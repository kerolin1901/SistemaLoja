/* ==========================================
   SISTEMA DA LOJA
   VENDAS DO VENDEDOR
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
    document.getElementById("produtoVenda");

const quantidadeVenda =
    document.getElementById("quantidadeVenda");

const precoProdutoSelecionado =
    document.getElementById("precoProdutoSelecionado");

const btnAdicionarProduto =
    document.getElementById("btnAdicionarProduto");

const listaItensVenda =
    document.getElementById("listaItensVenda");

const clienteVenda =
    document.getElementById("clienteVenda");

const formaPagamento =
    document.getElementById("formaPagamento");

const observacoesVenda =
    document.getElementById("observacoesVenda");

const subtotalVenda =
    document.getElementById("subtotalVenda");

const descontoVenda =
    document.getElementById("descontoVenda");

const totalVenda =
    document.getElementById("totalVenda");

const btnFinalizarVenda =
    document.getElementById("btnFinalizarVenda");

const mensagemVenda =
    document.getElementById("mensagemVenda");

const nomeVendedor =
    document.getElementById("nomeVendedor");

const avatarVendedor =
    document.getElementById("avatarVendedor");

const dataAtual =
    document.getElementById("dataAtual");


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
        document.createElement("div");

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
   BUSCA DE PRODUTOS
========================================== */

function criarBuscaProduto() {

    if (
        !produtoVenda ||
        buscaProdutoVenda
    ) {

        return;

    }


    buscaProdutoVenda =
        document.createElement("input");


    buscaProdutoVenda.type =
        "text";


    buscaProdutoVenda.id =
        "buscaProdutoVenda";


    buscaProdutoVenda.placeholder =
        "🔎 Digite o nome ou SKU do produto";


    buscaProdutoVenda.autocomplete =
        "off";


    buscaProdutoVenda.style.width =
        "100%";


    buscaProdutoVenda.style.boxSizing =
        "border-box";


    buscaProdutoVenda.style.marginBottom =
        "8px";


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

    if (
        !buscaProdutoVenda ||
        !produtoVenda
    ) {

        return;

    }


    const busca =
        buscaProdutoVenda.value
            .trim()
            .toLowerCase();


    const produtoSelecionadoAntes =
        produtoVenda.value;


    const produtosFiltrados =
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


                if (!busca) {
                    return true;
                }


                return (
                    nome.includes(busca) ||
                    sku.includes(busca)
                );

            }
        );


    produtoVenda.innerHTML = "";


    const opcaoInicial =
        document.createElement("option");


    opcaoInicial.value =
        "";


    opcaoInicial.textContent =
        "Selecione um produto";


    produtoVenda.appendChild(
        opcaoInicial
    );


    produtosFiltrados.forEach(
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


    if (!busca) {

        produtoVenda.value =
            "";

        atualizarPrecoProduto();

        return;

    }


    if (
        produtosFiltrados.length === 0
    ) {

        produtoVenda.innerHTML = `
            <option value="">
                Nenhum produto encontrado
            </option>
        `;

        atualizarPrecoProduto();

        return;

    }


    if (
        produtosFiltrados.length === 1
    ) {

        produtoVenda.value =
            String(
                produtosFiltrados[0].id
            );

        atualizarPrecoProduto();

        return;

    }


    if (
        produtosFiltrados.some(
            function (produto) {

                return (
                    String(produto.id) ===
                    String(produtoSelecionadoAntes)
                );

            }
        )
    ) {

        produtoVenda.value =
            produtoSelecionadoAntes;

    }


    atualizarPrecoProduto();

}


/* ==========================================
   CARREGAR PRODUTOS
========================================== */

async function carregarProdutos() {

    const resultado =
        await vendedorVendasSupabase
            .from("produtos_para_venda")
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

    filtrarProdutos();

}


/* ==========================================
   BUSCA DE CLIENTES
========================================== */

