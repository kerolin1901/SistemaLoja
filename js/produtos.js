/* ==========================================
   SISTEMA DA LOJA
   GERENCIAMENTO DE PRODUTOS
========================================== */


/* ==========================================
   ELEMENTOS
========================================== */

const formProduto =
    document.getElementById(
        "formProduto"
    );

const tituloFormulario =
    document.getElementById(
        "tituloFormulario"
    );

const nomeProduto =
    document.getElementById(
        "nomeProduto"
    );

const skuProduto =
    document.getElementById(
        "skuProduto"
    );

const categoriaProduto =
    document.getElementById(
        "categoriaProduto"
    );

const precoCusto =
    document.getElementById(
        "precoCusto"
    );

const precoVenda =
    document.getElementById(
        "precoVenda"
    );

const estoque =
    document.getElementById(
        "estoque"
    );

const estoqueMinimo =
    document.getElementById(
        "estoqueMinimo"
    );

const produtoAtivo =
    document.getElementById(
        "produtoAtivo"
    );

const btnSalvar =
    document.getElementById(
        "btnSalvar"
    );

const btnCancelar =
    document.getElementById(
        "btnCancelar"
    );

const btnAtualizar =
    document.getElementById(
        "btnAtualizar"
    );

const listaProdutos =
    document.getElementById(
        "listaProdutos"
    );

const carregando =
    document.getElementById(
        "carregando"
    );

const semProdutos =
    document.getElementById(
        "semProdutos"
    );

const mensagemAdmin =
    document.getElementById(
        "mensagemAdmin"
    );

const nomeAdministrador =
    document.getElementById(
        "nomeAdministrador"
    );

const avatarAdministrador =
    document.querySelector(
        ".avatar-admin"
    );

const dataAtual =
    document.getElementById(
        "dataAtual"
    );

const btnSair =
    document.getElementById(
        "btnSair"
    );


/* ==========================================
   ESTADO
========================================== */

let produtoEditandoId =
    null;


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = "sucesso"
) {

    mensagemAdmin.textContent =
        texto;

    mensagemAdmin.style.display =
        "block";

    mensagemAdmin.className =
        "mensagem-admin " +
        tipo;


    setTimeout(
        () => {

            mensagemAdmin.style.display =
                "none";

        },
        5000
    );
}


/* ==========================================
   DATA
========================================== */

function mostrarDataAtual() {

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


/* ==========================================
   PROTEGER PÁGINA
========================================== */

async function protegerPagina() {

    const {

        data: {
            session
        },

        error: erroSessao

    } =
        await supabaseClient
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

        data: perfil,

        error

    } =
        await supabaseClient

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
        error ||
        !perfil
    ) {

        await supabaseClient
            .auth
            .signOut();

        window.location.href =
            "index.html";

        return false;
    }


    if (
        perfil.tipo !== "admin" ||
        perfil.ativo !== true
    ) {

        await supabaseClient
            .auth
            .signOut();

        window.location.href =
            "index.html";

        return false;
    }


    const nome =
        perfil.nome_completo ||
        "Administrador";


    nomeAdministrador.textContent =
        nome;


    avatarAdministrador.textContent =
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


/* ==========================================
   CARREGAR CATEGORIAS
========================================== */

