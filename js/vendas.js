/* ==========================================

   SISTEMA DA LOJA

   VENDAS DO ADMINISTRADOR

   CARRINHO PADRONIZADO

========================================== */

/* ==========================================

   SUPABASE

========================================== */

const vendasSupabase =

    supabaseClient;

/* ==========================================

   ELEMENTOS

========================================== */

const clienteVenda =

    document.getElementById(

        "clienteVenda"

    );

const produtoVenda =

    document.getElementById(

        "produtoVenda"

    );

const quantidadeVenda =

    document.getElementById(

        "quantidadeVenda"

    );

const precoVenda =

    document.getElementById(

        "precoVenda"

    );

const btnAdicionarProduto =

    document.getElementById(

        "btnAdicionarProduto"

    );

const listaCarrinho =

    document.getElementById(

        "listaCarrinho"

    );

const carrinhoVazio =

    document.getElementById(

        "carrinhoVazio"

    );

const quantidadeItensCarrinho =

    document.getElementById(

        "quantidadeItensCarrinho"

    );

const valorSubtotal =

    document.getElementById(

        "valorSubtotal"

    );

const descontoVenda =

    document.getElementById(

        "descontoVenda"

    );

let seletorTipoDescontoVenda = null;
let tipoDescontoVendaAtual = "valor";
let descontoMaximoAplicado = false;
let descontoAvistaAtivo = false;
let assinaturaCarrinhoDescontoMaximo = "";
let configuracoesDescontosVenda = {
    desconto_maximo_ativo: true,
    desconto_avista_ativo: true,
    desconto_avista_percentual: 8
};
let erroCarregarConfiguracoesDescontosVenda = false;
let lojaIdDescontosVenda = null;
const btnAplicarDescontoAvista = document.getElementById("btnAplicarDescontoAvista");
const infoDescontoAvista = document.getElementById("infoDescontoAvista");

const valorTotal =

    document.getElementById(

        "valorTotal"

    );

const formaPagamento =

    document.getElementById(

        "formaPagamento"

    );

const camposPrazoVenda =

    document.getElementById("camposPrazoVenda");

const parcelasFiadoVenda =

    document.getElementById("parcelasFiadoVenda");

const diasPrimeiroVencimentoVenda =

    document.getElementById("diasPrimeiroVencimentoVenda");

const camposDinheiroVenda = document.getElementById("camposDinheiroVenda");
const valorRecebidoVenda = document.getElementById("valorRecebidoVenda");
const trocoVenda = document.getElementById("trocoVenda");
const avisoDinheiroVenda = document.getElementById("avisoDinheiroVenda");

const observacoesVenda =

    document.getElementById(

        "observacoesVenda"

    );

const btnCancelarVenda =

    document.getElementById(

        "btnCancelarVenda"

    );

const btnFinalizarVenda =

    document.getElementById(

        "btnFinalizarVenda"

    );

const mensagemVenda =

    document.getElementById(

        "mensagemVenda"

    );

const btnSair =

    document.getElementById(

        "btnSair"

    );

/* ==========================================

   ESTADO

========================================== */

let produtosVenda = [];

let clientesVenda = [];

let carrinho = [];

let buscaProdutoVenda = null;
let wrapperBuscaProdutoVenda = null;
let listaSugestoesProdutoVenda = null;
let produtosSugestoesVenda = [];
let indiceSugestaoProdutoVenda = -1;

let buscaClienteVenda = null;

/* ==========================================

   FORMATAÇÃO

========================================== */

function formatarMoeda(

    valor

) {

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

/* ==========================================

   ESCAPAR HTML

========================================== */

function escaparHTML(

    texto

) {

    const div =

        document.createElement(

            "div"

        );

    div.textContent =

        texto ?? "";

    return div.innerHTML;

}

/* ==========================================

   MENSAGEM

========================================== */

function mostrarMensagem(

    texto,

    tipo = "info"

) {

    if (!mensagemVenda) {

        return;

    }

    mensagemVenda.textContent =

        texto;

    mensagemVenda.className =

        "mensagem-venda";

    mensagemVenda.classList.add(

        tipo

    );

    mensagemVenda.style.display =

        "block";

    clearTimeout(

        mostrarMensagem._timer

    );

    mostrarMensagem._timer =

        setTimeout(

            function () {

                mensagemVenda.style.display =

                    "none";

            },

            4000

        );

}

/* ==========================================

   PROTEGER PÁGINA

========================================== */

async function protegerPaginaVendas() {

    try {

        const {

            data: {

                session

            },

            error

        } =

            await vendasSupabase

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

        } =

            await vendasSupabase

                .from("perfis")

                .select(

                    "id, nome_completo, usuario, tipo, ativo, loja_id"

                )

                .eq(

                    "id",

                    session.user.id

                )

                .maybeSingle();

        if (

            erroPerfil ||

            !perfil

        ) {

            console.error(

                "Erro ao carregar perfil:",

                erroPerfil

            );

            await vendasSupabase

                .auth

                .signOut({

                    scope: "local"

                });

            window.location.href =

                "index.html";

            return false;

        }

        if (

            perfil.ativo !== true

        ) {

            alert(

                "Seu usuário está desativado. Procure o administrador."

            );

            await vendasSupabase

                .auth

                .signOut({

                    scope: "local"

                });

            sessionStorage.removeItem(

                "sistemaLojaPerfil"

            );

            window.location.href =

                "index.html";

            return false;

        }

        if (

            perfil.tipo !== "admin"

        ) {

            window.location.href =

                "vendedor-vendas.html";

            return false;

        }

        lojaIdDescontosVenda = perfil.loja_id || null;

        const nomeAdministrador =

            document.getElementById(

                "nomeAdministrador"

            );

        const avatarAdministrador =

            document.querySelector(

                ".avatar-admin"

            );

        const nome =

            perfil.nome_completo ||

            perfil.usuario ||

            "Administrador";

        if (

            nomeAdministrador

        ) {

            nomeAdministrador.textContent =

                nome;

        }

        if (

            avatarAdministrador

        ) {

            avatarAdministrador.textContent =

                nome

                    .trim()

                    .charAt(0)

                    .toUpperCase();

        }

        sessionStorage.setItem(

            "sistemaLojaPerfil",

            JSON.stringify(perfil)

        );

        return true;

    }

    catch (erro) {

        console.error(

            "Erro ao proteger página:",

            erro

        );

        window.location.href =

            "index.html";

        return false;

    }

}

/* ==========================================
   CONFIGURAÇÕES DE DESCONTO POR LOJA
========================================== */
async function carregarConfiguracoesDescontosVenda() {
    const padrao = {
        desconto_maximo_ativo: true,
        desconto_avista_ativo: true,
        desconto_avista_percentual: 8
    };

    if (!lojaIdDescontosVenda) {
        erroCarregarConfiguracoesDescontosVenda = true;
        configuracoesDescontosVenda = {
            ...padrao,
            desconto_maximo_ativo: false,
            desconto_avista_ativo: false
        };
        atualizarInfoDescontoMaximo();
        atualizarControleDescontoAvista(0);
        mostrarMensagem(
            "Não foi possível identificar a loja para carregar as regras de desconto. Os botões automáticos ficaram desativados.",
            "erro"
        );
        return false;
    }

    const { data, error } = await vendasSupabase
        .from("configuracoes_descontos")
        .select("desconto_maximo_ativo, desconto_avista_ativo, desconto_avista_percentual")
        .eq("loja_id", lojaIdDescontosVenda)
        .maybeSingle();

    if (error) {
        console.error("Erro ao carregar configurações de desconto:", error);
        erroCarregarConfiguracoesDescontosVenda = true;
        configuracoesDescontosVenda = {
            ...padrao,
            desconto_maximo_ativo: false,
            desconto_avista_ativo: false
        };
        atualizarInfoDescontoMaximo();
        atualizarControleDescontoAvista(0);
        mostrarMensagem(
            "Não foi possível carregar as configurações de desconto. Confira se o SQL de configurações foi executado no Supabase. Os botões automáticos ficaram desativados.",
            "erro"
        );
        return false;
    }

    const percentual = Number(data?.desconto_avista_percentual ?? padrao.desconto_avista_percentual);
    configuracoesDescontosVenda = {
        desconto_maximo_ativo: data?.desconto_maximo_ativo !== false,
        desconto_avista_ativo: data?.desconto_avista_ativo !== false,
        desconto_avista_percentual: Number.isFinite(percentual)
            ? Math.max(0, Math.min(99.99, percentual))
            : padrao.desconto_avista_percentual
    };
    erroCarregarConfiguracoesDescontosVenda = false;

    atualizarInfoDescontoMaximo();
    atualizarControleDescontoAvista(0);
    return true;
}

function formatarPercentualDescontoAvista() {
    const percentual = Number(configuracoesDescontosVenda.desconto_avista_percentual) || 0;
    return percentual.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }) + "%";
}

/* ==========================================

   PADRONIZAÇÃO VISUAL

========================================== */

