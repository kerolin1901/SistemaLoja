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

let nomeLojaRelatorio = "Sistema da Loja";

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

                ativo,

                loja_id

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

    // O nome da loja é usado apenas no cabeçalho impresso.
    // Se a consulta não estiver disponível, o relatório continua funcionando.
    if (perfil.loja_id) {
        const resultadoLoja = await relatoriosSupabase
            .from("lojas")
            .select("nome")
            .eq("id", perfil.loja_id)
            .maybeSingle();

        if (!resultadoLoja.error && resultadoLoja.data?.nome) {
            nomeLojaRelatorio = resultadoLoja.data.nome;
        }
    }

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

    aplicarValoresLiquidosAosItens();

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

   DISTRIBUIR FATURAMENTO LÍQUIDO POR ITEM

   O total gravado em vendas é o valor efetivamente cobrado
   após desconto. Distribuímos esse total proporcionalmente
   aos subtotais dos itens, arredondando em centavos para que
   a soma dos produtos seja exatamente igual à venda.

========================================== */

function aplicarValoresLiquidosAosItens() {

    const vendasPorId = new Map(
        vendasRelatorio.map(venda => [String(venda.id), venda])
    );

    const itensPorVenda = new Map();

    itensRelatorio.forEach(item => {
        const chaveVenda = String(item.venda_id);

        if (!itensPorVenda.has(chaveVenda)) {
            itensPorVenda.set(chaveVenda, []);
        }

        const subtotalInformado = Number(item.subtotal);
        const subtotalCalculado =
            (Number(item.preco_unitario) || 0) *
            (Number(item.quantidade) || 0);

        const subtotalBruto =
            item.subtotal !== null &&
            item.subtotal !== undefined &&
            Number.isFinite(subtotalInformado)
                ? subtotalInformado
                : subtotalCalculado;

        itensPorVenda.get(chaveVenda).push({
            item,
            brutoCentavos: Math.max(0, Math.round(subtotalBruto * 100))
        });
    });

    itensPorVenda.forEach((itens, chaveVenda) => {
        const venda = vendasPorId.get(chaveVenda);
        const totalLiquidoCentavos = venda
            ? Math.max(0, Math.round((Number(venda.total) || 0) * 100))
            : null;

        const brutoTotalCentavos = itens.reduce(
            (total, registro) => total + registro.brutoCentavos,
            0
        );

        if (totalLiquidoCentavos === null) {
            itens.forEach(registro => {
                registro.item.valorLiquidoRelatorio =
                    registro.brutoCentavos / 100;
            });
            return;
        }

        if (brutoTotalCentavos <= 0) {
            itens.forEach((registro, indice) => {
                registro.item.valorLiquidoRelatorio =
                    indice === itens.length - 1
                        ? totalLiquidoCentavos / 100
                        : 0;
            });
            return;
        }

        const alocacoes = itens.map(registro => {
            const valorExato =
                totalLiquidoCentavos *
                registro.brutoCentavos /
                brutoTotalCentavos;

            return {
                ...registro,
                centavosAlocados: Math.floor(valorExato),
                resto: valorExato - Math.floor(valorExato)
            };
        });

        let centavosRestantes = totalLiquidoCentavos - alocacoes.reduce(
            (total, registro) => total + registro.centavosAlocados,
            0
        );

        const ordemPorResto = [...alocacoes].sort(
            (a, b) => b.resto - a.resto
        );

        let indiceResto = 0;

        while (centavosRestantes > 0 && ordemPorResto.length > 0) {
            ordemPorResto[indiceResto].centavosAlocados += 1;
            centavosRestantes -= 1;
            indiceResto = (indiceResto + 1) % ordemPorResto.length;
        }

        alocacoes.forEach(registro => {
            registro.item.valorLiquidoRelatorio =
                registro.centavosAlocados / 100;
        });
    });
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

                    item.valorLiquidoRelatorio ?? item.subtotal

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

        const valorTotal = Number(item.valorLiquidoRelatorio ?? item.subtotal) || 0;

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

    // Abrir a janela imediatamente para evitar bloqueio de pop-up pelo navegador.
    const janela = window.open("", "_blank");

    if (!janela) {
        mostrarMensagem("O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.", "erro");
        return;
    }

    janela.document.open();
    janela.document.write("<p style='font-family:Arial;padding:24px'>Preparando relatório mensal...</p>");
    janela.document.close();

    try {
        const dataInicial = dataInicialRelatorio.value;
        const dataFinal = dataFinalRelatorio.value;
        const produtos = obterProdutosParaImpressao();

        const totalVendasBrutas = vendasRelatorio.reduce(
            (total, venda) => total + (Number(venda.subtotal) || 0),
            0
        );

        const totalDescontosResumo = vendasRelatorio.reduce(
            (total, venda) => total + (Number(venda.desconto) || 0),
            0
        );

        // O campo venda.total já contém o valor efetivamente cobrado após descontos.
        const totalVendasLiquidas = vendasRelatorio.reduce(
            (total, venda) => total + (Number(venda.total) || 0),
            0
        );

        const custoProdutosTotal = itensRelatorio.reduce(
            (total, item) => total +
                (Number(item.custo_unitario) || 0) *
                (Number(item.quantidade) || 0),
            0
        );

        const lucroBrutoPeriodo = totalVendasLiquidas - custoProdutosTotal;

        // Consulta apenas os lançamentos do período selecionado. O RLS continua
        // determinando quais registros financeiros o administrador pode consultar.
        const resultadoFinanceiro = await relatoriosSupabase
            .from("financeiro")
            .select("tipo, categoria, valor, data_movimento")
            .gte("data_movimento", dataInicial)
            .lte("data_movimento", dataFinal);

        if (resultadoFinanceiro.error) {
            console.error("Erro ao carregar financeiro para impressão:", resultadoFinanceiro.error);
            janela.close();
            mostrarMensagem("Não foi possível carregar as entradas e saídas financeiras. Nenhum relatório foi impresso.", "erro");
            return;
        }

        const lancamentos = resultadoFinanceiro.data || [];

        const normalizarCategoria = categoria => String(categoria || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const totalVendasRecebidas = lancamentos.reduce((total, item) => {
            const categoria = normalizarCategoria(item.categoria);
            return total + (
                item.tipo === "entrada" && categoria === "venda"
                    ? (Number(item.valor) || 0)
                    : 0
            );
        }, 0);

        const totalOutrasEntradas = lancamentos.reduce((total, item) => {
            const categoria = normalizarCategoria(item.categoria);
            return total + (
                item.tipo === "entrada" && categoria !== "venda"
                    ? (Number(item.valor) || 0)
                    : 0
            );
        }, 0);

        const totalEntradasFinanceiro = lancamentos.reduce(
            (total, item) => total + (
                item.tipo === "entrada" ? (Number(item.valor) || 0) : 0
            ),
            0
        );

        const totalSaidasFinanceiro = lancamentos.reduce(
            (total, item) => total + (
                item.tipo === "saida" ? (Number(item.valor) || 0) : 0
            ),
            0
        );

        const saldoPeriodo = totalEntradasFinanceiro - totalSaidasFinanceiro;

        // Receitas adicionais para o lucro estimado: entradas não classificadas
        // como Venda, Compra de mercadoria ou Fornecedor.
        const categoriasNaoReceita = new Set([
            "venda",
            "compra de mercadoria",
            "fornecedor"
        ]);

        const receitasAdicionais = lancamentos.reduce((total, item) => {
            const categoria = normalizarCategoria(item.categoria);
            const contaComoReceita =
                item.tipo === "entrada" && !categoriasNaoReceita.has(categoria);

            return total + (contaComoReceita ? (Number(item.valor) || 0) : 0);
        }, 0);

        // Saídas classificadas como despesas operacionais reduzem o lucro estimado.
        // Compras de estoque/fornecedor não entram aqui para não descontar o custo
        // das mercadorias duas vezes: o custo dos itens vendidos já está no lucro bruto.
        const categoriasDespesaOperacional = new Set([
            "despesa",
            "salario",
            "aluguel",
            "impostos",
            "frete",
            "outros"
        ]);

        const despesasOperacionais = lancamentos.reduce((total, item) => {
            const categoria = normalizarCategoria(item.categoria);
            const contaComoDespesa =
                item.tipo === "saida" && categoriasDespesaOperacional.has(categoria);

            return total + (contaComoDespesa ? (Number(item.valor) || 0) : 0);
        }, 0);

        const lucroLiquidoEstimado = lucroBrutoPeriodo + receitasAdicionais - despesasOperacionais;
        // Arredondar primeiro para centavos evita exibir R$ 85,79 quando
        // o ticket médio real do exemplo é R$ 85,795 (R$ 85,80 na impressão).
        const ticketMedioPeriodo = vendasRelatorio.length > 0
            ? Math.round((totalVendasLiquidas * 100 / vendasRelatorio.length) + 1e-7) / 100
            : 0;

        const totalItensVendidos = produtos.reduce(
            (total, produto) => total + (Number(produto.quantidade) || 0),
            0
        );

        const margemBrutaPercentual = totalVendasLiquidas > 0
            ? (lucroBrutoPeriodo / totalVendasLiquidas) * 100
            : 0;

        const margemBrutaTexto = margemBrutaPercentual.toLocaleString("pt-BR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + "%";

        const linhasProdutos = produtos.map(produto => `
            <tr>
                <td>
                    <strong>${escaparHtmlRelatorio(produto.nome)}</strong>
                    <span class="product-sub">Valor líquido após distribuição proporcional dos descontos</span>
                </td>
                <td class="right">${Number(produto.quantidade) || 0} un.</td>
                <td class="right product-total">${escaparHtmlRelatorio(formatarMoeda(produto.valorTotal))}</td>
            </tr>
        `).join("");

        const periodo = `${formatarData(dataInicial)} — ${formatarData(dataFinal)}`;
        const dataEmissao = new Date().toLocaleDateString("pt-BR");

        janela.document.open();
        janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório mensal — Sistema da Loja</title>
<style>
  :root { --navy:#172554; --blue:#2563eb; --blue-light:#eff6ff; --text:#172033; --muted:#64748b; --line:#dbe3ef; --green:#047857; --green-bg:#ecfdf5; --red:#b91c1c; --pale:#f1f5f9; }
  * { box-sizing:border-box; }
  body { margin:0; background:#e9eef6; color:var(--text); font-family:Arial,Helvetica,sans-serif; font-size:11px; line-height:1.45; }
  .page { width:210mm; min-height:297mm; margin:18px auto; padding:14mm 14mm 12mm; background:#fff; box-shadow:0 8px 28px rgba(15,23,42,.13); }
  .top-banner { display:flex; justify-content:space-between; align-items:center; gap:18px; min-height:60px; padding:12px 14px; border-radius:9px; background:var(--navy); color:#fff; }
  .brand { display:flex; align-items:center; gap:10px; min-width:0; flex:1 1 auto; }
  .brand > div:last-child { width:max-content; flex:0 0 auto; }
  .logo { width:34px; height:34px; flex:0 0 34px; border-radius:7px; background:#fff; color:var(--navy); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; }
  .brandname { color:#fff; font-size:12px; font-weight:800; margin:0 0 3px; white-space:nowrap; }
  .banner-caption { color:#cbd5e1; font-size:8px; letter-spacing:.45px; text-transform:uppercase; }
  .period { text-align:right; min-width:155px; flex:0 0 auto; }
  .label { color:var(--muted); font-size:8.5px; text-transform:uppercase; letter-spacing:.45px; }
  .period .label { color:#cbd5e1; }
  .dates { color:#fff; font-weight:800; margin-top:4px; font-size:11px; white-space:nowrap; }
  .period .muted { color:#cbd5e1; font-size:8px; margin-top:4px; }
  .title-area { margin:15px 0 12px; padding-bottom:11px; border-bottom:2px solid var(--navy); }
  h1 { color:var(--navy); margin:0 0 4px; font-size:22px; line-height:1.12; letter-spacing:-.25px; }
  .subtitle { margin:0; color:var(--muted); font-size:10px; }
  .meta { display:grid; grid-template-columns:1.25fr 1fr 1fr; gap:12px; padding:0 0 12px; margin:0 0 12px; border-bottom:1px solid var(--line); }
  .meta strong { display:block; font-size:10px; margin-top:4px; }
  .section-heading { margin:16px 0 8px; }
  .section-title { display:flex; align-items:center; gap:8px; margin:0 0 2px; color:var(--navy); font-weight:800; font-size:11.5px; }
  .section-title:before { content:""; flex:0 0 4px; width:4px; height:14px; border-radius:2px; background:var(--blue); }
  .section-subtitle { color:var(--muted); font-size:8.5px; margin-left:12px; }
  .kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin:0 0 15px; }
  .kpi { border:1px solid var(--line); border-radius:7px; padding:10px 10px 9px; min-height:65px; }
  .kpi.highlight { background:var(--blue-light); border-color:#bfdbfe; }
  .kpi .value { color:var(--navy); font-weight:800; font-size:14px; margin-top:6px; white-space:nowrap; }
  .kpi-sub { color:var(--muted); font-size:8px; margin-top:4px; }
  table { width:100%; border-collapse:collapse; }
  thead { display:table-header-group; }
  thead th { text-align:left; background:var(--pale); color:#475569; font-size:8.5px; text-transform:uppercase; letter-spacing:.35px; padding:10px 9px; border-bottom:1px solid var(--line); }
  tbody td { padding:12px 9px; border-bottom:1px solid #e8edf4; vertical-align:middle; font-size:10px; }
  .right { text-align:right; white-space:nowrap; }
  .product-sub { display:block; color:var(--muted); font-size:8.5px; font-weight:400; margin-top:3px; }
  .product-total { color:var(--navy); font-weight:800; }
  tfoot td { padding:11px 9px; border-top:2px solid var(--navy); font-weight:800; }
  .total-label { text-align:right; color:var(--navy); }
  .summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .panel { border:1px solid var(--line); border-radius:8px; overflow:hidden; break-inside:avoid; page-break-inside:avoid; }
  .panel-head { background:#f8fafc; border-bottom:1px solid var(--line); padding:11px 12px; color:var(--navy); font-size:9.5px; font-weight:800; }
  .panel-body { padding:4px 12px 9px; }
  .row { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:8px 0; border-bottom:1px solid #edf1f6; }
  .row:last-child { border-bottom:0; }
  .row .name { color:#475569; }
  .row .amount { font-weight:700; white-space:nowrap; text-align:right; }
  .row.total { border-top:1px solid #94a3b8; border-bottom:0; margin-top:3px; padding-top:11px; font-size:10.5px; }
  .row.total .name, .row.total .amount { color:var(--navy); font-weight:800; }
  .positive { color:var(--green); }
  .negative { color:var(--red); }
  .net-box { margin-top:13px; border:1px solid #a7f3d0; background:var(--green-bg); border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px; break-inside:avoid; page-break-inside:avoid; }
  .net-box .eyebrow { color:var(--green); font-size:8px; font-weight:800; text-transform:uppercase; letter-spacing:.6px; margin-bottom:3px; }
  .net-box .name { color:#064e3b; font-size:12px; font-weight:800; }
  .net-box .formula { color:var(--green); font-size:8px; margin-top:3px; }
  .net-box .number { color:var(--green); font-size:21px; line-height:1; font-weight:800; white-space:nowrap; }
  .note { display:flex; gap:8px; align-items:stretch; margin-top:11px; padding:9px 11px; border-left:3px solid #94a3b8; background:#f8fafc; color:var(--muted); font-size:8.2px; break-inside:avoid; page-break-inside:avoid; }
  .note-accent { width:3px; flex:0 0 3px; border-radius:2px; background:var(--blue); }
  .note-content strong { display:block; color:var(--navy); font-size:8.5px; margin-bottom:3px; }
  .ribbon { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:11px; break-inside:avoid; page-break-inside:avoid; }
  .ribbon-item { border:1px solid var(--line); border-radius:6px; padding:8px 9px; min-height:38px; display:flex; justify-content:space-between; align-items:center; gap:7px; }
  .ribbon-item .ribbon-label { color:var(--muted); font-size:7.5px; font-weight:800; letter-spacing:.25px; }
  .ribbon-item .ribbon-value { color:var(--navy); font-size:10px; font-weight:800; text-align:right; white-space:nowrap; }
  .footer { display:flex; justify-content:space-between; gap:10px; margin-top:19px; padding-top:9px; border-top:1px solid var(--line); color:#94a3b8; font-size:8px; }
  @page { size:A4 portrait; margin:0; }
  @media print { body { background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; } .page { margin:0; box-shadow:none; width:210mm; min-height:297mm; } }
  @media screen and (max-width:760px) { .page { width:100%; margin:0; padding:22px; } .top-banner { align-items:flex-start; flex-direction:column; } .period { text-align:left; } .meta { grid-template-columns:1fr; } .kpis { grid-template-columns:repeat(2,minmax(0,1fr)); } .summary-grid { grid-template-columns:1fr; } .ribbon { grid-template-columns:1fr; } }
</style>
</head>
<body>
<main class="page">
  <header class="top-banner">
    <div class="brand">
      <div class="logo">SL</div>
      <div><p class="brandname">Sistema da Loja</p><div class="banner-caption">Relatórios gerenciais</div></div>
    </div>
    <div class="period"><div class="label">Período do relatório</div><div class="dates">${escaparHtmlRelatorio(periodo)}</div><div class="muted">Emitido em ${escaparHtmlRelatorio(dataEmissao)}</div></div>
  </header>

  <section class="title-area">
    <h1>Relatório mensal</h1>
    <p class="subtitle">Desempenho de vendas, custos e movimentação financeira</p>
  </section>

  <div class="meta">
    <div><div class="label">Loja</div><strong>${escaparHtmlRelatorio(nomeLojaRelatorio)}</strong></div>
    <div><div class="label">Status das vendas</div><strong>Somente vendas finalizadas</strong></div>
    <div><div class="label">Documento</div><strong>Resumo de desempenho</strong></div>
  </div>

  <div class="section-heading"><div class="section-title">Visão geral</div><div class="section-subtitle">Indicadores do período selecionado</div></div>
  <section class="kpis">
    <div class="kpi"><div class="label">Vendas finalizadas</div><div class="value">${vendasRelatorio.length}</div><div class="kpi-sub">Operações concluídas</div></div>
    <div class="kpi highlight"><div class="label">Vendas líquidas</div><div class="value">${escaparHtmlRelatorio(formatarMoeda(totalVendasLiquidas))}</div><div class="kpi-sub">Após os descontos</div></div>
    <div class="kpi"><div class="label">Descontos concedidos</div><div class="value">${escaparHtmlRelatorio(formatarMoeda(totalDescontosResumo))}</div><div class="kpi-sub">Total de descontos</div></div>
    <div class="kpi"><div class="label">Ticket médio</div><div class="value">${escaparHtmlRelatorio(formatarMoeda(ticketMedioPeriodo))}</div><div class="kpi-sub">Valor médio por venda</div></div>
  </section>

  <div class="section-heading"><div class="section-title">Produtos vendidos</div><div class="section-subtitle">Valores líquidos com descontos distribuídos proporcionalmente</div></div>
  <table>
    <thead><tr><th>Produto</th><th class="right">Quantidade</th><th class="right">Valor líquido</th></tr></thead>
    <tbody>${linhasProdutos || '<tr><td colspan="3">Nenhum produto vendido no período.</td></tr>'}</tbody>
    <tfoot><tr><td colspan="2" style="text-align:right;padding:9px 8px;border-top:2px solid #172554;font-weight:800">TOTAL DE VENDAS LÍQUIDAS</td><td class="right" style="padding:9px 8px;border-top:2px solid #172554;font-size:11px;font-weight:800">${escaparHtmlRelatorio(formatarMoeda(totalVendasLiquidas))}</td></tr></tfoot>
  </table>

  <div class="section-heading"><div class="section-title">Resumo financeiro e resultado</div><div class="section-subtitle">Resultado comercial separado da movimentação de dinheiro</div></div>
  <section class="summary-grid">
    <div class="panel">
      <div class="panel-head">RESULTADO DAS VENDAS</div>
      <div class="panel-body">
        <div class="row"><span class="name">Vendas antes dos descontos</span><strong class="amount">${escaparHtmlRelatorio(formatarMoeda(totalVendasBrutas))}</strong></div>
        <div class="row"><span class="name">Descontos concedidos</span><strong class="amount negative">− ${escaparHtmlRelatorio(formatarMoeda(totalDescontosResumo))}</strong></div>
        <div class="row"><span class="name">Vendas líquidas</span><strong class="amount">${escaparHtmlRelatorio(formatarMoeda(totalVendasLiquidas))}</strong></div>
        <div class="row"><span class="name">Custo dos produtos vendidos</span><strong class="amount negative">− ${escaparHtmlRelatorio(formatarMoeda(custoProdutosTotal))}</strong></div>
        <div class="row total"><span class="name">LUCRO BRUTO</span><strong class="amount ${lucroBrutoPeriodo >= 0 ? 'positive' : 'negative'}">${escaparHtmlRelatorio(formatarMoeda(lucroBrutoPeriodo))}</strong></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">MOVIMENTAÇÃO FINANCEIRA</div>
      <div class="panel-body">
        <div class="row"><span class="name">Vendas recebidas</span><strong class="amount">${escaparHtmlRelatorio(formatarMoeda(totalVendasRecebidas))}</strong></div>
        <div class="row"><span class="name">Outras entradas</span><strong class="amount positive">+ ${escaparHtmlRelatorio(formatarMoeda(totalOutrasEntradas))}</strong></div>
        <div class="row"><span class="name">TOTAL DE ENTRADAS</span><strong class="amount">${escaparHtmlRelatorio(formatarMoeda(totalEntradasFinanceiro))}</strong></div>
        <div class="row"><span class="name">Saídas registradas</span><strong class="amount negative">− ${escaparHtmlRelatorio(formatarMoeda(totalSaidasFinanceiro))}</strong></div>
        <div class="row total"><span class="name">SALDO DO PERÍODO</span><strong class="amount ${saldoPeriodo >= 0 ? 'positive' : 'negative'}">${escaparHtmlRelatorio(formatarMoeda(saldoPeriodo))}</strong></div>
      </div>
    </div>
  </section>

  <section class="net-box">
    <div><div class="eyebrow">Resultado operacional estimado</div><div class="name">Lucro líquido estimado</div><div class="formula">Lucro bruto + outras receitas consideradas − despesas operacionais</div></div>
    <div class="number">${escaparHtmlRelatorio(formatarMoeda(lucroLiquidoEstimado))}</div>
  </section>

  <div class="note"><div class="note-accent"></div><div class="note-content"><strong>COMO LER ESTE RELATÓRIO</strong>Lucro e saldo de caixa são indicadores diferentes. O lucro líquido estimado considera outras receitas e somente as despesas operacionais selecionadas. Compras de mercadoria e fornecedor não são descontadas novamente do lucro bruto; todas as saídas continuam reduzindo o saldo financeiro.</div></div>

  <section class="ribbon">
    <div class="ribbon-item"><span class="ribbon-label">MARGEM BRUTA</span><strong class="ribbon-value">${escaparHtmlRelatorio(margemBrutaTexto)}</strong></div>
    <div class="ribbon-item"><span class="ribbon-label">ITENS VENDIDOS</span><strong class="ribbon-value">${escaparHtmlRelatorio(totalItensVendidos.toLocaleString("pt-BR"))} un.</strong></div>
    <div class="ribbon-item"><span class="ribbon-label">MÉDIA POR VENDA</span><strong class="ribbon-value">${escaparHtmlRelatorio(formatarMoeda(ticketMedioPeriodo))}</strong></div>
  </section>

  <footer class="footer"><span>Sistema da Loja • Relatório gerencial</span><span>Documento de gestão • Não é documento fiscal</span></footer>
</main>
<script>
  window.addEventListener("load", function () { window.focus(); window.print(); });
<\/script>
</body>
</html>`);

        janela.document.close();
    } catch (erro) {
        console.error("Erro ao montar relatório impresso:", erro);
        janela.close();
        mostrarMensagem("Não foi possível preparar o relatório impresso. Confira o Console para ver o erro.", "erro");
    }
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
