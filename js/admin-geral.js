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

const totalAdministradores =
    document.getElementById("totalAdministradores");

const administradoresAtivos =
    document.getElementById("administradoresAtivos");

const administradoresInativos =
    document.getElementById("administradoresInativos");

const totalVendedores =
    document.getElementById("totalVendedores");

const listaResumoLojas =
    document.getElementById("listaResumoLojas");

const carregandoResumoLojas =
    document.getElementById(
        "carregandoResumoLojas"
    );

const vazioResumoLojas =
    document.getElementById(
        "vazioResumoLojas"
    );

const mensagem =
    document.getElementById("mensagem");

const btnSair =
    document.getElementById("btnSair");


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
   CARREGAR RESUMO ADMINISTRATIVO
========================================== */

async function carregarResumoAdministrativo() {

    try {

        if (carregandoResumoLojas) {

            carregandoResumoLojas.classList.add(
                "exibir"
            );
        }


        if (vazioResumoLojas) {

            vazioResumoLojas.classList.remove(
                "exibir"
            );
        }


        if (listaResumoLojas) {

            listaResumoLojas.innerHTML = "";
        }


        /* ======================================
           CARREGAR LOJAS
        ======================================= */

        const {
            data: lojas,
            error: erroLojas
        } =
            await supabaseClient
                .from("lojas")
                .select(
                    "id, nome, ativo"
                )
                .order(
                    "nome",
                    {
                        ascending: true
                    }
                );


        if (erroLojas) {

            throw erroLojas;
        }


        const listaLojas =
            lojas || [];


        /* ======================================
           CARDS DAS LOJAS
        ======================================= */

        const total =
            listaLojas.length;


        const ativas =
            listaLojas.filter(
                function (loja) {

                    return loja.ativo === true;

                }
            ).length;


        const inativas =
            listaLojas.filter(
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


        /* ======================================
           CARREGAR PERFIS
        ======================================= */

        const {
            data: perfis,
            error: erroPerfis
        } =
            await supabaseClient
                .from("perfis")
                .select(
                    "id, nome_completo, usuario, tipo, ativo, loja_id"
                );


        if (erroPerfis) {

            throw erroPerfis;
        }


        const listaPerfis =
            perfis || [];


        /* ======================================
           CONTADORES
        ======================================= */

        const administradores =
            listaPerfis.filter(
                function (perfil) {

                    return perfil.tipo === "admin";

                }
            );


        const vendedores =
            listaPerfis.filter(
                function (perfil) {

                    return perfil.tipo === "vendedor";

                }
            );


        const administradoresAtivosLista =
            administradores.filter(
                function (perfil) {

                    return perfil.ativo === true;

                }
            );


        const administradoresInativosLista =
            administradores.filter(
                function (perfil) {

                    return perfil.ativo !== true;

                }
            );


        if (totalAdministradores) {

            totalAdministradores.textContent =
                administradores.length;
        }


        if (administradoresAtivos) {

            administradoresAtivos.textContent =
                administradoresAtivosLista.length;
        }


        if (administradoresInativos) {

            administradoresInativos.textContent =
                administradoresInativosLista.length;
        }


        if (totalVendedores) {

            totalVendedores.textContent =
                vendedores.length;
        }


        /* ======================================
           RESUMO POR LOJA
        ======================================= */

        if (
            !listaResumoLojas ||
            listaLojas.length === 0
        ) {

            if (vazioResumoLojas) {

                vazioResumoLojas.classList.add(
                    "exibir"
                );
            }

            return;
        }


        listaLojas.forEach(
            function (loja) {

                const administradoresDaLoja =
                    administradores.filter(
                        function (administrador) {

                            return (
                                administrador.loja_id ===
                                loja.id
                            );

                        }
                    ).length;


                const tr =
                    document.createElement("tr");


                const tdNome =
                    document.createElement("td");


                tdNome.textContent =
                    loja.nome ||
                    "Loja sem nome";


                const tdStatus =
                    document.createElement("td");


                const status =
                    document.createElement("span");


                status.className =
                    "status-geral " +
                    (
                        loja.ativo === true
                            ? "ativo"
                            : "inativo"
                    );


                status.textContent =
                    loja.ativo === true
                        ? "Ativa"
                        : "Inativa";


                tdStatus.appendChild(
                    status
                );


                const tdAdministradores =
                    document.createElement("td");


                tdAdministradores.textContent =
                    administradoresDaLoja;


                tr.appendChild(
                    tdNome
                );


                tr.appendChild(
                    tdStatus
                );


                tr.appendChild(
                    tdAdministradores
                );


                listaResumoLojas.appendChild(
                    tr
                );

            }
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar resumo administrativo:",
            erro
        );


        mostrarMensagem(
            "Não foi possível carregar o resumo administrativo.",
            "erro"
        );


        if (listaResumoLojas) {

            listaResumoLojas.innerHTML = "";
        }


    } finally {

        if (carregandoResumoLojas) {

            carregandoResumoLojas.classList.remove(
                "exibir"
            );
        }

    }
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


    await carregarResumoAdministrativo();
}


/* ==========================================
   INICIAR PÁGINA
========================================== */

iniciarAdministradorGeral();