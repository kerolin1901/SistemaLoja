/* ==========================================
   SISTEMA DA LOJA
   RELATÓRIOS
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const relatoriosSupabase =
    supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const nomeAdministrador =
    document.getElementById("nomeAdministrador");

const avatarAdministrador =
    document.querySelector(".avatar-admin");

const dataInicialRelatorio =
    document.getElementById("dataInicialRelatorio");

const dataFinalRelatorio =
    document.getElementById("dataFinalRelatorio");

const btnGerarRelatorio =
    document.getElementById("btnGerarRelatorio");

const btnSair =
    document.getElementById("btnSair");

const mensagemRelatorio =
    document.getElementById("mensagemRelatorio");


const totalVendas =
    document.getElementById("totalVendas");

const faturamento =
    document.getElementById("faturamento");

const ticketMedio =
    document.getElementById("ticketMedio");

const totalDescontos =
    document.getElementById("totalDescontos");

const custoProdutos =
    document.getElementById("custoProdutos");

const lucroBruto =
    document.getElementById("lucroBruto");


const periodoRelatorio =
    document.getElementById("periodoRelatorio");

const resumoFaturamento =
    document.getElementById("resumoFaturamento");

const resumoCusto =
    document.getElementById("resumoCusto");

const resumoLucro =
    document.getElementById("resumoLucro");


const carregandoProdutos =
    document.getElementById("carregandoProdutos");

const semProdutosVendidos =
    document.getElementById("semProdutosVendidos");

const containerTabelaProdutos =
    document.getElementById("containerTabelaProdutos");

const listaProdutosVendidos =
    document.getElementById("listaProdutosVendidos");


const carregandoPagamentos =
    document.getElementById("carregandoPagamentos");

const semPagamentos =
    document.getElementById("semPagamentos");

const listaPagamentos =
    document.getElementById("listaPagamentos");


const carregandoVendasDia =
    document.getElementById("carregandoVendasDia");

const semVendasDia =
    document.getElementById("semVendasDia");

const containerTabelaVendasDia =
    document.getElementById("containerTabelaVendasDia");

const listaVendasDia =
    document.getElementById("listaVendasDia");


/* ==========================================
   VARIÁVEIS
========================================== */

let vendasRelatorio =
    [];

let itensRelatorio =
    [];

let produtosRelatorio =
    [];


/* ==========================================
   FORMATAÇÃO
========================================== */

