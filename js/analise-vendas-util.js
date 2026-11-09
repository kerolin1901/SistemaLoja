/* =========================================================
   SISTEMA DA LOJA — UTILITÁRIOS DE ANÁLISE DE VENDAS
   Leitura compartilhada por dashboard e estoque.
   Não altera vendas nem movimentações no banco.
========================================================= */
(function () {
    "use strict";

    const PAGE_SIZE = 1000;
    const CHUNK_SIZE = 100;

    async function listarPaginado(criarConsulta) {
        const todos = [];
        let inicio = 0;

        while (true) {
            const { data, error } = await criarConsulta().range(inicio, inicio + PAGE_SIZE - 1);
            if (error) throw error;
            const pagina = data || [];
            todos.push(...pagina);
            if (pagina.length < PAGE_SIZE) break;
            inicio += PAGE_SIZE;
        }

        return todos;
    }

    function emLotes(lista, tamanho, callback) {
        return (async function () {
            const resultados = [];
            for (let i = 0; i < lista.length; i += tamanho) {
                resultados.push(...await callback(lista.slice(i, i + tamanho)));
            }
            return resultados;
        })();
    }

    async function carregarDados({ supabase, lojaId, inicio, fim, incluirCusto = false, usuarioId = null }) {
        if (!supabase || !lojaId || !(inicio instanceof Date) || !(fim instanceof Date)) {
            throw new Error("Não foi possível identificar a loja ou o período da análise.");
        }

        const vendas = await listarPaginado(() => {
            let consulta = supabase
                .from("vendas")
                .select("id, total, criado_em")
                .eq("loja_id", lojaId)
                .eq("status", "finalizada")
                .gte("criado_em", inicio.toISOString())
                .lt("criado_em", fim.toISOString());
            if (usuarioId) consulta = consulta.eq("usuario_id", usuarioId);
            return consulta.order("criado_em", { ascending: true });
        });

        if (!vendas.length) {
            return { vendas: [], itens: [], produtos: new Map() };
        }

        const idsVendas = vendas.map((venda) => venda.id);
        const colunasItens = incluirCusto
            ? "id, venda_id, produto_id, descricao_avulsa, quantidade, preco_unitario, custo_unitario, subtotal, desconto_item, produto_cor_id, cor_vendida"
            : "id, venda_id, produto_id, descricao_avulsa, quantidade, preco_unitario, subtotal, desconto_item, produto_cor_id, cor_vendida";
        const itens = await emLotes(idsVendas, CHUNK_SIZE, async (lote) => listarPaginado(() => supabase
            .from("itens_venda")
            .select(colunasItens)
            .in("venda_id", lote)
            .order("id", { ascending: true })
        ));

        const idsProdutos = [...new Set(itens
            .map((item) => item.produto_id)
            .filter((id) => id !== null && id !== undefined)
            .map(String))];
        const produtos = new Map();

        await emLotes(idsProdutos, CHUNK_SIZE, async (lote) => {
            let resultado = await supabase
                .from("produtos")
                .select("id, nome, sku")
                .in("id", lote);
            if (resultado.error || !(resultado.data || []).length) {
                resultado = await supabase
                    .from("produtos_para_venda")
                    .select("id, nome, sku")
                    .in("id", lote);
            }
            if (resultado.error) throw resultado.error;
            (resultado.data || []).forEach((produto) => produtos.set(String(produto.id), produto));
            return [];
        });

        const itensPorVenda = new Map();
        itens.forEach((item) => {
            const chave = String(item.venda_id);
            if (!itensPorVenda.has(chave)) itensPorVenda.set(chave, []);
            itensPorVenda.get(chave).push(item);
        });

        for (const venda of vendas) {
            const linhas = itensPorVenda.get(String(venda.id)) || [];
            if (!linhas.length) continue;

            const valoresBrutos = linhas.map((item) => {
                const quantidade = Number(item.quantidade) || 0;
                const subtotal = item.subtotal !== null && item.subtotal !== undefined && Number.isFinite(Number(item.subtotal))
                    ? Number(item.subtotal)
                    : (Number(item.preco_unitario) || 0) * quantidade;
                return Math.max(0, Math.round(subtotal * 100));
            });
            const totalBruto = valoresBrutos.reduce((soma, valor) => soma + valor, 0);
            const todosTemDesconto = linhas.every((item) =>
                item.desconto_item !== null && item.desconto_item !== undefined && Number.isFinite(Number(item.desconto_item))
            );
            const totalLiquido = Math.max(0, Math.round((Number(venda.total) || 0) * 100));
            let distribuido = 0;

            linhas.forEach((item, indice) => {
                const quantidade = Number(item.quantidade) || 0;
                let liquidoCentavos;

                if (todosTemDesconto) {
                    liquidoCentavos = Math.max(0, valoresBrutos[indice] - Math.max(0, Math.round((Number(item.desconto_item) || 0) * 100)));
                } else if (indice === linhas.length - 1) {
                    liquidoCentavos = Math.max(0, totalLiquido - distribuido);
                } else if (totalBruto > 0) {
                    liquidoCentavos = Math.max(0, Math.round(totalLiquido * valoresBrutos[indice] / totalBruto));
                } else {
                    liquidoCentavos = 0;
                }

                distribuido += liquidoCentavos;
                item.quantidade_numero = quantidade;
                item.valor_liquido = liquidoCentavos / 100;
                item.custo_conhecido = incluirCusto && item.custo_unitario !== null && item.custo_unitario !== undefined && Number.isFinite(Number(item.custo_unitario));
                item.lucro_bruto = item.custo_conhecido
                    ? item.valor_liquido - (Number(item.custo_unitario) || 0) * quantidade
                    : null;
                const produto = produtos.get(String(item.produto_id));
                item.nome_produto = produto?.nome || item.descricao_avulsa || "Produto não identificado";
                item.sku_produto = produto?.sku || "";
            });
        }

        return { vendas, itens, produtos };
    }

    function dentroDoPeriodo(valor, periodo) {
        const data = new Date(valor);
        return Number.isFinite(data.getTime()) && data >= periodo.inicio && data < periodo.fim;
    }

    function resumir({ vendas, itens }, periodo) {
        const vendasPeriodo = (vendas || []).filter((venda) => dentroDoPeriodo(venda.criado_em, periodo));
        const ids = new Set(vendasPeriodo.map((venda) => String(venda.id)));
        const itensPeriodo = (itens || []).filter((item) => ids.has(String(item.venda_id)));
        const custosCompletos = itensPeriodo.every((item) => item.custo_conhecido === true);

        return {
            quantidadeVendas: vendasPeriodo.length,
            faturamento: vendasPeriodo.reduce((soma, venda) => soma + (Number(venda.total) || 0), 0),
            unidades: itensPeriodo.reduce((soma, item) => soma + (Number(item.quantidade_numero) || 0), 0),
            lucroBruto: custosCompletos
                ? itensPeriodo.reduce((soma, item) => soma + (Number(item.lucro_bruto) || 0), 0)
                : null,
            custosCompletos
        };
    }

    function agruparPorProduto(itens, vendas, periodo) {
        const idsVendas = new Set((vendas || [])
            .filter((venda) => dentroDoPeriodo(venda.criado_em, periodo))
            .map((venda) => String(venda.id)));
        const grupos = new Map();

        (itens || []).filter((item) => idsVendas.has(String(item.venda_id)) && item.produto_id !== null && item.produto_id !== undefined)
            .forEach((item) => {
                const chave = String(item.produto_id);
                if (!grupos.has(chave)) {
                    grupos.set(chave, {
                        id: item.produto_id,
                        nome: item.nome_produto || "Produto não identificado",
                        sku: item.sku_produto || "",
                        quantidade: 0,
                        faturamento: 0,
                        lucro: 0,
                        lucroCompleto: true
                    });
                }
                const grupo = grupos.get(chave);
                grupo.quantidade += Number(item.quantidade_numero) || 0;
                grupo.faturamento += Number(item.valor_liquido) || 0;
                if (item.custo_conhecido) grupo.lucro += Number(item.lucro_bruto) || 0;
                else grupo.lucroCompleto = false;
            });

        return [...grupos.values()];
    }

    function agruparPorCor(itens, vendas, periodo) {
        const idsVendas = new Set((vendas || [])
            .filter((venda) => dentroDoPeriodo(venda.criado_em, periodo))
            .map((venda) => String(venda.id)));
        const grupos = new Map();

        (itens || []).filter((item) =>
            idsVendas.has(String(item.venda_id)) &&
            (item.produto_cor_id !== null && item.produto_cor_id !== undefined || String(item.cor_vendida || "").trim())
        ).forEach((item) => {
            const cor = String(item.cor_vendida || "Cor sem identificação").trim() || "Cor sem identificação";
            const chave = `${item.produto_id || "sem-produto"}|${cor.toLocaleLowerCase("pt-BR")}`;
            if (!grupos.has(chave)) {
                grupos.set(chave, {
                    produto: item.nome_produto || "Produto não identificado",
                    cor,
                    quantidade: 0,
                    faturamento: 0
                });
            }
            const grupo = grupos.get(chave);
            grupo.quantidade += Number(item.quantidade_numero) || 0;
            grupo.faturamento += Number(item.valor_liquido) || 0;
        });

        return [...grupos.values()].sort((a, b) => b.quantidade - a.quantidade || b.faturamento - a.faturamento);
    }

    window.SistemaLojaAnaliseVendas = {
        carregarDados,
        resumir,
        agruparPorProduto,
        agruparPorCor
    };
})();
