/* =========================================================
   SISTEMA DA LOJA
   GERENCIAMENTO DE PRODUTOS
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const produtosSupabase = supabaseClient;


/* =========================================================
   ELEMENTOS
========================================================= */

const formProduto =
    document.getElementById("formProduto");

const nomeProduto =
    document.getElementById("nomeProduto");

const skuProduto =
    document.getElementById("skuProduto");

const fornecedorProduto =
    document.getElementById("fornecedorProduto");

const categoriaProduto =
    document.getElementById("categoriaProduto");

const precoCusto =
    document.getElementById("precoCusto");

const precoVenda =
    document.getElementById("precoVenda");

const estoque =
    document.getElementById("estoque");

const estoqueMinimo =
    document.getElementById("estoqueMinimo");

const produtoAtivo =
    document.getElementById("produtoAtivo");

const tituloFormulario =
    document.getElementById("tituloFormulario");

const btnSalvar =
    document.getElementById("btnSalvar");

const btnCancelar =
    document.getElementById("btnCancelar");

const btnAtualizar =
    document.getElementById("btnAtualizar");

const listaProdutos =
    document.getElementById("listaProdutos");

const carregando =
    document.getElementById("carregando");

const semProdutos =
    document.getElementById("semProdutos");

const mensagemAdmin =
    document.getElementById("mensagemAdmin");

const dataAtual =
    document.getElementById("dataAtual");

const nomeAdministrador =
    document.getElementById("nomeAdministrador");


/* =========================================================
   ESTADO
========================================================= */

let perfilAtual = null;

let produtoEditandoId = null;

let categorias = [];

let produtos = [];


/* =========================================================
   MENSAGENS
========================================================= */

function mostrarMensagem(
    texto,
    tipo = "erro"
) {

    if (!mensagemAdmin) {
        return;
    }

    mensagemAdmin.textContent = texto;

    mensagemAdmin.className =
        "mensagem " + tipo;

}


function limparMensagem() {

    if (!mensagemAdmin) {
        return;
    }

    mensagemAdmin.textContent = "";

    mensagemAdmin.className =
        "mensagem";

}


/* =========================================================
   DATA ATUAL
========================================================= */

function mostrarDataAtual() {

    if (!dataAtual) {
        return;
    }

    const agora =
        new Date();

    const dataFormatada =
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
        dataFormatada
            .charAt(0)
            .toUpperCase() +
        dataFormatada.slice(1);

}


/* =========================================================
   PROTEGER PÁGINA
========================================================= */

async function protegerPagina() {

    const {
        data: {
            session
        },
        error: erroSessao
    } =
        await produtosSupabase
            .auth
            .getSession();


    if (
        erroSessao ||
        !session
    ) {

        window.location.href =
            "index.html";

        return false;

    }


    const {
        data: usuario,
        error: erroUsuario
    } =
        await produtosSupabase
            .auth
            .getUser();


    if (
        erroUsuario ||
        !usuario?.user
    ) {

        window.location.href =
            "index.html";

        return false;

    }


    const {
        data: perfil,
        error
    } =
        await produtosSupabase
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
                usuario.user.id
            )
            .single();


    if (error) {

        console.error(
            "Erro ao carregar perfil:",
            error
        );

        mostrarMensagem(
            "Não foi possível verificar seu perfil.",
            "erro"
        );

        return false;

    }


    if (
        !perfil ||
        perfil.tipo !== "admin" ||
        perfil.ativo !== true ||
        !perfil.loja_id
    ) {

        alert(
            "Acesso permitido somente para administradores ativos."
        );

        window.location.href =
            "index.html";

        return false;

    }


    perfilAtual =
        perfil;


    if (nomeAdministrador) {

        nomeAdministrador.textContent =
            perfil.nome_completo ||
            perfil.usuario ||
            "Administrador";

    }


    return true;

}


/* =========================================================
   CARREGAR CATEGORIAS
========================================================= */

async function carregarCategorias() {

    if (!perfilAtual?.loja_id) {
        return;
    }


    const {
        data,
        error
    } =
        await produtosSupabase
            .from("categorias")
            .select(`
                id,
                nome,
                ativo
            `)
            .eq(
                "loja_id",
                perfilAtual.loja_id
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
            "Erro ao carregar categorias:",
            error
        );

        mostrarMensagem(
            "Não foi possível carregar as categorias.",
            "erro"
        );

        return;

    }


    categorias =
        data || [];


    preencherCategorias();

}


/* =========================================================
   PREENCHER CATEGORIAS
========================================================= */

