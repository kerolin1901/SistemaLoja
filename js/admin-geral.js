/* ==========================================
   SISTEMA DA LOJA
   ADMINISTRADOR GERAL
   ADMIN-GERAL.JS
========================================== */


/* ==========================================
   ELEMENTOS
========================================== */

const nomeUsuario =
    document.getElementById("nomeUsuario");

const nomeCabecalho =
    document.getElementById("nomeCabecalho");

const totalLojas =
    document.getElementById("totalLojas");

const lojasAtivas =
    document.getElementById("lojasAtivas");

const lojasInativas =
    document.getElementById("lojasInativas");

const mensagem =
    document.getElementById("mensagem");

const btnSair =
    document.getElementById("btnSair");

const btnAdministradores =
    document.getElementById(
        "btnAdministradores"
    );

const btnAdministradoresCard =
    document.getElementById(
        "btnAdministradoresCard"
    );


/* ==========================================
   MOSTRAR MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = "erro"
) {

    if (!mensagem) {
        return;
    }


    mensagem.textContent =
        texto;


    mensagem.className =
        "mensagem-geral " + tipo;
}


/* ==========================================
   PROTEGER PÁGINA
========================================== */

async function protegerAdministradorGeral() {

    try {

        const {
            data: { session },
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
            error: erroPerfil
        } =
            await supabaseClient
                .from("perfis")
                .select(`
                    id,
                    nome_completo,
                    usuario,
                    tipo,
                    ativo,
                    loja_id
                `)
                .eq(
                    "id",
                    session.user.id
                )
                .single();


        if (
            erroPerfil ||
            !perfil
        ) {

            console.error(
                "Erro ao carregar perfil:",
                erroPerfil
            );


            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "index.html";


            return false;
        }


        if (
            perfil.tipo !== "admin_geral" ||
            perfil.usuario !== "admingeral" ||
            perfil.ativo !== true
        ) {

            alert(
                "Acesso permitido somente ao Administrador Geral."
            );


            window.location.href =
                "admin.html";


            return false;
        }


        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );


        if (nomeUsuario) {

            nomeUsuario.textContent =
                perfil.nome_completo ||
                "Administrador Geral";
        }


        if (nomeCabecalho) {

            nomeCabecalho.textContent =
                perfil.nome_completo ||
                "Administrador Geral";
        }


        return true;


    } catch (erro) {

        console.error(
            "Erro ao proteger painel geral:",
            erro
        );


        window.location.href =
            "index.html";


        return false;
    }
}


/* ==========================================
   CARREGAR RESUMO DAS LOJAS
========================================== */

async function carregarResumoLojas() {

    try {

        const {
            data: lojas,
            error
        } =
            await supabaseClient
                .from("lojas")
                .select(
                    "id, nome, ativo"
                );


        if (error) {

            console.error(
                "Erro ao carregar lojas:",
                error
            );


            mostrarMensagem(
                "Não foi possível carregar o resumo das lojas.",
                "erro"
            );


            return;
        }


        const lista =
            lojas || [];


        const total =
            lista.length;


        const ativas =
            lista.filter(
                function (loja) {

                    return loja.ativo === true;

                }
            ).length;


        const inativas =
            lista.filter(
                function (loja) {

                    return loja.ativo !== true;

                }
            ).length;


        if (totalLojas) {

            totalLojas.textContent =
                total;
        }


        if (lojasAtivas) {

            lojasAtivas.textContent =
                ativas;
        }


        if (lojasInativas) {

            lojasInativas.textContent =
                inativas;
        }


    } catch (erro) {

        console.error(
            "Erro inesperado:",
            erro
        );


        mostrarMensagem(
            "Ocorreu um erro ao carregar o resumo.",
            "erro"
        );
    }
}


/* ==========================================
   ADMINISTRADORES
========================================== */

function abrirAdministradores() {

    mostrarMensagem(
        "A área de Administradores será criada na próxima etapa.",
        "sucesso"
    );
}


if (btnAdministradores) {

    btnAdministradores.addEventListener(
        "click",
        function (evento) {

            evento.preventDefault();

            abrirAdministradores();

        }
    );
}


if (btnAdministradoresCard) {

    btnAdministradoresCard.addEventListener(
        "click",
        function () {

            abrirAdministradores();

        }
    );
}


/* ==========================================
   SAIR
========================================== */

if (btnSair) {

    btnSair.addEventListener(
        "click",
        async function () {

            try {

                await supabaseClient
                    .auth
                    .signOut();

            } catch (erro) {

                console.error(
                    "Erro ao sair:",
                    erro
                );

            } finally {

                sessionStorage.removeItem(
                    "sistemaLojaPerfil"
                );


                window.location.href =
                    "index.html";
            }

        }
    );
}


/* ==========================================
   INICIAR
========================================== */

async function iniciarAdministradorGeral() {

    const autorizado =
        await protegerAdministradorGeral();


    if (!autorizado) {
        return;
    }


    await carregarResumoLojas();
}


/* ==========================================
   INICIAR PÁGINA
========================================== */

iniciarAdministradorGeral();