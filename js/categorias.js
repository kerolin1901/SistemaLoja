/* ==========================================
   SISTEMA DA LOJA
   CATEGORIAS
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const categoriasSupabase =
    supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const nomeAdministrador =
    document.getElementById("nomeAdministrador");

const avatarAdministrador =
    document.querySelector(".avatar-admin");

const formCategoria =
    document.getElementById("formCategoria");

const nomeCategoria =
    document.getElementById("nomeCategoria");

const btnSalvar =
    document.getElementById("btnSalvar");

const btnCancelar =
    document.getElementById("btnCancelar");

const btnAtualizar =
    document.getElementById("btnAtualizar");

const btnSair =
    document.getElementById("btnSair");

const mensagemCategoria =
    document.getElementById("mensagemCategoria");

const totalCategorias =
    document.getElementById("totalCategorias");

const categoriasAtivas =
    document.getElementById("categoriasAtivas");

const categoriasInativas =
    document.getElementById("categoriasInativas");

const carregandoCategorias =
    document.getElementById("carregandoCategorias");

const semCategorias =
    document.getElementById("semCategorias");

const containerTabelaCategorias =
    document.getElementById(
        "containerTabelaCategorias"
    );

const listaCategorias =
    document.getElementById(
        "listaCategorias"
    );


/* ==========================================
   VARIÁVEIS
========================================== */

let categoriaEditandoId =
    null;

let categorias =
    [];


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = ""
) {

    mensagemCategoria.textContent =
        texto;

    mensagemCategoria.className =
        "mensagem-categoria";

    if (tipo) {

        mensagemCategoria.classList.add(
            tipo
        );

    }

}


/* ==========================================
   PROTEGER PÁGINA
========================================== */

async function protegerPaginaCategorias() {

    const {
        data,
        error
    } =
        await categoriasSupabase.auth.getSession();


    if (
        error ||
        !data ||
        !data.session
    ) {

        window.location.href =
            "index.html";

        return false;

    }


    const usuarioId =
        data.session.user.id;


    const resultado =
        await categoriasSupabase
            .from("perfis")
            .select(`
                id,
                nome_completo,
                usuario,
                tipo,
                ativo
            `)
            .eq(
                "id",
                usuarioId
            )
            .maybeSingle();


    if (
        resultado.error ||
        !resultado.data
    ) {

        await categoriasSupabase.auth.signOut();

        window.location.href =
            "index.html";

        return false;

    }


    const perfil =
        resultado.data;


    if (
        perfil.tipo !== "admin" ||
        perfil.ativo !== true
    ) {

        window.location.href =
            "vendedor.html";

        return false;

    }


    nomeAdministrador.textContent =
        perfil.nome_completo ||
        perfil.usuario ||
        "Administrador";


    avatarAdministrador.textContent =
        (
            perfil.nome_completo ||
            perfil.usuario ||
            "A"
        )
        .charAt(0)
        .toUpperCase();


    return true;

}


/* ==========================================
   FORMATAR DATA
========================================== */

function formatarData(data) {

    if (!data) {
        return "-";
    }


    const dataObj =
        new Date(data);


    if (
        Number.isNaN(
            dataObj.getTime()
        )
    ) {

        return "-";

    }


    return dataObj.toLocaleDateString(
        "pt-BR"
    );

}


/* ==========================================
   LIMPAR FORMULÁRIO
========================================== */

function limparFormulario() {

    categoriaEditandoId =
        null;

    nomeCategoria.value =
        "";

    btnSalvar.textContent =
        "Salvar categoria";

    btnCancelar.style.display =
        "none";

    nomeCategoria.focus();

}


/* ==========================================
   CARREGAR CATEGORIAS
========================================== */

async function carregarCategorias() {

    carregandoCategorias.style.display =
        "block";

    semCategorias.style.display =
        "none";

    containerTabelaCategorias.style.display =
        "none";


    const resultado =
        await categoriasSupabase
            .from("categorias")
            .select(`
                id,
                nome,
                ativo,
                criado_em
            `)
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    carregandoCategorias.style.display =
        "none";


    if (resultado.error) {

        console.error(
            resultado.error
        );


        mostrarMensagem(
            "Não foi possível carregar as categorias.",
            "erro"
        );


        return;

    }


    categorias =
        resultado.data || [];


    atualizarResumo();


    renderizarCategorias();

}


/* ==========================================
   RESUMO
========================================== */

function atualizarResumo() {

    const total =
        categorias.length;


    const ativas =
        categorias.filter(
            categoria =>
                categoria.ativo === true
        ).length;


    const inativas =
        categorias.filter(
            categoria =>
                categoria.ativo !== true
        ).length;


    totalCategorias.textContent =
        total;


    categoriasAtivas.textContent =
        ativas;


    categoriasInativas.textContent =
        inativas;

}