function preencherCategorias() {

    if (!categoriaProduto) {
        return;
    }


    categoriaProduto.innerHTML =
        `
        <option value="">
            Sem categoria
        </option>
        `;


    categorias.forEach(
        function (categoria) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                categoria.id;

            option.textContent =
                categoria.nome;

            categoriaProduto.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   CARREGAR PRODUTOS
========================================================= */

async function carregarProdutos() {

    if (!perfilAtual?.loja_id) {
        return;
    }


    if (carregando) {

        carregando.style.display =
            "block";

    }


    if (semProdutos) {

        semProdutos.style.display =
            "none";

    }


    const {
        data,
        error
    } =
        await produtosSupabase
            .from("produtos")
            .select(`
                id,
                nome,
                sku,
                fornecedor,
                categoria_id,
                preco_custo,
                preco_venda,
                estoque,
                estoque_minimo,
                ativo,
                criado_em,
                atualizado_em,
                categorias (
                    nome
                )
            `)
            .eq(
                "loja_id",
                perfilAtual.loja_id
            )
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (carregando) {

        carregando.style.display =
            "none";

    }


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


    produtos =
        data || [];


    renderizarProdutos();

}


/* =========================================================
   FORMATAR MOEDA
========================================================= */

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


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        texto ?? "";

    return div.innerHTML;

}


/* =========================================================
   RENDERIZAR PRODUTOS
========================================================= */

function renderizarProdutos() {

    if (!listaProdutos) {
        return;
    }


    listaProdutos.innerHTML =
        "";


    if (
        !produtos ||
        produtos.length === 0
    ) {

        if (semProdutos) {

            semProdutos.style.display =
                "block";

        }

        return;

    }


    if (semProdutos) {

        semProdutos.style.display =
            "none";

    }


    produtos.forEach(
        function (produto) {

            const tr =
                document.createElement(
                    "tr"
                );


            const nome =
                escaparHTML(
                    produto.nome ||
                    "Sem nome"
                );


            const sku =
                escaparHTML(
                    produto.sku ||
                    "-"
                );


            const fornecedor =
                escaparHTML(
                    produto.fornecedor ||
                    "-"
                );


            const categoria =
                escaparHTML(
                    produto.categorias?.nome ||
                    "Sem categoria"
                );


            const custo =
                formatarMoeda(
                    produto.preco_custo
                );


            const venda =
                formatarMoeda(
                    produto.preco_venda
                );


            const estoqueAtual =
                Number(
                    produto.estoque
                ) || 0;


            const ativo =
                produto.ativo === true;


            tr.innerHTML = `
                <td>
                    ${nome}
                </td>

                <td>
                    ${sku}
                </td>

                <td>
                    ${fornecedor}
                </td>

                <td>
                    ${categoria}
                </td>

                <td>
                    ${custo}
                </td>

                <td>
                    ${venda}
                </td>

                <td>
                    ${estoqueAtual}
                </td>

                <td>
                    <span
                        class="status-produto ${
                            ativo
                                ? "ativo"
                                : "inativo"
                        }"
                    >
                        ${
                            ativo
                                ? "Ativo"
                                : "Inativo"
                        }
                    </span>
                </td>

                <td>

                    <div
                        class="acoes-produto"
                    >

                        <button
                            type="button"
                            class="btn-acao btn-editar"
                            onclick="editarProduto('${produto.id}')"
                        >
                            Editar
                        </button>


                        <button
                            type="button"
                            class="btn-acao btn-status"
                            onclick="alternarStatusProduto(
                                '${produto.id}',
                                ${ativo}
                            )"
                        >
                            ${
                                ativo
                                    ? "Desativar"
                                    : "Ativar"
                            }
                        </button>


                        <button
                            type="button"
                            class="btn-acao btn-excluir"
                            onclick="excluirProduto('${produto.id}')"
                        >
                            Excluir
                        </button>

                    </div>

                </td>
            `;


            listaProdutos.appendChild(
                tr
            );

        }
    );

}


/* =========================================================
   LIMPAR FORMULÁRIO
========================================================= */

function limparFormulario() {

    if (formProduto) {
        formProduto.reset();
    }


    produtoEditandoId =
        null;


    if (produtoAtivo) {

        produtoAtivo.checked =
            true;

    }


    if (categoriaProduto) {

        categoriaProduto.value =
            "";

    }


    if (tituloFormulario) {

        tituloFormulario.textContent =
            "Cadastrar produto";

    }


    if (btnSalvar) {

        btnSalvar.textContent =
            "Cadastrar produto";

    }

}


/* =========================================================
   EDITAR PRODUTO
========================================================= */

function editarProduto(id) {

    const produto =
        produtos.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(id)
                );

            }
        );


    if (!produto) {

        alert(
            "Produto não encontrado."
        );

        return;

    }


    produtoEditandoId =
        produto.id;


    if (tituloFormulario) {

        tituloFormulario.textContent =
            "Editar produto";

    }


    if (btnSalvar) {

        btnSalvar.textContent =
            "Salvar alterações";

    }


    nomeProduto.value =
        produto.nome || "";


    skuProduto.value =
        produto.sku || "";


    fornecedorProduto.value =
        produto.fornecedor || "";


    categoriaProduto.value =
        produto.categoria_id || "";


    precoCusto.value =
        produto.preco_custo ?? "";


    precoVenda.value =
        produto.preco_venda ?? "";


    estoque.value =
        produto.estoque ?? 0;


    estoqueMinimo.value =
        produto.estoque_minimo ?? 0;


    produtoAtivo.checked =
        produto.ativo === true;


    limparMensagem();


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   SALVAR PRODUTO
========================================================= */