function criarBuscaCliente() {

    if (
        !clienteVenda ||
        buscaClienteVenda
    ) {

        return;

    }


    buscaClienteVenda =
        document.createElement("input");


    buscaClienteVenda.type =
        "text";


    buscaClienteVenda.id =
        "buscaClienteVenda";


    buscaClienteVenda.placeholder =
        "🔎 Digite o nome ou telefone do cliente";


    buscaClienteVenda.autocomplete =
        "off";


    buscaClienteVenda.style.width =
        "100%";


    buscaClienteVenda.style.boxSizing =
        "border-box";


    buscaClienteVenda.style.marginBottom =
        "8px";


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

    if (
        !buscaClienteVenda ||
        !clienteVenda
    ) {

        return;

    }


    const busca =
        buscaClienteVenda.value
            .trim()
            .toLowerCase();


    const clienteSelecionadoAntes =
        clienteVenda.value;


    /* ======================================
       SEM BUSCA
    ====================================== */

    if (!busca) {

        preencherListaClientes(
            clientes
        );

        clienteVenda.value =
            "";

        return;

    }


    /* ======================================
       FILTRAR
    ====================================== */

    const clientesFiltrados =
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
                    nome.includes(busca) ||
                    telefone.includes(busca)
                );

            }
        );


    /* ======================================
       NENHUM CLIENTE
    ====================================== */

    if (
        clientesFiltrados.length === 0
    ) {

        clienteVenda.innerHTML = `
            <option value="">
                Nenhum cliente encontrado
            </option>
        `;

        return;

    }


    /* ======================================
       UM CLIENTE
    ====================================== */

    preencherListaClientes(
        clientesFiltrados
    );


    if (
        clientesFiltrados.length === 1
    ) {

        clienteVenda.value =
            String(
                clientesFiltrados[0].id
            );

        return;

    }


    /* ======================================
       MAIS DE UM CLIENTE
    ====================================== */

    if (
        clientesFiltrados.some(
            function (cliente) {

                return (
                    String(cliente.id) ===
                    String(clienteSelecionadoAntes)
                );

            }
        )
    ) {

        clienteVenda.value =
            clienteSelecionadoAntes;

    }

}


/* ==========================================
   PREENCHER LISTA DE CLIENTES
========================================== */

function preencherListaClientes(
    lista
) {

    clienteVenda.innerHTML = `
        <option value="">
            Consumidor não identificado
        </option>
    `;


    lista.forEach(
        function (cliente) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                cliente.id;


            let texto =
                cliente.nome;


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
            .from("clientes_para_venda")
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
   ENCONTRAR PRODUTO
========================================== */

function encontrarProduto(
    produtoId
) {

    return produtos.find(
        function (produto) {

            return (
                String(produto.id) ===
                String(produtoId)
            );

        }
    );

}


/* ==========================================
   QUANTIDADE NO CARRINHO
========================================== */

function obterQuantidadeNoCarrinho(
    produtoId
) {

    const item =
        itensVenda.find(
            function (item) {

                return (
                    String(item.produto_id) ===
                    String(produtoId)
                );

            }
        );


    if (!item) {
        return 0;
    }


    return Number(
        item.quantidade
    ) || 0;

}


/* ==========================================
   ATUALIZAR PREÇO
========================================== */

function atualizarPrecoProduto() {

    const produtoId =
        produtoVenda.value;


    const produto =
        encontrarProduto(
            produtoId
        );


    if (!produto) {

        precoProdutoSelecionado.textContent =
            "R$ 0,00";

        quantidadeVenda.max =
            "";

        quantidadeVenda.min =
            "1";

        quantidadeVenda.value =
            "1";

        return;

    }


    const estoque =
        Math.floor(
            Number(
                produto.estoque
            ) || 0
        );


    const quantidadeCarrinho =
        obterQuantidadeNoCarrinho(
            produto.id
        );


    const estoqueRestante =
        Math.max(
            0,
            estoque -
            quantidadeCarrinho
        );


    precoProdutoSelecionado.textContent =
        formatarMoeda(
            produto.preco_venda
        );


    quantidadeVenda.max =
        estoqueRestante;


    let quantidadeAtual =
        Number(
            quantidadeVenda.value
        ) || 1;


    if (
        estoqueRestante <= 0
    ) {

        quantidadeVenda.value =
            "0";

        quantidadeVenda.min =
            "0";

        return;

    }


    quantidadeVenda.min =
        "1";


    if (
        quantidadeAtual >
        estoqueRestante
    ) {

        quantidadeAtual =
            estoqueRestante;

    }


    if (
        quantidadeAtual < 1
    ) {

        quantidadeAtual =
            1;

    }


    quantidadeVenda.value =
        quantidadeAtual;

}


/* ==========================================
   ADICIONAR PRODUTO
========================================== */

function adicionarProduto() {

    mostrarMensagem("");


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
        encontrarProduto(
            produtoId
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
        Math.floor(
            Number(
                produto.estoque
            ) || 0
        );


    const quantidadeAtualCarrinho =
        obterQuantidadeNoCarrinho(
            produto.id
        );


    const quantidadeFinal =
        quantidadeAtualCarrinho +
        quantidade;


    if (
        quantidadeFinal >
        estoque
    ) {

        mostrarMensagem(
            "Quantidade maior que o estoque disponível.",
            "erro"
        );

        return;

    }


    const itemExistente =
        itensVenda.find(
            function (item) {

                return (
                    String(item.produto_id) ===
                    String(produto.id)
                );

            }
        );


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

            quantidade:
                quantidade,

            preco_unitario:
                Number(
                    produto.preco_venda
                ),

            estoque:
                estoque

        });

    }


    quantidadeVenda.value =
        "1";


    produtoVenda.value =
        "";


    if (buscaProdutoVenda) {

        buscaProdutoVenda.value =
            "";

    }


    filtrarProdutos();

    renderizarItens();

    atualizarResumo();


    mostrarMensagem(
        "Produto adicionado à venda.",
        "sucesso"
    );

}


