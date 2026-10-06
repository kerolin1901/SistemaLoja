/* ==========================================
   SISTEMA DA LOJA
   HISTÓRICO DE VENDAS
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const historicoSupabase =
    supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const nomeAdministrador =
    document.getElementById(
        "nomeAdministrador"
    );

const avatarAdministrador =
    document.querySelector(
        ".avatar-admin"
    );

const totalVendas =
    document.getElementById(
        "totalVendas"
    );

const valorTotalVendas =
    document.getElementById(
        "valorTotalVendas"
    );

const vendasHoje =
    document.getElementById(
        "vendasHoje"
    );

const filtroData =
    document.getElementById(
        "filtroData"
    );

const filtroFormaPagamento =
    document.getElementById(
        "filtroFormaPagamento"
    );

const filtroStatus =
    document.getElementById(
        "filtroStatus"
    );

const btnLimparFiltros =
    document.getElementById(
        "btnLimparFiltros"
    );

const btnAtualizar =
    document.getElementById(
        "btnAtualizar"
    );

const carregandoVendas =
    document.getElementById(
        "carregandoVendas"
    );

const semVendas =
    document.getElementById(
        "semVendas"
    );

const containerTabelaVendas =
    document.getElementById(
        "containerTabelaVendas"
    );

const listaVendas =
    document.getElementById(
        "listaVendas"
    );

const mensagemHistorico =
    document.getElementById(
        "mensagemHistorico"
    );

const modalVenda =
    document.getElementById(
        "modalVenda"
    );

const numeroVendaModal =
    document.getElementById(
        "numeroVendaModal"
    );

const detalhesVenda =
    document.getElementById(
        "detalhesVenda"
    );

const btnFecharModal =
    document.getElementById(
        "btnFecharModal"
    );

const btnFecharModalRodape =
    document.getElementById(
        "btnFecharModalRodape"
    );

const btnSair =
    document.getElementById(
        "btnSair"
    );


/* ==========================================
   DADOS AUXILIARES
========================================== */

let clientesHistorico = [];

let perfisHistorico = [];


/* ==========================================
   FORMATAÇÃO
========================================== */

