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

    const primeiroDiaMes = `${ano}-${mes}-01`;

    dataInicialRelatorio.value = primeiroDiaMes;
    dataFinalRelatorio.value = dataHoje;

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

/* ==========================================
   RELATÓRIO MENSAL - IMPRESSÃO / PDF
========================================== */

function escaparHtmlRelatorio(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function obterProdutosParaImpressao() {
    const mapa = new Map();

    itensRelatorio.forEach(item => {
        const produto = produtosRelatorio.find(p => p.id === item.produto_id);
        const chave = item.produto_id || produto?.id || item.id;
        const nome = produto?.nome || "Produto não encontrado";
        const quantidade = Number(item.quantidade) || 0;
        const valorTotal = Number(item.subtotal) || 0;

        if (!mapa.has(chave)) {
            mapa.set(chave, { nome, quantidade: 0, valorTotal: 0 });
        }

        const registro = mapa.get(chave);
        registro.quantidade += quantidade;
        registro.valorTotal += valorTotal;
    });

    return Array.from(mapa.values()).sort((a, b) => {
        if (b.quantidade !== a.quantidade) return b.quantidade - a.quantidade;
        return a.nome.localeCompare(b.nome, "pt-BR");
    });
}

async function imprimirRelatorioMensal() {
    if (!dataInicialRelatorio.value || !dataFinalRelatorio.value) {
        mostrarMensagem("Selecione a data inicial e a data final e gere o relatório antes de imprimir.", "erro");
        return;
    }

    if (dataInicialRelatorio.value > dataFinalRelatorio.value) {
        mostrarMensagem("A data inicial não pode ser maior que a data final.", "erro");
        return;
    }

    if (vendasRelatorio.length === 0) {
        mostrarMensagem("Não há vendas finalizadas no período. Gere um relatório com vendas antes de imprimir.", "erro");
        return;
    }

    // Abrir a janela antes da consulta para evitar bloqueio de pop-up pelo navegador.
    const janela = window.open("", "_blank");
    if (!janela) {
        mostrarMensagem("O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.", "erro");
        return;
    }
    janela.document.write("<p style='font-family:Arial;padding:24px'>Preparando relatório mensal...</p>");

    const dataInicial = dataInicialRelatorio.value;
    const dataFinal = dataFinalRelatorio.value;
    const produtos = obterProdutosParaImpressao();
    const totalVendasBrutas = vendasRelatorio.reduce(
        (total, venda) => total + (Number(venda.subtotal) || 0), 0
    );
    const totalDescontosResumo = vendasRelatorio.reduce(
        (total, venda) => total + (Number(venda.desconto) || 0), 0
    );

    // Entradas e saídas são somente lançamentos do financeiro; vendas ficam separadas.
    const resultadoFinanceiro = await relatoriosSupabase
        .from("financeiro")
        .select("tipo, valor, data_movimento")
        .gte("data_movimento", dataInicial)
        .lte("data_movimento", dataFinal);

    if (resultadoFinanceiro.error) {
        console.error(resultadoFinanceiro.error);
        janela.close();
        mostrarMensagem("Não foi possível carregar as entradas e saídas financeiras. Nenhum relatório foi impresso.", "erro");
        return;
    }

    const lancamentos = resultadoFinanceiro.data || [];
    const totalEntradas = lancamentos.reduce((total, item) =>
        total + (item.tipo === "entrada" ? (Number(item.valor) || 0) : 0), 0
    );
    const totalSaidas = lancamentos.reduce((total, item) =>
        total + (item.tipo === "saida" ? (Number(item.valor) || 0) : 0), 0
    );
    const totalResumo = totalVendasBrutas - totalDescontosResumo + totalEntradas - totalSaidas;

    const linhas = produtos.map(produto => `
        <tr>
            <td>${escaparHtmlRelatorio(produto.nome)}</td>
            <td class="numero">${produto.quantidade}</td>
            <td class="valor">${escaparHtmlRelatorio(formatarMoeda(produto.valorTotal))}</td>
        </tr>
    `).join("");

    const periodo = `${formatarData(dataInicial)} até ${formatarData(dataFinal)}`;
    const totalVendasLiquidas = totalVendasBrutas - totalDescontosResumo;

    janela.document.open();
    janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório mensal de vendas</title>
    <style>
        @page { size: A4 portrait; margin: 16mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; font-size: 12px; }
        header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 16px; margin-bottom: 22px; }
        h1 { font-size: 21px; margin: 0 0 8px; letter-spacing: .3px; }
        .subtitulo { color: #4b5563; font-size: 12px; margin: 0; }
        .periodo { margin-top: 8px; font-weight: 700; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; page-break-inside: avoid; }
        th { text-align: left; background: #f3f4f6; color: #111827; padding: 10px 8px; border-bottom: 1px solid #9ca3af; }
        td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
        .numero, .valor { text-align: right; white-space: nowrap; }
        .numero { width: 90px; }
        .valor { width: 145px; }
        tfoot td { border-top: 2px solid #1f2937; border-bottom: 0; padding-top: 15px; font-weight: 700; font-size: 14px; }
        .total-label { text-align: right; }
        .resumo { margin-top: 28px; break-inside: avoid; page-break-inside: avoid; }
        .resumo h2 { font-size: 16px; margin: 0 0 10px; padding-bottom: 8px; border-bottom: 2px solid #1f2937; }
        .linha-resumo { display: flex; justify-content: space-between; gap: 20px; padding: 7px 2px; border-bottom: 1px solid #e5e7eb; }
        .linha-resumo strong { white-space: nowrap; }
        .linha-total { margin-top: 6px; padding: 11px 2px; border-top: 2px solid #1f2937; border-bottom: 0; font-size: 14px; font-weight: 700; }
        .rodape { margin-top: 24px; padding-top: 10px; border-top: 1px solid #d1d5db; color: #6b7280; font-size: 10px; text-align: center; }
        @media screen { body { max-width: 800px; margin: 24px auto; padding: 24px; box-shadow: 0 2px 16px rgba(0,0,0,.12); } }
    </style>
</head>
<body>
    <header>
        <h1>RELATÓRIO MENSAL DE VENDAS</h1>
        <p class="subtitulo">Sistema da Loja</p>
        <p class="periodo">Período: ${escaparHtmlRelatorio(periodo)}</p>
    </header>
    <table>
        <thead><tr><th>Produto</th><th class="numero">Quantidade vendida</th><th class="valor">Valor total</th></tr></thead>
        <tbody>${linhas || '<tr><td colspan="3">Nenhum produto vendido no período.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="2" class="total-label">TOTAL DE VENDAS DO PERÍODO</td><td class="valor">${escaparHtmlRelatorio(formatarMoeda(totalVendasLiquidas))}</td></tr></tfoot>
    </table>

    <section class="resumo">
        <h2>RESUMO MENSAL</h2>
        <div class="linha-resumo"><span>Vendas (antes dos descontos)</span><strong>${escaparHtmlRelatorio(formatarMoeda(totalVendasBrutas))}</strong></div>
        <div class="linha-resumo"><span>Descontos</span><strong>${escaparHtmlRelatorio(formatarMoeda(totalDescontosResumo))}</strong></div>
        <div class="linha-resumo"><span>Entradas (sem vendas)</span><strong>${escaparHtmlRelatorio(formatarMoeda(totalEntradas))}</strong></div>
        <div class="linha-resumo"><span>Saídas</span><strong>${escaparHtmlRelatorio(formatarMoeda(totalSaidas))}</strong></div>
        <div class="linha-resumo linha-total"><span>TOTAL DO PERÍODO</span><strong>${escaparHtmlRelatorio(formatarMoeda(totalResumo))}</strong></div>
    </section>
    <div class="rodape">Relatório gerado pelo Sistema da Loja.</div>
    <script>
        window.addEventListener("load", function () { window.focus(); window.print(); });
    <\/script>
</body>
</html>`);
    janela.document.close();
}

btnGerarRelatorio.addEventListener(

    "click",

    carregarVendas

);

const btnImprimirRelatorioMensal = document.getElementById("btnImprimirRelatorioMensal");
if (btnImprimirRelatorioMensal) {
    btnImprimirRelatorioMensal.addEventListener("click", imprimirRelatorioMensal);
}

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
