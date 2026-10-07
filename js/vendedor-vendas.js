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
            "O desconto não pode ser maior que o subtotal.",
            "erro"
        );

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


    btnFinalizarVenda.disabled =
        true;


    btnFinalizarVenda.textContent =
        "Finalizando...";


    try {

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
                            itensParaEnviar
                    }
                );


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


        observacoesVenda.value =
            "";


        descontoVenda.value =
            "0";


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