/* ==========================================
   SISTEMA DA LOJA
   GERENCIAMENTO DE USUÁRIOS
========================================== */


/* ==========================================
   CONFIGURAÇÃO
========================================== */

const FUNCAO_CRIAR_USUARIO =
    "criar-usuario";


/* ==========================================
   ELEMENTOS DA PÁGINA
========================================== */

const formUsuario =
    document.getElementById("formUsuario");

const nomeCompleto =
    document.getElementById("nomeCompleto");

const usuario =
    document.getElementById("usuario");

const senha =
    document.getElementById("senha");

const tipo =
    document.getElementById("tipo");

const btnCadastrar =
    document.getElementById("btnCadastrar");

const mensagem =
    document.getElementById("mensagem");

const listaUsuarios =
    document.getElementById("listaUsuarios");

const carregando =
    document.getElementById("carregando");

const semUsuarios =
    document.getElementById("semUsuarios");

const btnAtualizar =
    document.getElementById("btnAtualizar");

const btnSair =
    document.getElementById("btnSair");

const nomeAdministrador =
    document.getElementById("nomeAdministrador");

const avatarAdministrador =
    document.querySelector(".avatar-admin");

const dataAtual =
    document.getElementById("dataAtual");


/* ==========================================
   MENSAGENS
========================================== */

function mostrarMensagem(
    texto,
    tipoMensagem
) {

    mensagem.textContent = texto;

    mensagem.className =
        "mensagem " + tipoMensagem;
}


function limparMensagem() {

    mensagem.textContent = "";

    mensagem.className =
        "mensagem";
}


/* ==========================================
   DATA ATUAL
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
        data: { session },
        error: erroSessao
    } =
        await supabaseClient.auth.getSession();


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

        await supabaseClient.auth.signOut();

        window.location.href =
            "index.html";

        return false;
    }


    if (
        perfil.tipo !== "admin" ||
        perfil.ativo !== true
    ) {

        await supabaseClient.auth.signOut();

        window.location.href =
            "index.html";

        return false;
    }


    /* ======================================
       MOSTRAR ADMINISTRADOR
    ======================================= */

    if (nomeAdministrador) {

        nomeAdministrador.textContent =
            perfil.nome_completo ||
            "Administrador";
    }


    if (avatarAdministrador) {

        const inicial =
            (
                perfil.nome_completo ||
                "A"
            )
                .trim()
                .charAt(0)
                .toUpperCase();

        avatarAdministrador.textContent =
            inicial;
    }


    sessionStorage.setItem(
        "sistemaLojaPerfil",
        JSON.stringify(perfil)
    );


    return true;
}


/* ==========================================
   CADASTRAR USUÁRIO
========================================== */

async function cadastrarUsuario(event) {

    event.preventDefault();

    limparMensagem();


    const nome =
        nomeCompleto.value.trim();


    const nomeUsuarioDigitado =
        usuario.value
            .trim()
            .toLowerCase();


    const senhaDigitada =
        senha.value;


    const tipoSelecionado =
        tipo.value;


    /* ======================================
       VALIDAR NOME
    ======================================= */

    if (
        nome.length < 2
    ) {

        mostrarMensagem(
            "Informe o nome completo.",
            "erro"
        );

        nomeCompleto.focus();

        return;
    }


    /* ======================================
       VALIDAR USUÁRIO
    ======================================= */

    if (
        nomeUsuarioDigitado.length < 3
    ) {

        mostrarMensagem(
            "O usuário precisa ter pelo menos 3 caracteres.",
            "erro"
        );

        usuario.focus();

        return;
    }


    const usuarioValido =
        /^[a-z0-9._-]+$/i.test(
            nomeUsuarioDigitado
        );


    if (!usuarioValido) {

        mostrarMensagem(
            "O usuário pode conter apenas letras, números, ponto, hífen e underline.",
            "erro"
        );

        usuario.focus();

        return;
    }


    /* ======================================
       VALIDAR SENHA
    ======================================= */

    if (
        senhaDigitada.length < 6
    ) {

        mostrarMensagem(
            "A senha precisa ter pelo menos 6 caracteres.",
            "erro"
        );

        senha.focus();

        return;
    }


    /* ======================================
       BLOQUEAR BOTÃO
    ======================================= */

    btnCadastrar.disabled =
        true;

    btnCadastrar.textContent =
        "Cadastrando...";


    try {

        console.log(
            "Enviando cadastro para criar-usuario..."
        );


        const {
            data,
            error
        } =
            await supabaseClient.functions.invoke(
                FUNCAO_CRIAR_USUARIO,
                {
                    body: {
                        nome_completo:
                            nome,

                        usuario:
                            nomeUsuarioDigitado,

                        senha:
                            senhaDigitada,

                        tipo:
                            tipoSelecionado
                    }
                }
            );


        console.log(
            "Resposta da função:",
            data
        );


        console.log(
            "Erro da função:",
            error
        );


        /* ==================================
           ERRO DA CHAMADA
        =================================== */

        if (error) {

            console.error(
                "Erro ao chamar criar-usuario:",
                error
            );


            let mensagemErro =
                error.message ||
                "Não foi possível cadastrar o usuário.";


            if (error.context) {

                try {

                    const resposta =
                        await error.context.json();


                    console.log(
                        "Resposta detalhada:",
                        resposta
                    );


                    if (
                        resposta &&
                        resposta.mensagem
                    ) {

                        mensagemErro =
                            resposta.mensagem;
                    }

                } catch (erroResposta) {

                    console.error(
                        "Não foi possível ler a resposta:",
                        erroResposta
                    );
                }
            }


            throw new Error(
                mensagemErro
            );
        }


        /* ==================================
           VALIDAR RESPOSTA
        =================================== */

        if (
            !data ||
            data.sucesso !== true
        ) {

            throw new Error(
                data?.mensagem ||
                "Não foi possível cadastrar o usuário."
            );
        }


        /* ==================================
           SUCESSO
        =================================== */

        mostrarMensagem(
            "Vendedor cadastrado com sucesso!",
            "sucesso"
        );


        formUsuario.reset();


        tipo.value =
            "vendedor";


        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao cadastrar usuário:",
            erro
        );


        mostrarMensagem(
            erro.message ||
            "Erro ao cadastrar usuário.",
            "erro"
        );


    } finally {

        btnCadastrar.disabled =
            false;

        btnCadastrar.textContent =
            "Cadastrar vendedor";
    }
}