function formatarMoeda(valor) {

    const numero =
        Number(valor) || 0;

    return numero.toLocaleString(
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

    const partes =
        data.split("-");

    if (partes.length !== 3) {
        return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatarFormaPagamento(forma) {

    if (!forma) {
        return "Não informado";
    }

    const valor =
        forma.toLowerCase();

    const nomes = {

        pix: "PIX",

        dinheiro: "Dinheiro",

        cartao: "Cartão",

        "cartão": "Cartão",

        credito: "Cartão de crédito",

        "cartão de crédito":
            "Cartão de crédito",

        debito: "Cartão de débito",

        "cartão de débito":
            "Cartão de débito",

        boleto: "Boleto"

    };

    return nomes[valor] ||
        forma;
}


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = ""
) {

    mensagemRelatorio.textContent =
        texto;

    mensagemRelatorio.className =
        "mensagem-relatorio";

    if (tipo) {
        mensagemRelatorio.classList.add(
            tipo
        );
    }
}


/* ==========================================
   PROTEGER PÁGINA
========================================== */

async function protegerPaginaRelatorios() {

    const {
        data,
        error
    } =
        await relatoriosSupabase.auth.getSession();


    if (
        error ||
        !data ||
        !data.session
    ) {

        window.location.href =
            "index.html";

        return false;

    }


    const usuarioId =
        data.session.user.id;


    const resultado =
        await relatoriosSupabase
            .from("perfis")
            .select(`
                id,
                nome_completo,
                usuario,
                tipo,
                ativo
            `)
            .eq(
                "id",
                usuarioId
            )
            .maybeSingle();


    if (
        resultado.error ||
        !resultado.data
    ) {

        await relatoriosSupabase.auth.signOut();

        window.location.href =
            "index.html";

        return false;

    }


    const perfil =
        resultado.data;


    if (
        perfil.tipo !== "admin" ||
        perfil.ativo !== true
    ) {

        window.location.href =
            "vendedor.html";

        return false;

    }


    nomeAdministrador.textContent =
        perfil.nome_completo ||
        perfil.usuario ||
        "Administrador";


    avatarAdministrador.textContent =
        (
            perfil.nome_completo ||
            perfil.usuario ||
            "A"
        )
        .charAt(0)
        .toUpperCase();


    return true;

}


/* ==========================================
   DATAS PADRÃO
========================================== */

function definirDatasPadrao() {

    const hoje =
        new Date();


    const ano =
        hoje.getFullYear();


    const mes =
        String(
            hoje.getMonth() + 1
        )
        .padStart(2, "0");


    const dia =
        String(
            hoje.getDate()
        )
        .padStart(2, "0");


    const dataHoje =
        `${ano}-${mes}-${dia}`;


    dataInicialRelatorio.value =
        dataHoje;


    dataFinalRelatorio.value =
        dataHoje;

}


/* ==========================================
   LIMPAR RESULTADOS
========================================== */

function limparResultados() {

    totalVendas.textContent =
        "0";

    faturamento.textContent =
        formatarMoeda(0);

    ticketMedio.textContent =
        formatarMoeda(0);

    totalDescontos.textContent =
        formatarMoeda(0);

    custoProdutos.textContent =
        formatarMoeda(0);

    lucroBruto.textContent =
        formatarMoeda(0);


    resumoFaturamento.textContent =
        formatarMoeda(0);

    resumoCusto.textContent =
        formatarMoeda(0);

    resumoLucro.textContent =
        formatarMoeda(0);


    listaProdutosVendidos.innerHTML =
        "";

    listaPagamentos.innerHTML =
        "";

    listaVendasDia.innerHTML =
        "";


    carregandoProdutos.style.display =
        "none";

    semProdutosVendidos.style.display =
        "block";

    containerTabelaProdutos.style.display =
        "none";


    carregandoPagamentos.style.display =
        "none";

    semPagamentos.style.display =
        "block";

    listaPagamentos.style.display =
        "none";


    carregandoVendasDia.style.display =
        "none";

    semVendasDia.style.display =
        "block";

    containerTabelaVendasDia.style.display =
        "none";

}


/* ==========================================
   CARREGAR VENDAS
========================================== */

async function carregarVendas() {

    const dataInicial =
        dataInicialRelatorio.value;

    const dataFinal =
        dataFinalRelatorio.value;


    if (
        !dataInicial ||
        !dataFinal
    ) {

        mostrarMensagem(
            "Informe a data inicial e a data final.",
            "erro"
        );

        return;

    }


    if (
        dataInicial >
        dataFinal
    ) {

        mostrarMensagem(
            "A data inicial não pode ser maior que a data final.",
            "erro"
        );

        return;

    }


    limparResultados();


    mostrarMensagem(
        "Gerando relatório..."
    );


    const inicio =
        `${dataInicial}T00:00:00`;


    const dataFinalObj =
        new Date(
            `${dataFinal}T00:00:00`
        );


    dataFinalObj.setDate(
        dataFinalObj.getDate() + 1
    );


    const proximoDia =
        dataFinalObj
            .toISOString()
            .slice(0, 10);


    const fim =
        `${proximoDia}T00:00:00`;


    const resultado =
        await relatoriosSupabase
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
                "status",
                "finalizada"
            )
            .gte(
                "criado_em",
                inicio
            )
            .lt(
                "criado_em",
                fim
            )
            .order(
                "criado_em",
                {
                    ascending: true
                }
            );


    if (resultado.error) {

        console.error(
            resultado.error
        );

        mostrarMensagem(
            "Não foi possível carregar as vendas.",
            "erro"
        );

        return;

    }


    vendasRelatorio =
        resultado.data || [];


    periodoRelatorio.textContent =
        `Período: ${formatarData(dataInicial)} até ${formatarData(dataFinal)}`;


    if (
        vendasRelatorio.length === 0
    ) {

        mostrarMensagem(
            "Nenhuma venda finalizada encontrada neste período.",
            "sucesso"
        );

        return;

    }


    const idsVendas =
        vendasRelatorio.map(
            venda => venda.id
        );


    await carregarItens(
        idsVendas
    );


    await carregarProdutos();


    montarIndicadores();

    montarProdutosVendidos();

    montarPagamentos();

    montarVendasPorDia();


    mostrarMensagem(
        "Relatório atualizado com sucesso.",
        "sucesso"
    );

}


/* ==========================================
   CARREGAR ITENS
========================================== */

async function carregarItens(
    idsVendas
) {

    itensRelatorio = [];


    if (
        idsVendas.length === 0
    ) {
        return;
    }


    const resultado =
        await relatoriosSupabase
            .from("itens_venda")
            .select(`
                id,
                venda_id,
                produto_id,
                quantidade,
                preco_unitario,
                custo_unitario,
                subtotal
            `)
            .in(
                "venda_id",
                idsVendas
            );


    if (resultado.error) {

        console.error(
            resultado.error
        );

        mostrarMensagem(
            "As vendas foram carregadas, mas não foi possível carregar os itens.",
            "erro"
        );

        return;

    }


    itensRelatorio =
        resultado.data || [];

}


/* ==========================================
   CARREGAR PRODUTOS
========================================== */

async function carregarProdutos() {

    produtosRelatorio = [];


    const idsProdutos =
        [
            ...new Set(
                itensRelatorio
                    .map(
                        item =>
                            item.produto_id
                    )
                    .filter(Boolean)
            )
        ];


    if (
        idsProdutos.length === 0
    ) {
        return;
    }


    const resultado =
        await relatoriosSupabase
            .from("produtos")
            .select(`
                id,
                nome,
                sku
            `)
            .in(
                "id",
                idsProdutos
            );


    if (resultado.error) {

        console.error(
            resultado.error
        );

        return;

    }


    produtosRelatorio =
        resultado.data || [];

}


/* ==========================================
   INDICADORES
========================================== */

function montarIndicadores() {

    const quantidadeVendas =
        vendasRelatorio.length;


    const valorFaturamento =
        vendasRelatorio.reduce(
            (
                total,
                venda
            ) =>
                total +
                (
                    Number(
                        venda.total
                    ) || 0
                ),
            0
        );


    const valorDescontos =
        vendasRelatorio.reduce(
            (
                total,
                venda
            ) =>
                total +
                (
                    Number(
                        venda.desconto
                    ) || 0
                ),
            0
        );


    const custo =
        itensRelatorio.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    (
                        Number(
                            item.custo_unitario
                        ) || 0
                    )
                    *
                    (
                        Number(
                            item.quantidade
                        ) || 0
                    )
                ),
            0
        );


    const lucro =
        valorFaturamento -
        custo;


    const ticket =
        quantidadeVendas > 0
            ? valorFaturamento /
              quantidadeVendas
            : 0;


    totalVendas.textContent =
        quantidadeVendas;


    faturamento.textContent =
        formatarMoeda(
            valorFaturamento
        );


    ticketMedio.textContent =
        formatarMoeda(
            ticket
        );


    totalDescontos.textContent =
        formatarMoeda(
            valorDescontos
        );


    custoProdutos.textContent =
        formatarMoeda(
            custo
        );


    lucroBruto.textContent =
        formatarMoeda(
            lucro
        );


    resumoFaturamento.textContent =
        formatarMoeda(
            valorFaturamento
        );


    resumoCusto.textContent =
        formatarMoeda(
            custo
        );


    resumoLucro.textContent =
        formatarMoeda(
            lucro
        );

}


