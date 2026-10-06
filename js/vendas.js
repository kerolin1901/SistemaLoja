/* ==========================================
   SISTEMA DA LOJA
   VENDAS
========================================== */


/* ==========================================
   PROTEÇÃO
========================================== */

async function protegerPaginaVendas() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();


    if (error || !session) {

        window.location.href = "index.html";

        return false;
    }


    const {
        data: perfil,
        error: erroPerfil
    } = await supabaseClient
        .from("perfis")
        .select("*")
        .eq("id", session.user.id)
        .single();


    if (erroPerfil || !perfil) {

        alert(
            "Não foi possível carregar o perfil do usuário."
        );

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

        return false;
    }


    if (!perfil.ativo) {

        alert("Seu usuário está inativo.");

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

        return false;
    }


    if (
        perfil.tipo !== "admin" &&
        perfil.tipo !== "vendedor"
    ) {

        alert(
            "Você não possui permissão para acessar vendas."
        );

        window.location.href = "index.html";

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


    if (nomeAdministrador) {

        nomeAdministrador.textContent =
            perfil.nome_completo ||
            perfil.usuario ||
            "Usuário";
    }


    if (avatarAdministrador) {

        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "U";

        avatarAdministrador.textContent =
            nome.charAt(0).toUpperCase();
    }


    sessionStorage.setItem(
        "sistemaLojaPerfil",
        JSON.stringify(perfil)
    );


    return true;
}


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


/*
   ATENÇÃO:
   O HTML usa "precoVenda".
*/

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


/* ==========================================
   ESTADO
========================================== */

let produtosVenda = [];

let carrinho = [];


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
        "mensagem-venda " +
        "mensagem-" +
        tipo;


    mensagemVenda.style.display =
        "block";


    setTimeout(() => {

        mensagemVenda.style.display =
            "none";

    }, 4000);
}


/* ==========================================
   CARREGAR CLIENTES
========================================== */

async function carregarClientesVenda() {

    const {
        data,
        error
    } = await vendasSupabase
        .from("clientes")
        .select(`
            id,
            nome
        `)
        .eq("ativo", true)
        .order("nome", {
            ascending: true
        });


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


    clienteVenda.innerHTML =
        `
        <option value="">
            Consumidor não identificado
        </option>
        `;


    if (!data) {
        return;
    }


    data.forEach(cliente => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            cliente.id;


        option.textContent =
            cliente.nome;


        clienteVenda.appendChild(
            option
        );

    });
}


/* ==========================================
   CARREGAR PRODUTOS
========================================== */

async function carregarProdutosVenda() {

    const {
        data,
        error
    } = await vendasSupabase
        .from("produtos_para_venda")
        .select(`
            id,
            nome,
            sku,
            preco_venda,
            estoque,
            estoque_minimo,
            ativo
        `)
        .eq("ativo", true)
        .order("nome", {
            ascending: true
        });


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


    produtoVenda.innerHTML =
        `
        <option value="">
            Selecione um produto
        </option>
        `;


    produtosVenda.forEach(produto => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            produto.id;


        option.textContent =
            `${produto.nome} — ${formatarMoeda(produto.preco_venda)} — Estoque: ${produto.estoque}`;


        produtoVenda.appendChild(
            option
        );

    });


    /*
       Se existir somente um produto,
       ainda assim o usuário deverá
       selecioná-lo normalmente.
    */
}


/* ==========================================
   PRODUTO SELECIONADO
========================================== */

function atualizarPrecoProduto() {

    const produtoId =
        Number(
            produtoVenda.value
        );


    const produto =
        produtosVenda.find(
            item =>
                Number(item.id) ===
                produtoId
        );


    if (!produto) {

        precoVenda.value =
            "R$ 0,00";

        return;
    }


    /*
       PUXA O PREÇO DE VENDA
       DIRETAMENTE DO PRODUTO
    */

    const preco =
        Number(
            produto.preco_venda
        ) || 0;


    precoVenda.value =
        formatarMoeda(preco);


    quantidadeVenda.max =
        produto.estoque;


    quantidadeVenda.value =
        1;
}