function aplicarEstiloVendas() {

    if (

        document.getElementById(

            "estiloVendasPadronizado"

        )

    ) {

        return;

    }

    const estilo =

        document.createElement(

            "style"

        );

    estilo.id =

        "estiloVendasPadronizado";

    estilo.textContent = `

        /* ==============================

           BUSCAS

        ============================== */

        .campo-busca-venda {

            width: 100% !important;

            height: 38px !important;

            padding: 0 12px !important;

            margin-bottom: 8px !important;

            border:

                1px solid

                #d1d5db !important;

            border-radius: 7px !important;

            background:

                #ffffff !important;

            color:

                #1f2937 !important;

            font-family:

                inherit !important;

            font-size:

                13px !important;

            outline:

                none !important;

            box-sizing:

                border-box !important;

        }

        .campo-busca-venda:focus {

            border-color:

                #2563eb !important;

            box-shadow:

                0 0 0 2px

                rgba(37, 99, 235, 0.08) !important;

        }

        /* ==============================

           FORÇAR LISTA VISÍVEL

        ============================== */

        #listaCarrinho {

            display:

                block !important;

            visibility:

                visible !important;

            opacity:

                1 !important;

            height:

                auto !important;

            min-height:

                0 !important;

            max-height:

                none !important;

            overflow:

                visible !important;

            width:

                100% !important;

            position:

                relative !important;

        }

        #listaCarrinho .carrinho-tabela-wrapper {

            display:

                block !important;

            visibility:

                visible !important;

            opacity:

                1 !important;

            width:

                100% !important;

            height:

                auto !important;

            overflow-x:

                auto !important;

            overflow-y:

                visible !important;

        }

        /* ==============================

           TABELA

        ============================== */

        #listaCarrinho .carrinho-tabela-admin {

            display:

                table !important;

            visibility:

                visible !important;

            opacity:

                1 !important;

            width:

                100% !important;

            min-width:

                700px !important;

            border-collapse:

                collapse !important;

            background:

                #ffffff !important;

        }

        #listaCarrinho

        .carrinho-tabela-admin th {

            display:

                table-cell !important;

            padding:

                11px 10px !important;

            text-align:

                left !important;

            background:

                #f8fafc !important;

            color:

                #6b7280 !important;

            font-size:

                10px !important;

            font-weight:

                800 !important;

            text-transform:

                uppercase !important;

            border-bottom:

                1px solid

                #e5e7eb !important;

            white-space:

                nowrap !important;

        }

        #listaCarrinho

        .carrinho-tabela-admin td {

            display:

                table-cell !important;

            padding:

                12px 10px !important;

            border-bottom:

                1px solid

                #eef0f3 !important;

            color:

                #374151 !important;

            font-size:

                12px !important;

            vertical-align:

                middle !important;

            background:

                #ffffff !important;

        }

        #listaCarrinho

        .carrinho-tabela-admin tr {

            display:

                table-row !important;

        }

        #listaCarrinho

        .carrinho-tabela-admin tbody {

            display:

                table-row-group !important;

        }

        #listaCarrinho

        .carrinho-tabela-admin thead {

            display:

                table-header-group !important;

        }

        /* ==============================

           PRODUTO

        ============================== */

        .produto-item-nome {

            color:

                #111827;

            font-weight:

                700;

        }

        .produto-item-sku {

            color:

                #6b7280;

            font-size:

                11px;

            font-weight:

                600;

        }

        /* ==============================

           QUANTIDADE

        ============================== */

        .controle-quantidade-carrinho {

            display:

                inline-flex !important;

            align-items:

                center !important;

            gap:

                4px !important;

        }

        .botao-quantidade {

            width:

                26px !important;

            height:

                26px !important;

            min-width:

                26px !important;

            min-height:

                26px !important;

            border:

                1px solid

                #d1d5db !important;

            border-radius:

                5px !important;

            background:

                #ffffff !important;

            color:

                #374151 !important;

            font-size:

                15px !important;

            font-weight:

                700 !important;

            line-height:

                1 !important;

            cursor:

                pointer !important;

            padding:

                0 !important;

        }

        .botao-quantidade:hover:not(:disabled) {

            background:

                #f3f4f6 !important;

        }

        .botao-quantidade:disabled {

            opacity:

                0.4 !important;

            cursor:

                not-allowed !important;

        }

        .quantidade-carrinho {

            width:

                42px !important;

            height:

                26px !important;

            padding:

                0 5px !important;

            border:

                1px solid

                #d1d5db !important;

            border-radius:

                5px !important;

            background:

                #ffffff !important;

            color:

                #111827 !important;

            text-align:

                center !important;

            font-size:

                12px !important;

            font-weight:

                700 !important;

            box-sizing:

                border-box !important;

        }

        .quantidade-carrinho:focus {

            outline:

                none !important;

            border-color:

                #2563eb !important;

        }

        .estoque-item {

            display:

                block !important;

            margin-top:

                4px !important;

            color:

                #6b7280 !important;

            font-size:

                10px !important;

        }

        /* ==============================

           PREÇOS

        ============================== */

        .preco-item {

            font-weight:

                700 !important;

            color:

                #111827 !important;

        }

        .subtotal-item {

            font-weight:

                700 !important;

            color:

                #111827 !important;

        }

        /* ==============================

           REMOVER

        ============================== */

        .botao-remover-item {

            min-height:

                28px !important;

            padding:

                5px 9px !important;

            border:

                1px solid

                #fecaca !important;

            border-radius:

                6px !important;

            background:

                #fff1f2 !important;

            color:

                #b91c1c !important;

            font-family:

                inherit !important;

            font-size:

                10px !important;

            font-weight:

                700 !important;

            cursor:

                pointer !important;

        }

        .botao-remover-item:hover {

            background:

                #fee2e2 !important;

        }

        /* ==============================

           MOBILE

        ============================== */

        @media (

            max-width: 850px

        ) {

            #listaCarrinho

            .carrinho-tabela-admin {

                min-width:

                    700px !important;

            }

        }

    `;

    document.head.appendChild(

        estilo

    );

}

/* ==========================================

   BUSCA CLIENTE

========================================== */

function criarBuscaCliente() {

    if (

        buscaClienteVenda

    ) {

        return;

    }

    buscaClienteVenda =

        document.createElement(

            "input"

        );

    buscaClienteVenda.type =

        "text";

    buscaClienteVenda.id =

        "buscaClienteVenda";

    buscaClienteVenda.className =

        "campo-busca-venda";

    buscaClienteVenda.placeholder =

        "🔎 Digite o nome ou telefone do cliente";

    buscaClienteVenda.autocomplete =

        "off";

    clienteVenda.parentNode.insertBefore(

        buscaClienteVenda,

        clienteVenda

    );

    buscaClienteVenda.addEventListener(

        "input",

        filtrarClientes

    );

}

/* ==========================================

   BUSCA PRODUTO

========================================== */


/* ==========================================
   AUTOCOMPLETE DE PRODUTOS
========================================== */

function aplicarEstiloAutocompleteProdutoVenda() {
    if (document.getElementById("estiloAutocompleteProdutoVenda")) return;

    const estilo = document.createElement("style");
    estilo.id = "estiloAutocompleteProdutoVenda";
    estilo.textContent = `
        .autocomplete-produto-venda {
            position: relative !important;
            display: block !important;
            width: 100% !important;
            min-width: 0 !important;
            z-index: 80;
        }
        .autocomplete-produto-venda .campo-busca-venda {
            display: block !important;
            width: 100% !important;
            margin-bottom: 0 !important;
        }
        .lista-sugestoes-produto-venda {
            position: absolute;
            top: calc(100% + 5px);
            left: 0;
            right: 0;
            z-index: 10050;
            max-height: 290px;
            overflow-y: auto;
            background: #fff;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            box-shadow: 0 12px 30px rgba(15, 23, 42, .18);
            padding: 5px;
        }
        .lista-sugestoes-produto-venda[hidden] { display: none !important; }
        .sugestao-produto-venda {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            width: 100%;
            padding: 10px 11px;
            border: 0;
            border-radius: 7px;
            background: #fff;
            color: #1f2937;
            text-align: left;
            cursor: pointer;
        }
        .sugestao-produto-venda:hover,
        .sugestao-produto-venda.ativa {
            background: #eff6ff;
        }
        .sugestao-produto-venda .sugestao-dados {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
        }
        .sugestao-produto-venda strong {
            overflow: hidden;
            color: #111827;
            font-size: 13px;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .sugestao-produto-venda small {
            color: #64748b;
            font-size: 11px;
        }
        .sugestao-produto-venda .sugestao-preco {
            flex: 0 0 auto;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
        }
        .sugestao-produto-venda-vazia {
            padding: 13px 11px;
            color: #64748b;
            font-size: 12px;
        }
        @media (max-width: 560px) {
            .lista-sugestoes-produto-venda { max-height: 220px; }
        }
    `;
    document.head.appendChild(estilo);
}

function ocultarSugestoesProdutoVenda() {
    if (listaSugestoesProdutoVenda) {
        listaSugestoesProdutoVenda.hidden = true;
        listaSugestoesProdutoVenda.innerHTML = "";
    }
    produtosSugestoesVenda = [];
    indiceSugestaoProdutoVenda = -1;
    if (wrapperBuscaProdutoVenda) {
        wrapperBuscaProdutoVenda.classList.remove("com-sugestoes-abertas");
    }
}

function renderizarSugestoesProdutoVenda(lista, textoBusca) {
    if (!listaSugestoesProdutoVenda) return;

    listaSugestoesProdutoVenda.innerHTML = "";
    produtosSugestoesVenda = Array.isArray(lista) ? lista : [];
    indiceSugestaoProdutoVenda = -1;

    if (!String(textoBusca || "").trim()) {
        ocultarSugestoesProdutoVenda();
        return;
    }

    if (produtosSugestoesVenda.length === 0) {
        const vazio = document.createElement("div");
        vazio.className = "sugestao-produto-venda-vazia";
        vazio.textContent = "Nenhum produto encontrado. Confira o nome ou SKU.";
        listaSugestoesProdutoVenda.appendChild(vazio);
    } else {
        produtosSugestoesVenda.forEach(function (produto, indice) {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "sugestao-produto-venda";
            botao.dataset.indice = String(indice);

            const dados = document.createElement("span");
            dados.className = "sugestao-dados";

            const nome = document.createElement("strong");
            nome.textContent = produto.nome || "Produto sem nome";
            dados.appendChild(nome);

            const detalhe = document.createElement("small");
            const sku = produto.sku ? `SKU: ${produto.sku}` : "Sem SKU";
            const estoque = produto.estoque !== undefined && produto.estoque !== null
                ? `Estoque: ${produto.estoque}`
                : "";
            detalhe.textContent = [sku, estoque].filter(Boolean).join(" • ");
            dados.appendChild(detalhe);

            const preco = document.createElement("span");
            preco.className = "sugestao-preco";
            preco.textContent = formatarMoeda(produto.preco_venda);

            botao.appendChild(dados);
            botao.appendChild(preco);
            botao.addEventListener("mousedown", function (evento) {
                // Evita que o campo perca o foco antes do clique na sugestão.
                evento.preventDefault();
            });
            botao.addEventListener("click", function () {
                selecionarSugestaoProdutoVenda(produto);
            });
            listaSugestoesProdutoVenda.appendChild(botao);
        });
    }

    listaSugestoesProdutoVenda.hidden = false;
    if (wrapperBuscaProdutoVenda) {
        wrapperBuscaProdutoVenda.classList.add("com-sugestoes-abertas");
    }
}

function selecionarSugestaoProdutoVenda(produto) {
    if (!produto) return;

    produtoVenda.value = String(produto.id);
    if (buscaProdutoVenda) {
        buscaProdutoVenda.value = String(produto.nome || "");
    }
    ocultarSugestoesProdutoVenda();
    atualizarPrecoProduto();
}

function moverSelecaoSugestaoProdutoVenda(direcao) {
    if (!listaSugestoesProdutoVenda || listaSugestoesProdutoVenda.hidden) return;

    const botoes = Array.from(
        listaSugestoesProdutoVenda.querySelectorAll("button.sugestao-produto-venda")
    );
    if (!botoes.length) return;

    indiceSugestaoProdutoVenda += direcao;
    if (indiceSugestaoProdutoVenda < 0) indiceSugestaoProdutoVenda = botoes.length - 1;
    if (indiceSugestaoProdutoVenda >= botoes.length) indiceSugestaoProdutoVenda = 0;

    botoes.forEach(function (botao, indice) {
        botao.classList.toggle("ativa", indice === indiceSugestaoProdutoVenda);
    });
}

function confirmarSugestaoProdutoVenda() {
    if (!produtosSugestoesVenda.length) return false;
    const indice = indiceSugestaoProdutoVenda >= 0 ? indiceSugestaoProdutoVenda : 0;
    selecionarSugestaoProdutoVenda(produtosSugestoesVenda[indice]);
    return true;
}