/* ==========================================
   PRODUTOS MAIS VENDIDOS
========================================== */

function montarProdutosVendidos() {

    const mapa =
        new Map();


    itensRelatorio.forEach(
        item => {

            const produto =
                produtosRelatorio.find(
                    p =>
                        p.id ===
                        item.produto_id
                );


            const nome =
                produto?.nome ||
                "Produto não encontrado";


            const quantidade =
                Number(
                    item.quantidade
                ) || 0;


            const faturamentoItem =
                Number(
                    item.subtotal
                ) || 0;


            const custoItem =
                (
                    Number(
                        item.custo_unitario
                    ) || 0
                )
                *
                quantidade;


            const lucroItem =
                faturamentoItem -
                custoItem;


            if (
                !mapa.has(
                    item.produto_id
                )
            ) {

                mapa.set(
                    item.produto_id,
                    {
                        nome,
                        quantidade: 0,
                        faturamento: 0,
                        lucro: 0
                    }
                );

            }


            const registro =
                mapa.get(
                    item.produto_id
                );


            registro.quantidade +=
                quantidade;

            registro.faturamento +=
                faturamentoItem;

            registro.lucro +=
                lucroItem;

        }
    );


    const produtos =
        Array.from(
            mapa.values()
        )
        .sort(
            (
                a,
                b
            ) =>
                b.quantidade -
                a.quantidade
        );


    if (
        produtos.length === 0
    ) {

        carregandoProdutos.style.display =
            "none";

        semProdutosVendidos.style.display =
            "block";

        containerTabelaProdutos.style.display =
            "none";

        return;

    }


    carregandoProdutos.style.display =
        "none";

    semProdutosVendidos.style.display =
        "none";

    containerTabelaProdutos.style.display =
        "block";


    listaProdutosVendidos.innerHTML =
        "";


    produtos.forEach(
        produto => {

            const tr =
                document.createElement(
                    "tr"
                );


            const tdNome =
                document.createElement(
                    "td"
                );

            tdNome.textContent =
                produto.nome;


            const tdQuantidade =
                document.createElement(
                    "td"
                );

            tdQuantidade.textContent =
                produto.quantidade;


            const tdFaturamento =
                document.createElement(
                    "td"
                );

            tdFaturamento.textContent =
                formatarMoeda(
                    produto.faturamento
                );


            const tdLucro =
                document.createElement(
                    "td"
                );

            tdLucro.textContent =
                formatarMoeda(
                    produto.lucro
                );

            tdLucro.className =
                produto.lucro >= 0
                    ? "valor-positivo"
                    : "valor-negativo";


            tr.appendChild(
                tdNome
            );

            tr.appendChild(
                tdQuantidade
            );

            tr.appendChild(
                tdFaturamento
            );

            tr.appendChild(
                tdLucro
            );


            listaProdutosVendidos.appendChild(
                tr
            );

        }
    );

}


