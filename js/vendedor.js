/* ==========================================
   SISTEMA DA LOJA
   ÁREA DO VENDEDOR
========================================== */


/* ==========================================
   ELEMENTOS
========================================== */

const nomeVendedor =
    document.getElementById(
        "nomeVendedor"
    );

const avatarVendedor =
    document.getElementById(
        "avatarVendedor"
    );

const tituloBoasVindas =
    document.getElementById(
        "tituloBoasVindas"
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

async function protegerVendedor() {

    const {
        data: {
            session
        },
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        error ||
        !session
    ) {

        window.location.href =
            "index.html";

        return false;
    }


    const {
        data: perfil,
        error: erroPerfil
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
        erroPerfil ||
        !perfil
    ) {

        await supabaseClient
            .auth
            .signOut();

        sessionStorage.removeItem(
            "sistemaLojaPerfil"
        );

        window.location.href =
            "index.html";

        return false;
    }


    /* ======================================
       NÃO PERMITIR ADMIN NESTA ÁREA
    ======================================= */

    if (
        perfil.tipo !== "vendedor"
    ) {

        if (
            perfil.tipo === "admin"
        ) {

            window.location.href =
                "admin.html";

            return false;
        }


        await supabaseClient
            .auth
            .signOut();

        window.location.href =
            "index.html";

        return false;
    }


    /* ======================================
       VERIFICAR ATIVO
    ======================================= */

    if (
        perfil.ativo !== true
    ) {

        await supabaseClient
            .auth
            .signOut();

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


    /* ======================================
       MOSTRAR DADOS
    ======================================= */

    const nome =
        perfil.nome_completo ||
        perfil.usuario ||
        "Vendedor";


    nomeVendedor.textContent =
        nome;


    const inicial =
        nome
            .trim()
            .charAt(0)
            .toUpperCase();


    avatarVendedor.textContent =
        inicial;


    tituloBoasVindas.textContent =
        "Bem-vindo, " +
        nome +
        "!";


    sessionStorage.setItem(
        "sistemaLojaPerfil",
        JSON.stringify(perfil)
    );


    return true;
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
   MENU FUTURO
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
                            " será desenvolvida na próxima etapa."
                        );

                    }
                );

            }
        );
}


/* ==========================================
   INICIAR
========================================== */

async function iniciarVendedor() {

    mostrarDataAtual();


    const autorizado =
        await protegerVendedor();


    if (!autorizado) {

        return;
    }


    configurarMenu();


    btnSair.addEventListener(
        "click",
        sair
    );
}


/* ==========================================
   EXECUTAR
========================================== */

iniciarVendedor();