/* ==========================================
   CARREGAR USUÁRIOS
========================================== */

async function carregarUsuarios() {

    carregando.style.display =
        "block";

    listaUsuarios.innerHTML =
        "";

    semUsuarios.style.display =
        "none";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("perfis")
                .select(
                    "id, nome_completo, usuario, tipo, ativo, criado_em"
                )
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

            semUsuarios.style.display =
                "block";

            return;
        }


        data.forEach(
            criarLinhaUsuario
        );


    } catch (erro) {

        carregando.style.display =
            "none";


        console.error(
            "Erro ao carregar usuários:",
            erro
        );


        mostrarMensagem(
            "Não foi possível carregar os usuários: " +
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

function criarLinhaUsuario(
    perfil
) {

    const tr =
        document.createElement("tr");


    const nome =
        perfil.nome_completo ||
        "-";


    const nomeLogin =
        perfil.usuario ||
        "-";


    const tipoUsuario =
        perfil.tipo === "admin"
            ? "Administrador"
            : "Vendedor";


    const ativo =
        perfil.ativo === true;


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


    const classeBotao =
        ativo
            ? "desativar"
            : "ativar";


    tr.innerHTML = `

        <td>
            ${escaparHtml(nome)}
        </td>

        <td>
            ${escaparHtml(nomeLogin)}
        </td>

        <td>
            ${tipoUsuario}
        </td>

        <td>

            <span class="status ${classeStatus}">
                ${statusTexto}
            </span>

        </td>

        <td>

            <button
                type="button"
                class="botao-status ${classeBotao}"
                data-id="${perfil.id}"
                data-ativo="${ativo}"
            >
                ${textoBotao}
            </button>

        </td>

    `;


    listaUsuarios.appendChild(
        tr
    );


    const botao =
        tr.querySelector(
            ".botao-status"
        );


    if (
        perfil.id ===
        obterIdUsuarioLogado()
    ) {

        botao.style.display =
            "none";

    } else {

        botao.addEventListener(
            "click",
            function () {

                alterarStatusUsuario(
                    perfil.id,
                    !ativo
                );

            }
        );
    }
}


/* ==========================================
   OBTER ID DO ADMIN
========================================== */

function obterIdUsuarioLogado() {

    const perfilSalvo =
        sessionStorage.getItem(
            "sistemaLojaPerfil"
        );


    if (!perfilSalvo) {

        return null;
    }


    try {

        const perfil =
            JSON.parse(
                perfilSalvo
            );


        return perfil.id ||
            null;


    } catch {

        return null;
    }
}


/* ==========================================
   ALTERAR STATUS
========================================== */

async function alterarStatusUsuario(
    id,
    novoStatus
) {

    const mensagemConfirmacao =
        novoStatus
            ? "Deseja ativar este usuário?"
            : "Deseja desativar este usuário?";


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
            await supabaseClient
                .from("perfis")
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
                ? "Usuário ativado com sucesso."
                : "Usuário desativado com sucesso.",
            "sucesso"
        );


        await carregarUsuarios();


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
   SAIR
========================================== */

async function sair() {

    try {

        await supabaseClient.auth.signOut();

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
   MENU
========================================== */

function configurarMenu() {

    document
        .querySelectorAll(
            "[data-futuro]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        alert(
                            botao.dataset.futuro +
                            " será desenvolvido nesta etapa."
                        );

                    }
                );

            }
        );
}


/* ==========================================
   INICIAR
========================================== */

async function iniciarUsuarios() {

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


    formUsuario.addEventListener(
        "submit",
        cadastrarUsuario
    );


    btnAtualizar.addEventListener(
        "click",
        carregarUsuarios
    );


    await carregarUsuarios();
}


/* ==========================================
   EXECUTAR
========================================== */

iniciarUsuarios();