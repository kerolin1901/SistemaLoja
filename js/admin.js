/* ==========================================
   SISTEMA DA LOJA
   PAINEL ADMINISTRATIVO
   ADMIN.JS
========================================== */


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

const dataAtual =
    document.getElementById("dataAtual");


/* ==========================================
   VERIFICAR ADMINISTRADOR
========================================== */

async function carregarAdministrador() {

    try {

        const resultado =
            await adminSupabase.auth.getUser();

        const usuario =
            resultado.data.user;


        /* ======================================
           NÃO ESTÁ LOGADO
        ====================================== */

        if (!usuario) {

            window.location.href =
                "index.html";

            return;
        }


        /* ======================================
           BUSCAR PERFIL
        ====================================== */

        const perfilResultado =
            await adminSupabase
                .from("perfis")
                .select("*")
                .eq("id", usuario.id)
                .single();


        /* ======================================
           PERFIL NÃO ENCONTRADO
        ====================================== */

        if (
            perfilResultado.error ||
            !perfilResultado.data
        ) {

            await adminSupabase.auth.signOut({
                scope: "local"
            });

            sessionStorage.removeItem(
                "sistemaLojaPerfil"
            );

            window.location.href =
                "index.html";

            return;
        }


        const perfil =
            perfilResultado.data;


        /* ======================================
           NÃO É ADMIN
        ====================================== */

        if (perfil.tipo !== "admin") {

            window.location.href =
                "vendedor.html";

            return;
        }


        /* ======================================
           USUÁRIO DESATIVADO
        ====================================== */

        if (!perfil.ativo) {

            await adminSupabase.auth.signOut({
                scope: "local"
            });

            sessionStorage.removeItem(
                "sistemaLojaPerfil"
            );

            alert(
                "Seu usuário está desativado."
            );

            window.location.href =
                "index.html";

            return;
        }


        /* ======================================
           MOSTRAR NOME
        ====================================== */

        if (nomeAdministrador) {

            nomeAdministrador.textContent =
                perfil.nome_completo ||
                "Administrador";
        }


        /* ======================================
           MOSTRAR AVATAR
        ====================================== */

        if (avatarAdministrador) {

            const nome =
                perfil.nome_completo ||
                "Administrador";

            avatarAdministrador.textContent =
                nome
                    .charAt(0)
                    .toUpperCase();
        }


        /* ======================================
           SALVAR PERFIL
        ====================================== */

        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar administrador:",
            erro
        );

        sessionStorage.removeItem(
            "sistemaLojaPerfil"
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
   SAIR DO SISTEMA
========================================== */

async function sair() {

    try {

        console.log(
            "Saindo do sistema..."
        );


        const resultado =
            await adminSupabase.auth.signOut({
                scope: "local"
            });


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


        /* ======================================
           LIMPAR PERFIL
        ====================================== */

        sessionStorage.removeItem(
            "sistemaLojaPerfil"
        );


        /* ======================================
           VOLTAR PARA LOGIN
        ====================================== */

        window.location.href =
            "index.html";

    }

    catch (erro) {

        console.error(
            "Erro ao sair:",
            erro
        );


        /* ======================================
           MESMO COM ERRO,
           LIMPAR SESSÃO LOCAL
        ====================================== */

        sessionStorage.removeItem(
            "sistemaLojaPerfil"
        );


        window.location.href =
            "index.html";
    }
}


/* ==========================================
   ÁREAS FUTURAS
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
   CONFIGURAR BOTÃO SAIR
========================================== */

function configurarBotaoSair() {

    const botaoSair =
        document.getElementById(
            "btnSair"
        );


    if (!botaoSair) {

        console.error(
            "Botão btnSair não encontrado."
        );

        return;
    }


    botaoSair.addEventListener(
        "click",
        sair
    );


    console.log(
        "Botão Sair configurado."
    );
}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

async function iniciarAdmin() {

    mostrarDataAtual();

    configurarBotaoSair();

    await carregarAdministrador();

    configurarMenuFuturo();
}


/* ==========================================
   INICIAR PÁGINA
========================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarAdmin
    );

}
else {

    iniciarAdmin();

}