/* ==========================================
   ADICIONAR PRODUTO AO CARRINHO
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

        alert(
            "Selecione um produto."
        );

        return;
    }


    if (
        !Number.isFinite(quantidade) ||
        quantidade <= 0
    ) {

        alert(
            "Informe uma quantidade válida."
        );

        return;
    }


    const produto =
        produtosVenda.find(
            item =>
                Number(item.id) ===
                produtoId
        );


    if (!produto) {

        alert(
            "Produto não encontrado."
        );

        return;
    }


    const estoque =
        Number(
            produto.estoque
        ) || 0;


    const itemExistente =
        carrinho.find(
            item =>
                Number(item.produto_id) ===
                produtoId
        );


    const quantidadeFinal =
        itemExistente
            ? Number(itemExistente.quantidade) + quantidade
            : quantidade;


    if (
        quantidadeFinal >
        estoque
    ) {

        alert(
            `Estoque insuficiente para "${produto.nome}".\n\nEstoque disponível: ${estoque}`
        );

        return;
    }


    if (itemExistente) {

        itemExistente.quantidade =
            quantidadeFinal;

    } else {

        carrinho.push({

            produto_id:
                produto.id,

            nome:
                produto.nome,

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
}


/* ==========================================
   REMOVER PRODUTO
========================================== */

function removerProdutoCarrinho(
    produtoId
) {

    carrinho =
        carrinho.filter(
            item =>
                Number(item.produto_id) !==
                Number(produtoId)
        );


    renderizarCarrinho();
}


/* ==========================================
   ALTERAR QUANTIDADE
========================================== */

function alterarQuantidadeCarrinho(
    produtoId,
    novaQuantidade
) {

    const item =
        carrinho.find(
            produto =>
                Number(produto.produto_id) ===
                Number(produtoId)
        );


    if (!item) {
        return;
    }


    const quantidade =
        Number(
            novaQuantidade
        );


    if (
        !Number.isFinite(quantidade) ||
        quantidade <= 0
    ) {

        removerProdutoCarrinho(
            produtoId
        );

        return;
    }


    if (
        quantidade >
        Number(item.estoque)
    ) {

        alert(
            `Estoque insuficiente para "${item.nome}".\n\nEstoque disponível: ${item.estoque}`
        );

        renderizarCarrinho();

        return;
    }


    item.quantidade =
        quantidade;


    renderizarCarrinho();
}


/* ==========================================
   CALCULAR SUBTOTAL
========================================== */

function calcularSubtotal() {

    return carrinho.reduce(
        (
            total,
            item
        ) => {

            return total +
                (
                    Number(
                        item.preco_unitario
                    ) *
                    Number(
                        item.quantidade
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
        );


    if (
        !Number.isFinite(desconto) ||
        desconto < 0
    ) {

        desconto = 0;
    }


    if (
        desconto > subtotal
    ) {

        desconto =
            subtotal;
    }


    const total =
        subtotal - desconto;


    valorSubtotal.textContent =
        formatarMoeda(
            subtotal
        );


    valorTotal.textContent =
        formatarMoeda(
            total
        );
}


/* ==========================================
   ATUALIZAR QUANTIDADE DE ITENS
========================================== */

function atualizarQuantidadeItens() {

    const quantidade =
        carrinho.reduce(
            (
                total,
                item
            ) => {

                return total +
                    Number(
                        item.quantidade
                    );

            },
            0
        );


    if (!quantidadeItensCarrinho) {
        return;
    }


    quantidadeItensCarrinho.textContent =
        quantidade === 1
            ? "1 item"
            : `${quantidade} itens`;
}


/* ==========================================
   RENDERIZAR CARRINHO
========================================== */

function renderizarCarrinho() {

    listaCarrinho.innerHTML =
        "";


    atualizarQuantidadeItens();


    if (carrinho.length === 0) {

        carrinhoVazio.style.display =
            "block";

        atualizarResumo();

        return;
    }


    carrinhoVazio.style.display =
        "none";


    carrinho.forEach(item => {

        const linha =
            document.createElement(
                "div"
            );


        linha.className =
            "item-carrinho";


        const subtotalItem =
            Number(
                item.preco_unitario
            ) *
            Number(
                item.quantidade
            );


        linha.innerHTML = `

            <div class="item-carrinho-produto">

                <strong>
                    ${item.nome}
                </strong>

                <span>
                    ${formatarMoeda(item.preco_unitario)}
                    cada
                </span>

            </div>


            <div class="item-carrinho-quantidade">

                <label>
                    Quantidade
                </label>

                <input
                    type="number"
                    min="1"
                    step="1"
                    value="${item.quantidade}"
                    data-quantidade="${item.produto_id}"
                >

            </div>


            <div class="item-carrinho-subtotal">

                <span>
                    Subtotal
                </span>

                <strong>
                    ${formatarMoeda(subtotalItem)}
                </strong>

            </div>


            <button
                type="button"
                class="botao-remover-item"
                data-remover="${item.produto_id}"
            >
                Remover
            </button>

        `;


        listaCarrinho.appendChild(
            linha
        );

    });


    listaCarrinho
        .querySelectorAll(
            "[data-remover]"
        )
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => {

                    removerProdutoCarrinho(
                        botao.dataset.remover
                    );

                }
            );

        });


    listaCarrinho
        .querySelectorAll(
            "[data-quantidade]"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    alterarQuantidadeCarrinho(
                        input.dataset.quantidade,
                        input.value
                    );

                }
            );

        });


    atualizarResumo();
}