async function salvarProduto(event) {

    if (event) {

        event.preventDefault();

    }


    limparMensagem();


    if (!perfilAtual?.loja_id) {

        mostrarMensagem(
            "Loja do administrador não encontrada.",
            "erro"
        );

        return;

    }


    const nome =
        nomeProduto.value
            .trim();


    const sku =
        skuProduto.value
            .trim();


    const fornecedor =
        fornecedorProduto.value
            .trim();


    const categoriaId =
        categoriaProduto.value ||
        null;


    const precoCustoValor =
        Number(
            precoCusto.value
        );


    const precoVendaValor =
        Number(
            precoVenda.value
        );


    const estoqueValor =
        Number(
            estoque.value
        );


    const estoqueMinimoValor =
        Number(
            estoqueMinimo.value
        );


    const ativo =
        produtoAtivo.checked;


    if (!nome) {

        mostrarMensagem(
            "Digite o nome do produto.",
            "erro"
        );

        nomeProduto.focus();

        return;

    }


    if (
        !Number.isFinite(
            precoCustoValor
        ) ||
        precoCustoValor < 0
    ) {

        mostrarMensagem(
            "Digite um preço de custo válido.",
            "erro"
        );

        precoCusto.focus();

        return;

    }


    if (
        !Number.isFinite(
            precoVendaValor
        ) ||
        precoVendaValor < 0
    ) {

        mostrarMensagem(
            "Digite um preço de venda válido.",
            "erro"
        );

        precoVenda.focus();

        return;

    }


    if (
        !Number.isFinite(
            estoqueValor
        ) ||
        estoqueValor < 0
    ) {

        mostrarMensagem(
            "Digite um estoque válido.",
            "erro"
        );

        estoque.focus();

        return;

    }


    if (
        !Number.isFinite(
            estoqueMinimoValor
        ) ||
        estoqueMinimoValor < 0
    ) {

        mostrarMensagem(
            "Digite um estoque mínimo válido.",
            "erro"
        );

        estoqueMinimo.focus();

        return;

    }


    const dadosProduto = {

        nome:
            nome,

        sku:
            sku || null,

        fornecedor:
            fornecedor || null,

        categoria_id:
            categoriaId,

        preco_custo:
            precoCustoValor,

        preco_venda:
            precoVendaValor,

        estoque:
            estoqueValor,

        estoque_minimo:
            estoqueMinimoValor,

        ativo:
            ativo

    };


    if (btnSalvar) {

        btnSalvar.disabled =
            true;

    }


    try {

        /* =================================================
           CADASTRAR
        ================================================= */

        if (!produtoEditandoId) {

            dadosProduto.loja_id =
                perfilAtual.loja_id;


            const {
                error
            } =
                await produtosSupabase
                    .from("produtos")
                    .insert(
                        dadosProduto
                    );


            if (error) {

                console.error(
                    "Erro ao cadastrar produto:",
                    error
                );

                mostrarMensagem(
                    "Não foi possível cadastrar o produto: " +
                    error.message,
                    "erro"
                );

                return;

            }


            mostrarMensagem(
                "Produto cadastrado com sucesso!",
                "sucesso"
            );

        }

        /* =================================================
           EDITAR
        ================================================= */

        else {

            const {
                error
            } =
                await produtosSupabase
                    .from("produtos")
                    .update(
                        dadosProduto
                    )
                    .eq(
                        "id",
                        produtoEditandoId
                    )
                    .eq(
                        "loja_id",
                        perfilAtual.loja_id
                    );


            if (error) {

                console.error(
                    "Erro ao atualizar produto:",
                    error
                );

                mostrarMensagem(
                    "Não foi possível atualizar o produto: " +
                    error.message,
                    "erro"
                );

                return;

            }


            mostrarMensagem(
                "Produto atualizado com sucesso!",
                "sucesso"
            );

        }


        limparFormulario();

        await carregarProdutos();


    } catch (erro) {

        console.error(
            "Erro ao salvar produto:",
            erro
        );

        mostrarMensagem(
            "Ocorreu um erro ao salvar o produto.",
            "erro"
        );

    } finally {

        if (btnSalvar) {

            btnSalvar.disabled =
                false;

        }

    }

}