function limparBuscaProdutoVenda() {
    if (buscaProdutoVenda) buscaProdutoVenda.value = "";
    produtoVenda.value = "";
    ocultarSugestoesProdutoVenda();
}


function criarBuscaProduto() {
    if (buscaProdutoVenda) return;

    aplicarEstiloAutocompleteProdutoVenda();

    buscaProdutoVenda = document.createElement("input");
    buscaProdutoVenda.type = "text";
    buscaProdutoVenda.id = "buscaProdutoVenda";
    buscaProdutoVenda.className = "campo-busca-venda";
    buscaProdutoVenda.placeholder = "🔎 Digite o nome ou SKU do produto";
    buscaProdutoVenda.autocomplete = "off";
    buscaProdutoVenda.setAttribute("aria-autocomplete", "list");
    buscaProdutoVenda.setAttribute("aria-controls", "listaSugestoesProdutoVenda");

    wrapperBuscaProdutoVenda = document.createElement("div");
    wrapperBuscaProdutoVenda.className = "autocomplete-produto-venda";
    produtoVenda.parentNode.insertBefore(wrapperBuscaProdutoVenda, produtoVenda);
    wrapperBuscaProdutoVenda.appendChild(buscaProdutoVenda);

    listaSugestoesProdutoVenda = document.createElement("div");
    listaSugestoesProdutoVenda.id = "listaSugestoesProdutoVenda";
    listaSugestoesProdutoVenda.className = "lista-sugestoes-produto-venda";
    listaSugestoesProdutoVenda.hidden = true;
    wrapperBuscaProdutoVenda.appendChild(listaSugestoesProdutoVenda);

    // O select original continua no DOM para preservar a lógica já existente,
    // mas a escolha passa a ser feita pelo autocomplete que abre ao digitar.
    produtoVenda.style.display = "none";
    produtoVenda.setAttribute("aria-hidden", "true");
    produtoVenda.tabIndex = -1;

    const rotulo = produtoVenda.parentNode.querySelector('label[for="produtoVenda"]');
    if (rotulo) rotulo.htmlFor = "buscaProdutoVenda";

    buscaProdutoVenda.addEventListener("input", filtrarProdutos);
    buscaProdutoVenda.addEventListener("focus", function () {
        // Com o campo vazio, exibe a lista completa; com texto, exibe os resultados filtrados.
        filtrarProdutos();
    });
    buscaProdutoVenda.addEventListener("keydown", function (evento) {
        if (evento.key === "ArrowDown") {
            evento.preventDefault();
            moverSelecaoSugestaoProdutoVenda(1);
        } else if (evento.key === "ArrowUp") {
            evento.preventDefault();
            moverSelecaoSugestaoProdutoVenda(-1);
        } else if (evento.key === "Enter") {
            if (confirmarSugestaoProdutoVenda()) evento.preventDefault();
        } else if (evento.key === "Escape") {
            ocultarSugestoesProdutoVenda();
        }
    });
    document.addEventListener("click", function (evento) {
        if (wrapperBuscaProdutoVenda && !wrapperBuscaProdutoVenda.contains(evento.target)) {
            ocultarSugestoesProdutoVenda();
        }
    });
}

/* ==========================================

   CLIENTES

========================================== */

async function carregarClientesVenda() {

    const {

        data,

        error

    } =

        await vendasSupabase

            .from("clientes")

            .select(

                "id, nome, telefone, ativo"

            )

            .eq(

                "ativo",

                true

            )

            .order(

                "nome",

                {

                    ascending: true

                }

            );

    if (error) {

        console.error(

            "Erro ao carregar clientes:",

            error

        );

        mostrarMensagem(

            "Não foi possível carregar os clientes.",

            "erro"

        );

        return;

    }

    clientesVenda =

        data || [];

    preencherListaClientes(

        clientesVenda

    );

}

function preencherListaClientes(

    lista

) {

    clienteVenda.innerHTML =

        "";

    const opcaoInicial =

        document.createElement(

            "option"

        );

    opcaoInicial.value =

        "";

    opcaoInicial.textContent =

        "Consumidor não identificado";

    clienteVenda.appendChild(

        opcaoInicial

    );

    lista.forEach(

        function (cliente) {

            const option =

                document.createElement(

                    "option"

                );

            option.value =

                cliente.id;

            const telefone =

                cliente.telefone

                    ? ` — ${cliente.telefone}`

                    : "";

            option.textContent =

                `${cliente.nome}${telefone}`;

            clienteVenda.appendChild(

                option

            );

        }

    );

}

function filtrarClientes() {

    const texto =

        (

            buscaClienteVenda.value ||

            ""

        )

            .trim()

            .toLowerCase();

    if (!texto) {

        preencherListaClientes(

            clientesVenda

        );

        return;

    }

    const encontrados =

        clientesVenda.filter(

            function (cliente) {

                const nome =

                    String(

                        cliente.nome ||

                        ""

                    ).toLowerCase();

                const telefone =

                    String(

                        cliente.telefone ||

                        ""

                    ).toLowerCase();

                return (

                    nome.includes(texto) ||

                    telefone.includes(texto)

                );

            }

        );

    preencherListaClientes(

        encontrados

    );

    if (

        encontrados.length === 1

    ) {

        clienteVenda.value =

            String(

                encontrados[0].id

            );

    }

}

/* ==========================================

   PRODUTOS

========================================== */

async function carregarProdutosVenda() {

    const {

        data,

        error

    } =

        await vendasSupabase

            .from("produtos_para_venda")

            .select(

                `

                id,

                nome,

                sku,

                preco_venda,
                preco_venda_minimo,
                estoque,

                estoque_minimo,

                ativo

                `

            )

            .eq(

                "ativo",

                true

            )

            .order(

                "nome",

                {

                    ascending: true

                }

            );

    if (error) {

        console.error(

            "Erro ao carregar produtos:",

            error

        );

        mostrarMensagem(

            "Não foi possível carregar os produtos.",

            "erro"

        );

        return;

    }

    produtosVenda =

        data || [];

    preencherListaProdutos(

        produtosVenda

    );

}

function preencherListaProdutos(

    lista

) {

    produtoVenda.innerHTML =

        "";

    const opcaoInicial =

        document.createElement(

            "option"

        );

    opcaoInicial.value =

        "";

    if (

        lista.length === 0

    ) {

        opcaoInicial.textContent =

            "Nenhum produto encontrado";

    }

    else {

        opcaoInicial.textContent =

            "Selecione um produto";

    }

    produtoVenda.appendChild(

        opcaoInicial

    );

    lista.forEach(

        function (produto) {

            const option =

                document.createElement(

                    "option"

                );

            option.value =

                produto.id;

            option.textContent =

                `${produto.nome} — ${produto.sku || "-"} — ${formatarMoeda(produto.preco_venda)} — Estoque: ${produto.estoque}`;

            produtoVenda.appendChild(

                option

            );

        }

    );

}

function filtrarProdutos() {
    const texto = String(buscaProdutoVenda?.value || "").trim().toLowerCase();

    produtoVenda.value = "";
    atualizarPrecoProduto();

    if (!texto) {
        preencherListaProdutos(produtosVenda);
        renderizarSugestoesProdutoVenda(produtosVenda, "__todos_os_produtos__");
        return;
    }

    const encontrados = produtosVenda.filter(function (produto) {
        const nome = String(produto.nome || "").toLowerCase();
        const sku = String(produto.sku || "").toLowerCase();
        return nome.includes(texto) || sku.includes(texto);
    });

    preencherListaProdutos(encontrados);
    renderizarSugestoesProdutoVenda(encontrados, texto);
}

/* ==========================================

   ATUALIZAR PREÇO

========================================== */

function atualizarPrecoProduto() {

    const produtoId =

        Number(

            produtoVenda.value

        );

    const produto =

        produtosVenda.find(

            function (item) {

                return (

                    Number(item.id) ===

                    produtoId

                );

            }

        );

    if (!produto) {

        precoVenda.value =

            "R$ 0,00";

        quantidadeVenda.value =

            1;

        quantidadeVenda.removeAttribute(

            "max"

        );

        return;

    }

    precoVenda.value =

        formatarMoeda(

            produto.preco_venda

        );

    quantidadeVenda.max =

        produto.estoque;

    quantidadeVenda.value =

        1;

}

/* ==========================================

   ADICIONAR PRODUTO

========================================== */

function adicionarProdutoCarrinho() {

    const produtoId =

        Number(

            produtoVenda.value

        );

    const quantidade =

        Number(

            quantidadeVenda.value

        );

    if (!produtoId) {

        mostrarMensagem(

            "Selecione um produto.",

            "erro"

        );

        return;

    }

    if (

        !Number.isInteger(

            quantidade

        ) ||

        quantidade <= 0

    ) {

        mostrarMensagem(

            "Informe uma quantidade válida.",

            "erro"

        );

        return;

    }

    const produto =

        produtosVenda.find(

            function (item) {

                return (

                    Number(item.id) ===

                    produtoId

                );

            }

        );

    if (!produto) {

        mostrarMensagem(

            "Produto não encontrado.",

            "erro"

        );

        return;

    }

    const estoque =

        Number(

            produto.estoque

        ) || 0;

    if (

        estoque <= 0

    ) {

        mostrarMensagem(

            `O produto "${produto.nome}" está sem estoque.`,

            "erro"

        );

        return;

    }

    const itemExistente =

        carrinho.find(

            function (item) {

                return (

                    Number(item.produto_id) ===

                    produtoId

                );

            }

        );

    const quantidadeFinal =

        itemExistente

            ? Number(itemExistente.quantidade) +

              quantidade

            : quantidade;

    if (

        quantidadeFinal > estoque

    ) {

        mostrarMensagem(

            `Estoque insuficiente para "${produto.nome}". Estoque disponível: ${estoque}.`,

            "erro"

        );

        return;

    }

    if (

        itemExistente

    ) {

        itemExistente.quantidade =

            quantidadeFinal;

    }

    else {

        carrinho.push({

            produto_id:

                produto.id,

            nome:

                produto.nome,

            sku:

                produto.sku || "",

            preco_unitario:

                Number(

                    produto.preco_venda

                ) || 0,

            preco_venda_minimo: Number(produto.preco_venda_minimo ?? produto.preco_venda) || 0,

            estoque:

                estoque,

            quantidade:

                quantidade

        });

    }

    renderizarCarrinho();

    limparBuscaProdutoVenda();
    preencherListaProdutos(produtosVenda);

    quantidadeVenda.value = 1;
    precoVenda.value = "R$ 0,00";

    mostrarMensagem(

        "Produto adicionado ao carrinho.",

        "sucesso"

    );

}

/* ==========================================

   REMOVER

========================================== */

function removerProdutoCarrinho(

    indice

) {

    const indiceNumero =

        Number(

            indice

        );

    if (

        !Number.isInteger(

            indiceNumero

        )

    ) {

        return;

    }

    carrinho.splice(

        indiceNumero,

        1

    );

    renderizarCarrinho();
    atualizarResumo();

}