function formatarMoeda(valor) {

    return (
        Number(valor) || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function formatarData(data) {

    if (!data) {
        return "-";
    }


    const dataObj =
        new Date(data);


    return dataObj.toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}


function formatarFormaPagamento(
    forma
) {

    const formas = {

        dinheiro:
            "Dinheiro",

        pix:
            "PIX",

        cartao_credito:
            "Cartão de crédito",

        cartao_debito:
            "Cartão de débito",

        boleto:
            "Boleto",

        outro:
            "Outro"

    };


    return formas[forma] ||
        forma ||
        "-";
}


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = "erro"
) {

    if (!mensagemHistorico) {
        return;
    }


    mensagemHistorico.textContent =
        texto;


    mensagemHistorico.className =
        "mensagem-historico " +
        "mensagem-" +
        tipo;


    mensagemHistorico.style.display =
        "block";


    setTimeout(() => {

        mensagemHistorico.style.display =
            "none";

    }, 5000);
}


/* ==========================================
   PROTEGER PÁGINA
========================================== */

async function protegerPaginaHistorico() {

    const {
        data: {
            session
        },
        error
    } = await historicoSupabase
        .auth
        .getSession();


    if (
        error ||
        !session
    ) {

        window.location.href =
            "index.html";

        return false;
    }


    const {
        data: perfil,
        error: erroPerfil
    } = await historicoSupabase
        .from("perfis")
        .select("*")
        .eq(
            "id",
            session.user.id
        )
        .single();


    if (
        erroPerfil ||
        !perfil
    ) {

        alert(
            "Não foi possível carregar o perfil."
        );

        await historicoSupabase
            .auth
            .signOut();

        window.location.href =
            "index.html";

        return false;
    }


    if (
        !perfil.ativo
    ) {

        alert(
            "Seu usuário está inativo."
        );

        await historicoSupabase
            .auth
            .signOut();

        window.location.href =
            "index.html";

        return false;
    }


    if (
        perfil.tipo !==
        "admin"
    ) {

        alert(
            "Somente o administrador pode acessar o histórico completo de vendas."
        );

        window.location.href =
            "vendedor.html";

        return false;
    }


    if (nomeAdministrador) {

        nomeAdministrador.textContent =
            perfil.nome_completo ||
            perfil.usuario ||
            "Administrador";
    }


    if (avatarAdministrador) {

        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "A";


        avatarAdministrador.textContent =
            nome
                .charAt(0)
                .toUpperCase();
    }


    sessionStorage.setItem(
        "sistemaLojaPerfil",
        JSON.stringify(perfil)
    );


    return true;
}


/* ==========================================
   CARREGAR CLIENTES
========================================== */

async function carregarClientesHistorico() {

    const {
        data,
        error
    } = await historicoSupabase
        .from("clientes")
        .select(`
            id,
            nome,
            telefone
        `);


    if (error) {

        console.error(
            "Erro ao carregar clientes:",
            error
        );

        clientesHistorico = [];

        return;
    }


    clientesHistorico =
        data || [];
}


/* ==========================================
   CARREGAR PERFIS
========================================== */

async function carregarPerfisHistorico() {

    const {
        data,
        error
    } = await historicoSupabase
        .from("perfis")
        .select(`
            id,
            nome_completo,
            usuario
        `);


    if (error) {

        console.error(
            "Erro ao carregar perfis:",
            error
        );

        perfisHistorico = [];

        return;
    }


    perfisHistorico =
        data || [];
}


/* ==========================================
   ENCONTRAR CLIENTE
========================================== */

function encontrarCliente(
    clienteId
) {

    return clientesHistorico.find(
        cliente =>
            Number(cliente.id) ===
            Number(clienteId)
    );
}


/* ==========================================
   ENCONTRAR PERFIL
========================================== */

function encontrarPerfil(
    usuarioId
) {

    return perfisHistorico.find(
        perfil =>
            String(perfil.id) ===
            String(usuarioId)
    );
}


/* ==========================================
   CARREGAR VENDAS
========================================== */

async function carregarVendas() {

    carregandoVendas.style.display =
        "flex";

    semVendas.style.display =
        "none";

    containerTabelaVendas.style.display =
        "none";


    /*
       Primeiro carregamos os dados
       auxiliares.
    */

    await carregarClientesHistorico();

    await carregarPerfisHistorico();


    /*
       Agora carregamos somente a tabela
       vendas, sem tentar fazer relações
       automáticas com outras tabelas.
    */

    let consulta =
        historicoSupabase
            .from("vendas")
            .select(`
                id,
                usuario_id,
                cliente_id,
                subtotal,
                desconto,
                total,
                forma_pagamento,
                status,
                observacoes,
                criado_em
            `)
            .order(
                "criado_em",
                {
                    ascending: false
                }
            );


    /* ==========================================
       FILTRO POR DATA
    ========================================== */

    if (filtroData.value) {

        const inicio =
            `${filtroData.value}T00:00:00`;

        const fim =
            `${filtroData.value}T23:59:59`;


        consulta =
            consulta
                .gte(
                    "criado_em",
                    inicio
                )
                .lte(
                    "criado_em",
                    fim
                );
    }


    /* ==========================================
       FILTRO PAGAMENTO
    ========================================== */

    if (
        filtroFormaPagamento.value
    ) {

        consulta =
            consulta.eq(
                "forma_pagamento",
                filtroFormaPagamento.value
            );
    }


    /* ==========================================
       FILTRO STATUS
    ========================================== */

    if (
        filtroStatus.value
    ) {

        consulta =
            consulta.eq(
                "status",
                filtroStatus.value
            );
    }


    const {
        data,
        error
    } = await consulta;


    carregandoVendas.style.display =
        "none";


    if (error) {

        console.error(
            "Erro ao carregar vendas:",
            error
        );


        semVendas.style.display =
            "flex";


        mostrarMensagem(
            "Não foi possível carregar as vendas: " +
            error.message,
            "erro"
        );


        return;
    }


    const vendas =
        data || [];


    atualizarResumo(
        vendas
    );


    if (
        vendas.length === 0
    ) {

        semVendas.style.display =
            "flex";

        return;
    }


    containerTabelaVendas.style.display =
        "block";


    renderizarVendas(
        vendas
    );
}


/* ==========================================
   ATUALIZAR RESUMO
========================================== */

function atualizarResumo(
    vendas
) {

    const quantidade =
        vendas.length;


    const valor =
        vendas.reduce(
            (
                total,
                venda
            ) => {

                if (
                    venda.status ===
                    "cancelada"
                ) {

                    return total;
                }


                return total +
                    (
                        Number(
                            venda.total
                        ) || 0
                    );

            },
            0
        );


    const hoje =
        new Date();


    const ano =
        hoje.getFullYear();


    const mes =
        hoje.getMonth();


    const dia =
        hoje.getDate();


    const quantidadeHoje =
        vendas.filter(
            venda => {

                const data =
                    new Date(
                        venda.criado_em
                    );


                return (
                    data.getFullYear() ===
                    ano &&
                    data.getMonth() ===
                    mes &&
                    data.getDate() ===
                    dia
                );

            }
        ).length;


    totalVendas.textContent =
        quantidade;


    valorTotalVendas.textContent =
        formatarMoeda(
            valor
        );


    vendasHoje.textContent =
        quantidadeHoje;
}


/* ==========================================
   RENDERIZAR VENDAS
========================================== */

function renderizarVendas(
    vendas
) {

    listaVendas.innerHTML =
        "";


    vendas.forEach(
        venda => {

            const linha =
                document.createElement(
                    "tr"
                );


            const cliente =
                encontrarCliente(
                    venda.cliente_id
                );


            const perfil =
                encontrarPerfil(
                    venda.usuario_id
                );


            const nomeCliente =
                cliente?.nome ||
                "Consumidor não identificado";


            const nomeVendedor =
                perfil?.nome_completo ||
                perfil?.usuario ||
                "Administrador";


            const status =
                venda.status ||
                "finalizada";


            const statusTexto =
                status ===
                "cancelada"
                    ? "Cancelada"
                    : "Finalizada";


            linha.innerHTML = `

                <td>

                    <span class="numero-venda">
                        #${venda.id}
                    </span>

                </td>


                <td>
                    ${formatarData(venda.criado_em)}
                </td>


                <td>
                    ${nomeCliente}
                </td>


                <td>
                    ${nomeVendedor}
                </td>


                <td>
                    ${formatarFormaPagamento(venda.forma_pagamento)}
                </td>


                <td>
                    ${formatarMoeda(venda.subtotal)}
                </td>


                <td>
                    ${formatarMoeda(venda.desconto)}
                </td>


                <td>

                    <span class="valor-venda">
                        ${formatarMoeda(venda.total)}
                    </span>

                </td>


                <td>

                    <span class="status-venda ${
                        status === "cancelada"
                            ? "status-cancelada"
                            : "status-finalizada"
                    }">

                        ${statusTexto}

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="btn-detalhes"
                        data-venda-id="${venda.id}"
                    >

                        Ver detalhes

                    </button>

                </td>

            `;


            listaVendas.appendChild(
                linha
            );

        }
    );


    listaVendas
        .querySelectorAll(
            "[data-venda-id]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        abrirDetalhesVenda(
                            botao.dataset.vendaId
                        );

                    }
                );

            }
        );
}


