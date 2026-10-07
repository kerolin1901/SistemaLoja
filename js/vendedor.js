/* ==========================================
   SISTEMA DA LOJA
   ÁREA DO VENDEDOR
   VENDEDOR.JS
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const vendedorSupabase =
    supabaseClient;


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
   DATA ATUAL
========================================== */

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


/* ==========================================
   PROTEGER ÁREA DO VENDEDOR
========================================== */

async function protegerVendedor() {

    try {

        /* ======================================
           VERIFICAR SESSÃO SUPABASE
        ====================================== */

        const resultadoSessao =
            await vendedorSupabase
                .auth
                .getSession();


        const session =
            resultadoSessao
                .data
                .session;


        if (!session) {

            window.location.href =
                "index.html";

            return false;
        }


        /* ======================================
           BUSCAR PERFIL
        ====================================== */

        const resultadoPerfil =
            await vendedorSupabase
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
            resultadoPerfil.error ||
            !resultadoPerfil.data
        ) {

            console.error(
                "Erro ao buscar perfil:",
                resultadoPerfil.error
            );


            await vendedorSupabase
                .auth
                .signOut({
                    scope: "local"
                });


            sessionStorage.removeItem(
                "sistemaLojaPerfil"
            );


            window.location.href =
                "index.html";


            return false;
        }


        const perfil =
            resultadoPerfil.data;


        /* ======================================
           NÃO É VENDEDOR
        ====================================== */

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


            await vendedorSupabase
                .auth
                .signOut({
                    scope: "local"
                });


            sessionStorage.removeItem(
                "sistemaLojaPerfil"
            );


            window.location.href =
                "index.html";


            return false;
        }


        /* ======================================
           USUÁRIO DESATIVADO
        ====================================== */

        if (
            perfil.ativo !== true
        ) {

            await vendedorSupabase
                .auth
                .signOut({
                    scope: "local"
                });


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
           MOSTRAR NOME
        ====================================== */

        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "Vendedor";


        if (nomeVendedor) {

            nomeVendedor.textContent =
                nome;
        }


        /* ======================================
           AVATAR
        ====================================== */

        if (avatarVendedor) {

            const inicial =
                nome
                    .trim()
                    .charAt(0)
                    .toUpperCase();


            avatarVendedor.textContent =
                inicial;
        }


        /* ======================================
           BOAS-VINDAS
        ====================================== */

        if (tituloBoasVindas) {

            tituloBoasVindas.textContent =
                "Bem-vindo, " +
                nome +
                "!";
        }


        /* ======================================
           SALVAR PERFIL
        ====================================== */

        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );


        return true;

    }

    catch (erro) {

        console.error(
            "Erro ao proteger área do vendedor:",
            erro
        );


        sessionStorage.removeItem(
            "sistemaLojaPerfil"
        );


        window.location.href =
            "index.html";


        return false;
    }
}


/* ==========================================
   SAIR
========================================== */

async function sair() {

    try {

        await vendedorSupabase
            .auth
            .signOut({
                scope: "local"
            });

    }

    catch (erro) {

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
   BOTÃO SAIR
========================================== */

function configurarBotaoSair() {

    const botao =
        document.getElementById(
            "btnSair"
        );


    if (!botao) {

        console.error(
            "Botão Sair não encontrado."
        );

        return;
    }


    botao.addEventListener(
        "click",
        sair
    );
}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

async function iniciarVendedor() {

    mostrarDataAtual();


    configurarBotaoSair();


    const autorizado =
        await protegerVendedor();


    if (!autorizado) {

        return;
    }
}


/* ==========================================
   EXECUTAR QUANDO A PÁGINA ESTIVER PRONTA
========================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarVendedor
    );

}
else {

    iniciarVendedor();

}