/* ==========================================

   ALTERAR QUANTIDADE

========================================== */

function alterarQuantidadeCarrinho(

    indice,

    variacao

) {

    const item =

        carrinho[indice];

    if (!item) {

        return;

    }

    const novaQuantidade =

        Number(

            item.quantidade

        ) +

        Number(

            variacao

        );

    definirQuantidadeCarrinho(

        indice,

        novaQuantidade

    );

}

/* ==========================================

   DEFINIR QUANTIDADE

========================================== */

function definirQuantidadeCarrinho(

    indice,

    quantidadeInformada

) {

    const item =

        carrinho[indice];

    if (!item) {

        return;

    }

    let quantidade =

        Number(

            quantidadeInformada

        );

    if (

        !Number.isInteger(

            quantidade

        )

    ) {

        quantidade =

            1;

    }

    if (

        quantidade < 1

    ) {

        quantidade =

            1;

    }

    const estoque =

        Number(

            item.estoque

        ) || 0;

    if (

        !item.avulso && quantidade > estoque

    ) {

        quantidade =

            estoque;

        mostrarMensagem(

            `A quantidade não pode ser maior que o estoque disponível. Estoque: ${estoque}.`,

            "erro"

        );

    }

    item.quantidade =

        quantidade;

    renderizarCarrinho();
    atualizarResumo();

}

/* ==========================================

   SUBTOTAL

========================================== */

function calcularSubtotal() {

    return carrinho.reduce(

        function (total, item) {

            return total +
                (Number(item.preco_unitario) * Number(item.quantidade));

        },

        0

    );

}

/* ==========================================
   TIPO DE DESCONTO: VALOR OU PORCENTAGEM
========================================== */

function calcularLimiteDescontoSeguro(subtotal = calcularSubtotalProdutosCadastrados()) {
    const itens = carrinho.filter(item => !item.avulso && item.produto_id != null);
    const subtotalCentavos = Math.max(0, Math.round((Number(subtotal) || 0) * 100));
    let valorMaximoCentavos = 0;
    let encontrouItem = false;

    // Soma a margem disponÃ­vel de CADA item. NÃ£o usa o menor percentual da venda.
    itens.forEach((item) => {
        const quantidade = Number(item.quantidade) || 0;
        if (quantidade <= 0) return;
        encontrouItem = true;

        const precoCentavos = Math.max(0, Math.round((Number(item.preco_unitario) || 0) * 100));
        const valorMinimoInformado = item.preco_venda_minimo ?? item.preco_unitario;
        const minimoCentavos = Math.max(0, Math.round((Number(valorMinimoInformado) || 0) * 100));

        const subtotalItemCentavos = Math.max(0, Math.round(precoCentavos * quantidade));
        const minimoItemCentavos = Math.max(0, Math.round(minimoCentavos * quantidade));
        const margemItemCentavos = Math.max(0, subtotalItemCentavos - minimoItemCentavos);

        valorMaximoCentavos += margemItemCentavos;
    });

    // Nunca permite desconto acima do subtotal, nem margem negativa.
    valorMaximoCentavos = !encontrouItem || subtotalCentavos <= 0
        ? 0
        : Math.max(0, Math.min(subtotalCentavos, valorMaximoCentavos));

    const percentualMaximo = subtotalCentavos > 0
        ? Math.round((valorMaximoCentavos / subtotalCentavos) * 10000) / 100
        : 0;

    return { subtotalCentavos, valorMaximoCentavos, percentualMaximo, temItens: encontrouItem };
}

function atualizarInfoDescontoMaximo(limite = calcularLimiteDescontoSeguro()) {
    const info = document.getElementById("infoDescontoMaximo");
    const botao = document.getElementById("btnAplicarDescontoMaximo");

    if (botao) {
        botao.hidden = erroCarregarConfiguracoesDescontosVenda || !configuracoesDescontosVenda.desconto_maximo_ativo;
        botao.disabled = erroCarregarConfiguracoesDescontosVenda || !limite.temItens;
    }
    if (!info) return;

    info.hidden = false;
    if (erroCarregarConfiguracoesDescontosVenda) {
        info.textContent = "Configurações de desconto indisponíveis. Verifique a configuração da loja no Supabase.";
        return;
    }
    if (!configuracoesDescontosVenda.desconto_maximo_ativo) {
        info.textContent = "O desconto máximo automático está desativado nas configurações desta loja. O desconto manual continua sujeito ao limite pelo preço mínimo.";
        return;
    }

    if (!limite.temItens) {
        info.textContent = "Adicione produtos para calcular o desconto máximo.";
    } else {
        info.textContent = "Desconto máximo permitido: " +
            formatarMoeda(limite.valorMaximoCentavos / 100) +
            " (" +
            limite.percentualMaximo.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) +
            "% do total).";
    }
}

function calcularValorDesconto(subtotal = calcularSubtotalProdutosCadastrados(), tipo = tipoDescontoVendaAtual) {
    const subtotalCentavos = Math.max(0, Math.round((Number(subtotal) || 0) * 100));
    const valorInformado = Number(descontoVenda && descontoVenda.value);
    const valor = Number.isFinite(valorInformado) ? valorInformado : 0;
    let descontoCentavos;

    if (tipo === "porcentagem") {
        const percentual = Math.max(0, Math.min(100, valor));
        descontoCentavos = Math.round(subtotalCentavos * percentual / 100);
    } else {
        descontoCentavos = Math.max(0, Math.min(subtotalCentavos, Math.round(valor * 100)));
    }

    const limite = calcularLimiteDescontoSeguro(subtotal);
    return Math.min(descontoCentavos, limite.valorMaximoCentavos) / 100;
}


/* ==========================================
   DESCONTO ADICIONAL À VISTA CONFIGURÁVEL POR LOJA
   O adicional é calculado sobre o total restante depois do desconto máximo.
========================================== */
function assinaturaItensParaDescontoAvista() {
    const itens = (carrinho || []).filter(item => !item.avulso && item.produto_id != null);
    return itens.map((item) => [
        String(item.produto_id ?? item.id ?? ""),
        Number(item.quantidade) || 0,
        Number(item.preco_unitario ?? item.preco_venda ?? item.preco ?? 0) || 0,
        Number(item.preco_venda_minimo ?? 0) || 0
    ].join(":" )).sort().join("|");
}

