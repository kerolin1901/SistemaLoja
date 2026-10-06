/* ==========================================
   SISTEMA DA LOJA
   PAINEL ADMINISTRATIVO
   ADMIN.JS
========================================== */


/* ==========================================
   PROTEGER PAINEL
========================================== */

protegerAdmin();


/* ==========================================
   SUPABASE
========================================== */

const adminSupabase = supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const nomeAdministrador =
    document.getElementById("nomeAdministrador");

const avatarAdministrador =
    document.querySelector(".avatar-admin");

const btnSair =
    document.getElementById("btnSair");

const dataAtual =
    document.getElementById("dataAtual");


/* ==========================================
   MOSTRAR ADMINISTRADOR
========================================== */

async function carregarAdministrador() {

    try {

        const resultado =
            await adminSupabase.auth.getUser();

        const usuario =
            resultado.data.user;

        if (!usuario) {

            window.location.href =
                "index.html";

            return;
        }


        const perfilResultado =
            await adminSupabase
                .from("perfis")
                .select("*")
                .eq("id", usuario.id)
                .single();


        if (
            perfilResultado.error ||
            !perfilResultado.data
        ) {

            await adminSupabase.auth.signOut();

            window.location.href =
                "index.html";

            return;
        }


        const perfil =
            perfilResultado.data;


        if (perfil.tipo !== "admin") {

            window.location.href =
                "vendedor.html";

            return;
        }


        if (!perfil.ativo) {

            await adminSupabase.auth.signOut();

            alert(
                "Seu usuário está desativado."
            );

            window.location.href =
                "index.html";

            return;
        }


        if (nomeAdministrador) {

            nomeAdministrador.textContent =
                perfil.nome_completo ||
                "Administrador";
        }


        if (avatarAdministrador) {

            const nome =
                perfil.nome_completo ||
                "Administrador";

            avatarAdministrador.textContent =
                nome
                    .charAt(0)
                    .toUpperCase();
        }


        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar administrador:",
            erro
        );

        window.location.href =
            "index.html";
    }
}


/* ==========================================
   DATA ATUAL
========================================== */

function mostrarDataAtual() {

    if (!dataAtual) {
        return;
    }


    const agora =
        new Date();


    dataAtual.textContent =
        agora.toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
}


/* ==========================================
   SAIR
========================================== */

async function sair() {

    try {

        const resultado =
            await adminSupabase.auth.signOut();


        if (resultado.error) {

            console.error(
                "Erro ao sair:",
                resultado.error
            );

            alert(
                "Não foi possível sair."
            );

            return;
        }


        sessionStorage.removeItem(
            "sistemaLojaPerfil"
        );


        window.location.href =
            "index.html";


    } catch (erro) {

        console.error(
            "Erro ao sair:",
            erro
        );

        alert(
            "Ocorreu um erro ao sair."
        );
    }
}


/* ==========================================
   ÁREAS AINDA NÃO DESENVOLVIDAS
========================================== */

function configurarMenuFuturo() {

    const itens =
        document.querySelectorAll(
            "[data-futuro]"
        );


    itens.forEach(function (item) {

        item.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                const nome =
                    item.getAttribute(
                        "data-futuro"
                    );


                alert(
                    'A área "' +
                    nome +
                    '" será desenvolvida nesta etapa.'
                );

            }
        );

    });
}


/* ==========================================
   EVENTOS
========================================== */

if (btnSair) {

    btnSair.addEventListener(
        "click",
        sair
    );
}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

async function iniciarAdmin() {

    mostrarDataAtual();

    await carregarAdministrador();

    configurarMenuFuturo();
}


iniciarAdmin();