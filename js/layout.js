/* ==========================================
   SISTEMA DA LOJA
   LAYOUT PADRÃO
   NOME DA LOJA + TIPO DE USUÁRIO
========================================== */


/* ==========================================
   AGUARDAR DOM
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    inicializarLayout
);


/* ==========================================
   INICIALIZAR LAYOUT
========================================== */

async function inicializarLayout() {

    try {

        /* --------------------------------------
           VERIFICAR SESSÃO
        -------------------------------------- */

        const {
            data: {
                user
            },
            error: erroUsuario
        } = await supabaseClient
            .auth
            .getUser();


        if (
            erroUsuario ||
            !user
        ) {

            return;

        }


        /* --------------------------------------
           BUSCAR PERFIL
        -------------------------------------- */

        const {
            data: perfil,
            error: erroPerfil
        } = await supabaseClient
            .from("perfis")
            .select(
                "id, nome_completo, usuario, tipo, ativo, loja_id"
            )
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


        if (erroPerfil) {

            console.error(
                "Erro ao carregar perfil do layout:",
                erroPerfil
            );

            return;

        }


        if (!perfil) {

            return;

        }


        /* --------------------------------------
           VERIFICAR USUÁRIO ATIVO
        -------------------------------------- */

        if (
            perfil.ativo !== true
        ) {

            return;

        }


        /* --------------------------------------
           DEFINIR NOME E TIPO
        -------------------------------------- */

        let nomePrincipal =
            "Sistema da Loja";


        let tipoUsuario =
            "Usuário";


        /* --------------------------------------
           ADMINISTRADOR GERAL
        -------------------------------------- */

        if (
            perfil.tipo === "admin_geral"
        ) {

            nomePrincipal =
                "Sistema da Loja";

            tipoUsuario =
                "Administrador Geral";

        }


        /* --------------------------------------
           ADMINISTRADOR DA LOJA
        -------------------------------------- */

        else if (
            perfil.tipo === "admin"
        ) {

            nomePrincipal =
                await obterNomeLoja(
                    perfil.loja_id
                );

            tipoUsuario =
                "Administrador";

        }


        /* --------------------------------------
           VENDEDOR
        -------------------------------------- */

        else if (
            perfil.tipo === "vendedor"
        ) {

            nomePrincipal =
                await obterNomeLoja(
                    perfil.loja_id
                );

            tipoUsuario =
                "Vendedor";

        }


        /* --------------------------------------
           ATUALIZAR CABEÇALHO
        -------------------------------------- */

        atualizarNomePrincipal(
            nomePrincipal
        );


        atualizarTipoUsuario(
            tipoUsuario
        );


        atualizarNomeUsuario(
            perfil.nome_completo
        );


        atualizarAvatar(
            perfil.nome_completo
        );


    } catch (erro) {

        console.error(
            "Erro ao inicializar layout:",
            erro
        );

    }

}


/* ==========================================
   BUSCAR NOME DA LOJA
========================================== */

async function obterNomeLoja(
    lojaId
) {

    if (!lojaId) {

        return "Minha Loja";

    }


    try {

        const {
            data: loja,
            error
        } = await supabaseClient
            .from("lojas")
            .select("nome")
            .eq(
                "id",
                lojaId
            )
            .maybeSingle();


        if (error) {

            console.error(
                "Erro ao buscar nome da loja:",
                error
            );

            return "Minha Loja";

        }


        if (
            !loja ||
            !loja.nome
        ) {

            return "Minha Loja";

        }


        return loja.nome;


    } catch (erro) {

        console.error(
            "Erro ao buscar loja:",
            erro
        );

        return "Minha Loja";

    }

}


/* ==========================================
   ATUALIZAR NOME PRINCIPAL
========================================== */

function atualizarNomePrincipal(
    nome
) {

    const elementos =
        document.querySelectorAll(
            ".logo-admin strong"
        );


    elementos.forEach(
        function (elemento) {

            elemento.textContent =
                nome;

        }
    );


    /* --------------------------------------
       COMPATIBILIDADE COM PÁGINAS ANTIGAS
    -------------------------------------- */

    const titulos =
        document.querySelectorAll(
            ".logo-admin h1"
        );


    titulos.forEach(
        function (elemento) {

            elemento.textContent =
                nome;

        }
    );

}


/* ==========================================
   ATUALIZAR TIPO DO USUÁRIO
========================================== */

function atualizarTipoUsuario(
    tipo
) {

    /* --------------------------------------
       SUBTÍTULO DO LOGO
    -------------------------------------- */

    const subtitulos =
        document.querySelectorAll(
            ".logo-admin > div:last-child span"
        );


    subtitulos.forEach(
        function (elemento) {

            elemento.textContent =
                tipo;

        }
    );


    /* --------------------------------------
       TIPO ABAIXO DO NOME
    -------------------------------------- */

    const dadosUsuario =
        document.querySelectorAll(
            ".dados-usuario span"
        );


    dadosUsuario.forEach(
        function (elemento) {

            elemento.textContent =
                tipo;

        }
    );


    /* --------------------------------------
       COMPATIBILIDADE
       PÁGINAS COM SPAN DIRETO
    -------------------------------------- */

    const usuarios =
        document.querySelectorAll(
            ".usuario-logado span"
        );


    usuarios.forEach(
        function (elemento) {

            if (
                !elemento.closest(
                    ".dados-usuario"
                )
            ) {

                elemento.textContent =
                    tipo;

            }

        }
    );


}


/* ==========================================
   ATUALIZAR NOME DO USUÁRIO
========================================== */

function atualizarNomeUsuario(
    nome
) {

    if (!nome) {

        return;

    }


    const campo =
        document.getElementById(
            "nomeAdministrador"
        );


    if (campo) {

        campo.textContent =
            nome;

    }

}


/* ==========================================
   ATUALIZAR AVATAR
========================================== */

function atualizarAvatar(
    nome
) {

    const avatar =
        document.querySelector(
            ".avatar-admin"
        );


    if (
        !avatar ||
        !nome
    ) {

        return;

    }


    const nomeLimpo =
        nome
            .trim()
            .replace(
                /\s+/g,
                " "
            );


    if (!nomeLimpo) {

        return;

    }


    const partes =
        nomeLimpo.split(" ");


    let iniciais = "";


    if (
        partes.length >= 2
    ) {

        iniciais =
            partes[0].charAt(0) +
            partes[
                partes.length - 1
            ].charAt(0);

    } else {

        iniciais =
            partes[0].charAt(0);

    }


    avatar.textContent =
        iniciais.toUpperCase();

}


/* ==========================================
   FUNÇÃO GLOBAL
   CASO OUTRA PÁGINA PRECISE ATUALIZAR
========================================== */

window.atualizarLayoutSistema =
    inicializarLayout;