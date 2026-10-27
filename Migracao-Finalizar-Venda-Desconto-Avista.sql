-- Corrige a finalização de vendas com desconto adicional à vista.
-- Usa as configurações por loja em public.configuracoes_descontos.
-- Mantém o desconto base limitado ao preço mínimo e registra o adicional à vista
-- como parte do desconto total da venda e de seus itens.
-- Execute no SQL Editor do MESMO projeto Supabase usado pelo Sistema da Loja.
-- Esta migração substitui somente a função public.finalizar_venda.

BEGIN;

CREATE OR REPLACE FUNCTION public.finalizar_venda(p_cliente_id bigint DEFAULT NULL::bigint, p_desconto numeric DEFAULT 0, p_forma_pagamento text DEFAULT NULL::text, p_observacoes text DEFAULT NULL::text, p_itens jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

DECLARE

    /* ========================================================
       USUÁRIO
    ======================================================== */

    v_usuario_id uuid;
    v_tipo_usuario text;
    v_ativo boolean;
    v_loja_id uuid;
    v_forma_normalizada text;
    v_forma_pagamento_desconto text;

    v_config_desconto_maximo_ativo boolean := true;
    v_config_desconto_avista_ativo boolean := true;
    v_config_desconto_avista_percentual numeric(5,2) := 8.00;

    /* ========================================================
       VENDA
    ======================================================== */

    v_venda_id bigint;

    v_subtotal numeric(12,2) := 0;
    v_desconto numeric(12,2) := 0;
    v_total numeric(12,2) := 0;
    v_desconto_maximo numeric(12,2) := 0;
    v_desconto_adicional_maximo numeric(12,2) := 0;
    v_desconto_base numeric(12,2) := 0;
    v_desconto_adicional numeric(12,2) := 0;
    v_desconto_base_restante numeric(12,2) := 0;
    v_desconto_adicional_restante numeric(12,2) := 0;
    v_desconto_item_base numeric(12,2) := 0;
    v_desconto_adicional_item numeric(12,2) := 0;
    v_saldo_item numeric(12,2) := 0;
    v_saldo_restante numeric(12,2) := 0;
    v_margem_item numeric(12,2) := 0;
    v_margem_restante numeric(12,2) := 0;
    v_desconto_item numeric(12,2) := 0;

    /* ========================================================
       PRODUTO / ITEM
    ======================================================== */

    v_produto record;

    v_quantidade numeric(12,3);
    v_preco_unitario numeric(12,2);
    v_custo_unitario numeric(12,2);
    v_item_subtotal numeric(12,2);

BEGIN

    /* ========================================================
       VERIFICAR USUÁRIO LOGADO
    ======================================================== */

    v_usuario_id := auth.uid();

    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;


    /* ========================================================
       VERIFICAR PERFIL E LOJA
    ======================================================== */

    SELECT
        tipo,
        ativo,
        loja_id
    INTO
        v_tipo_usuario,
        v_ativo,
        v_loja_id
    FROM public.perfis
    WHERE id = v_usuario_id;


    IF v_tipo_usuario IS NULL THEN
        RAISE EXCEPTION 'Perfil do usuário não encontrado.';
    END IF;


    IF v_ativo IS NOT TRUE THEN
        RAISE EXCEPTION 'Usuário inativo.';
    END IF;


    IF v_tipo_usuario NOT IN ('admin', 'vendedor') THEN
        RAISE EXCEPTION 'Usuário sem permissão para registrar vendas.';
    END IF;


    IF v_loja_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não está vinculado a uma loja.';
    END IF;

    /* ========================================================
       CARREGAR REGRAS DE DESCONTO DA PRÓPRIA LOJA
       Sem cadastro, preserva o comportamento anterior (8% e ambas ligadas).
    ======================================================== */

    SELECT
        cd.desconto_maximo_ativo,
        cd.desconto_avista_ativo,
        cd.desconto_avista_percentual
    INTO
        v_config_desconto_maximo_ativo,
        v_config_desconto_avista_ativo,
        v_config_desconto_avista_percentual
    FROM public.configuracoes_descontos cd
    WHERE cd.loja_id = v_loja_id;

    IF NOT FOUND THEN
        v_config_desconto_maximo_ativo := true;
        v_config_desconto_avista_ativo := true;
        v_config_desconto_avista_percentual := 8.00;
    END IF;

    v_forma_pagamento_desconto := lower(trim(coalesce(p_forma_pagamento, '')));

    /* Trava crítica: só a RPC validada de venda a prazo pode habilitar esta forma. */
    v_forma_normalizada := public.normalizar_forma_fiado(p_forma_pagamento);
    IF v_forma_normalizada = 'a_prazo'
       AND coalesce(current_setting('app.sistema_loja_fiado_autorizado', true), '') <> '1' THEN
        RAISE EXCEPTION 'A venda a prazo ainda não está habilitada. Registre usando a função segura do módulo Notinhas/Fiado.';
    END IF;


    /* ========================================================
       VALIDAR ITENS
    ======================================================== */

    IF p_itens IS NULL
       OR jsonb_typeof(p_itens) <> 'array'
       OR jsonb_array_length(p_itens) = 0 THEN

        RAISE EXCEPTION
            'A venda precisa possuir pelo menos um produto.';

    END IF;


    /* ========================================================
       VALIDAR CLIENTE
       O CLIENTE PRECISA SER DA MESMA LOJA
    ======================================================== */

    IF p_cliente_id IS NOT NULL THEN

        IF NOT EXISTS (
            SELECT 1
            FROM public.clientes c
            WHERE c.id = p_cliente_id
              AND c.ativo = true
              AND c.loja_id = v_loja_id
        ) THEN

            RAISE EXCEPTION
                'Cliente não encontrado, inativo ou pertencente a outra loja.';

        END IF;

    END IF;


    /* ========================================================
       VALIDAR DESCONTO
    ======================================================== */

    IF p_desconto IS NULL THEN
        v_desconto := 0;
    ELSE
        v_desconto := round(p_desconto, 2);
    END IF;


    IF v_desconto < 0 THEN

        RAISE EXCEPTION
            'O desconto não pode ser negativo.';

    END IF;


    /* ========================================================
       CALCULAR SUBTOTAL
       PRODUTO, PREÇO E CUSTO VÊM DO BANCO
       PRODUTO PRECISA SER DA MESMA LOJA
    ======================================================== */

    FOR v_produto IN

        SELECT
            p.id,
            p.nome,
            p.preco_venda,
            p.preco_venda_minimo,
            p.preco_custo,
            p.estoque,
            p.ativo,
            p.loja_id,
            x.quantidade

        FROM jsonb_to_recordset(p_itens)
        AS x(
            produto_id bigint,
            quantidade numeric
        )

        INNER JOIN public.produtos p
            ON p.id = x.produto_id

        WHERE p.loja_id = v_loja_id

    LOOP

        v_quantidade :=
            v_produto.quantidade;


        /* ====================================================
           VALIDAR QUANTIDADE
        ==================================================== */

        IF v_quantidade IS NULL
           OR v_quantidade <= 0 THEN

            RAISE EXCEPTION
                'Quantidade inválida para o produto: %',
                v_produto.nome;

        END IF;


        /* ====================================================
           VALIDAR PRODUTO ATIVO
        ==================================================== */

        IF v_produto.ativo IS NOT TRUE THEN

            RAISE EXCEPTION
                'O produto "%" está inativo.',
                v_produto.nome;

        END IF;


        /* ====================================================
           VALIDAR PREÇO
        ==================================================== */

        IF v_produto.preco_venda IS NULL
           OR v_produto.preco_venda < 0 THEN

            RAISE EXCEPTION
                'Preço de venda inválido para o produto "%".',
                v_produto.nome;

        END IF;

        IF v_produto.preco_venda_minimo IS NULL
           OR v_produto.preco_venda_minimo < 0
           OR v_produto.preco_venda_minimo > v_produto.preco_venda THEN

            RAISE EXCEPTION
                'Preço mínimo inválido para o produto "%".',
                v_produto.nome;

        END IF;


        /* ====================================================
           VALIDAR ESTOQUE
        ==================================================== */

        IF v_produto.estoque < v_quantidade THEN

            RAISE EXCEPTION
                'Estoque insuficiente para o produto "%". Estoque disponível: %.',
                v_produto.nome,
                v_produto.estoque;

        END IF;


        /* ====================================================
           CALCULAR ITEM
        ==================================================== */

        v_item_subtotal :=
            round(
                v_produto.preco_venda * v_quantidade,
                2
            );

        v_margem_item := GREATEST(
            0,
            v_item_subtotal - round(v_produto.preco_venda_minimo * v_quantidade, 2)
        );
        v_desconto_maximo := v_desconto_maximo + v_margem_item;

        v_subtotal :=
            v_subtotal + v_item_subtotal;

    END LOOP;


    /* ========================================================
       GARANTIR QUE TODOS OS PRODUTOS EXISTEM NA MESMA LOJA
    ======================================================== */

    IF (
        SELECT count(*)
        FROM jsonb_to_recordset(p_itens)
        AS x(
            produto_id bigint,
            quantidade numeric
        )
    ) <>
    (
        SELECT count(*)
        FROM jsonb_to_recordset(p_itens)
        AS x(
            produto_id bigint,
            quantidade numeric
        )
        INNER JOIN public.produtos p
            ON p.id = x.produto_id
        WHERE p.loja_id = v_loja_id
    ) THEN

        RAISE EXCEPTION
            'Um ou mais produtos não pertencem à loja do usuário.';

    END IF;


    /* ========================================================
       VALIDAR DESCONTO CONTRA SUBTOTAL
    ======================================================== */

    IF v_desconto > v_subtotal THEN

        RAISE EXCEPTION
            'O desconto não pode ser maior que o subtotal.';

    END IF;


    /*
       O desconto normal nunca ultrapassa a margem somada dos produtos.
       O excesso só é aceito como desconto adicional à vista se as regras
       desta loja estiverem habilitadas e a forma de pagamento for permitida.
    */
    IF v_desconto > v_desconto_maximo THEN
        IF NOT (
            v_config_desconto_maximo_ativo IS TRUE
            AND v_config_desconto_avista_ativo IS TRUE
            AND v_forma_pagamento_desconto IN ('dinheiro', 'pix', 'outro', 'outros')
        ) THEN
            RAISE EXCEPTION
                'Desconto máximo permitido para estes produtos: %.',
                to_char(v_desconto_maximo, 'FM999999990D00');
        END IF;

        v_desconto_adicional_maximo := round(
            GREATEST(0, v_subtotal - v_desconto_maximo)
            * (v_config_desconto_avista_percentual / 100.0),
            2
        );

        IF v_desconto > round(v_desconto_maximo + v_desconto_adicional_maximo, 2) THEN
            RAISE EXCEPTION
                'Desconto total acima do permitido. Máximo normal: %, adicional à vista configurado em %: %, máximo total permitido: %.',
                to_char(v_desconto_maximo, 'FM999999990D00'),
                to_char(v_config_desconto_avista_percentual, 'FM990D00') || '%',
                to_char(v_desconto_adicional_maximo, 'FM999999990D00'),
                to_char(round(v_desconto_maximo + v_desconto_adicional_maximo, 2), 'FM999999990D00');
        END IF;
    END IF;

    v_desconto_base := LEAST(v_desconto, v_desconto_maximo);
    v_desconto_adicional := GREATEST(0, round(v_desconto - v_desconto_base, 2));

    /* ========================================================
       CALCULAR TOTAL
    ======================================================== */

    v_total :=
        round(
            v_subtotal - v_desconto,
            2
        );


    /* ========================================================
       CRIAR VENDA
       AGORA COM loja_id
    ======================================================== */

    INSERT INTO public.vendas (
        usuario_id,
        cliente_id,
        loja_id,
        subtotal,
        desconto,
        total,
        forma_pagamento,
        status,
        observacoes
    )
    VALUES (
        v_usuario_id,
        p_cliente_id,
        v_loja_id,
        v_subtotal,
        v_desconto,
        v_total,
        nullif(trim(p_forma_pagamento), ''),
        'finalizada',
        nullif(trim(p_observacoes), '')
    )
    RETURNING id
    INTO v_venda_id;


    /* ========================================================
       GRAVAR ITENS E BAIXAR ESTOQUE
    ======================================================== */

    /* Distribui primeiro o desconto normal respeitando a margem dos produtos;
       distribui o adicional à vista separadamente, conforme a regra da loja. */
    v_desconto_base_restante := v_desconto_base;
    v_desconto_adicional_restante := v_desconto_adicional;
    v_margem_restante := v_desconto_maximo;
    v_saldo_restante := round(v_subtotal - v_desconto_base, 2);

    FOR v_produto IN

        SELECT
            p.id,
            p.nome,
            p.preco_venda,
            p.preco_venda_minimo,
            p.preco_custo,
            p.estoque,
            p.loja_id,
            x.quantidade

        FROM jsonb_to_recordset(p_itens)
        AS x(
            produto_id bigint,
            quantidade numeric
        )

        INNER JOIN public.produtos p
            ON p.id = x.produto_id

        WHERE p.loja_id = v_loja_id

    LOOP

        v_quantidade :=
            v_produto.quantidade;


        v_preco_unitario :=
            round(
                v_produto.preco_venda,
                2
            );


        v_custo_unitario :=
            round(
                coalesce(v_produto.preco_custo, 0),
                2
            );


        v_item_subtotal :=
            round(
                v_preco_unitario * v_quantidade,
                2
            );

        v_margem_item := GREATEST(
            0,
            v_item_subtotal - round(v_produto.preco_venda_minimo * v_quantidade, 2)
        );

        /* Parte 1: desconto base, sempre limitado à margem individual. */
        IF v_desconto_base_restante <= 0 OR v_margem_item <= 0 THEN
            v_desconto_item_base := 0;
        ELSIF v_margem_restante <= v_margem_item THEN
            v_desconto_item_base := LEAST(v_desconto_base_restante, v_margem_item);
        ELSE
            v_desconto_item_base := LEAST(
                v_margem_item,
                v_desconto_base_restante,
                round(v_desconto_base_restante * v_margem_item / NULLIF(v_margem_restante, 0), 2)
            );
        END IF;

        v_desconto_base_restante := round(v_desconto_base_restante - v_desconto_item_base, 2);
        v_margem_restante := round(v_margem_restante - v_margem_item, 2);

        /* Parte 2: adicional à vista, rateado pelo saldo de cada item após o desconto base.
           Este componente pode ultrapassar o preço mínimo, conforme a regra aceita pela loja. */
        v_saldo_item := GREATEST(0, round(v_item_subtotal - v_desconto_item_base, 2));

        IF v_desconto_adicional_restante <= 0 OR v_saldo_item <= 0 THEN
            v_desconto_adicional_item := 0;
        ELSIF v_saldo_restante <= v_saldo_item THEN
            v_desconto_adicional_item := LEAST(v_desconto_adicional_restante, v_saldo_item);
        ELSE
            v_desconto_adicional_item := LEAST(
                v_saldo_item,
                v_desconto_adicional_restante,
                round(
                    v_desconto_adicional_restante * v_saldo_item
                    / NULLIF(v_saldo_restante, 0),
                    2
                )
            );
        END IF;

        v_desconto_adicional_restante := round(
            v_desconto_adicional_restante - v_desconto_adicional_item,
            2
        );
        v_saldo_restante := round(v_saldo_restante - v_saldo_item, 2);
        v_desconto_item := round(v_desconto_item_base + v_desconto_adicional_item, 2);

        /* ====================================================
           GRAVAR ITEM DA VENDA
        ==================================================== */

        INSERT INTO public.itens_venda (
            venda_id,
            produto_id,
            quantidade,
            preco_unitario,
            custo_unitario,
            subtotal,
            desconto_item
        )
        VALUES (
            v_venda_id,
            v_produto.id,
            v_quantidade,
            v_preco_unitario,
            v_custo_unitario,
            v_item_subtotal,
            v_desconto_item
        );


        /* ====================================================
           BAIXAR ESTOQUE
        ==================================================== */

        UPDATE public.produtos
        SET
            estoque = estoque - v_quantidade,
            atualizado_em = now()
        WHERE id = v_produto.id
          AND loja_id = v_loja_id
          AND ativo = true
          AND estoque >= v_quantidade;


        IF NOT FOUND THEN

            RAISE EXCEPTION
                'Não foi possível baixar o estoque do produto "%". O estoque pode ter sido alterado por outra operação.',
                v_produto.nome;

        END IF;


        /* ====================================================
           REGISTRAR MOVIMENTAÇÃO
        ==================================================== */

        INSERT INTO public.movimentacoes_estoque (
            produto_id,
            usuario_id,
            tipo,
            quantidade,
            estoque_anterior,
            estoque_novo,
            motivo
        )
        VALUES (
            v_produto.id,
            v_usuario_id,
            'saida',
            v_quantidade,
            v_produto.estoque,
            v_produto.estoque - v_quantidade,
            'Venda #' || v_venda_id
        );

    END LOOP;

    IF v_desconto_base_restante <> 0 OR v_desconto_adicional_restante <> 0 THEN
        RAISE EXCEPTION
            'Não foi possível distribuir integralmente os descontos entre os itens. A venda foi cancelada.';
    END IF;

    /* ========================================================
       RETORNAR RESULTADO
    ======================================================== */

    RETURN jsonb_build_object(
        'sucesso', true,
        'venda_id', v_venda_id,
        'subtotal', v_subtotal,
        'desconto', v_desconto,
        'total', v_total
    );


EXCEPTION

    WHEN OTHERS THEN

        RAISE;

END;

$function$
;


COMMIT;
