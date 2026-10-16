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

                    "id, nome_completo, usuario, tipo, ativo"

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

                "id, nome, sku, preco_venda, estoque, estoque_minimo, ativo"

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

                    const estoque =

                        Number(

                            item.estoque

                        );

                    const podeDiminuir =

                        Number(

                            item.quantidade

                        ) > 1;

                    const podeAumentar =

                        Number(

                            item.quantidade

                        ) < estoque;

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

                                        max="${estoque}"

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

                                    Estoque: ${estoque}

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

                                    ${formatarMoeda(

                                        subtotal

                                    )}

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

        quantidade >

        estoque

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

function calcularValorDesconto(subtotal = calcularSubtotal(), tipo = tipoDescontoVendaAtual) {

    const subtotalCentavos = Math.max(0, Math.round((Number(subtotal) || 0) * 100));
    const valorInformado = Number(descontoVenda && descontoVenda.value);
    const valor = Number.isFinite(valorInformado) ? valorInformado : 0;

    if (tipo === "porcentagem") {
        const percentual = Math.max(0, Math.min(100, valor));
        return Math.round(subtotalCentavos * percentual / 100) / 100;
    }

    const descontoCentavos = Math.max(
        0,
        Math.min(subtotalCentavos, Math.round(valor * 100))
    );

    return descontoCentavos / 100;

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

        const subtotal = calcularSubtotal();
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

    const subtotalCentavos = Math.max(0, Math.round(calcularSubtotal() * 100));
    const descontoCentavos = Math.max(0, Math.min(
        subtotalCentavos,
        Math.round(calcularValorDesconto() * 100)
    ));

    return Math.max(0, subtotalCentavos - descontoCentavos);

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

    const subtotal = Math.max(0, calcularSubtotal());
    let valorInformado = Number(descontoVenda.value);

    if (!Number.isFinite(valorInformado) || valorInformado < 0) {
        valorInformado = 0;
        descontoVenda.value = "0";
    }

    if (tipoDescontoVendaAtual === "porcentagem" && valorInformado > 100) {
        valorInformado = 100;
        descontoVenda.value = "100";
    } else if (tipoDescontoVendaAtual === "valor" && valorInformado > subtotal) {
        valorInformado = subtotal;
        descontoVenda.value = subtotal.toFixed(2);
    }

    const desconto = calcularValorDesconto(subtotal);
    const subtotalCentavos = Math.max(0, Math.round(subtotal * 100));
    const descontoCentavos = Math.max(0, Math.min(
        subtotalCentavos,
        Math.round(desconto * 100)
    ));
    const total = Math.max(0, subtotalCentavos - descontoCentavos) / 100;

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

    const desconto = calcularValorDesconto(subtotal);
    const subtotalCentavos = Math.max(0, Math.round(subtotal * 100));
    const descontoCentavos = Math.max(0, Math.min(
        subtotalCentavos,
        Math.round(desconto * 100)
    ));
    const totalCentavos = Math.max(0, subtotalCentavos - descontoCentavos);
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
        `Desconto: ${formatarMoeda(desconto)}\n` +
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

                return {

                    produto_id:

                        item.produto_id,

                    quantidade:

                        Number(

                            item.quantidade

                        )

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

quantidadeVenda.addEventListener(

    "input",

    function () {

        atualizarPrecoProduto();

    }

);

descontoVenda.addEventListener(

    "input",

    atualizarResumo

);

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

    formaPagamento.addEventListener("change", atualizarCamposPrazoVenda);

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
