/* ==========================================

   SISTEMA DA LOJA

   VENDAS DO VENDEDOR

   CARRINHO COM BUSCAS E CONTROLE DE QUANTIDADE

========================================== */

/* ==========================================

   SUPABASE

========================================== */

const vendedorVendasSupabase =

    supabaseClient;

/* ==========================================

   ELEMENTOS

========================================== */

const produtoVenda =

    document.getElementById(

        "produtoVenda"

    );

const quantidadeVenda =

    document.getElementById(

        "quantidadeVenda"

    );

const precoProdutoSelecionado =

    document.getElementById(

        "precoProdutoSelecionado"

    );

const btnAdicionarProduto =

    document.getElementById(

        "btnAdicionarProduto"

    );

const listaItensVenda =

    document.getElementById(

        "listaItensVenda"

    );

const clienteVenda =

    document.getElementById(

        "clienteVenda"

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

const observacoesVenda =

    document.getElementById(

        "observacoesVenda"

    );

const subtotalVenda =

    document.getElementById(

        "subtotalVenda"

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
let camposDinheiroVenda = null;
let valorRecebidoVenda = null;
let trocoVenda = null;
let avisoDinheiroVenda = null;

const totalVenda =

    document.getElementById(

        "totalVenda"

    );

const btnFinalizarVenda =

    document.getElementById(

        "btnFinalizarVenda"

    );

const mensagemVenda =

    document.getElementById(

        "mensagemVenda"

    );

const nomeVendedor =

    document.getElementById(

        "nomeVendedor"

    );

const avatarVendedor =

    document.getElementById(

        "avatarVendedor"

    );

const dataAtual =

    document.getElementById(

        "dataAtual"

    );

/* ==========================================

   ESTADO

========================================== */

let produtos = [];

let clientes = [];

let itensVenda = [];

let buscaProdutoVenda = null;

let buscaClienteVenda = null;

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

/* ==========================================

   ESCAPAR HTML

========================================== */

function escaparHTML(texto) {

    const div =

        document.createElement(

            "div"

        );

    div.textContent =

        texto ?? "";

    return div.innerHTML;

}

/* ==========================================

   DATA

========================================== */

function mostrarDataAtual() {

    if (!dataAtual) {

        return;

    }

    const agora =

        new Date();

    const texto =

        agora.toLocaleDateString(

            "pt-BR",

            {

                weekday: "long",

                day: "2-digit",

                month: "long",

                year: "numeric"

            }

        );

    dataAtual.textContent =

        texto.charAt(0).toUpperCase() +

        texto.slice(1);

}

/* ==========================================

   MENSAGEM

========================================== */

function mostrarMensagem(

    texto,

    tipo = ""

) {

    mensagemVenda.textContent =

        texto;

    mensagemVenda.className =

        "mensagem-venda";

    if (tipo) {

        mensagemVenda.classList.add(

            tipo

        );

    }

}

/* ==========================================

   PROTEGER VENDEDOR

========================================== */

async function protegerVendedor() {

    try {

        const resultadoSessao =

            await vendedorVendasSupabase

                .auth

                .getSession();

        const session =

            resultadoSessao

                .data

                .session;

        if (!session) {

            window.location.href =

                "index.html";

            return false;

        }

        const resultadoPerfil =

            await vendedorVendasSupabase

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

            resultadoPerfil.error ||

            !resultadoPerfil.data

        ) {

            await vendedorVendasSupabase

                .auth

                .signOut({

                    scope: "local"

                });

            window.location.href =

                "index.html";

            return false;

        }

        const perfil =

            resultadoPerfil.data;

        if (

            perfil.tipo === "admin"

        ) {

            window.location.href =

                "admin.html";

            return false;

        }

        if (

            perfil.tipo !== "vendedor"

        ) {

            await vendedorVendasSupabase

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

            await vendedorVendasSupabase

                .auth

                .signOut({

                    scope: "local"

                });

            sessionStorage.removeItem(

                "sistemaLojaPerfil"

            );

            alert(

                "Seu usuário está desativado. Procure o administrador."

            );

            window.location.href =

                "index.html";

            return false;

        }

        lojaIdDescontosVenda = perfil.loja_id || null;

        const nome =

            perfil.nome_completo ||

            perfil.usuario ||

            "Vendedor";

        nomeVendedor.textContent =

            nome;

        avatarVendedor.textContent =

            nome

                .trim()

                .charAt(0)

                .toUpperCase();

        sessionStorage.setItem(

            "sistemaLojaPerfil",

            JSON.stringify(perfil)

        );

        return true;

    }

    catch (erro) {

        console.error(

            "Erro ao proteger vendedor:",

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

    const { data, error } = await vendedorVendasSupabase
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

   CRIAR BUSCA DE PRODUTO

========================================== */

function criarBuscaProduto() {

    if (buscaProdutoVenda) {

        return;

    }

    buscaProdutoVenda =

        document.createElement(

            "input"

        );

    buscaProdutoVenda.type =

        "text";

    buscaProdutoVenda.id =

        "buscaProdutoVenda";

    buscaProdutoVenda.className =

        "campo-busca-venda";

    buscaProdutoVenda.placeholder =

        "🔎 Digite o nome ou SKU do produto";

    buscaProdutoVenda.autocomplete =

        "off";

    produtoVenda.parentNode.insertBefore(

        buscaProdutoVenda,

        produtoVenda

    );

    buscaProdutoVenda.addEventListener(

        "input",

        filtrarProdutos

    );

}

/* ==========================================

   FILTRAR PRODUTOS

========================================== */

function filtrarProdutos() {

    const texto =

        (

            buscaProdutoVenda.value ||

            ""

        )

        .trim()

        .toLowerCase();

    if (!texto) {

        preencherListaProdutos(

            produtos

        );

        atualizarPrecoProduto();

        return;

    }

    const encontrados =

        produtos.filter(

            function (produto) {

                const nome =

                    String(

                        produto.nome || ""

                    ).toLowerCase();

                const sku =

                    String(

                        produto.sku || ""

                    ).toLowerCase();

                return (

                    nome.includes(texto) ||

                    sku.includes(texto)

                );

            }

        );

    preencherListaProdutos(

        encontrados

    );

    if (

        encontrados.length === 1

    ) {

        produtoVenda.value =

            encontrados[0].id;

        atualizarPrecoProduto();

        return;

    }

    produtoVenda.value =

        "";

    atualizarPrecoProduto();

}

/* ==========================================

   PREENCHER PRODUTOS

========================================== */

function preencherListaProdutos(

    lista

) {

    produtoVenda.innerHTML = "";

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

                produto.nome +

                " — " +

                (

                    produto.sku ||

                    "Sem SKU"

                ) +

                " — " +

                formatarMoeda(

                    produto.preco_venda

                );

            produtoVenda.appendChild(

                option

            );

        }

    );

}

/* ==========================================

   CARREGAR PRODUTOS

========================================== */

async function carregarProdutos() {

    const resultado =

        await vendedorVendasSupabase

            .from(

                "produtos_para_venda"

            )

            .select(

                "id, nome, sku, preco_venda, preco_venda_minimo, estoque, estoque_minimo, ativo"

            )

            .eq(

                "ativo",

                true

            )

            .gt(

                "estoque",

                0

            )

            .order(

                "nome",

                {

                    ascending: true

                }

            );

    if (resultado.error) {

        console.error(

            "Erro ao carregar produtos:",

            resultado.error

        );

        mostrarMensagem(

            "Não foi possível carregar os produtos.",

            "erro"

        );

        return;

    }

    produtos =

        resultado.data || [];

    criarBuscaProduto();

    preencherListaProdutos(

        produtos

    );

    atualizarPrecoProduto();

}

/* ==========================================

   CRIAR BUSCA DE CLIENTE

========================================== */

function criarBuscaCliente() {

    if (buscaClienteVenda) {

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

   FILTRAR CLIENTES

========================================== */

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

            clientes

        );

        return;

    }

    const encontrados =

        clientes.filter(

            function (cliente) {

                const nome =

                    String(

                        cliente.nome || ""

                    ).toLowerCase();

                const telefone =

                    String(

                        cliente.telefone || ""

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

            encontrados[0].id;

        return;

    }

    clienteVenda.value =

        "";

}

/* ==========================================

   PREENCHER CLIENTES

========================================== */

function preencherListaClientes(

    lista

) {

    clienteVenda.innerHTML = "";

    const consumidor =

        document.createElement(

            "option"

        );

    consumidor.value =

        "";

    consumidor.textContent =

        "Consumidor não identificado";

    clienteVenda.appendChild(

        consumidor

    );

    if (

        lista.length === 0

    ) {

        const option =

            document.createElement(

                "option"

            );

        option.value =

            "";

        option.textContent =

            "Nenhum cliente encontrado";

        clienteVenda.appendChild(

            option

        );

        return;

    }

    lista.forEach(

        function (cliente) {

            const option =

                document.createElement(

                    "option"

                );

            option.value =

                cliente.id;

            let texto =

                cliente.nome || "Cliente";

            if (

                cliente.telefone

            ) {

                texto +=

                    " — " +

                    cliente.telefone;

            }

            option.textContent =

                texto;

            clienteVenda.appendChild(

                option

            );

        }

    );

}

/* ==========================================

   CARREGAR CLIENTES

========================================== */

async function carregarClientes() {

    const resultado =

        await vendedorVendasSupabase

            .from(

                "clientes_para_venda"

            )

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

    if (resultado.error) {

        console.error(

            "Erro ao carregar clientes:",

            resultado.error

        );

        return;

    }

    clientes =

        resultado.data || [];

    criarBuscaCliente();

    preencherListaClientes(

        clientes

    );

}

/* ==========================================

   ATUALIZAR PREÇO DO PRODUTO

========================================== */

function atualizarPrecoProduto() {

    const produtoId =

        produtoVenda.value;

    const produto =

        produtos.find(

            function (item) {

                return (

                    String(item.id) ===

                    String(produtoId)

                );

            }

        );

    if (!produto) {

        precoProdutoSelecionado.textContent =

            "R$ 0,00";

        quantidadeVenda.max =

            "";

        return;

    }

    precoProdutoSelecionado.textContent =

        formatarMoeda(

            produto.preco_venda

        );

    quantidadeVenda.max =

        Math.floor(

            Number(

                produto.estoque

            )

        );

    const quantidadeAtual =

        Number(

            quantidadeVenda.value

        ) || 1;

    if (

        quantidadeAtual >

        Number(produto.estoque)

    ) {

        quantidadeVenda.value =

            Math.floor(

                Number(

                    produto.estoque

                )

            );

    }

}

/* ==========================================

   ADICIONAR PRODUTO

========================================== */

function adicionarProduto() {

    mostrarMensagem(

        ""

    );

    const produtoId =

        produtoVenda.value;

    if (!produtoId) {

        mostrarMensagem(

            "Selecione um produto.",

            "erro"

        );

        return;

    }

    const produto =

        produtos.find(

            function (item) {

                return (

                    String(item.id) ===

                    String(produtoId)

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

    const quantidade =

        Number(

            quantidadeVenda.value

        );

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

    const estoque =

        Number(

            produto.estoque

        );

    const itemExistente =

        itensVenda.find(

            function (item) {

                return (

                    String(item.produto_id) ===

                    String(produto.id)

                );

            }

        );

    const quantidadeAtual =

        itemExistente

            ? Number(

                itemExistente.quantidade

            )

            : 0;

    const quantidadeFinal =

        quantidadeAtual +

        quantidade;

    if (

        quantidadeFinal >

        estoque

    ) {

        mostrarMensagem(

            "A quantidade solicitada ultrapassa o estoque disponível. Estoque: " +

            estoque,

            "erro"

        );

        return;

    }

    if (itemExistente) {

        itemExistente.quantidade =

            quantidadeFinal;

    }

    else {

        itensVenda.push({

            produto_id:

                produto.id,

            nome:

                produto.nome,

            sku:

                produto.sku,

            preco_unitario:

                Number(

                    produto.preco_venda

                ),

            preco_venda_minimo: Number(produto.preco_venda_minimo ?? produto.preco_venda) || 0,

            estoque:

                estoque,

            quantidade:

                quantidade

        });

    }

    renderizarItens();

    atualizarResumo();

    quantidadeVenda.value =

        "1";

    mostrarMensagem(

        "Produto adicionado ao carrinho.",

        "sucesso"

    );

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
        itensVenda.push({
            id: `avulso_${Date.now()}_${itensVenda.length + 1}`,
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
        renderizarItens();
        atualizarResumo();
        mostrarMensagem("Produto avulso adicionado. Desconto manual separado dos produtos cadastrados.", "sucesso");
    });

    window.requestAnimationFrame(() => descricaoCampo.focus());
    atualizarPrevia();
}


function calcularSubtotalProdutosCadastrados() {
    return itensVenda.reduce((total, item) => {
        if (item.avulso || item.produto_id == null) return total;
        return total + (Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0);
    }, 0);
}

function calcularDescontoManualAvulsosCentavos() {
    return itensVenda.reduce((total, item) => {
        if (!item.avulso) return total;
        const subtotalCentavos = Math.round((Number(item.preco_unitario) || 0) * 100) * (Number(item.quantidade) || 0);
        const percentual = Math.max(0, Math.min(100, Number(item.desconto_percentual) || 0));
        return total + Math.round(subtotalCentavos * percentual / 100);
    }, 0);
}

function renderizarItens() {

    if (

        itensVenda.length === 0

    ) {

        listaItensVenda.innerHTML = `

            <tr>

                <td

                    colspan="6"

                    class="carrinho-vazio"

                >

                    Nenhum produto adicionado.

                </td>

            </tr>

        `;

        return;

    }

    listaItensVenda.innerHTML =

        itensVenda

            .map(

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

                    return `

                        <tr>

                            <td>

                                <div

                                    class="produto-item-nome"

                                >

                                    ${escaparHTML(

                                        item.nome

                                    )}

                                </div>

                            </td>

                            <td>

                                <span

                                    class="produto-item-sku"

                                >

                                    ${escaparHTML(

                                        item.sku ||

                                        "-"

                                    )}

                                </span>

                            </td>

                            <td>

                                <div

                                    class="controle-quantidade-carrinho"

                                >

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

                                <small>

                                    ${item.avulso ? "Sem controle de estoque" : `Estoque: ${estoque}`}

                                </small>

                            </td>

                            <td>

                                <span

                                    class="preco-item"

                                >

                                    ${formatarMoeda(

                                        item.preco_unitario

                                    )}

                                </span>

                            </td>

                            <td>

                                <span

                                    class="subtotal-item"

                                >

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

                        </tr>

                    `;

                }

            )

            .join("");

    configurarBotoesCarrinho();

}

/* ==========================================

   CONFIGURAR CONTROLES DO CARRINHO

========================================== */

function configurarBotoesCarrinho() {

    document

        .querySelectorAll(

            ".botao-menos"

        )

        .forEach(

            function (botao) {

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

    document

        .querySelectorAll(

            ".botao-mais"

        )

        .forEach(

            function (botao) {

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

    document

        .querySelectorAll(

            ".quantidade-carrinho"

        )

        .forEach(

            function (campo) {

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

    document

        .querySelectorAll(

            ".botao-remover-item"

        )

        .forEach(

            function (botao) {

                botao.addEventListener(

                    "click",

                    function () {

                        const indice =

                            Number(

                                botao.dataset.indice

                            );

                        itensVenda.splice(

                            indice,

                            1

                        );

                        renderizarItens();

                        atualizarResumo();

                    }

                );

            }

        );

}

/* ==========================================

   ALTERAR QUANTIDADE

========================================== */

function alterarQuantidadeCarrinho(

    indice,

    variacao

) {

    const item =

        itensVenda[indice];

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

        itensVenda[indice];

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

        quantidade = 1;

    }

    if (

        quantidade < 1

    ) {

        quantidade = 1;

    }

    const estoque =

        Number(

            item.estoque

        );

    if (

        !item.avulso && quantidade > estoque

    ) {

        quantidade =

            estoque;

        mostrarMensagem(

            "A quantidade não pode ser maior que o estoque disponível. Estoque: " +

            estoque,

            "erro"

        );

    }

    item.quantidade =

        quantidade;

    renderizarItens();

    atualizarResumo();

}

/* ==========================================

   CALCULAR SUBTOTAL

========================================== */

function calcularSubtotal() {

    return itensVenda.reduce(

        function (

            total,

            item

        ) {

            return (

                total +

                (

                    Number(

                        item.quantidade

                    ) *

                    Number(

                        item.preco_unitario

                    )

                )

            );

        },

        0

    );

}

/* ==========================================

   TIPO DE DESCONTO: VALOR OU PORCENTAGEM

========================================== */

function calcularLimiteDescontoSeguro(subtotal = calcularSubtotalProdutosCadastrados()) {
    const itens = itensVenda.filter(item => !item.avulso && item.produto_id != null);
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
    const itens = (itensVenda || []).filter(item => !item.avulso && item.produto_id != null);
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

    if (!descontoVenda || !descontoVenda.parentElement || document.getElementById("tipoDescontoVenda")) return;

    const container = descontoVenda.parentElement;
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.style.alignItems = "center";
    container.style.justifyContent = "flex-end";
    container.style.gap = "6px";
    container.style.flexWrap = "nowrap";
    container.style.width = "min(100%, 270px)";
    container.style.minWidth = "0";
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
        "flex: 0 1 112px",
        "min-width: 88px",
        "max-width: 112px",
        "width: 112px",
        "height: 38px",
        "padding: 0 7px",
        "border: 1px solid #d1d5db",
        "border-radius: 8px",
        "background: #fff",
        "color: #253047",
        "font: inherit",
        "font-size: 12px",
        "box-sizing: border-box"
    ].join(";");

    descontoVenda.style.flex = "1 1 68px";
    descontoVenda.style.minWidth = "58px";
    descontoVenda.style.maxWidth = "78px";
    descontoVenda.style.height = "38px";
    descontoVenda.style.boxSizing = "border-box";
    descontoVenda.style.padding = "0 8px";

    const unidadeInicial = container.querySelector("span");
    if (unidadeInicial) {
        unidadeInicial.style.position = "static";
        unidadeInicial.style.left = "auto";
        unidadeInicial.style.top = "auto";
        unidadeInicial.style.transform = "none";
        unidadeInicial.style.display = "inline-block";
        unidadeInicial.style.flex = "0 0 20px";
        unidadeInicial.style.minWidth = "20px";
        unidadeInicial.style.maxWidth = "20px";
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

        // Ao trocar a modalidade, preserva o valor monetário aproximado do desconto.
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

/* ==========================================

   RECEBIMENTO EM DINHEIRO E TROCO

========================================== */

function configurarCamposDinheiroVenda() {

    if (!formaPagamento || !formaPagamento.parentElement) return;

    const campoPagamento = formaPagamento.closest(".campo-pagamento-vendedor") || formaPagamento.parentElement;

    // Usa a mesma estrutura visual da tela de vendas do administrador.
    camposDinheiroVenda = document.getElementById("camposDinheiroVenda");

    if (!camposDinheiroVenda) {
        camposDinheiroVenda = document.createElement("div");
        camposDinheiroVenda.id = "camposDinheiroVenda";
        camposDinheiroVenda.className = "configuracao-dinheiro-venda";
        camposDinheiroVenda.hidden = true;

        const grupoRecebido = document.createElement("div");
        grupoRecebido.className = "campo-venda";

        const labelRecebido = document.createElement("label");
        labelRecebido.htmlFor = "valorRecebidoVenda";
        labelRecebido.textContent = "Valor recebido do cliente";

        valorRecebidoVenda = document.createElement("input");
        valorRecebidoVenda.type = "number";
        valorRecebidoVenda.id = "valorRecebidoVenda";
        valorRecebidoVenda.min = "0";
        valorRecebidoVenda.step = "0.01";
        valorRecebidoVenda.inputMode = "decimal";
        valorRecebidoVenda.autocomplete = "off";
        valorRecebidoVenda.placeholder = "Ex.: 50,00";
        valorRecebidoVenda.style.cssText = [
            "width:100%",
            "min-width:0",
            "height:44px",
            "box-sizing:border-box",
            "padding:0 13px",
            "border:1px solid #d1d5db",
            "border-radius:9px",
            "background:#fff",
            "color:#111827",
            "font:inherit",
            "font-size:14px",
            "outline:none"
        ].join(";");

        grupoRecebido.appendChild(labelRecebido);
        grupoRecebido.appendChild(valorRecebidoVenda);

        const grupoTroco = document.createElement("div");
        grupoTroco.className = "campo-venda";

        const labelTroco = document.createElement("label");
        labelTroco.htmlFor = "trocoVenda";
        labelTroco.textContent = "Troco a devolver";

        trocoVenda = document.createElement("output");
        trocoVenda.id = "trocoVenda";
        trocoVenda.className = "valor-troco-venda";
        trocoVenda.textContent = formatarMoeda(0);
        trocoVenda.style.cssText = [
            "display:flex",
            "align-items:center",
            "min-height:44px",
            "width:100%",
            "box-sizing:border-box",
            "padding:0 12px",
            "border:1px solid #bbf7d0",
            "border-radius:9px",
            "background:#fff",
            "color:#15803d",
            "font-size:18px",
            "font-weight:800",
            "overflow-wrap:anywhere"
        ].join(";");

        grupoTroco.appendChild(labelTroco);
        grupoTroco.appendChild(trocoVenda);

        avisoDinheiroVenda = document.createElement("small");
        avisoDinheiroVenda.id = "avisoDinheiroVenda";
        avisoDinheiroVenda.className = "texto-ajuda-dinheiro";
        avisoDinheiroVenda.textContent = "Informe quanto o cliente entregou. O troco será calculado automaticamente.";
        avisoDinheiroVenda.style.cssText = [
            "grid-column:1 / -1",
            "display:block",
            "margin:0",
            "color:#166534",
            "font-size:12px",
            "line-height:1.5"
        ].join(";");

        camposDinheiroVenda.appendChild(grupoRecebido);
        camposDinheiroVenda.appendChild(grupoTroco);
        camposDinheiroVenda.appendChild(avisoDinheiroVenda);
        campoPagamento.insertAdjacentElement("afterend", camposDinheiroVenda);
    } else {
        valorRecebidoVenda = document.getElementById("valorRecebidoVenda");
        trocoVenda = document.getElementById("trocoVenda");
        avisoDinheiroVenda = document.getElementById("avisoDinheiroVenda");

        if (trocoVenda) {
            trocoVenda.classList.add("valor-troco-venda");
            trocoVenda.style.cssText += ";display:flex;align-items:center;min-height:44px;width:100%;box-sizing:border-box;padding:0 12px;border:1px solid #bbf7d0;border-radius:9px;background:#fff;color:#15803d;font-size:18px;font-weight:800;overflow-wrap:anywhere";
        }
        if (avisoDinheiroVenda) {
            avisoDinheiroVenda.classList.add("texto-ajuda-dinheiro");
        }
    }

    camposDinheiroVenda.style.cssText = [
        "display:none",
        "grid-column:1 / -1",
        "grid-template-columns:repeat(2,minmax(0,1fr))",
        "gap:12px",
        "width:100%",
        "box-sizing:border-box",
        "margin-top:12px",
        "padding:14px",
        "border:1px solid #bbf7d0",
        "border-radius:9px",
        "background:#f0fdf4"
    ].join(";");

    if (!document.getElementById("estiloAvisoDinheiroVendedor")) {
        const estilo = document.createElement("style");
        estilo.id = "estiloAvisoDinheiroVendedor";
        estilo.textContent = `
            .texto-ajuda-dinheiro.invalido {
                color: #b91c1c !important;
                font-weight: 700 !important;
            }
            @media (max-width: 600px) {
                #camposDinheiroVenda { grid-template-columns: 1fr !important; }
            }
        `;
        document.head.appendChild(estilo);
    }

}

function normalizarFormaPagamento(valor) {

    const forma = String(valor || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const formasConhecidas = {
        dinheiro: "dinheiro",
        pix: "pix",
        cartao_de_debito: "cartao_debito",
        cartao_debito: "cartao_debito",
        cartao_de_credito: "cartao_credito",
        cartao_credito: "cartao_credito",
        boleto: "boleto",
        outro: "outro",
        a_prazo: "a_prazo"
    };

    return formasConhecidas[forma] || forma;

}

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

    if (!trocoVenda || !valorRecebidoVenda || !formaPagamento) return;

    const ehDinheiro = normalizarFormaPagamento(formaPagamento.value) === "dinheiro";

    if (camposDinheiroVenda) {
        camposDinheiroVenda.hidden = !ehDinheiro;
        camposDinheiroVenda.style.display = ehDinheiro ? "grid" : "none";
    }

    if (!ehDinheiro) {
        trocoVenda.textContent = formatarMoeda(0);
        if (avisoDinheiroVenda) {
            avisoDinheiroVenda.textContent = "Informe quanto o cliente entregou. O troco será calculado automaticamente.";
            avisoDinheiroVenda.classList.remove("invalido");
            avisoDinheiroVenda.style.color = "#64748b";
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
            avisoDinheiroVenda.style.color = "#64748b";
        }
        return;
    }

    if (recebidoCentavos < totalCentavos) {
        trocoVenda.textContent = formatarMoeda(0);
        if (avisoDinheiroVenda) {
            avisoDinheiroVenda.textContent = `Valor insuficiente. Faltam ${formatarMoeda((totalCentavos - recebidoCentavos) / 100)}.`;
            avisoDinheiroVenda.classList.add("invalido");
            avisoDinheiroVenda.style.color = "#b91c1c";
        }
        return;
    }

    trocoVenda.textContent = formatarMoeda((recebidoCentavos - totalCentavos) / 100);
    if (avisoDinheiroVenda) {
        avisoDinheiroVenda.textContent = "Troco calculado automaticamente.";
        avisoDinheiroVenda.classList.remove("invalido");
        avisoDinheiroVenda.style.color = "#047857";
    }

}

/* ==========================================

   ATUALIZAR RESUMO

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

    if (subtotalVenda) {
        subtotalVenda.textContent = formatarMoeda(subtotalCentavos / 100);
    }

    if (totalVenda) {
        totalVenda.textContent = formatarMoeda(total);
    }

    atualizarTrocoDinheiro();

}

// Configura os controles depois que as funções de cálculo já estão disponíveis.
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
configurarCamposDinheiroVenda();


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

    const forma = normalizarFormaPagamento(formaPagamento && formaPagamento.value);
    const vendaAPrazo = forma === "a_prazo";
    const vendaEmDinheiro = forma === "dinheiro";

    if (camposPrazoVenda) {
        camposPrazoVenda.hidden = !vendaAPrazo;
    }

    if (camposDinheiroVenda) {
        camposDinheiroVenda.hidden = !vendaEmDinheiro;
        camposDinheiroVenda.style.display = vendaEmDinheiro ? "grid" : "none";
    }

    if (!vendaEmDinheiro && valorRecebidoVenda) {
        valorRecebidoVenda.value = "";
    }

    atualizarTrocoDinheiro();

}


async function finalizarVenda() {

    mostrarMensagem(

        ""

    );

    if (

        itensVenda.length === 0

    ) {

        mostrarMensagem(

            "Adicione pelo menos um produto à venda.",

            "erro"

        );

        return;

    }

    if (

        !formaPagamento.value

    ) {

        mostrarMensagem(

            "Selecione a forma de pagamento.",

            "erro"

        );

        return;

    }

    const forma = normalizarFormaPagamento(formaPagamento.value);

    if (forma === "a_prazo") {

        const clienteFiado = clientes.find(
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

    const subtotal =

        calcularSubtotal();

    if (descontoAvistaAtivo && !formaPagamentoPermiteDescontoAvista()) {
        descontoAvistaAtivo = false;
        atualizarResumo();
        mostrarMensagem(`O desconto adicional de ${formatarPercentualDescontoAvista()} só pode ser usado com Dinheiro, Pix ou Outro e enquanto estiver habilitado nas configurações da loja.`, "erro");
        return;
    }

    const totaisDesconto = calcularTotaisComDescontos(subtotal);
    const descontoBase = totaisDesconto.descontoBaseCentavos / 100;
    const descontoAvista = totaisDesconto.descontoAvistaCentavos / 100;
    const desconto = totaisDesconto.descontoProdutosCentavos / 100;
    const descontoAvulso = totaisDesconto.descontoAvulsoCentavos / 100;
    const descontoTotalGeral = totaisDesconto.descontoTotalCentavos / 100;
    const subtotalCentavos = totaisDesconto.subtotalCentavos;
    const descontoCentavos = totaisDesconto.descontoTotalCentavos;
    const totalCentavos = totaisDesconto.totalCentavos;
    const total = totalCentavos / 100;

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

    const confirmou = window.confirm(
        `Confirma a finalização desta venda?\n\n` +
        `Subtotal: ${formatarMoeda(subtotal)}\n` +
        `Desconto máximo: ${formatarMoeda(descontoBase)}\n` +
        `Desconto adicional à vista (${formatarPercentualDescontoAvista()}): ${formatarMoeda(descontoAvista)}\n` +
        `Desconto dos produtos cadastrados: ${formatarMoeda(desconto)}\n` +
        `Desconto manual dos avulsos: ${formatarMoeda(descontoAvulso)}\n` +
        `Desconto total: ${formatarMoeda(descontoTotalGeral)}\n` +
        `Total: ${formatarMoeda(total)}\n\n` +
        `${resumoFormaPagamento}\n\n` +
        `O estoque será atualizado uma única vez.`
    );

    if (!confirmou) {

        return;

    }

    const itensParaEnviar =

        itensVenda.map(

            function (item) {

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

    // Dados usados tanto na venda normal quanto na venda a prazo.
    const clienteId = clienteVenda.value
        ? Number(clienteVenda.value)
        : null;

    const observacoes = observacoesVenda.value.trim() || null;

    btnFinalizarVenda.disabled =

        true;

    btnFinalizarVenda.textContent =

        "Finalizando...";

    try {

        let resultado;

        if (forma === "a_prazo") {

            resultado = await vendedorVendasSupabase.rpc("registrar_venda_a_prazo", {
                p_cliente_id: clienteId,
                p_desconto: desconto,
                p_observacoes: observacoes,
                p_itens: itensParaEnviar,
                p_numero_parcelas: numeroParcelasFiado,
                p_primeiro_vencimento: calcularDataPrimeiroVencimentoFiado(
                    diasPrimeiroVencimentoFiado
                )
            });

        } else {

            resultado = await vendedorVendasSupabase.rpc("finalizar_venda", {
                p_cliente_id: clienteId,
                p_desconto: desconto,
                p_forma_pagamento: forma,
                p_observacoes: observacoes,
                p_itens: itensParaEnviar
            });

        }

        if (resultado.error) {

            console.error(

                "Erro ao finalizar venda:",

                resultado.error

            );

            mostrarMensagem(

                resultado.error.message ||

                "Não foi possível finalizar a venda.",

                "erro"

            );

            return;

        }

        const resposta =

            resultado.data;

        if (

            !resposta ||

            resposta.sucesso !== true

        ) {

            mostrarMensagem(

                resposta?.mensagem ||

                "Não foi possível finalizar a venda.",

                "erro"

            );

            return;

        }

        // Disponibiliza a impressão da venda que acabou de ser registrada.

        if (

            window.SistemaLojaComprovantes &&

            typeof window.SistemaLojaComprovantes.adicionarBotao === "function"

        ) {

            window.SistemaLojaComprovantes.adicionarBotao(

                vendedorVendasSupabase,

                resposta.venda_id,

                btnFinalizarVenda,

                forma === "dinheiro"
                    ? {
                        valorRecebido: recebidoDinheiroCentavos / 100,
                        troco: trocoDinheiroCentavos / 100
                    }
                    : null

            );

        }

        if (forma === "a_prazo") {

            mostrarMensagem(
                `Venda #${resposta.venda_id} registrada. Notinha #${String(resposta.notinha_numero).padStart(6, "0")} criada; saldo a receber: ${formatarMoeda(resposta.total)}.`,
                "sucesso"
            );

        } else {

            mostrarMensagem(
                "Venda #" + resposta.venda_id + " finalizada com sucesso!",
                "sucesso"
            );

        }

        /* ======================================

           LIMPAR VENDA

        ====================================== */

        itensVenda =

            [];

        invalidarEstadoDescontoAvista();

        clienteVenda.value =

            "";

        if (

            buscaClienteVenda

        ) {

            buscaClienteVenda.value =

                "";

        }

        formaPagamento.value =

            "";

        if (parcelasFiadoVenda) parcelasFiadoVenda.value = "1";

        if (diasPrimeiroVencimentoVenda) diasPrimeiroVencimentoVenda.value = "30";

        atualizarCamposPrazoVenda();

        observacoesVenda.value =

            "";

        descontoVenda.value =

            "0";

        tipoDescontoVendaAtual = "valor";
        if (seletorTipoDescontoVenda) seletorTipoDescontoVenda.value = "valor";
        atualizarUnidadeDescontoVenda();
        if (valorRecebidoVenda) valorRecebidoVenda.value = "";

        produtoVenda.value =

            "";

        if (

            buscaProdutoVenda

        ) {

            buscaProdutoVenda.value =

                "";

        }

        quantidadeVenda.value =

            "1";

        atualizarPrecoProduto();

        renderizarItens();

        atualizarResumo();

        /* ======================================

           ATUALIZAR ESTOQUE

        ====================================== */

        await carregarProdutos();

        /* ======================================

           ATUALIZAR CLIENTES

        ====================================== */

        await carregarClientes();

    }

    catch (erro) {

        console.error(

            "Erro inesperado ao finalizar venda:",

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

            "Finalizar Venda";

    }

}

/* ==========================================

   BOTÃO SAIR

========================================== */

function configurarBotaoSair() {

    const botao =

        document.getElementById(

            "btnSair"

        );

    if (!botao) {

        return;

    }

    botao.addEventListener(

        "click",

        async function () {

            try {

                await vendedorVendasSupabase

                    .auth

                    .signOut({

                        scope: "local"

                    });

            }

            catch (erro) {

                console.error(

                    "Erro ao sair:",

                    erro

                );

            }

            sessionStorage.removeItem(

                "sistemaLojaPerfil"

            );

            window.location.href =

                "index.html";

        }

    );

}

/* ==========================================

   EVENTOS

========================================== */

produtoVenda.addEventListener(

    "change",

    atualizarPrecoProduto

);

btnAdicionarProduto.addEventListener(

    "click",

    adicionarProduto

);

document.getElementById("btnAdicionarProdutoAvulso")?.addEventListener("click", adicionarProdutoAvulso);

quantidadeVenda.addEventListener(

    "input",

    function () {

        atualizarPrecoProduto();

    }

);

descontoVenda.addEventListener("input", function () {
    invalidarEstadoDescontoAvista();
    atualizarResumo();
});

if (valorRecebidoVenda) {
    valorRecebidoVenda.addEventListener("input", atualizarTrocoDinheiro);
}

/* ==========================================

   CANCELAR VENDA EM ANDAMENTO

========================================== */

function configurarAcoesVenda() {

    const painelVenda = document.querySelector(".painel-venda");

    if (!painelVenda || !btnFinalizarVenda) return;

    let acoes = document.getElementById("acoesVendaComprovante");

    if (!acoes) {

        acoes = document.createElement("div");

        acoes.id = "acoesVendaComprovante";

        acoes.className = "acoes-venda-comprovante";

        painelVenda.appendChild(acoes);

    }

    let btnCancelarVenda = document.getElementById("btnCancelarVendaVendedor");

    if (!btnCancelarVenda) {

        btnCancelarVenda = document.createElement("button");

        btnCancelarVenda.type = "button";

        btnCancelarVenda.id = "btnCancelarVendaVendedor";

        btnCancelarVenda.className = "botao-cancelar-venda";

        btnCancelarVenda.textContent = "Cancelar";

        btnCancelarVenda.addEventListener("click", cancelarVendaEmAndamento);

    }

    // Mantém os botões no rodapé da tela, como na área do administrador.

    acoes.appendChild(btnCancelarVenda);

    acoes.appendChild(btnFinalizarVenda);

    btnCancelarVenda.style.display = "inline-flex";

}

function cancelarVendaEmAndamento() {

    const temDados =

        itensVenda.length > 0 ||

        (clienteVenda && clienteVenda.value) ||

        (formaPagamento && formaPagamento.value) ||

        (observacoesVenda && observacoesVenda.value.trim()) ||

        (descontoVenda && Number(descontoVenda.value) > 0);

    if (temDados && !window.confirm("Deseja cancelar esta venda? Os produtos e os dados preenchidos serão removidos. A venda ainda não foi registrada.")) {

        return;

    }

    itensVenda = [];

    invalidarEstadoDescontoAvista();

    if (clienteVenda) clienteVenda.value = "";

    if (buscaClienteVenda) buscaClienteVenda.value = "";

    if (formaPagamento) formaPagamento.value = "";

    if (parcelasFiadoVenda) parcelasFiadoVenda.value = "1";

    if (diasPrimeiroVencimentoVenda) diasPrimeiroVencimentoVenda.value = "30";

    atualizarCamposPrazoVenda();

    if (observacoesVenda) observacoesVenda.value = "";

    if (descontoVenda) descontoVenda.value = "0";
    tipoDescontoVendaAtual = "valor";
    if (seletorTipoDescontoVenda) seletorTipoDescontoVenda.value = "valor";
    atualizarUnidadeDescontoVenda();
    if (valorRecebidoVenda) valorRecebidoVenda.value = "";

    if (produtoVenda) produtoVenda.value = "";

    if (buscaProdutoVenda) buscaProdutoVenda.value = "";

    if (quantidadeVenda) quantidadeVenda.value = "1";

    atualizarPrecoProduto();

    renderizarItens();

    atualizarResumo();

    mostrarMensagem("Venda cancelada. Nenhuma venda foi registrada.", "info");

}

configurarAcoesVenda();

if (formaPagamento) {

    formaPagamento.addEventListener("change", tratarMudancaFormaPagamentoDescontoAvista);

    atualizarCamposPrazoVenda();

}

btnFinalizarVenda.addEventListener(

    "click",

    finalizarVenda

);

/* ==========================================

   INICIALIZAÇÃO

========================================== */

async function iniciarVendasVendedor() {

    mostrarDataAtual();

    const autorizado =

        await protegerVendedor();

    if (!autorizado) {

        return;

    }

    await carregarConfiguracoesDescontosVenda();

    await carregarProdutos();

    await carregarClientes();

    renderizarItens();

    atualizarResumo();

    configurarBotaoSair();

}

document.addEventListener(

    "DOMContentLoaded",

    iniciarVendasVendedor

);