function formaPagamentoPermiteDescontoAvista() {
    const forma = String(formaPagamento?.value || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    return ["dinheiro", "pix", "outro", "outros"].includes(forma);
}

function atualizarControleDescontoAvista(valorAdicionalCentavos = 0) {
    if (!btnAplicarDescontoAvista) return;

    const maximoHabilitado =
        !erroCarregarConfiguracoesDescontosVenda &&
        configuracoesDescontosVenda.desconto_maximo_ativo;
    const avistaHabilitado =
        maximoHabilitado && configuracoesDescontosVenda.desconto_avista_ativo;
    const percentualTexto = formatarPercentualDescontoAvista();

    btnAplicarDescontoAvista.hidden = !descontoMaximoAplicado || !avistaHabilitado;
    btnAplicarDescontoAvista.classList.toggle("aplicado", descontoAvistaAtivo);
    btnAplicarDescontoAvista.setAttribute("aria-pressed", String(descontoAvistaAtivo));
    btnAplicarDescontoAvista.textContent = descontoAvistaAtivo
        ? `Desconto à vista aplicado (${percentualTexto})`
        : `Aplicar +${percentualTexto} à vista`;

    if (!infoDescontoAvista) return;
    infoDescontoAvista.hidden = !descontoMaximoAplicado || !maximoHabilitado;

    if (erroCarregarConfiguracoesDescontosVenda) {
        infoDescontoAvista.textContent = "As configurações de desconto não puderam ser carregadas.";
    } else if (!descontoMaximoAplicado || !maximoHabilitado) {
        infoDescontoAvista.textContent = "";
    } else if (!configuracoesDescontosVenda.desconto_avista_ativo) {
        infoDescontoAvista.textContent = "O desconto adicional à vista está desativado nas configurações desta loja.";
        infoDescontoAvista.hidden = false;
    } else if (descontoAvistaAtivo) {
        infoDescontoAvista.textContent =
            `Desconto adicional à vista de ${percentualTexto}: ${formatarMoeda(valorAdicionalCentavos / 100)}. Este adicional pode deixar o total abaixo do preço mínimo cadastrado.`;
    } else {
        infoDescontoAvista.textContent =
            `Disponível somente para Dinheiro, Pix ou Outro. O adicional de ${percentualTexto} é calculado depois do desconto máximo e pode ultrapassar o preço mínimo.`;
    }
}

function invalidarEstadoDescontoAvista() {
    descontoMaximoAplicado = false;
    descontoAvistaAtivo = false;
    assinaturaCarrinhoDescontoMaximo = "";
    atualizarControleDescontoAvista(0);
}

function calcularTotaisComDescontos(subtotal = calcularSubtotal()) {
    const subtotalCentavos = Math.max(0, Math.round((Number(subtotal) || 0) * 100));
    const subtotalProdutosCentavos = Math.max(0, Math.round(calcularSubtotalProdutosCadastrados() * 100));
    const descontoBaseCentavos = Math.max(0, Math.min(
        subtotalProdutosCentavos,
        Math.round(calcularValorDesconto(subtotalProdutosCentavos / 100) * 100)
    ));
    const saldoProdutosAposDescontoCentavos = Math.max(0, subtotalProdutosCentavos - descontoBaseCentavos);
    const descontoAvistaCentavos =
        descontoMaximoAplicado &&
        descontoAvistaAtivo &&
        !erroCarregarConfiguracoesDescontosVenda &&
        configuracoesDescontosVenda.desconto_maximo_ativo &&
        configuracoesDescontosVenda.desconto_avista_ativo
            ? Math.min(
                saldoProdutosAposDescontoCentavos,
                Math.round(
                    saldoProdutosAposDescontoCentavos *
                    Number(configuracoesDescontosVenda.desconto_avista_percentual) / 100
                )
            )
            : 0;
    const descontoAvulsoCentavos = calcularDescontoManualAvulsosCentavos();
    const descontoProdutosCentavos = descontoBaseCentavos + descontoAvistaCentavos;
    const descontoTotalCentavos = Math.min(
        subtotalCentavos,
        descontoProdutosCentavos + descontoAvulsoCentavos
    );
    const totalCentavos = Math.max(0, subtotalCentavos - descontoTotalCentavos);

    return {
        subtotalCentavos,
        descontoBaseCentavos,
        descontoAvistaCentavos,
        descontoAvulsoCentavos,
        descontoProdutosCentavos,
        descontoTotalCentavos,
        totalCentavos
    };
}

function tratarMudancaFormaPagamentoDescontoAvista() {
    if (descontoAvistaAtivo && (
        !formaPagamentoPermiteDescontoAvista() ||
        erroCarregarConfiguracoesDescontosVenda ||
        !configuracoesDescontosVenda.desconto_maximo_ativo ||
        !configuracoesDescontosVenda.desconto_avista_ativo
    )) {
        descontoAvistaAtivo = false;
        atualizarControleDescontoAvista(0);
        mostrarMensagem(
            `O desconto adicional à vista (${formatarPercentualDescontoAvista()}) foi removido porque a forma de pagamento ou as configurações não permitem o adicional.`,
            "info"
        );
    }

    atualizarCamposPrazoVenda();
    atualizarResumo();
}

function atualizarUnidadeDescontoVenda() {

    if (!descontoVenda) return;

    const container = descontoVenda.parentElement;
    if (!container) return;

    const unidade = container.querySelector("span");
    if (unidade) {
        unidade.textContent = tipoDescontoVendaAtual === "porcentagem" ? "%" : "R$";
        unidade.setAttribute("aria-hidden", "true");
    }

    if (seletorTipoDescontoVenda) {
        seletorTipoDescontoVenda.setAttribute(
            "aria-label",
            "Tipo de desconto: valor em reais ou porcentagem"
        );
    }

    descontoVenda.setAttribute(
        "aria-label",
        tipoDescontoVendaAtual === "porcentagem"
            ? "Percentual de desconto da venda"
            : "Valor do desconto da venda em reais"
    );

}

function configurarControleTipoDesconto() {

    if (!descontoVenda || !descontoVenda.parentElement) return;

    const container = descontoVenda.parentElement;
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "6px";
    container.style.flexWrap = "wrap";
    container.style.width = "min(100%, 270px)";
    container.style.maxWidth = "100%";
    container.style.boxSizing = "border-box";

    seletorTipoDescontoVenda = document.createElement("select");
    seletorTipoDescontoVenda.id = "tipoDescontoVenda";
    seletorTipoDescontoVenda.innerHTML = `
        <option value="valor">Valor (R$)</option>
        <option value="porcentagem">Porcentagem (%)</option>
    `;
    seletorTipoDescontoVenda.value = "valor";
    seletorTipoDescontoVenda.style.cssText = [
        "flex: 1 1 120px",
        "min-width: 105px",
        "max-width: 100%",
        "padding: 8px 6px",
        "border: 1px solid #d5dbe5",
        "border-radius: 8px",
        "background: #fff",
        "color: #253047",
        "font: inherit",
        "font-size: 12px",
        "box-sizing: border-box"
    ].join(";");

    descontoVenda.style.flex = "2 1 75px";
    descontoVenda.style.minWidth = "70px";
    descontoVenda.style.maxWidth = "100%";
    descontoVenda.style.boxSizing = "border-box";
    descontoVenda.style.padding = "0 8px";

    const unidadeInicial = container.querySelector("span");
    if (unidadeInicial) {
        unidadeInicial.style.position = "static";
        unidadeInicial.style.left = "auto";
        unidadeInicial.style.top = "auto";
        unidadeInicial.style.transform = "none";
        unidadeInicial.style.display = "inline-block";
        unidadeInicial.style.flex = "0 0 auto";
        unidadeInicial.style.minWidth = "20px";
        unidadeInicial.style.textAlign = "right";
    }

    container.insertBefore(seletorTipoDescontoVenda, descontoVenda);
    atualizarUnidadeDescontoVenda();

    seletorTipoDescontoVenda.addEventListener("change", function () {

        const subtotal = calcularSubtotalProdutosCadastrados();
        const descontoMonetarioAtual = calcularValorDesconto(
            subtotal,
            tipoDescontoVendaAtual
        );
        const novoTipo = seletorTipoDescontoVenda.value === "porcentagem"
            ? "porcentagem"
            : "valor";

        // Preserva o mesmo valor monetário do desconto ao trocar de modalidade.
        if (novoTipo === "porcentagem") {
            descontoVenda.value = subtotal > 0
                ? ((descontoMonetarioAtual / subtotal) * 100).toFixed(2)
                : "0";
        } else {
            descontoVenda.value = descontoMonetarioAtual.toFixed(2);
        }

        invalidarEstadoDescontoAvista();
        tipoDescontoVendaAtual = novoTipo;
        atualizarUnidadeDescontoVenda();
        atualizarResumo();

    });

}

configurarControleTipoDesconto();
const botaoAplicarDescontoMaximo = document.getElementById("btnAplicarDescontoMaximo");
if (botaoAplicarDescontoMaximo) {
    botaoAplicarDescontoMaximo.addEventListener("click", () => {
        if (erroCarregarConfiguracoesDescontosVenda || !configuracoesDescontosVenda.desconto_maximo_ativo) {
            mostrarMensagem("O desconto máximo automático está desativado ou indisponível nas configurações desta loja.", "erro");
            return;
        }
        const limite = calcularLimiteDescontoSeguro();
        descontoVenda.value = (
            tipoDescontoVendaAtual === "porcentagem"
                ? limite.percentualMaximo
                : limite.valorMaximoCentavos / 100
        ).toFixed(2);
        descontoMaximoAplicado = true;
        descontoAvistaAtivo = false;
        assinaturaCarrinhoDescontoMaximo = assinaturaItensParaDescontoAvista();
        atualizarResumo();
    });
}

if (btnAplicarDescontoAvista) {
    btnAplicarDescontoAvista.addEventListener("click", () => {
        if (
            erroCarregarConfiguracoesDescontosVenda ||
            !configuracoesDescontosVenda.desconto_maximo_ativo ||
            !configuracoesDescontosVenda.desconto_avista_ativo
        ) {
            mostrarMensagem("O desconto adicional à vista está desativado ou indisponível nas configurações desta loja.", "erro");
            return;
        }

        if (
            !descontoMaximoAplicado ||
            assinaturaCarrinhoDescontoMaximo !== assinaturaItensParaDescontoAvista()
        ) {
            invalidarEstadoDescontoAvista();
            mostrarMensagem("Aplique novamente o desconto máximo depois de conferir os produtos da venda.", "erro");
            return;
        }

        if (descontoAvistaAtivo) {
            descontoAvistaAtivo = false;
            atualizarResumo();
            mostrarMensagem("O desconto adicional à vista foi removido.", "info");
            return;
        }

        if (!formaPagamentoPermiteDescontoAvista()) {
            mostrarMensagem(`Para aplicar o adicional de ${formatarPercentualDescontoAvista()}, selecione Dinheiro, Pix ou Outro como forma de pagamento.`, "erro");
            formaPagamento?.focus();
            return;
        }

        descontoAvistaAtivo = true;
        atualizarResumo();
        mostrarMensagem(`Desconto adicional de ${formatarPercentualDescontoAvista()} à vista aplicado ao total restante após o desconto máximo.`, "sucesso");
    });
}

atualizarControleDescontoAvista(0);
atualizarInfoDescontoMaximo();

/* ==========================================

   RESUMO

========================================== */

function atualizarResumo() {

    if (
        descontoMaximoAplicado &&
        assinaturaCarrinhoDescontoMaximo !== assinaturaItensParaDescontoAvista()
    ) {
        invalidarEstadoDescontoAvista();
    }

    const subtotal = Math.max(0, calcularSubtotal());
    let valorInformado = Number(descontoVenda.value);

    if (!Number.isFinite(valorInformado) || valorInformado < 0) {
        valorInformado = 0;
        descontoVenda.value = "0";
    }

        const limiteDesconto = calcularLimiteDescontoSeguro();
    const limiteEntrada = tipoDescontoVendaAtual === "porcentagem"
        ? limiteDesconto.percentualMaximo
        : limiteDesconto.valorMaximoCentavos / 100;

    if (valorInformado > limiteEntrada) {
        valorInformado = limiteEntrada;
        descontoVenda.value = valorInformado.toFixed(2);
    }

    const totaisDesconto = calcularTotaisComDescontos(subtotal);
    const subtotalCentavos = totaisDesconto.subtotalCentavos;
    const descontoCentavos = totaisDesconto.descontoTotalCentavos;
    const total = totaisDesconto.totalCentavos / 100;
    atualizarControleDescontoAvista(totaisDesconto.descontoAvistaCentavos);

    atualizarInfoDescontoMaximo(limiteDesconto);

    if (valorSubtotal) {
        valorSubtotal.textContent = formatarMoeda(subtotalCentavos / 100);
    }

    if (valorTotal) {
        valorTotal.textContent = formatarMoeda(total);
    }

    atualizarTrocoDinheiro();

}

/* ==========================================
   RECEBIMENTO EM DINHEIRO E TROCO
========================================== */

function valorRecebidoEmCentavos() {
    if (!valorRecebidoVenda || String(valorRecebidoVenda.value).trim() === "") {
        return null;
    }

    const valor = Number(valorRecebidoVenda.value);
    if (!Number.isFinite(valor) || valor < 0) {
        return null;
    }

    return Math.round(valor * 100);
}

function totalAtualEmCentavos() {
    return calcularTotaisComDescontos().totalCentavos;
}

function atualizarTrocoDinheiro() {
    if (!trocoVenda || !valorRecebidoVenda || !formaPagamento) {
        return;
    }

    const ehDinheiro = formaPagamento.value === "dinheiro";
    if (camposDinheiroVenda) {
        camposDinheiroVenda.hidden = !ehDinheiro;
    }

    if (!ehDinheiro) {
        trocoVenda.textContent = formatarMoeda(0);
        if (avisoDinheiroVenda) {
            avisoDinheiroVenda.textContent = "Informe quanto o cliente entregou. O troco será calculado automaticamente.";
            avisoDinheiroVenda.classList.remove("invalido");
        }
        return;
    }

    const recebidoCentavos = valorRecebidoEmCentavos();
    const totalCentavos = totalAtualEmCentavos();

    if (recebidoCentavos === null) {
        trocoVenda.textContent = formatarMoeda(0);
        if (avisoDinheiroVenda) {
            avisoDinheiroVenda.textContent = "Informe quanto o cliente entregou. O troco será calculado automaticamente.";
            avisoDinheiroVenda.classList.remove("invalido");
        }
        return;
    }

    if (recebidoCentavos < totalCentavos) {
        trocoVenda.textContent = formatarMoeda(0);
        if (avisoDinheiroVenda) {
            avisoDinheiroVenda.textContent = `Valor insuficiente. Faltam ${formatarMoeda((totalCentavos - recebidoCentavos) / 100)}.`;
            avisoDinheiroVenda.classList.add("invalido");
        }
        return;
    }

    trocoVenda.textContent = formatarMoeda((recebidoCentavos - totalCentavos) / 100);
    if (avisoDinheiroVenda) {
        avisoDinheiroVenda.textContent = "Troco calculado automaticamente.";
        avisoDinheiroVenda.classList.remove("invalido");
    }
    
}

/* ==========================================

   QUANTIDADE DE ITENS

========================================== */

function atualizarQuantidadeItens() {

    const quantidade =

        carrinho.reduce(

            function (

                total,

                item

            ) {

                return (

                    total +

                    Number(

                        item.quantidade

                    )

                );

            },

            0

        );

    if (

        quantidadeItensCarrinho

    ) {

        quantidadeItensCarrinho.textContent =

            quantidade === 1

                ? "1 item"

                : `${quantidade} itens`;

    }

}

/* ==========================================

   RENDERIZAR CARRINHO

========================================== */



/* ==========================================
   MODO EMERGÊNCIA — PRODUTO AVULSO
   Desconto independente dos descontos dos produtos cadastrados.
========================================== */
function converterEntradaNumericaAvulsa(valor) {
    let texto = String(valor ?? "").trim().replace(/[R$\s]/g, "");
    if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
    return Number(texto);
}


function adicionarProdutoAvulso() {
    const modalId = "modalProdutoAvulsoEmergencia";
    document.getElementById(modalId)?.remove();

    if (!document.getElementById("modalProdutoAvulsoEmergenciaStyle")) {
        const style = document.createElement("style");
        style.id = "modalProdutoAvulsoEmergenciaStyle";
        style.textContent = "\n#modalProdutoAvulsoEmergencia {\n  position: fixed; inset: 0; z-index: 10050; display: flex;\n  align-items: center; justify-content: center; padding: 20px;\n  background: rgba(15, 23, 42, .62); backdrop-filter: blur(4px);\n}\n#modalProdutoAvulsoEmergencia[hidden] { display: none !important; }\n#modalProdutoAvulsoEmergencia .avulso-dialog {\n  width: min(100%, 560px); max-height: min(92vh, 760px); overflow: auto;\n  background: #fff; color: #172033; border-radius: 18px;\n  box-shadow: 0 24px 80px rgba(0,0,0,.28); border: 1px solid #e5eaf2;\n  animation: avulsoEntrar .18s ease-out;\n}\n@keyframes avulsoEntrar { from { opacity: 0; transform: translateY(10px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }\n#modalProdutoAvulsoEmergencia .avulso-head {\n  display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;\n  padding: 22px 24px 17px; border-bottom: 1px solid #edf0f5;\n}\n#modalProdutoAvulsoEmergencia .avulso-title { margin: 0; font-size: 19px; font-weight: 750; color: #172033; }\n#modalProdutoAvulsoEmergencia .avulso-subtitle { margin: 5px 0 0; font-size: 13px; line-height: 1.45; color: #64748b; }\n#modalProdutoAvulsoEmergencia .avulso-badge {\n  display: inline-flex; align-items: center; margin-top: 10px; padding: 5px 9px;\n  border-radius: 999px; color: #9a3412; background: #fff7ed; border: 1px solid #fed7aa;\n  font-size: 11px; font-weight: 700; letter-spacing: .02em;\n}\n#modalProdutoAvulsoEmergencia .avulso-fechar {\n  flex: 0 0 auto; width: 34px; height: 34px; border: 0; border-radius: 9px;\n  background: #f1f5f9; color: #475569; font-size: 21px; cursor: pointer;\n}\n#modalProdutoAvulsoEmergencia .avulso-fechar:hover { background: #e2e8f0; }\n#modalProdutoAvulsoEmergencia .avulso-form { padding: 21px 24px 22px; }\n#modalProdutoAvulsoEmergencia .avulso-campo { display: flex; flex-direction: column; gap: 7px; min-width: 0; margin-bottom: 16px; }\n#modalProdutoAvulsoEmergencia .avulso-campo label { font-size: 12px; font-weight: 700; color: #334155; }\n#modalProdutoAvulsoEmergencia .avulso-campo input {\n  width: 100%; min-height: 43px; box-sizing: border-box; padding: 10px 12px;\n  border: 1px solid #cbd5e1; border-radius: 9px; outline: none; background: #fff;\n  color: #0f172a; font: inherit; font-size: 14px; transition: border-color .15s, box-shadow .15s;\n}\n#modalProdutoAvulsoEmergencia .avulso-campo input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }\n#modalProdutoAvulsoEmergencia .avulso-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 13px; }\n#modalProdutoAvulsoEmergencia .avulso-resumo {\n  margin: 3px 0 17px; padding: 15px 16px; border: 1px solid #dbeafe;\n  border-radius: 12px; background: #f8fbff;\n}\n#modalProdutoAvulsoEmergencia .avulso-linha-resumo { display: flex; justify-content: space-between; gap: 12px; color: #64748b; font-size: 12px; }\n#modalProdutoAvulsoEmergencia .avulso-linha-resumo + .avulso-linha-resumo { margin-top: 7px; }\n#modalProdutoAvulsoEmergencia .avulso-total { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; padding-top: 11px; border-top: 1px solid #dbeafe; }\n#modalProdutoAvulsoEmergencia .avulso-total span { color: #1e293b; font-size: 13px; font-weight: 700; }\n#modalProdutoAvulsoEmergencia .avulso-total strong { color: #1d4ed8; font-size: 22px; font-weight: 800; }\n#modalProdutoAvulsoEmergencia .avulso-aviso { margin: 0 0 16px; color: #64748b; font-size: 11px; line-height: 1.5; }\n#modalProdutoAvulsoEmergencia .avulso-erro { min-height: 18px; margin: -4px 0 10px; color: #b91c1c; font-size: 12px; }\n#modalProdutoAvulsoEmergencia .avulso-acoes { display: flex; justify-content: flex-end; gap: 10px; padding-top: 3px; }\n#modalProdutoAvulsoEmergencia .avulso-btn { min-height: 42px; padding: 10px 17px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; }\n#modalProdutoAvulsoEmergencia .avulso-btn-cancelar { background: #fff; border: 1px solid #cbd5e1; color: #334155; }\n#modalProdutoAvulsoEmergencia .avulso-btn-adicionar { background: #2563eb; border: 1px solid #2563eb; color: #fff; }\n#modalProdutoAvulsoEmergencia .avulso-btn-adicionar:hover { background: #1d4ed8; }\n@media (max-width: 560px) {\n  #modalProdutoAvulsoEmergencia { padding: 10px; }\n  #modalProdutoAvulsoEmergencia .avulso-head { padding: 18px 18px 14px; }\n  #modalProdutoAvulsoEmergencia .avulso-form { padding: 18px; }\n  #modalProdutoAvulsoEmergencia .avulso-grid { grid-template-columns: 1fr 1fr; }\n  #modalProdutoAvulsoEmergencia .avulso-campo-desconto { grid-column: 1 / -1; }\n  #modalProdutoAvulsoEmergencia .avulso-acoes { flex-direction: column-reverse; }\n  #modalProdutoAvulsoEmergencia .avulso-btn { width: 100%; }\n}\n";
        document.head.appendChild(style);
    }

    const overlay = document.createElement("div");
    overlay.id = modalId;
    overlay.innerHTML = `
        <section class="avulso-dialog" role="dialog" aria-modal="true" aria-labelledby="tituloModalProdutoAvulso">
            <header class="avulso-head">
                <div>
                    <h2 class="avulso-title" id="tituloModalProdutoAvulso">Adicionar produto avulso</h2>
                    <p class="avulso-subtitle">Preencha os dados do item que ainda não está cadastrado.</p>
                    <span class="avulso-badge">SEM CONTROLE DE ESTOQUE</span>
                </div>
                <button type="button" class="avulso-fechar" data-avulso-fechar aria-label="Fechar">×</button>
            </header>
            <form class="avulso-form" data-avulso-form novalidate>
                <div class="avulso-campo">
                    <label for="avulsoDescricao">Descrição do produto</label>
                    <input id="avulsoDescricao" name="descricao" type="text" maxlength="200" placeholder="Ex.: Vara de pesca, anzol, acessório..." autocomplete="off" required>
                </div>
                <div class="avulso-grid">
                    <div class="avulso-campo">
                        <label for="avulsoPreco">Preço unitário (R$)</label>
                        <input id="avulsoPreco" name="preco" type="text" inputmode="decimal" placeholder="0,00" autocomplete="off" required>
                    </div>
                    <div class="avulso-campo">
                        <label for="avulsoQuantidade">Quantidade</label>
                        <input id="avulsoQuantidade" name="quantidade" type="number" min="1" step="1" value="1" required>
                    </div>
                    <div class="avulso-campo avulso-campo-desconto">
                        <label for="avulsoDesconto">Desconto manual (%)</label>
                        <input id="avulsoDesconto" name="desconto" type="text" inputmode="decimal" value="0" autocomplete="off" required>
                    </div>
                </div>
                <div class="avulso-resumo" aria-live="polite">
                    <div class="avulso-linha-resumo"><span>Subtotal</span><strong data-avulso-subtotal>R$ 0,00</strong></div>
                    <div class="avulso-linha-resumo"><span>Desconto manual</span><strong data-avulso-desconto-valor>R$ 0,00</strong></div>
                    <div class="avulso-total"><span>Total do item</span><strong data-avulso-total>R$ 0,00</strong></div>
                </div>
                <p class="avulso-aviso">O desconto é aplicado uma única vez neste item e não interfere no desconto máximo nem no desconto à vista dos produtos cadastrados. Este produto não terá baixa no estoque.</p>
                <p class="avulso-erro" data-avulso-erro role="alert"></p>
                <footer class="avulso-acoes">
                    <button type="button" class="avulso-btn avulso-btn-cancelar" data-avulso-fechar>Cancelar</button>
                    <button type="submit" class="avulso-btn avulso-btn-adicionar">Adicionar ao carrinho</button>
                </footer>
            </form>
        </section>`;
    document.body.appendChild(overlay);

    const form = overlay.querySelector("[data-avulso-form]");
    const descricaoCampo = overlay.querySelector("#avulsoDescricao");
    const precoCampo = overlay.querySelector("#avulsoPreco");
    const quantidadeCampo = overlay.querySelector("#avulsoQuantidade");
    const descontoCampo = overlay.querySelector("#avulsoDesconto");
    const erroCampo = overlay.querySelector("[data-avulso-erro]");
    const subtotalResumo = overlay.querySelector("[data-avulso-subtotal]");
    const descontoResumo = overlay.querySelector("[data-avulso-desconto-valor]");
    const totalResumo = overlay.querySelector("[data-avulso-total]");

    const fechar = () => {
        document.removeEventListener("keydown", tratarTeclaEsc);
        overlay.remove();
    };
    const tratarTeclaEsc = (evento) => {
        if (evento.key === "Escape") fechar();
    };
    overlay.querySelectorAll("[data-avulso-fechar]").forEach((botao) => botao.addEventListener("click", fechar));
    overlay.addEventListener("mousedown", (evento) => {
        if (evento.target === overlay) fechar();
    });
    document.addEventListener("keydown", tratarTeclaEsc);

    const obterValores = () => {
        const preco = converterEntradaNumericaAvulsa(precoCampo.value);
        const quantidade = Number(quantidadeCampo.value);
        const percentual = converterEntradaNumericaAvulsa(descontoCampo.value);
        const precoCentavos = Number.isFinite(preco) ? Math.round(preco * 100) : 0;
        const subtotalCentavos = precoCentavos * (Number.isInteger(quantidade) && quantidade > 0 ? quantidade : 0);
        const percentualSeguro = Number.isFinite(percentual) ? Math.max(0, Math.min(100, percentual)) : 0;
        const descontoCentavos = Math.round(subtotalCentavos * percentualSeguro / 100);
        return { preco, quantidade, percentual, subtotalCentavos, descontoCentavos, totalCentavos: Math.max(0, subtotalCentavos - descontoCentavos) };
    };
    const formatarCentavos = (centavos) => formatarMoeda(centavos / 100);
    const atualizarPrevia = () => {
        const valores = obterValores();
        subtotalResumo.textContent = formatarCentavos(valores.subtotalCentavos);
        descontoResumo.textContent = `-${formatarCentavos(valores.descontoCentavos)}`;
        totalResumo.textContent = formatarCentavos(valores.totalCentavos);
    };
    [precoCampo, quantidadeCampo, descontoCampo].forEach((campo) => campo.addEventListener("input", atualizarPrevia));

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const nome = descricaoCampo.value.trim();
        const valores = obterValores();
        let mensagemErro = "";
        if (!nome || nome.length > 200) mensagemErro = "Informe a descrição do produto (até 200 caracteres).";
        else if (!Number.isFinite(valores.preco) || valores.preco <= 0) mensagemErro = "Informe um preço unitário maior que zero.";
        else if (!Number.isInteger(valores.quantidade) || valores.quantidade < 1) mensagemErro = "Informe uma quantidade inteira maior que zero.";
        else if (!Number.isFinite(valores.percentual) || valores.percentual < 0 || valores.percentual > 100) mensagemErro = "O desconto deve ficar entre 0% e 100%.";
        else if (!Number.isSafeInteger(valores.subtotalCentavos) || valores.subtotalCentavos <= 0) mensagemErro = "Confira o preço e a quantidade informados.";

        if (mensagemErro) {
            erroCampo.textContent = mensagemErro;
            return;
        }

        const precoArredondado = valores.subtotalCentavos / 100 / valores.quantidade;
        const percentualArredondado = Math.round(valores.percentual * 100) / 100;
        carrinho.push({
            id: `avulso_${Date.now()}_${carrinho.length + 1}`,
            produto_id: null,
            avulso: true,
            descricao_avulsa: nome,
            nome,
            sku: "AVULSO",
            preco_unitario: precoArredondado,
            preco_venda_minimo: precoArredondado,
            estoque: null,
            quantidade: valores.quantidade,
            desconto_percentual: percentualArredondado
        });
        fechar();
        renderizarCarrinho();
        atualizarResumo();
        mostrarMensagem("Produto avulso adicionado. Desconto manual separado dos produtos cadastrados.", "sucesso");
    });

    window.requestAnimationFrame(() => descricaoCampo.focus());
    atualizarPrevia();
}