/* ==========================================
   RENDERIZAR ITENS
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
                function (item, indice) {

                    const subtotal =
                        item.quantidade *
                        item.preco_unitario;


                    const estoque =
                        Math.floor(
                            Number(
                                item.estoque
                            ) || 0
                        );


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
                                    style="
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        gap:6px;
                                    "
                                >

                                    <button
                                        type="button"
                                        class="botao-quantidade-item"
                                        data-acao="diminuir"
                                        data-indice="${indice}"
                                        ${
                                            item.quantidade <= 1
                                                ? "disabled"
                                                : ""
                                        }
                                    >
                                        −
                                    </button>


                                    <input
                                        type="number"
                                        class="input-quantidade-item"
                                        data-indice="${indice}"
                                        value="${item.quantidade}"
                                        min="1"
                                        max="${estoque}"
                                        step="1"
                                        style="
                                            width:60px;
                                            text-align:center;
                                        "
                                    >


                                    <button
                                        type="button"
                                        class="botao-quantidade-item"
                                        data-acao="aumentar"
                                        data-indice="${indice}"
                                        ${
                                            item.quantidade >= estoque
                                                ? "disabled"
                                                : ""
                                        }
                                    >
                                        +
                                    </button>

                                </div>


                                <small
                                    style="
                                        display:block;
                                        text-align:center;
                                        margin-top:4px;
                                        opacity:.7;
                                    "
                                >
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


    configurarBotoesQuantidade();

    configurarBotoesRemover();

}


/* ==========================================
   BOTÕES DE QUANTIDADE
========================================== */

