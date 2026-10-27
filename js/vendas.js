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

function criarBuscaProduto() {

    if (

        buscaProdutoVenda

    ) {

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

    const texto =

        (

            buscaProdutoVenda.value ||

            ""

        )

            .trim()

            .toLowerCase();

    if (!texto) {

        preencherListaProdutos(

            produtosVenda

        );

        atualizarPrecoProduto();

        return;

    }

    const encontrados =

        produtosVenda.filter(

            function (produto) {

                const nome =

                    String(

                        produto.nome ||

                        ""

                    ).toLowerCase();

                const sku =

                    String(

                        produto.sku ||

                        ""

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

            String(

                encontrados[0].id

            );

        atualizarPrecoProduto();

        return;

    }

    produtoVenda.value =

        "";

    atualizarPrecoProduto();

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

    produtoVenda.value =

        "";

    quantidadeVenda.value =

        1;

    precoVenda.value =

        "R$ 0,00";

    if (

        buscaProdutoVenda

    ) {

        buscaProdutoVenda.value =

            "";

    }

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

        quantidade > estoque

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

function calcularLimiteDescontoSeguro(subtotal = calcularSubtotal()) {
    const itens = carrinho;
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
    if (!info) return;

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

    if (botao) botao.disabled = !limite.temItens;
}

function calcularValorDesconto(subtotal = calcularSubtotal(), tipo = tipoDescontoVendaAtual) {
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

        const subtotal = calcularSubtotal();
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

        tipoDescontoVendaAtual = novoTipo;
        atualizarUnidadeDescontoVenda();
        atualizarResumo();

    });

}

configurarControleTipoDesconto();
const botaoAplicarDescontoMaximo = document.getElementById("btnAplicarDescontoMaximo");
if (botaoAplicarDescontoMaximo) {
    botaoAplicarDescontoMaximo.addEventListener("click", () => {
        const limite = calcularLimiteDescontoSeguro();
        descontoVenda.value = (
            tipoDescontoVendaAtual === "porcentagem"
                ? limite.percentualMaximo
                : limite.valorMaximoCentavos / 100
        ).toFixed(2);
        atualizarResumo();
    });
}
atualizarInfoDescontoMaximo();

/* ==========================================

   RESUMO

========================================== */

function atualizarResumo() {

    const subtotal = Math.max(0, calcularSubtotal());
    let valorInformado = Number(descontoVenda.value);

    if (!Number.isFinite(valorInformado) || valorInformado < 0) {
        valorInformado = 0;
        descontoVenda.value = "0";
    }

        const limiteDesconto = calcularLimiteDescontoSeguro(subtotal);
    const limiteEntrada = tipoDescontoVendaAtual === "porcentagem"
        ? limiteDesconto.percentualMaximo
        : limiteDesconto.valorMaximoCentavos / 100;

    if (valorInformado > limiteEntrada) {
        valorInformado = limiteEntrada;
        descontoVenda.value = valorInformado.toFixed(2);
    }

    const desconto = calcularValorDesconto(subtotal);
    const subtotalCentavos = Math.max(0, Math.round(subtotal * 100));
    const descontoCentavos = Math.max(0, Math.min(
        subtotalCentavos,
        Math.round(desconto * 100)
    ));
    const total = Math.max(0, subtotalCentavos - descontoCentavos) / 100;

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
    const subtotalCentavos = Math.max(0, Math.round(calcularSubtotal() * 100));
    const descontoCentavos = Math.max(0, Math.min(
        subtotalCentavos,
        Math.round(calcularValorDesconto() * 100)
    ));
    return Math.max(0, subtotalCentavos - descontoCentavos);
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

                    <small class="estoque-item">

                        Estoque: ${estoque}

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

    const subtotal = calcularSubtotal();
    const desconto = calcularValorDesconto(subtotal);
    const subtotalCentavos = Math.max(0, Math.round(subtotal * 100));
    const descontoCentavos = Math.max(0, Math.min(
        subtotalCentavos,
        Math.round(desconto * 100)
    ));
    const total = Math.max(0, subtotalCentavos - descontoCentavos) / 100;



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
        `Desconto: ${formatarMoeda(desconto)}\n` +
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

                return {

                    produto_id:

                        Number(

                            item.produto_id

                        ),

                    quantidade:

                        Number(

                            item.quantidade

                        )

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

descontoVenda.addEventListener(

    "input",

    atualizarResumo

);

btnCancelarVenda.addEventListener(

    "click",

    cancelarVenda

);

if (valorRecebidoVenda) {
    valorRecebidoVenda.addEventListener("input", atualizarTrocoDinheiro);
}

if (formaPagamento) {

    formaPagamento.addEventListener("change", atualizarCamposPrazoVenda);

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