function calcularSubtotalProdutosCadastrados() {
    return carrinho.reduce((total, item) => {
        if (item.avulso || item.produto_id == null) return total;
        return total + (Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0);
    }, 0);
}

function calcularDescontoManualAvulsosCentavos() {
    return carrinho.reduce((total, item) => {
        if (!item.avulso) return total;
        const subtotalCentavos = Math.round((Number(item.preco_unitario) || 0) * 100) * (Number(item.quantidade) || 0);
        const percentual = Math.max(0, Math.min(100, Number(item.desconto_percentual) || 0));
        return total + Math.round(subtotalCentavos * percentual / 100);
    }, 0);
}

function renderizarCarrinho() {

    if (!listaCarrinho) {

        return;

    }

    /* FORÇA A ÁREA A FICAR VISÍVEL */

    listaCarrinho.style.setProperty(

        "display",

        "block",

        "important"

    );

    listaCarrinho.style.setProperty(

        "visibility",

        "visible",

        "important"

    );

    listaCarrinho.style.setProperty(

        "opacity",

        "1",

        "important"

    );

    listaCarrinho.style.setProperty(

        "height",

        "auto",

        "important"

    );

    listaCarrinho.style.setProperty(

        "max-height",

        "none",

        "important"

    );

    listaCarrinho.style.setProperty(

        "overflow",

        "visible",

        "important"

    );

    atualizarQuantidadeItens();

    atualizarResumo();

    listaCarrinho.innerHTML =

        "";

    if (

        carrinho.length === 0

    ) {

        carrinhoVazio.style.display =

            "block";

        return;

    }

    carrinhoVazio.style.display =

        "none";

    const wrapper =

        document.createElement(

            "div"

        );

    wrapper.className =

        "carrinho-tabela-wrapper";

    wrapper.style.setProperty(

        "display",

        "block",

        "important"

    );

    wrapper.style.setProperty(

        "width",

        "100%",

        "important"

    );

    const tabela =

        document.createElement(

            "table"

        );

    tabela.className =

        "carrinho-tabela-admin";

    tabela.style.setProperty(

        "display",

        "table",

        "important"

    );

    tabela.style.setProperty(

        "visibility",

        "visible",

        "important"

    );

    tabela.style.setProperty(

        "opacity",

        "1",

        "important"

    );

    tabela.style.setProperty(

        "width",

        "100%",

        "important"

    );

    tabela.style.setProperty(

        "background",

        "#ffffff",

        "important"

    );

    tabela.innerHTML = `

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

                <th>

                    Ação

                </th>

            </tr>

        </thead>

        <tbody></tbody>

    `;

    const corpo =

        tabela.querySelector(

            "tbody"

        );

    carrinho.forEach(

        function (

            item,

            indice

        ) {

            const subtotal =

                Number(

                    item.quantidade

                ) *

                Number(

                    item.preco_unitario

                );

            const estoque = item.avulso ? null : Number(item.estoque);

            const podeDiminuir =

                Number(

                    item.quantidade

                ) > 1;

            const podeAumentar = item.avulso || Number(item.quantidade) < estoque;

            const linha =

                document.createElement(

                    "tr"

                );

            linha.innerHTML = `

                <td>

                    <div class="produto-item-nome">

                        ${escaparHTML(

                            item.nome

                        )}

                    </div>

                </td>

                <td>

                    <span class="produto-item-sku">

                        ${escaparHTML(

                            item.sku || "-"

                        )}

                    </span>

                </td>

                <td>

                    <div class="controle-quantidade-carrinho">

                        <button

                            type="button"

                            class="botao-quantidade botao-menos"

                            data-indice="${indice}"

                            ${podeDiminuir ? "" : "disabled"}

                        >

                            −

                        </button>

                        <input

                            type="number"

                            class="quantidade-carrinho"

                            data-indice="${indice}"

                            min="1"

                            ${item.avulso ? "" : `max="${estoque}"`}

                            step="1"

                            value="${Number(

                                item.quantidade

                            )}"

                        >

                        <button

                            type="button"

                            class="botao-quantidade botao-mais"

                            data-indice="${indice}"

                            ${podeAumentar ? "" : "disabled"}

                        >

                            +

                        </button>

                    </div>

                    <small class="estoque-item">

                        ${item.avulso ? "Sem controle de estoque" : `Estoque: ${estoque}`}

                    </small>

                </td>

                <td>

                    <span class="preco-item">

                        ${formatarMoeda(

                            item.preco_unitario

                        )}

                    </span>

                </td>

                <td>

                    <span class="subtotal-item">

                        ${formatarMoeda(subtotal)}
                        ${item.avulso ? `<small style="display:block;color:#9a3412;">Desconto manual: ${Number(item.desconto_percentual || 0).toLocaleString("pt-BR")}% (-${formatarMoeda(subtotal * Number(item.desconto_percentual || 0) / 100)})</small>` : ""}

                    </span>

                </td>

                <td>

                    <button

                        type="button"

                        class="botao-remover-item"

                        data-indice="${indice}"

                    >

                        Remover

                    </button>

                </td>

            `;

            corpo.appendChild(

                linha

            );

        }

    );

    wrapper.appendChild(

        tabela

    );

    listaCarrinho.appendChild(

        wrapper

    );

    configurarBotoesCarrinho();

}