function configurarBotoesQuantidade() {

    document
        .querySelectorAll(
            ".botao-quantidade-item"
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


                        const acao =
                            botao.dataset.acao;


                        const item =
                            itensVenda[
                                indice
                            ];


                        if (!item) {
                            return;
                        }


                        const estoque =
                            Math.floor(
                                Number(
                                    item.estoque
                                ) || 0
                            );


                        if (
                            acao ===
                            "aumentar"
                        ) {

                            if (
                                item.quantidade <
                                estoque
                            ) {

                                item.quantidade++;

                            }

                        }


                        if (
                            acao ===
                            "diminuir"
                        ) {

                            if (
                                item.quantidade >
                                1
                            ) {

                                item.quantidade--;

                            }

                        }


                        renderizarItens();

                        atualizarResumo();

                        atualizarPrecoProduto();

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".input-quantidade-item"
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


                        const item =
                            itensVenda[
                                indice
                            ];


                        if (!item) {
                            return;
                        }


                        const estoque =
                            Math.floor(
                                Number(
                                    item.estoque
                                ) || 0
                            );


                        let quantidade =
                            Number(
                                campo.value
                            );


                        if (
                            !Number.isInteger(
                                quantidade
                            ) ||
                            quantidade < 1
                        ) {

                            quantidade =
                                1;

                        }


                        if (
                            quantidade >
                            estoque
                        ) {

                            quantidade =
                                estoque;

                        }


                        item.quantidade =
                            quantidade;


                        renderizarItens();

                        atualizarResumo();

                        atualizarPrecoProduto();

                    }
                );

            }
        );

}


/* ==========================================
   REMOVER ITEM
========================================== */

function configurarBotoesRemover() {

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

                        atualizarPrecoProduto();

                    }
                );

            }
        );

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
                    item.quantidade *
                    item.preco_unitario
                )
            );

        },
        0
    );

}


/* ==========================================
   ATUALIZAR RESUMO
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

        desconto = 0;

        descontoVenda.value =
            0;

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


    subtotalVenda.textContent =
        formatarMoeda(
            subtotal
        );


    totalVenda.textContent =
        formatarMoeda(
            total
        );

}


/* ==========================================
   FINALIZAR VENDA
========================================== */

async function finalizarVenda() {

    mostrarMensagem("");


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


    const subtotal =
        calcularSubtotal();


    const desconto =
        Number(
            descontoVenda.value
        ) || 0;


    if (
        desconto < 0 ||
        desconto > subtotal
    ) {

        mostrarMensagem(
            "O desconto informado é inválido.",
            "erro"
        );

        return;

    }


    const itensRPC =
        itensVenda.map(
            function (item) {

                return {

                    produto_id:
                        item.produto_id,

                    quantidade:
                        item.quantidade

                };

            }
        );


    btnFinalizarVenda.disabled =
        true;


    btnFinalizarVenda.textContent =
        "Finalizando...";


    const resultado =
        await vendedorVendasSupabase
            .rpc(
                "finalizar_venda",
                {

                    p_cliente_id:
                        clienteVenda.value
                            ? Number(
                                clienteVenda.value
                            )
                            : null,

                    p_desconto:
                        desconto,

                    p_forma_pagamento:
                        formaPagamento.value,

                    p_observacoes:
                        observacoesVenda.value
                            .trim() ||
                        null,

                    p_itens:
                        itensRPC

                }
            );


    btnFinalizarVenda.disabled =
        false;


    btnFinalizarVenda.textContent =
        "Finalizar Venda";


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


    mostrarMensagem(
        "Venda #" +
        resposta.venda_id +
        " finalizada com sucesso!",
        "sucesso"
    );


    itensVenda = [];


    clienteVenda.value =
        "";


    formaPagamento.value =
        "";


    observacoesVenda.value =
        "";


    descontoVenda.value =
        "0";


    produtoVenda.value =
        "";


    quantidadeVenda.value =
        "1";


    if (buscaProdutoVenda) {

        buscaProdutoVenda.value =
            "";

    }


    if (buscaClienteVenda) {

        buscaClienteVenda.value =
            "";

    }


    renderizarItens();

    atualizarResumo();


    await carregarProdutos();

    await carregarClientes();

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


descontoVenda.addEventListener(
    "input",
    atualizarResumo
);


btnFinalizarVenda.addEventListener(
    "click",
    finalizarVenda
);


/* ==========================================
   INICIALIZAÇÃO
========================================== */

async function iniciarVendedorVendas() {

    mostrarDataAtual();


    configurarBotaoSair();


    const autorizado =
        await protegerVendedor();


    if (!autorizado) {
        return;
    }


    await carregarProdutos();

    await carregarClientes();


    renderizarItens();

    atualizarResumo();

}


/* ==========================================
   INICIAR
========================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarVendedorVendas
    );

}

else {

    iniciarVendedorVendas();

}