/* ==========================================
   FINALIZAR VENDA
========================================== */

async function finalizarVenda() {

    if (carrinho.length === 0) {

        alert(
            "Adicione pelo menos um produto à venda."
        );

        return;
    }


    const forma =
        formaPagamento.value.trim();


    if (!forma) {

        alert(
            "Selecione a forma de pagamento."
        );

        formaPagamento.focus();

        return;
    }


    let desconto =
        Number(
            descontoVenda.value
        );


    if (
        !Number.isFinite(desconto) ||
        desconto < 0
    ) {

        desconto = 0;
    }


    const subtotal =
        calcularSubtotal();


    if (desconto > subtotal) {

        desconto =
            subtotal;
    }


    const total =
        subtotal - desconto;


    const confirmou =
        confirm(
            `Confirmar venda?\n\nSubtotal: ${formatarMoeda(subtotal)}\nDesconto: ${formatarMoeda(desconto)}\nTotal: ${formatarMoeda(total)}`
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
            item => ({

                produto_id:
                    Number(
                        item.produto_id
                    ),

                quantidade:
                    Number(
                        item.quantidade
                    )

            })
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
        } = await vendasSupabase.rpc(
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


            alert(
                "Não foi possível finalizar a venda.\n\n" +
                error.message
            );


            return;
        }


        console.log(
            "Venda finalizada:",
            data
        );


        alert(
            `Venda finalizada com sucesso!\n\nNúmero da venda: #${data.venda_id}\nTotal: ${formatarMoeda(data.total)}`
        );


        limparVenda();


        await carregarProdutosVenda();

    } catch (erro) {

        console.error(
            "Erro inesperado:",
            erro
        );


        alert(
            "Ocorreu um erro ao finalizar a venda."
        );

    } finally {

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

    carrinho = [];


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


    renderizarCarrinho();
}


/* ==========================================
   CANCELAR VENDA
========================================== */

function cancelarVenda() {

    if (carrinho.length === 0) {

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


    await vendasSupabase.auth.signOut();


    sessionStorage.removeItem(
        "sistemaLojaPerfil"
    );


    window.location.href =
        "index.html";
}


/* ==========================================
   MENU FUTURO
========================================== */

document.querySelectorAll(
    "[data-futuro]"
).forEach(item => {

    item.addEventListener(
        "click",
        evento => {

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

});


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


btnSair.addEventListener(
    "click",
    sair
);


/* ==========================================
   INICIAR
========================================== */

async function iniciarVendas() {

    const autorizado =
        await protegerPaginaVendas();


    if (!autorizado) {
        return;
    }


    await carregarClientesVenda();

    await carregarProdutosVenda();

    renderizarCarrinho();
}


iniciarVendas();