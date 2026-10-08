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
   VERIFICAR LICENÇA DA LOJA
========================================== */

async function verificarLicencaLoja(
    lojaId
) {

    if (!lojaId) {

        return {
            permitida: false,
            mensagem:
                "Seu usuário não está vinculado a uma loja."
        };

    }


    try {

        const {
            data: loja,
            error
        } = await supabaseClient

            .from("lojas")

            .select(`
                id,
                nome,
                data_vencimento
            `)

            .eq(
                "id",
                lojaId
            )

            .maybeSingle();


        /* ==========================================
           ERRO AO BUSCAR LOJA
        ========================================== */

        if (error) {

            console.error(
                "Erro ao verificar licença da loja:",
                error
            );

            return {
                permitida: false,
                mensagem:
                    "Não foi possível verificar a licença da loja."
            };

        }


        /* ==========================================
           LOJA NÃO ENCONTRADA
        ========================================== */

        if (!loja) {

            return {
                permitida: false,
                mensagem:
                    "A loja vinculada ao seu usuário não foi encontrada."
            };

        }


        /* ==========================================
           DATA DE VENCIMENTO OBRIGATÓRIA
        ========================================== */

        if (
            !loja.data_vencimento
        ) {

            return {
                permitida: false,
                mensagem:
                    "A licença desta loja não possui uma data de vencimento cadastrada. Entre em contato com o Administrador Geral."
            };

        }


        /* ==========================================
           DATA DE HOJE
        ========================================== */

        const agora =
            new Date();

        const ano =
            agora.getFullYear();

        const mes =
            String(
                agora.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const dia =
            String(
                agora.getDate()
            ).padStart(
                2,
                "0"
            );


        const hoje =
            `${ano}-${mes}-${dia}`;


        /* ==========================================
           LICENÇA VENCIDA
        ========================================== */

        if (
            loja.data_vencimento <
            hoje
        ) {

            return {
                permitida: false,
                mensagem:
                    `A licença da loja "${loja.nome}" está vencida. Entre em contato com o Administrador Geral para renovar o acesso.`
            };

        }


        /* ==========================================
           LICENÇA VÁLIDA
        ========================================== */

        return {
            permitida: true,
            mensagem: ""
        };


    } catch (erro) {

        console.error(
            "Erro inesperado ao verificar licença:",
            erro
        );

        return {
            permitida: false,
            mensagem:
                "Não foi possível verificar a licença da loja."
        };

    }

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
           VERIFICAR LICENÇA DA LOJA
           
           IMPORTANTE:
           O ADMINISTRADOR GERAL NÃO PERTENCE
           A UMA LOJA E NÃO DEVE SER BLOQUEADO
           PELA LICENÇA.
        ========================================== */

        if (
            perfil.tipo !== "admin_geral"
        ) {

            const resultadoLicenca =
                await verificarLicencaLoja(
                    perfil.loja_id
                );


            /* ==========================================
               LICENÇA NÃO PERMITIDA
            ========================================== */

            if (
                !resultadoLicenca.permitida
            ) {

                await supabaseClient
                    .auth
                    .signOut();


                mostrarMensagem(
                    resultadoLicenca.mensagem,
                    "erro"
                );


                return;

            }

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


        /* ==========================================
           ERRO INESPERADO
        ========================================== */

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