async function carregarCategorias() {

    categoriaProduto.innerHTML = `

        <option value="">
            Sem categoria
        </option>

    `;


    const {

        data,

        error

    } =
        await supabaseClient

            .from("categorias")

            .select(
                "id, nome"
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

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        return;
    }


    data.forEach(
        categoria => {

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


/* ==========================================
   CADASTRAR / EDITAR
========================================== */

async function salvarProduto(
    event
) {

    event.preventDefault();


    const nome =
        nomeProduto.value.trim();


    const sku =
        skuProduto.value.trim();


    const custo =
        Number(
            precoCusto.value
        );


    const venda =
        Number(
            precoVenda.value
        );


    const quantidadeEstoque =
        Number(
            estoque.value
        );


    const quantidadeMinima =
        Number(
            estoqueMinimo.value
        );


    const categoria =
        categoriaProduto.value;


    const ativo =
        produtoAtivo.checked;


    /* ======================================
       VALIDAÇÕES
    ======================================= */

    if (
        nome.length < 2
    ) {

        mostrarMensagem(
            "Informe o nome do produto.",
            "erro"
        );

        nomeProduto.focus();

        return;
    }


    if (
        !Number.isFinite(custo) ||
        custo < 0
    ) {

        mostrarMensagem(
            "Informe um preço de custo válido.",
            "erro"
        );

        precoCusto.focus();

        return;
    }


    if (
        !Number.isFinite(venda) ||
        venda < 0
    ) {

        mostrarMensagem(
            "Informe um preço de venda válido.",
            "erro"
        );

        precoVenda.focus();

        return;
    }


    if (
        !Number.isFinite(
            quantidadeEstoque
        ) ||
        quantidadeEstoque < 0
    ) {

        mostrarMensagem(
            "Informe um estoque válido.",
            "erro"
        );

        estoque.focus();

        return;
    }


    if (
        !Number.isFinite(
            quantidadeMinima
        ) ||
        quantidadeMinima < 0
    ) {

        mostrarMensagem(
            "Informe um estoque mínimo válido.",
            "erro"
        );

        estoqueMinimo.focus();

        return;
    }


    /* ======================================
       BOTÃO
    ======================================= */

    btnSalvar.disabled =
        true;


    btnSalvar.textContent =
        produtoEditandoId
            ? "Salvando..."
            : "Cadastrando...";


    try {

        const dadosProduto = {

            nome:
                nome,

            sku:
                sku || null,

            categoria_id:
                categoria
                    ? Number(categoria)
                    : null,

            preco_custo:
                custo,

            preco_venda:
                venda,

            estoque:
                quantidadeEstoque,

            estoque_minimo:
                quantidadeMinima,

            ativo:
                ativo

        };


        let resposta;


        /* ==================================
           EDITAR
        =================================== */

        if (
            produtoEditandoId
        ) {

            resposta =
                await supabaseClient

                    .from("produtos")

                    .update(
                        dadosProduto
                    )

                    .eq(
                        "id",
                        produtoEditandoId
                    );


        } else {


            /* ==============================
               NOVO
            =============================== */

            resposta =
                await supabaseClient

                    .from("produtos")

                    .insert(
                        dadosProduto
                    );

        }


        if (
            resposta.error
        ) {

            throw resposta.error;
        }


        mostrarMensagem(

            produtoEditandoId
                ? "Produto atualizado com sucesso."
                : "Produto cadastrado com sucesso.",

            "sucesso"

        );


        limparFormulario();


        await carregarProdutos();


    } catch (erro) {

        console.error(
            "Erro ao salvar produto:",
            erro
        );


        let mensagem =
            erro.message ||
            "Não foi possível salvar o produto.";


        if (
            erro.code === "23505"
        ) {

            mensagem =
                "Este SKU já está cadastrado.";

        }


        mostrarMensagem(
            mensagem,
            "erro"
        );


    } finally {

        btnSalvar.disabled =
            false;


        btnSalvar.textContent =
            produtoEditandoId
                ? "Salvar alterações"
                : "Cadastrar produto";
    }
}


/* ==========================================
   CARREGAR PRODUTOS
========================================== */

async function carregarProdutos() {

    carregando.style.display =
        "block";


    listaProdutos.innerHTML =
        "";


    semProdutos.style.display =
        "none";


    try {

        const {

            data,

            error

        } =
            await supabaseClient

                .from("produtos")

                .select(`

                    id,
                    nome,
                    sku,
                    categoria_id,
                    preco_custo,
                    preco_venda,
                    estoque,
                    estoque_minimo,
                    ativo,
                    criado_em,
                    categorias (
                        nome
                    )

                `)

                .order(
                    "criado_em",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;
        }


        carregando.style.display =
            "none";


        if (
            !data ||
            data.length === 0
        ) {

            semProdutos.style.display =
                "block";

            return;
        }


        data.forEach(
            criarLinhaProduto
        );


    } catch (erro) {

        carregando.style.display =
            "none";


        console.error(
            "Erro ao carregar produtos:",
            erro
        );


        mostrarMensagem(
            "Não foi possível carregar os produtos: " +
            (
                erro.message ||
                "erro desconhecido"
            ),
            "erro"
        );
    }
}


/* ==========================================
   CRIAR LINHA
========================================== */

function criarLinhaProduto(
    produto
) {

    const tr =
        document.createElement(
            "tr"
        );


    const nome =
        produto.nome ||
        "-";


    const sku =
        produto.sku ||
        "-";


    const categoria =
        produto.categorias?.nome ||
        "Sem categoria";


    const ativo =
        produto.ativo === true;


    const statusTexto =
        ativo
            ? "Ativo"
            : "Inativo";


    const classeStatus =
        ativo
            ? "ativo"
            : "inativo";


    const textoBotao =
        ativo
            ? "Desativar"
            : "Ativar";


    const custo =
        formatarMoeda(
            produto.preco_custo
        );


    const venda =
        formatarMoeda(
            produto.preco_venda
        );


    const estoqueFormatado =
        formatarNumero(
            produto.estoque
        );


    tr.innerHTML = `

        <td>
            <strong>
                ${escaparHtml(nome)}
            </strong>
        </td>

        <td>
            ${escaparHtml(sku)}
        </td>

        <td>
            ${escaparHtml(categoria)}
        </td>

        <td>
            ${custo}
        </td>

        <td>
            ${venda}
        </td>

        <td>
            ${estoqueFormatado}
        </td>

        <td>

            <span class="status ${classeStatus}">
                ${statusTexto}
            </span>

        </td>

        <td>

            <div class="acoes-tabela">

                <button
                    type="button"
                    class="botao-acao botao-editar"
                    data-editar="${produto.id}"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="botao-acao botao-status-produto"
                    data-status="${produto.id}"
                    data-ativo="${ativo}"
                >
                    ${textoBotao}
                </button>

            </div>

        </td>

    `;


    listaProdutos.appendChild(
        tr
    );


    const botaoEditar =
        tr.querySelector(
            "[data-editar]"
        );


    botaoEditar.addEventListener(
        "click",
        () => {

            editarProduto(
                produto
            );

        }
    );


    const botaoStatus =
        tr.querySelector(
            "[data-status]"
        );


    botaoStatus.addEventListener(
        "click",
        () => {

            alterarStatusProduto(
                produto.id,
                !ativo
            );

        }
    );
}


/* ==========================================
   EDITAR PRODUTO
========================================== */

function editarProduto(
    produto
) {

    produtoEditandoId =
        produto.id;


    tituloFormulario.textContent =
        "Editar produto";


    btnSalvar.textContent =
        "Salvar alterações";


    btnCancelar.style.display =
        "inline-block";


    nomeProduto.value =
        produto.nome ||
        "";


    skuProduto.value =
        produto.sku ||
        "";


    categoriaProduto.value =
        produto.categoria_id
            ? String(
                produto.categoria_id
            )
            : "";


    precoCusto.value =
        produto.preco_custo ??
        "";


    precoVenda.value =
        produto.preco_venda ??
        "";


    estoque.value =
        produto.estoque ??
        0;


    estoqueMinimo.value =
        produto.estoque_minimo ??
        0;


    produtoAtivo.checked =
        produto.ativo === true;


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );


    nomeProduto.focus();
}


/* ==========================================
   LIMPAR FORMULÁRIO
========================================== */

function limparFormulario() {

    produtoEditandoId =
        null;


    formProduto.reset();


    categoriaProduto.value =
        "";


    produtoAtivo.checked =
        true;


    estoque.value =
        0;


    estoqueMinimo.value =
        0;


    tituloFormulario.textContent =
        "Cadastrar produto";


    btnSalvar.textContent =
        "Cadastrar produto";


    btnCancelar.style.display =
        "none";
}


/* ==========================================
   ALTERAR STATUS
========================================== */

async function alterarStatusProduto(
    id,
    novoStatus
) {

    const confirmacao =
        novoStatus
            ? "Deseja ativar este produto?"
            : "Deseja desativar este produto?";


    if (
        !confirm(
            confirmacao
        )
    ) {

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient

                .from("produtos")

                .update({

                    ativo:
                        novoStatus

                })

                .eq(
                    "id",
                    id
                );


        if (error) {

            throw error;
        }


        mostrarMensagem(

            novoStatus
                ? "Produto ativado com sucesso."
                : "Produto desativado com sucesso.",

            "sucesso"

        );


        await carregarProdutos();


    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );


        mostrarMensagem(
            "Não foi possível alterar o status: " +
            (
                erro.message ||
                "erro desconhecido"
            ),
            "erro"
        );
    }
}


/* ==========================================
   FORMATAÇÃO
========================================== */

function formatarMoeda(
    valor
) {

    const numero =
        Number(valor);


    if (
        !Number.isFinite(numero)
    ) {

        return "R$ 0,00";
    }


    return numero.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function formatarNumero(
    valor
) {

    const numero =
        Number(valor);


    if (
        !Number.isFinite(numero)
    ) {

        return "0";
    }


    return numero.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        }
    );
}