/* ==========================================
   FORMAS DE PAGAMENTO
========================================== */

function montarPagamentos() {

    const mapa =
        new Map();


    vendasRelatorio.forEach(
        venda => {

            const forma =
                formatarFormaPagamento(
                    venda.forma_pagamento
                );


            const valor =
                Number(
                    venda.total
                ) || 0;


            if (
                !mapa.has(
                    forma
                )
            ) {

                mapa.set(
                    forma,
                    {
                        quantidade: 0,
                        valor: 0
                    }
                );

            }


            const registro =
                mapa.get(
                    forma
                );


            registro.quantidade++;

            registro.valor +=
                valor;

        }
    );


    const pagamentos =
        Array.from(
            mapa.entries()
        )
        .map(
            ([nome, dados]) => ({
                nome,
                quantidade:
                    dados.quantidade,
                valor:
                    dados.valor
            })
        )
        .sort(
            (
                a,
                b
            ) =>
                b.valor -
                a.valor
        );


    if (
        pagamentos.length === 0
    ) {

        carregandoPagamentos.style.display =
            "none";

        semPagamentos.style.display =
            "block";

        listaPagamentos.style.display =
            "none";

        return;

    }


    carregandoPagamentos.style.display =
        "none";

    semPagamentos.style.display =
        "none";

    listaPagamentos.style.display =
        "flex";


    listaPagamentos.innerHTML =
        "";


    const faturamentoTotal =
        vendasRelatorio.reduce(
            (
                total,
                venda
            ) =>
                total +
                (
                    Number(
                        venda.total
                    ) || 0
                ),
            0
        );


    pagamentos.forEach(
        pagamento => {

            const percentual =
                faturamentoTotal > 0
                    ? (
                        pagamento.valor /
                        faturamentoTotal
                    )
                    * 100
                    : 0;


            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "item-pagamento";


            const topo =
                document.createElement(
                    "div"
                );

            topo.className =
                "topo-pagamento";


            const nome =
                document.createElement(
                    "span"
                );

            nome.className =
                "nome-pagamento";

            nome.textContent =
                pagamento.nome;


            const valor =
                document.createElement(
                    "span"
                );

            valor.className =
                "valor-pagamento";

            valor.textContent =
                formatarMoeda(
                    pagamento.valor
                );


            topo.appendChild(
                nome
            );

            topo.appendChild(
                valor
            );


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "info-pagamento";


            const quantidade =
                document.createElement(
                    "span"
                );

            quantidade.textContent =
                `${pagamento.quantidade} venda(s)`;


            const porcentagem =
                document.createElement(
                    "span"
                );

            porcentagem.textContent =
                `${percentual.toFixed(1)}%`;


            info.appendChild(
                quantidade
            );

            info.appendChild(
                porcentagem
            );


            const barra =
                document.createElement(
                    "div"
                );

            barra.className =
                "barra-pagamento";


            const preenchimento =
                document.createElement(
                    "span"
                );

            preenchimento.style.width =
                `${percentual}%`;


            barra.appendChild(
                preenchimento
            );


            item.appendChild(
                topo
            );

            item.appendChild(
                info
            );

            item.appendChild(
                barra
            );


            listaPagamentos.appendChild(
                item
            );

        }
    );

}


