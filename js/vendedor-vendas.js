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

let produtos =
    [];

let clientes =
    [];

let itensVenda =
    [];


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


    produtoVenda.innerHTML = `

        <option value="">
            Selecione um produto
        </option>

    `;


    produtos.forEach(
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


    atualizarPrecoProduto();
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


    clienteVenda.innerHTML = `

        <option value="">
            Consumidor não identificado
        </option>

    `;


    clientes.forEach(
        function (cliente) {

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

        }
    );
}


/* ==========================================
   ATUALIZAR PREÇO
========================================== */

function atualizarPrecoProduto() {

    const produtoId =
        produtoVenda.value;


    const produto =
        produtos.find(
            item =>
                String(item.id) ===
                String(produtoId)
        );


    if (!produto) {

        precoProdutoSelecionado.textContent =
            "R$ 0,00";


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
            item =>
                String(item.id) ===
                String(produtoId)
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
            item =>
                String(item.produto_id) ===
                String(produto.id)
        );


    const quantidadeFinal =
        (
            itemExistente
                ? itemExistente.quantidade
                : 0
        ) +
        quantidade;


    if (
        quantidadeFinal > estoque
    ) {

        mostrarMensagem(
            "Quantidade maior que o estoque disponível.",
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
        1;


    produtoVenda.value =
        "";


    atualizarPrecoProduto();


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

                                ${item.quantidade}

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
   CALCULAR SUBTOTAL
========================================== */

function calcularSubtotal() {

    return itensVenda.reduce(
        function (total, item) {

            return total +
                (
                    item.quantidade *
                    item.preco_unitario
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


    /* ======================================
       LIMPAR VENDA
    ====================================== */

    itensVenda =
        [];


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


    atualizarPrecoProduto();

    renderizarItens();

    atualizarResumo();


    /* ======================================
       ATUALIZAR ESTOQUE DOS PRODUTOS
    ====================================== */

    await carregarProdutos();
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
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarVendedorVendas
    );

}
else {

    iniciarVendedorVendas();

}