/* ==========================================
   ABRIR DETALHES
========================================== */

async function abrirDetalhesVenda(
    vendaId
) {

    detalhesVenda.innerHTML =
        "Carregando detalhes...";


    numeroVendaModal.textContent =
        `Venda #${vendaId}`;


    modalVenda.style.display =
        "flex";


    const {
        data: venda,
        error: erroVenda
    } = await historicoSupabase
        .from("vendas")
        .select(`
            id,
            usuario_id,
            cliente_id,
            subtotal,
            desconto,
            total,
            forma_pagamento,
            status,
            observacoes,
            criado_em
        `)
        .eq(
            "id",
            vendaId
        )
        .single();


    if (erroVenda) {

        console.error(
            "Erro ao carregar venda:",
            erroVenda
        );


        detalhesVenda.innerHTML =
            "Não foi possível carregar os dados da venda.";

        return;
    }


    const {
        data: itens,
        error: erroItens
    } = await historicoSupabase
        .from("itens_venda")
        .select(`
            id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal
        `)
        .eq(
            "venda_id",
            vendaId
        )
        .order(
            "id",
            {
                ascending: true
            }
        );


    if (erroItens) {

        console.error(
            "Erro ao carregar itens:",
            erroItens
        );


        detalhesVenda.innerHTML =
            "A venda foi carregada, mas não foi possível carregar os produtos.";

        return;
    }


    /*
       Carregar os produtos dos itens
       separadamente.
    */

    const produtoIds =
        [
            ...new Set(
                (itens || []).map(
                    item =>
                        Number(
                            item.produto_id
                        )
                )
            )
        ];


    let produtosItens = [];


    if (
        produtoIds.length > 0
    ) {

        const {
            data: produtos,
            error: erroProdutos
        } = await historicoSupabase
            .from("produtos")
            .select(`
                id,
                nome,
                sku
            `)
            .in(
                "id",
                produtoIds
            );


        if (
            !erroProdutos
        ) {

            produtosItens =
                produtos || [];
        }
    }


    const cliente =
        encontrarCliente(
            venda.cliente_id
        );


    const perfil =
        encontrarPerfil(
            venda.usuario_id
        );


    const nomeCliente =
        cliente?.nome ||
        "Consumidor não identificado";


    const nomeVendedor =
        perfil?.nome_completo ||
        perfil?.usuario ||
        "Administrador";


    let html = `

        <div class="detalhe-cabecalho">

            <div class="detalhe-info">

                <span>
                    Data
                </span>

                <strong>
                    ${formatarData(venda.criado_em)}
                </strong>

            </div>


            <div class="detalhe-info">

                <span>
                    Cliente
                </span>

                <strong>
                    ${nomeCliente}
                </strong>

            </div>


            <div class="detalhe-info">

                <span>
                    Vendedor
                </span>

                <strong>
                    ${nomeVendedor}
                </strong>

            </div>


            <div class="detalhe-info">

                <span>
                    Pagamento
                </span>

                <strong>
                    ${formatarFormaPagamento(venda.forma_pagamento)}
                </strong>

            </div>


            <div class="detalhe-info">

                <span>
                    Status
                </span>

                <strong>
                    ${
                        venda.status === "cancelada"
                            ? "Cancelada"
                            : "Finalizada"
                    }
                </strong>

            </div>


            <div class="detalhe-info">

                <span>
                    Telefone
                </span>

                <strong>
                    ${cliente?.telefone || "-"}
                </strong>

            </div>

        </div>


        <h3>
            Produtos
        </h3>


        <div class="tabela-scroll">

            <table class="tabela-itens">

                <thead>

                    <tr>

                        <th>
                            Produto
                        </th>

                        <th>
                            SKU
                        </th>

                        <th>
                            Quantidade
                        </th>

                        <th>
                            Preço unitário
                        </th>

                        <th>
                            Subtotal
                        </th>

                    </tr>

                </thead>

                <tbody>

    `;


    (itens || []).forEach(
        item => {

            const produto =
                produtosItens.find(
                    produtoItem =>
                        Number(
                            produtoItem.id
                        ) ===
                        Number(
                            item.produto_id
                        )
                );


            html += `

                <tr>

                    <td>
                        ${produto?.nome || "Produto"}
                    </td>

                    <td>
                        ${produto?.sku || "-"}
                    </td>

                    <td>
                        ${item.quantidade}
                    </td>

                    <td>
                        ${formatarMoeda(item.preco_unitario)}
                    </td>

                    <td>
                        ${formatarMoeda(item.subtotal)}
                    </td>

                </tr>

            `;
        }
    );


    html += `

                </tbody>

            </table>

        </div>


        <div class="resumo-detalhes">

            <div>

                <span>
                    Subtotal
                </span>

                <strong>
                    ${formatarMoeda(venda.subtotal)}
                </strong>

            </div>


            <div>

                <span>
                    Desconto
                </span>

                <strong>
                    ${formatarMoeda(venda.desconto)}
                </strong>

            </div>


            <div class="total-detalhes">

                <span>
                    Total
                </span>

                <strong>
                    ${formatarMoeda(venda.total)}
                </strong>

            </div>

        </div>

    `;


    if (
        venda.observacoes
    ) {

        html += `

            <div
                class="detalhe-info"
                style="margin-top: 20px;"
            >

                <span>
                    Observações
                </span>

                <strong>
                    ${venda.observacoes}
                </strong>

            </div>

        `;
    }


    detalhesVenda.innerHTML =
        html;
}


