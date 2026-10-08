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

const valorTotal =
    document.getElementById(
        "valorTotal"
    );

const formaPagamento =
    document.getElementById(
        "formaPagamento"
    );

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
        function (
            total,
            item
        ) {

            return (
                total +
                (
                    Number(
                        item.preco_unitario
                    ) *
                    Number(
                        item.quantidade
                    )
                )
            );

        },
        0
    );

}


/* ==========================================
   RESUMO
========================================== */

function atualizarResumo() {

    const subtotal =
        calcularSubtotal();


    let desconto =
        Number(
            descontoVenda.value
        ) || 0;


    if (
        desconto < 0
    ) {

        desconto =
            0;

        descontoVenda.value =
            "0";

    }


    if (
        desconto > subtotal
    ) {

        desconto =
            subtotal;

        descontoVenda.value =
            subtotal.toFixed(2);

    }


    const total =
        subtotal -
        desconto;


    if (
        valorSubtotal
    ) {

        valorSubtotal.textContent =
            formatarMoeda(
                subtotal
            );

    }


    if (
        valorTotal
    ) {

        valorTotal.textContent =
            formatarMoeda(
                total
            );

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


    let desconto =
        Number(
            descontoVenda.value
        ) || 0;


    const subtotal =
        calcularSubtotal();


    if (
        desconto < 0
    ) {

        desconto =
            0;

    }


    if (
        desconto > subtotal
    ) {

        desconto =
            subtotal;

    }


    const total =
        subtotal -
        desconto;


    const confirmou =
        confirm(
            `Confirmar venda?

Subtotal: ${formatarMoeda(subtotal)}
Desconto: ${formatarMoeda(desconto)}
Total: ${formatarMoeda(total)}`
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

        const {
            data,
            error
        } =
            await vendasSupabase.rpc(
                "finalizar_venda",
                {
                    p_cliente_id:
                        clienteId,

                    p_desconto:
                        desconto,

                    p_forma_pagamento:
                        forma,

                    p_observacoes:
                        observacoes,

                    p_itens:
                        itens
                }
            );


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


        alert(
            `Venda finalizada com sucesso!

Número da venda: #${data.venda_id}
Total: ${formatarMoeda(data.total)}
Pagamento: ${formaPagamento.options[formaPagamento.selectedIndex].text}`
        );


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