/* ==========================================
   SEGURANÇA HTML
========================================== */

function escaparHtml(
    valor
) {

    return String(valor)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* ==========================================
   MENU
========================================== */

function configurarMenu() {

    document
        .querySelectorAll(
            "[data-futuro]"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        alert(
                            "A área de " +
                            item.dataset.futuro +
                            " será desenvolvida nesta etapa."
                        );

                    }
                );

            }
        );
}


/* ==========================================
   SAIR
========================================== */

async function sair() {

    try {

        await supabaseClient
            .auth
            .signOut();

    } catch (erro) {

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


/* ==========================================
   INICIAR
========================================== */

async function iniciarProdutos() {

    mostrarDataAtual();


    const autorizado =
        await protegerPagina();


    if (!autorizado) {

        return;
    }


    configurarMenu();


    btnSair.addEventListener(
        "click",
        sair
    );


    formProduto.addEventListener(
        "submit",
        salvarProduto
    );


    btnCancelar.addEventListener(
        "click",
        limparFormulario
    );


    btnAtualizar.addEventListener(
        "click",
        carregarProdutos
    );


    try {

        await carregarCategorias();

    } catch (erro) {

        console.error(
            "Erro ao iniciar categorias:",
            erro
        );

    }


    await carregarProdutos();
}


/* ==========================================
   EXECUTAR
========================================== */

iniciarProdutos();