/* =========================================================
   ALTERNAR STATUS
========================================================= */

async function alternarStatusProduto(
    id,
    ativoAtual
) {

    const novoStatus =
        !ativoAtual;


    const mensagemConfirmacao =
        novoStatus
            ? "Deseja ativar este produto?"
            : "Deseja desativar este produto?";


    if (
        !confirm(
            mensagemConfirmacao
        )
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await produtosSupabase
                .from("produtos")
                .update(
                    {
                        ativo:
                            novoStatus
                    }
                )
                .eq(
                    "id",
                    id
                )
                .eq(
                    "loja_id",
                    perfilAtual.loja_id
                );


        if (error) {

            console.error(
                "Erro ao alterar status:",
                error
            );

            mostrarMensagem(
                "Não foi possível alterar o status do produto: " +
                error.message,
                "erro"
            );

            return;

        }


        mostrarMensagem(
            novoStatus
                ? "Produto ativado com sucesso!"
                : "Produto desativado com sucesso!",
            "sucesso"
        );


        await carregarProdutos();


    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );

        mostrarMensagem(
            "Ocorreu um erro ao alterar o status.",
            "erro"
        );

    }

}


/* =========================================================
   EXCLUIR PRODUTO
========================================================= */

async function excluirProduto(id) {

    const produto =
        produtos.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(id)
                );

            }
        );


    const nome =
        produto?.nome ||
        "este produto";


    /* =====================================================
       PRIMEIRA CONFIRMAÇÃO
    ===================================================== */

    const confirmar =
        confirm(
            `Deseja excluir o produto "${nome}"?`
        );


    if (!confirmar) {

        return;

    }


    /* =====================================================
       SEGUNDA CONFIRMAÇÃO
    ===================================================== */

    const confirmarNovamente =
        confirm(
            `Confirme novamente:\n\nExcluir definitivamente "${nome}"?`
        );


    if (!confirmarNovamente) {

        return;

    }


    try {

        /* =================================================
           IMPORTANTE:
           AQUI É RPC DO BANCO.

           NÃO É EDGE FUNCTION.
           
           NÃO USAR:
           /functions/v1/excluir_produto
        ================================================= */

        const {
            data,
            error
        } =
            await produtosSupabase
                .rpc(
                    "excluir_produto",
                    {
                        p_produto_id:
                            id
                    }
                );


        console.log(
            "Resposta da exclusão:",
            data
        );


        if (error) {

            console.error(
                "Erro RPC ao excluir produto:",
                error
            );


            let mensagemErro =
                error.message ||
                "Não foi possível excluir o produto.";


            if (
                mensagemErro
                    .toLowerCase()
                    .includes(
                        "já possui vendas"
                    )
            ) {

                mensagemErro =
                    "Este produto já possui vendas registradas e não pode ser excluído. Desative o produto em vez de excluí-lo.";

            }


            mostrarMensagem(
                mensagemErro,
                "erro"
            );

            return;

        }


        mostrarMensagem(
            "Produto excluído com sucesso!",
            "sucesso"
        );


        await carregarProdutos();


    } catch (erro) {

        console.error(
            "Erro ao excluir produto:",
            erro
        );

        mostrarMensagem(
            "Ocorreu um erro ao excluir o produto: " +
            (
                erro?.message ||
                "erro desconhecido."
            ),
            "erro"
        );

    }

}


/* =========================================================
   CANCELAR
========================================================= */

function cancelarEdicao() {

    limparFormulario();

    limparMensagem();

}


/* =========================================================
   EVENTOS
========================================================= */

if (formProduto) {

    formProduto.addEventListener(
        "submit",
        salvarProduto
    );

}


if (btnCancelar) {

    btnCancelar.addEventListener(
        "click",
        cancelarEdicao
    );

}


if (btnAtualizar) {

    btnAtualizar.addEventListener(
        "click",
        async function () {

            limparMensagem();

            await carregarCategorias();

            await carregarProdutos();

        }
    );

}


/* =========================================================
   SAIR
========================================================= */

async function sairProdutos() {

    await produtosSupabase
        .auth
        .signOut();

    window.location.href =
        "index.html";

}


/* =========================================================
   INICIAR
========================================================= */

async function iniciarProdutos() {

    mostrarDataAtual();


    const acesso =
        await protegerPagina();


    if (!acesso) {

        return;

    }


    await carregarCategorias();

    await carregarProdutos();

}


iniciarProdutos();