/* ==========================================
   VENDAS POR DIA
========================================== */

function montarVendasPorDia() {

    const mapa =
        new Map();


    vendasRelatorio.forEach(
        venda => {

            const data =
                venda.criado_em
                    ? venda.criado_em
                        .slice(
                            0,
                            10
                        )
                    : null;


            if (!data) {
                return;
            }


            if (
                !mapa.has(
                    data
                )
            ) {

                mapa.set(
                    data,
                    {
                        quantidade: 0,
                        faturamento: 0,
                        descontos: 0
                    }
                );

            }


            const registro =
                mapa.get(
                    data
                );


            registro.quantidade++;


            registro.faturamento +=
                Number(
                    venda.total
                ) || 0;


            registro.descontos +=
                Number(
                    venda.desconto
                ) || 0;

        }
    );


    const dias =
        Array.from(
            mapa.entries()
        )
        .sort(
            (
                a,
                b
            ) =>
                a[0].localeCompare(
                    b[0]
                )
        );


    if (
        dias.length === 0
    ) {

        carregandoVendasDia.style.display =
            "none";

        semVendasDia.style.display =
            "block";

        containerTabelaVendasDia.style.display =
            "none";

        return;

    }


    carregandoVendasDia.style.display =
        "none";

    semVendasDia.style.display =
        "none";

    containerTabelaVendasDia.style.display =
        "block";


    listaVendasDia.innerHTML =
        "";


    dias.forEach(
        ([data, dados]) => {

            const tr =
                document.createElement(
                    "tr"
                );


            const tdData =
                document.createElement(
                    "td"
                );

            tdData.textContent =
                formatarData(
                    data
                );


            const tdQuantidade =
                document.createElement(
                    "td"
                );

            tdQuantidade.textContent =
                dados.quantidade;


            const tdFaturamento =
                document.createElement(
                    "td"
                );

            tdFaturamento.textContent =
                formatarMoeda(
                    dados.faturamento
                );


            const tdDescontos =
                document.createElement(
                    "td"
                );

            tdDescontos.textContent =
                formatarMoeda(
                    dados.descontos
                );


            tr.appendChild(
                tdData
            );

            tr.appendChild(
                tdQuantidade
            );

            tr.appendChild(
                tdFaturamento
            );

            tr.appendChild(
                tdDescontos
            );


            listaVendasDia.appendChild(
                tr
            );

        }
    );

}


/* ==========================================
   SAIR
========================================== */

async function sair() {

    await relatoriosSupabase.auth.signOut();

    sessionStorage.removeItem(
        "sistemaLojaPerfil"
    );

    window.location.href =
        "index.html";

}


/* ==========================================
   EVENTOS
========================================== */

btnGerarRelatorio.addEventListener(
    "click",
    carregarVendas
);


btnSair.addEventListener(
    "click",
    sair
);


/* ==========================================
   INICIAR
========================================== */

async function iniciarRelatorios() {

    const permitido =
        await protegerPaginaRelatorios();


    if (!permitido) {
        return;
    }


    definirDatasPadrao();


    await carregarVendas();

}


iniciarRelatorios();