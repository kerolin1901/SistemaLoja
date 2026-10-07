/* ==========================================
   SISTEMA DA LOJA
   LOGIN
========================================== */


/* ==========================================
   CONFIGURAÇÃO DOS ADMINISTRADORES
========================================== */

const EMAIL_ADMIN =
    "wlpesca@outlook.com";

const EMAIL_ADMIN_GERAL =
    "amaraldesigner@outlook.com.br";


/* ==========================================
   ELEMENTOS DA TELA
========================================== */

const campoUsuario =
    document.getElementById("usuario");

const campoSenha =
    document.getElementById("senha");

const botaoEntrar =
    document.getElementById("btnEntrar");

const campoMensagem =
    document.getElementById("mensagem");


/* ==========================================
   MOSTRAR MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = "erro"
) {

    if (!campoMensagem) {
        return;
    }

    campoMensagem.textContent =
        texto;

    campoMensagem.className =
        "mensagem " + tipo;

}


/* ==========================================
   LIMPAR MENSAGEM
========================================== */

function limparMensagem() {

    if (!campoMensagem) {
        return;
    }

    campoMensagem.textContent =
        "";

    campoMensagem.className =
        "mensagem";

}


/* ==========================================
   TRANSFORMAR USUÁRIO EM E-MAIL
========================================== */

function obterEmailLogin(usuario) {

    const usuarioNormalizado =
        usuario
            .trim()
            .toLowerCase();


    /* ==========================================
       ADMINISTRADOR DA LOJA
    ========================================== */

    if (
        usuarioNormalizado === "admin"
    ) {

        return EMAIL_ADMIN;

    }


    /* ==========================================
       ADMINISTRADOR GERAL
    ========================================== */

    if (
        usuarioNormalizado === "admingeral"
    ) {

        return EMAIL_ADMIN_GERAL;

    }


    /* ==========================================
       VENDEDORES E DEMAIS USUÁRIOS
    ========================================== */

    return (
        usuarioNormalizado +
        "@login.sistemaloja.local"
    );

}


/* ==========================================
   ENTRAR NO SISTEMA
========================================== */

async function entrar() {

    limparMensagem();


    /* ==========================================
       PEGAR DADOS
    ========================================== */

    const usuario =
        campoUsuario.value
            .trim()
            .toLowerCase();

    const senha =
        campoSenha.value;


    /* ==========================================
       VALIDAR USUÁRIO
    ========================================== */

    if (!usuario) {

        mostrarMensagem(
            "Digite seu usuário."
        );

        campoUsuario.focus();

        return;

    }


    /* ==========================================
       VALIDAR SENHA
    ========================================== */

    if (!senha) {

        mostrarMensagem(
            "Digite sua senha."
        );

        campoSenha.focus();

        return;

    }


    /* ==========================================
       DESABILITAR BOTÃO
    ========================================== */

    botaoEntrar.disabled =
        true;

    botaoEntrar.textContent =
        "Entrando...";


    try {


        /* ==========================================
           OBTER E-MAIL INTERNO
        ========================================== */

        const email =
            obterEmailLogin(
                usuario
            );


        /* ==========================================
           LOGIN SUPABASE
        ========================================== */

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        senha

                });


        /* ==========================================
           ERRO NO LOGIN
        ========================================== */

        if (error) {

            console.error(
                "Erro no login:",
                error
            );


            mostrarMensagem(
                "Usuário ou senha incorretos."
            );

            return;

        }


        /* ==========================================
           VERIFICAR SESSÃO
        ========================================== */

        if (
            !data ||
            !data.user
        ) {

            mostrarMensagem(
                "Não foi possível iniciar a sessão."
            );

            return;

        }


        /* ==========================================
           BUSCAR PERFIL
        ========================================== */

        const {
            data: perfil,
            error: erroPerfil
        } =
            await supabaseClient

                .from("perfis")

                .select(
                    "id, nome_completo, usuario, tipo, ativo, loja_id"
                )

                .eq(
                    "id",
                    data.user.id
                )

                .maybeSingle();


        /* ==========================================
           ERRO PERFIL
        ========================================== */

        if (
            erroPerfil
        ) {

            console.error(
                "Erro ao buscar perfil:",
                erroPerfil
            );


            await supabaseClient
                .auth
                .signOut();


            mostrarMensagem(
                "Não foi possível carregar seu perfil."
            );

            return;

        }


        /* ==========================================
           PERFIL NÃO ENCONTRADO
        ========================================== */

        if (!perfil) {

            await supabaseClient
                .auth
                .signOut();


            mostrarMensagem(
                "Seu usuário ainda não possui um perfil."
            );

            return;

        }


        /* ==========================================
           USUÁRIO DESATIVADO
        ========================================== */

        if (
            perfil.ativo !== true
        ) {

            await supabaseClient
                .auth
                .signOut();


            mostrarMensagem(
                "Seu usuário está desativado."
            );

            return;

        }


        /* ==========================================
           SALVAR INFORMAÇÕES DA SESSÃO
        ========================================== */

        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );


        /* ==========================================
           REDIRECIONAR ADMINISTRADOR GERAL
        ========================================== */

        if (
            perfil.tipo === "admin_geral"
        ) {

            window.location.href =
                "admin-geral.html";

            return;

        }


        /* ==========================================
           REDIRECIONAR ADMINISTRADOR DA LOJA
        ========================================== */

        if (
            perfil.tipo === "admin"
        ) {

            window.location.href =
                "admin.html";

            return;

        }


        /* ==========================================
           REDIRECIONAR VENDEDOR
        ========================================== */

        if (
            perfil.tipo === "vendedor"
        ) {

            window.location.href =
                "vendedor.html";

            return;

        }


        /* ==========================================
           TIPO DESCONHECIDO
        ========================================== */

        await supabaseClient
            .auth
            .signOut();


        mostrarMensagem(
            "Tipo de usuário inválido."
        );


    } catch (erro) {


        console.error(
            "Erro inesperado no login:",
            erro
        );


        mostrarMensagem(
            "Ocorreu um erro ao entrar no sistema."
        );


    } finally {


        /* ==========================================
           REATIVAR BOTÃO
        ========================================== */

        botaoEntrar.disabled =
            false;

        botaoEntrar.textContent =
            "Entrar";

    }

}


/* ==========================================
   BOTÃO ENTRAR
========================================== */

if (botaoEntrar) {

    botaoEntrar.addEventListener(
        "click",
        entrar
    );

}


/* ==========================================
   ENTER NO CAMPO DE SENHA
========================================== */

if (campoSenha) {

    campoSenha.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Enter"
            ) {

                entrar();

            }

        }
    );

}


/* ==========================================
   ENTER NO CAMPO DE USUÁRIO
========================================== */

if (campoUsuario) {

    campoUsuario.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Enter"
            ) {

                entrar();

            }

        }
    );

}