/* ==========================================
   FECHAR MODAL
========================================== */

function fecharModal() {

    modalVenda.style.display =
        "none";

    detalhesVenda.innerHTML =
        "";
}


btnFecharModal.addEventListener(
    "click",
    fecharModal
);


btnFecharModalRodape.addEventListener(
    "click",
    fecharModal
);


modalVenda.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            modalVenda
        ) {

            fecharModal();
        }

    }
);


/* ==========================================
   FILTROS
========================================== */

filtroData.addEventListener(
    "change",
    carregarVendas
);


filtroFormaPagamento.addEventListener(
    "change",
    carregarVendas
);


filtroStatus.addEventListener(
    "change",
    carregarVendas
);


btnLimparFiltros.addEventListener(
    "click",
    () => {

        filtroData.value =
            "";

        filtroFormaPagamento.value =
            "";

        filtroStatus.value =
            "";

        carregarVendas();

    }
);


btnAtualizar.addEventListener(
    "click",
    carregarVendas
);


/* ==========================================
   SAIR
========================================== */

btnSair.addEventListener(
    "click",
    async () => {

        const confirmou =
            confirm(
                "Deseja realmente sair do sistema?"
            );


        if (!confirmou) {
            return;
        }


        await historicoSupabase
            .auth
            .signOut();


        sessionStorage.removeItem(
            "sistemaLojaPerfil"
        );


        window.location.href =
            "index.html";
    }
);


/* ==========================================
   MENU FUTURO
========================================== */

document.querySelectorAll(
    "[data-futuro]"
).forEach(
    item => {

        item.addEventListener(
            "click",
            evento => {

                evento.preventDefault();


                const nome =
                    item.getAttribute(
                        "data-futuro"
                    );


                alert(
                    `A área de ${nome} será desenvolvida nas próximas etapas.`
                );

            }
        );

    }
);


/* ==========================================
   INICIAR
========================================== */

async function iniciarHistoricoVendas() {

    const autorizado =
        await protegerPaginaHistorico();


    if (!autorizado) {
        return;
    }


    await carregarVendas();
}


iniciarHistoricoVendas();