/* ==========================================

   BOTÕES DO CARRINHO

========================================== */

function configurarBotoesCarrinho() {

    listaCarrinho

        .querySelectorAll(

            ".botao-menos"

        )

        .forEach(

            function (

                botao

            ) {

                botao.addEventListener(

                    "click",

                    function () {

                        const indice =

                            Number(

                                botao.dataset.indice

                            );

                        alterarQuantidadeCarrinho(

                            indice,

                            -1

                        );

                    }

                );

            }

        );

    listaCarrinho

        .querySelectorAll(

            ".botao-mais"

        )

        .forEach(

            function (

                botao

            ) {

                botao.addEventListener(

                    "click",

                    function () {

                        const indice =

                            Number(

                                botao.dataset.indice

                            );

                        alterarQuantidadeCarrinho(

                            indice,

                            1

                        );

                    }

                );

            }

        );

    listaCarrinho

        .querySelectorAll(

            ".quantidade-carrinho"

        )

        .forEach(

            function (

                campo

            ) {

                campo.addEventListener(

                    "change",

                    function () {

                        const indice =

                            Number(

                                campo.dataset.indice

                            );

                        definirQuantidadeCarrinho(

                            indice,

                            campo.value

                        );

                    }

                );

                campo.addEventListener(

                    "blur",

                    function () {

                        const indice =

                            Number(

                                campo.dataset.indice

                            );

                        definirQuantidadeCarrinho(

                            indice,

                            campo.value

                        );

                    }

                );

            }

        );

    listaCarrinho

        .querySelectorAll(

            ".botao-remover-item"

        )

        .forEach(

            function (

                botao

            ) {

                botao.addEventListener(

                    "click",

                    function () {

                        const indice =

                            Number(

                                botao.dataset.indice

                            );

                        removerProdutoCarrinho(

                            indice

                        );

                    }

                );

            }

        );

}

/* ==========================================

   FINALIZAR VENDA

========================================== */

function calcularDataPrimeiroVencimentoFiado(dias) {

    const data = new Date();
    data.setHours(12, 0, 0, 0);
    data.setDate(data.getDate() + Number(dias));

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;

}

function atualizarCamposPrazoVenda() {
    const vendaAPrazo = formaPagamento && formaPagamento.value === "a_prazo";
    const vendaEmDinheiro = formaPagamento && formaPagamento.value === "dinheiro";

    if (camposPrazoVenda) {
        camposPrazoVenda.hidden = !vendaAPrazo;
    }

    if (camposDinheiroVenda) {
        camposDinheiroVenda.hidden = !vendaEmDinheiro;
    }

    if (!vendaEmDinheiro && valorRecebidoVenda) {
        valorRecebidoVenda.value = "";
    }

    atualizarTrocoDinheiro();
}