/* ==========================================
   RENDERIZAR CATEGORIAS
========================================== */

function renderizarCategorias() {

    listaCategorias.innerHTML =
        "";


    if (
        categorias.length === 0
    ) {

        semCategorias.style.display =
            "block";

        containerTabelaCategorias.style.display =
            "none";

        return;

    }


    semCategorias.style.display =
        "none";

    containerTabelaCategorias.style.display =
        "block";


    categorias.forEach(
        categoria => {

            const tr =
                document.createElement(
                    "tr"
                );


            /* ==================================
               NOME
            ================================== */

            const tdNome =
                document.createElement(
                    "td"
                );


            const nome =
                document.createElement(
                    "strong"
                );


            nome.textContent =
                categoria.nome;


            tdNome.appendChild(
                nome
            );


            /* ==================================
               STATUS
            ================================== */

            const tdStatus =
                document.createElement(
                    "td"
                );


            const status =
                document.createElement(
                    "span"
                );


            status.className =
                categoria.ativo === true
                    ? "status-categoria ativa"
                    : "status-categoria inativa";


            status.textContent =
                categoria.ativo === true
                    ? "Ativa"
                    : "Inativa";


            tdStatus.appendChild(
                status
            );


            /* ==================================
               DATA
            ================================== */

            const tdData =
                document.createElement(
                    "td"
                );


            tdData.textContent =
                formatarData(
                    categoria.criado_em
                );


            /* ==================================
               AÇÕES
            ================================== */

            const tdAcoes =
                document.createElement(
                    "td"
                );


            const acoes =
                document.createElement(
                    "div"
                );


            acoes.className =
                "acoes-tabela";


            /* ==================================
               BOTÃO EDITAR
            ================================== */

            const btnEditar =
                document.createElement(
                    "button"
                );


            btnEditar.type =
                "button";

            btnEditar.className =
                "botao-acao botao-editar";

            btnEditar.textContent =
                "Editar";


            btnEditar.addEventListener(
                "click",
                () => {

                    editarCategoria(
                        categoria
                    );

                }
            );


            acoes.appendChild(
                btnEditar
            );


            /* ==================================
               BOTÃO ATIVAR / DESATIVAR
            ================================== */

            const btnStatus =
                document.createElement(
                    "button"
                );


            btnStatus.type =
                "button";


            if (
                categoria.ativo === true
            ) {

                btnStatus.className =
                    "botao-acao botao-desativar";

                btnStatus.textContent =
                    "Desativar";

            } else {

                btnStatus.className =
                    "botao-acao botao-ativar";

                btnStatus.textContent =
                    "Ativar";

            }


            btnStatus.addEventListener(
                "click",
                () => {

                    alterarStatusCategoria(
                        categoria
                    );

                }
            );


            acoes.appendChild(
                btnStatus
            );


            /* ==================================
               BOTÃO EXCLUIR
            ================================== */

            const btnExcluir =
                document.createElement(
                    "button"
                );


            btnExcluir.type =
                "button";

            btnExcluir.className =
                "botao-acao botao-excluir";

            btnExcluir.textContent =
                "Excluir";


            btnExcluir.addEventListener(
                "click",
                () => {

                    excluirCategoria(
                        categoria
                    );

                }
            );


            acoes.appendChild(
                btnExcluir
            );


            /* ==================================
               ADICIONAR AÇÕES
            ================================== */

            tdAcoes.appendChild(
                acoes
            );


            /* ==================================
               ADICIONAR LINHA
            ================================== */

            tr.appendChild(
                tdNome
            );

            tr.appendChild(
                tdStatus
            );

            tr.appendChild(
                tdData
            );

            tr.appendChild(
                tdAcoes
            );


            listaCategorias.appendChild(
                tr
            );

        }
    );

}


/* ==========================================
   EDITAR CATEGORIA
========================================== */