async function finalizarVenda() {

    if (

        carrinho.length === 0

    ) {

        mostrarMensagem(

            "Adicione pelo menos um produto à venda.",

            "erro"

        );

        return;

    }

    const forma =

        formaPagamento.value.trim();

    if (!forma) {

        mostrarMensagem(

            "Selecione a forma de pagamento.",

            "erro"

        );

        formaPagamento.focus();

        return;

    }

    if (forma === "a_prazo") {

        const clienteFiado = clientesVenda.find(
            (cliente) => String(cliente.id) === String(clienteVenda.value)
        );

        if (!clienteFiado) {
            mostrarMensagem("Para vender a prazo, selecione um cliente cadastrado.", "erro");
            clienteVenda.focus();
            return;
        }

        if (!String(clienteFiado.telefone || "").trim()) {
            mostrarMensagem("O cliente precisa ter telefone cadastrado para uma venda a prazo.", "erro");
            clienteVenda.focus();
            return;
        }

    }

    const numeroParcelasFiado = Number(parcelasFiadoVenda?.value || 1);
    const diasPrimeiroVencimentoFiado = Number(diasPrimeiroVencimentoVenda?.value || 30);

    if (descontoAvistaAtivo && !formaPagamentoPermiteDescontoAvista()) {
        descontoAvistaAtivo = false;
        atualizarResumo();
        mostrarMensagem(`O desconto adicional de ${formatarPercentualDescontoAvista()} só pode ser usado com Dinheiro, Pix ou Outro e enquanto estiver habilitado nas configurações da loja.`, "erro");
        return;
    }

    const subtotal = calcularSubtotal();
    const totaisDesconto = calcularTotaisComDescontos(subtotal);
    const descontoBase = totaisDesconto.descontoBaseCentavos / 100;
    const descontoAvista = totaisDesconto.descontoAvistaCentavos / 100;
    const desconto = totaisDesconto.descontoProdutosCentavos / 100;
    const descontoAvulso = totaisDesconto.descontoAvulsoCentavos / 100;
    const descontoTotalGeral = totaisDesconto.descontoTotalCentavos / 100;
    const subtotalCentavos = totaisDesconto.subtotalCentavos;
    const descontoCentavos = totaisDesconto.descontoTotalCentavos;
    const total = totaisDesconto.totalCentavos / 100;



    const totalCentavos = Math.round(total * 100);
    let recebidoDinheiroCentavos = null;
    let trocoDinheiroCentavos = 0;

    if (forma === "dinheiro") {
        recebidoDinheiroCentavos = valorRecebidoEmCentavos();

        if (recebidoDinheiroCentavos === null) {
            mostrarMensagem("Informe o valor que o cliente entregou em dinheiro.", "erro");
            valorRecebidoVenda?.focus();
            return;
        }

        if (recebidoDinheiroCentavos < totalCentavos) {
            const faltaCentavos = totalCentavos - recebidoDinheiroCentavos;
            mostrarMensagem(`O valor recebido é insuficiente. Faltam ${formatarMoeda(faltaCentavos / 100)}.`, "erro");
            valorRecebidoVenda?.focus();
            atualizarTrocoDinheiro();
            return;
        }

        trocoDinheiroCentavos = recebidoDinheiroCentavos - totalCentavos;
    }
    const resumoFormaPagamento = forma === "a_prazo"
        ? `Forma: A prazo\nParcelas: ${numeroParcelasFiado}\nPrimeiro vencimento: em ${diasPrimeiroVencimentoFiado} dias\nA dívida será registrada e não contará como valor recebido.`
        : forma === "dinheiro"
            ? `Forma: Dinheiro\nValor recebido: ${formatarMoeda(recebidoDinheiroCentavos / 100)}\nTroco: ${formatarMoeda(trocoDinheiroCentavos / 100)}`
            : `Forma: ${formaPagamento.options[formaPagamento.selectedIndex].text}`;

    const confirmou = confirm(
        `Confirmar venda?\n\n` +
        `Subtotal: ${formatarMoeda(subtotal)}\n` +
        `Desconto máximo: ${formatarMoeda(descontoBase)}\n` +
        `Desconto adicional à vista (${formatarPercentualDescontoAvista()}): ${formatarMoeda(descontoAvista)}\n` +
        `Desconto dos produtos cadastrados: ${formatarMoeda(desconto)}\n` +
        `Desconto manual dos avulsos: ${formatarMoeda(descontoAvulso)}\n` +
        `Desconto total: ${formatarMoeda(descontoTotalGeral)}\n` +
        `Total: ${formatarMoeda(total)}\n\n` +
        `${resumoFormaPagamento}`
    );

    if (!confirmou) {

        return;

    }

    btnFinalizarVenda.disabled =

        true;

    btnFinalizarVenda.textContent =

        "Finalizando...";

    const itens =

        carrinho.map(

            function (

                item

            ) {

                if (item.avulso) {
                    return {
                        produto_id: null,
                        descricao_avulsa: item.descricao_avulsa,
                        preco_unitario: Number(item.preco_unitario),
                        desconto_percentual: Number(item.desconto_percentual),
                        quantidade: Number(item.quantidade)
                    };
                }

                return {
                    produto_id: Number(item.produto_id),
                    quantidade: Number(item.quantidade)
                };

            }

        );

    const clienteId =

        clienteVenda.value

            ? Number(

                clienteVenda.value

            )

            : null;

    const observacoes =

        observacoesVenda.value.trim() ||

        null;

    try {

        let resultado;

        if (forma === "a_prazo") {

            resultado = await vendasSupabase.rpc("registrar_venda_a_prazo", {
                p_cliente_id: clienteId,
                p_desconto: desconto,
                p_observacoes: observacoes,
                p_itens: itens,
                p_numero_parcelas: numeroParcelasFiado,
                p_primeiro_vencimento: calcularDataPrimeiroVencimentoFiado(
                    diasPrimeiroVencimentoFiado
                )
            });

        } else {

            resultado = await vendasSupabase.rpc("finalizar_venda", {
                p_cliente_id: clienteId,
                p_desconto: desconto,
                p_forma_pagamento: forma,
                p_observacoes: observacoes,
                p_itens: itens
            });

        }

        const { data, error } = resultado;

        if (error) {

            console.error(

                "Erro ao finalizar venda:",

                error

            );

            mostrarMensagem(

                error.message ||

                "Não foi possível finalizar a venda.",

                "erro"

            );

            return;

        }

        if (forma === "a_prazo") {

            alert(
                `Venda #${data.venda_id} registrada com sucesso!\n` +
                `Notinha: #${String(data.notinha_numero).padStart(6, "0")}\n` +
                `Total da dívida: ${formatarMoeda(data.total)}\n` +
                `Parcelas: ${numeroParcelasFiado}\n` +
                `Primeiro vencimento: ${data.primeiro_vencimento || calcularDataPrimeiroVencimentoFiado(diasPrimeiroVencimentoFiado)}`
            );

        } else {

            alert(
                `Venda finalizada com sucesso!\n\n` +
                `Número da venda: #${data.venda_id}\n` +
                `Total: ${formatarMoeda(data.total)}\n` +
                `Pagamento: ${formaPagamento.options[formaPagamento.selectedIndex].text}`
            );

        }

        if (window.SistemaLojaComprovantes) {

            window.SistemaLojaComprovantes.adicionarBotao(
                vendasSupabase,
                data.venda_id,
                btnFinalizarVenda,
                forma === "dinheiro"
                    ? {
                        valorRecebido: recebidoDinheiroCentavos / 100,
                        troco: trocoDinheiroCentavos / 100
                    }
                    : null
            );

        }

        limparVenda();

        await carregarProdutosVenda();

    }

    catch (erro) {

        console.error(

            "Erro inesperado:",

            erro

        );

        mostrarMensagem(

            "Ocorreu um erro ao finalizar a venda.",

            "erro"

        );

    }

    finally {

        btnFinalizarVenda.disabled =

            false;

        btnFinalizarVenda.textContent =

            "✓ Finalizar venda";

    }

}

/* ==========================================

   LIMPAR VENDA

========================================== */

function limparVenda() {

    carrinho =

        [];

    invalidarEstadoDescontoAvista();

    clienteVenda.value =

        "";

    produtoVenda.value =

        "";

    quantidadeVenda.value =

        1;

    precoVenda.value =

        "R$ 0,00";

    descontoVenda.value =

        0;

    formaPagamento.value =

        "";

    if (parcelasFiadoVenda) parcelasFiadoVenda.value = "1";

    if (diasPrimeiroVencimentoVenda) diasPrimeiroVencimentoVenda.value = "30";

    atualizarCamposPrazoVenda();

    observacoesVenda.value =

        "";

    if (

        buscaProdutoVenda

    ) {

        buscaProdutoVenda.value =

            "";

    }

    if (

        buscaClienteVenda

    ) {

        buscaClienteVenda.value =

            "";

    }

    renderizarCarrinho();

}

/* ==========================================

   CANCELAR

========================================== */

function cancelarVenda() {

    if (

        carrinho.length === 0

    ) {

        limparVenda();

        return;

    }

    const confirmou =

        confirm(

            "Deseja cancelar a venda atual?"

        );

    if (!confirmou) {

        return;

    }

    limparVenda();

}

/* ==========================================

   SAIR

========================================== */

async function sair() {

    const confirmou =

        confirm(

            "Deseja realmente sair do sistema?"

        );

    if (!confirmou) {

        return;

    }

    await vendasSupabase

        .auth

        .signOut({

            scope: "local"

        });

    sessionStorage.removeItem(

        "sistemaLojaPerfil"

    );

    window.location.href =

        "index.html";

}

/* ==========================================

   MENU FUTURO

========================================== */

document

    .querySelectorAll(

        "[data-futuro]"

    )

    .forEach(

        function (item) {

            item.addEventListener(

                "click",

                function (evento) {

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

   EVENTOS

========================================== */

produtoVenda.addEventListener(

    "change",

    atualizarPrecoProduto

);

btnAdicionarProduto.addEventListener(

    "click",

    adicionarProdutoCarrinho

);

document.getElementById("btnAdicionarProdutoAvulso")?.addEventListener("click", adicionarProdutoAvulso);

descontoVenda.addEventListener("input", function () {
    invalidarEstadoDescontoAvista();
    atualizarResumo();
});

btnCancelarVenda.addEventListener(

    "click",

    cancelarVenda

);

if (valorRecebidoVenda) {
    valorRecebidoVenda.addEventListener("input", atualizarTrocoDinheiro);
}

if (formaPagamento) {

    formaPagamento.addEventListener("change", tratarMudancaFormaPagamentoDescontoAvista);

    atualizarCamposPrazoVenda();

}

btnFinalizarVenda.addEventListener(

    "click",

    finalizarVenda

);

if (btnSair) {

    btnSair.addEventListener(

        "click",

        sair

    );

}

/* ==========================================

   INICIAR

========================================== */

async function iniciarVendas() {

    aplicarEstiloVendas();

    const autorizado =

        await protegerPaginaVendas();

    if (!autorizado) {

        return;

    }

    await carregarConfiguracoesDescontosVenda();

    criarBuscaCliente();

    criarBuscaProduto();

    await carregarClientesVenda();

    await carregarProdutosVenda();

    renderizarCarrinho();

}

/* ==========================================

   EXECUTAR

========================================== */

iniciarVendas();