function editarCategoria(
    categoria
) {

    categoriaEditandoId =
        categoria.id;


    nomeCategoria.value =
        categoria.nome;


    btnSalvar.textContent =
        "Salvar alterações";


    btnCancelar.style.display =
        "inline-flex";


    nomeCategoria.focus();


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* ==========================================
   SALVAR CATEGORIA
========================================== */

async function salvarCategoria(
    evento
) {

    evento.preventDefault();


    const nome =
        nomeCategoria.value
            .trim();


    if (!nome) {

        mostrarMensagem(
            "Digite o nome da categoria.",
            "erro"
        );

        nomeCategoria.focus();

        return;

    }


    btnSalvar.disabled =
        true;

    btnCancelar.disabled =
        true;


    mostrarMensagem(
        "Salvando categoria..."
    );


    try {


        /* ==================================
           EDITAR
        ================================== */

        if (
            categoriaEditandoId
        ) {


            const resultado =
                await categoriasSupabase
                    .from("categorias")
                    .update(
                        {
                            nome
                        }
                    )
                    .eq(
                        "id",
                        categoriaEditandoId
                    );


            if (resultado.error) {

                throw resultado.error;

            }


            mostrarMensagem(
                "Categoria atualizada com sucesso.",
                "sucesso"
            );


        }


        /* ==================================
           NOVA CATEGORIA
        ================================== */

        else {


            const resultado =
                await categoriasSupabase
                    .from("categorias")
                    .insert(
                        {
                            nome,
                            ativo: true
                        }
                    );


            if (resultado.error) {

                throw resultado.error;

            }


            mostrarMensagem(
                "Categoria cadastrada com sucesso.",
                "sucesso"
            );

        }


        limparFormulario();


        await carregarCategorias();


    } catch (error) {


        console.error(
            error
        );


        if (
            error.code === "23505"
        ) {

            mostrarMensagem(
                "Já existe uma categoria com esse nome.",
                "erro"
            );

        } else {

            mostrarMensagem(
                error.message ||
                "Não foi possível salvar a categoria.",
                "erro"
            );

        }


    } finally {

        btnSalvar.disabled =
            false;

        btnCancelar.disabled =
            false;

    }

}


/* ==========================================
   ALTERAR STATUS
========================================== */

async function alterarStatusCategoria(
    categoria
) {

    const novoStatus =
        categoria.ativo !== true;


    const texto =
        novoStatus
            ? "ativar"
            : "desativar";


    const confirmar =
        window.confirm(
            `Deseja ${texto} a categoria "${categoria.nome}"?`
        );


    if (!confirmar) {
        return;
    }


    const resultado =
        await categoriasSupabase
            .from("categorias")
            .update(
                {
                    ativo: novoStatus
                }
            )
            .eq(
                "id",
                categoria.id
            );


    if (resultado.error) {

        console.error(
            resultado.error
        );


        mostrarMensagem(
            resultado.error.message ||
            "Não foi possível alterar o status.",
            "erro"
        );

        return;

    }


    mostrarMensagem(
        novoStatus
            ? "Categoria ativada com sucesso."
            : "Categoria desativada com sucesso.",
        "sucesso"
    );


    await carregarCategorias();

}


/* ==========================================
   EXCLUIR CATEGORIA
========================================== */

async function excluirCategoria(
    categoria
) {

    const confirmar =
        window.confirm(
            `Tem certeza que deseja excluir a categoria "${categoria.nome}"?\n\nEssa ação não poderá ser desfeita.`
        );


    if (!confirmar) {
        return;
    }


    mostrarMensagem(
        "Excluindo categoria..."
    );


    const resultado =
        await categoriasSupabase
            .from("categorias")
            .delete()
            .eq(
                "id",
                categoria.id
            );


    if (resultado.error) {

        console.error(
            resultado.error
        );


        /* ==============================
           CATEGORIA ESTÁ SENDO USADA
        ============================== */

        if (
            resultado.error.code === "23503"
        ) {

            mostrarMensagem(
                `A categoria "${categoria.nome}" não pode ser excluída porque está sendo usada por um ou mais produtos. Desative a categoria em vez de excluí-la.`,
                "erro"
            );

            return;

        }


        mostrarMensagem(
            resultado.error.message ||
            "Não foi possível excluir a categoria.",
            "erro"
        );

        return;

    }


    if (
        categoriaEditandoId ===
        categoria.id
    ) {

        limparFormulario();

    }


    mostrarMensagem(
        "Categoria excluída com sucesso.",
        "sucesso"
    );


    await carregarCategorias();

}


/* ==========================================
   SAIR
========================================== */

async function sair() {

    await categoriasSupabase.auth.signOut();


    sessionStorage.removeItem(
        "sistemaLojaPerfil"
    );


    window.location.href =
        "index.html";

}


/* ==========================================
   EVENTOS
========================================== */

formCategoria.addEventListener(
    "submit",
    salvarCategoria
);


btnCancelar.addEventListener(
    "click",
    limparFormulario
);


btnAtualizar.addEventListener(
    "click",
    carregarCategorias
);


btnSair.addEventListener(
    "click",
    sair
);


/* ==========================================
   INICIAR
========================================== */

async function iniciarCategorias() {

    const permitido =
        await protegerPaginaCategorias();


    if (!permitido) {
        return;
    }


    await carregarCategorias();

}


iniciarCategorias();