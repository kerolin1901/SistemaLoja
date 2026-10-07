/* ==========================================
   SISTEMA DA LOJA

   GERENCIAMENTO DE LOJAS
   ADMINISTRADOR GERAL
========================================== */


/* ==========================================
   ELEMENTOS DA PÁGINA
========================================== */

const formLoja =
    document.getElementById("formLoja");

const nomeLoja =
    document.getElementById("nomeLoja");

const btnCadastrar =
    document.getElementById("btnCadastrar");

const mensagem =
    document.getElementById("mensagem");

const carregando =
    document.getElementById("carregando");

const semLojas =
    document.getElementById("semLojas");

const listaLojas =
    document.getElementById("listaLojas");

const btnAtualizar =
    document.getElementById("btnAtualizar");

const btnSair =
    document.getElementById("btnSair");

const nomeAdministrador =
    document.getElementById("nomeAdministrador");

const avatarAdministrador =
    document.querySelector(".avatar-admin");


/* ==========================================
   MENSAGENS
========================================== */

function mostrarMensagem(
    texto,
    tipo = "sucesso"
) {

    if (!mensagem) {
        return;
    }

    mensagem.textContent =
        texto;

    mensagem.className =
        "mensagem " + tipo;

}


function limparMensagem() {

    if (!mensagem) {
        return;
    }

    mensagem.textContent =
        "";

    mensagem.className =
        "mensagem";

}


/* ==========================================
   ESCAPAR HTML
========================================== */

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto ?? "";

    return div.innerHTML;

}


/* ==========================================
   FORMATAR DATA
========================================== */

function formatarData(data) {

    if (!data) {
        return "-";
    }

    const dataObj =
        new Date(data);

    if (
        Number.isNaN(
            dataObj.getTime()
        )
    ) {
        return "-";
    }

    return dataObj.toLocaleDateString(
        "pt-BR"
    );

}


/* ==========================================
   VERIFICAR LOGIN
========================================== */

async function protegerPagina() {

    try {

        const {
            data: {
                session
            },
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


        /* ==========================================
           BUSCAR PERFIL
        ========================================== */

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

            console.error(
                "Erro ao buscar perfil:",
                error
            );

            await supabaseClient
                .auth
                .signOut();

            window.location.href =
                "index.html";

            return false;

        }


        /* ==========================================
           SOMENTE ADMINISTRADOR GERAL
        ========================================== */

        if (
            perfil.tipo !==
                "admin_geral" ||

            perfil.usuario !==
                "admingeral" ||

            perfil.ativo !== true
        ) {

            alert(
                "Acesso permitido somente ao Administrador Geral."
            );

            window.location.href =
                "index.html";

            return false;

        }


        /* ==========================================
           MOSTRAR NOME
        ========================================== */

        if (nomeAdministrador) {

            nomeAdministrador.textContent =
                perfil.nome_completo ||
                "Administrador Geral";

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


        /* ==========================================
           SALVAR PERFIL
        ========================================== */

        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );


        return true;


    } catch (erro) {

        console.error(
            "Erro ao proteger página:",
            erro
        );

        window.location.href =
            "index.html";

        return false;

    }

}


/* ==========================================
   CARREGAR LOJAS
========================================== */

async function carregarLojas() {

    if (!listaLojas) {
        return;
    }


    if (carregando) {

        carregando.style.display =
            "block";

    }


    if (semLojas) {

        semLojas.style.display =
            "none";

    }


    listaLojas.innerHTML =
        "";


    try {

        const {
            data: lojas,
            error
        } =
            await supabaseClient

                .from("lojas")

                .select(
                    "id, nome, ativo, criado_em"
                )

                .order(
                    "nome",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Erro ao carregar lojas:",
                error
            );

            mostrarMensagem(
                "Não foi possível carregar as lojas.",
                "erro"
            );

            return;

        }


        if (carregando) {

            carregando.style.display =
                "none";

        }


        if (
            !lojas ||
            lojas.length === 0
        ) {

            if (semLojas) {

                semLojas.style.display =
                    "block";

            }

            return;

        }


        /* ==========================================
           CRIAR LINHAS
        ========================================== */

        lojas.forEach(
            function (loja) {

                const tr =
                    document.createElement(
                        "tr"
                    );


                const ativo =
                    loja.ativo === true;


                const statusTexto =
                    ativo
                        ? "Ativa"
                        : "Inativa";


                const classeStatus =
                    ativo
                        ? "status-ativa"
                        : "status-inativa";


                const textoBotaoStatus =
                    ativo
                        ? "Desativar"
                        : "Ativar";


                const classeBotaoStatus =
                    ativo
                        ? "botao-desativar"
                        : "botao-ativar";


                tr.innerHTML = `

                    <td>
                        <strong>
                            ${escaparHTML(
                                loja.nome
                            )}
                        </strong>
                    </td>

                    <td>
                        <span
                            class="status-loja ${classeStatus}"
                        >
                            ${statusTexto}
                        </span>
                    </td>

                    <td>
                        ${formatarData(
                            loja.criado_em
                        )}
                    </td>

                    <td>

                        <div
                            class="acoes-loja"
                        >

                            <button
                                type="button"
                                class="botao-loja ${classeBotaoStatus}"
                                data-id="${loja.id}"
                                data-acao="status"
                                data-ativo="${ativo}"
                            >
                                ${textoBotaoStatus}
                            </button>

                            <button
                                type="button"
                                class="botao-loja botao-excluir-loja"
                                data-id="${loja.id}"
                                data-acao="excluir"
                            >
                                🗑️ Excluir
                            </button>

                        </div>

                    </td>

                `;


                listaLojas.appendChild(
                    tr
                );

            }
        );


    } catch (erro) {

        console.error(
            "Erro inesperado ao carregar lojas:",
            erro
        );

        if (carregando) {

            carregando.style.display =
                "none";

        }

        mostrarMensagem(
            "Ocorreu um erro ao carregar as lojas.",
            "erro"
        );

    }

}


/* ==========================================
   ALTERAR STATUS DA LOJA
========================================== */

async function alterarStatusLoja(
    id,
    novoStatus
) {

    const mensagemConfirmacao =
        novoStatus

            ? "Deseja ativar esta loja?"

            : "Deseja desativar esta loja?";


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

                .from("lojas")

                .update({
                    ativo:
                        novoStatus
                })

                .eq(
                    "id",
                    id
                );


        if (error) {

            console.error(
                "Erro ao alterar status:",
                error
            );

            mostrarMensagem(
                "Não foi possível alterar o status da loja.",
                "erro"
            );

            return;

        }


        mostrarMensagem(
            novoStatus
                ? "Loja ativada com sucesso!"
                : "Loja desativada com sucesso!",
            "sucesso"
        );


        await carregarLojas();


    } catch (erro) {

        console.error(
            "Erro:",
            erro
        );

        mostrarMensagem(
            "Ocorreu um erro ao alterar o status.",
            "erro"
        );

    }

}


/* ==========================================
   VERIFICAR SE A LOJA POSSUI DADOS
========================================== */

async function verificarDadosDaLoja(
    lojaId
) {

    const tabelas = [

        {
            nome: "produtos",
            titulo: "produtos"
        },

        {
            nome: "clientes",
            titulo: "clientes"
        },

        {
            nome: "vendas",
            titulo: "vendas"
        },

        {
            nome: "financeiro",
            titulo: "movimentações financeiras"
        },

        {
            nome: "categorias",
            titulo: "categorias"
        },

        {
            nome: "perfis",
            titulo: "usuários"
        }

    ];


    for (
        const tabela of tabelas
    ) {

        try {

            const {
                count,
                error
            } =
                await supabaseClient

                    .from(
                        tabela.nome
                    )

                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )

                    .eq(
                        "loja_id",
                        lojaId
                    );


            /*
               Se a tabela não possuir
               loja_id, simplesmente
               continuamos.
            */

            if (error) {

                console.warn(
                    "Não foi possível verificar " +
                    tabela.nome,
                    error
                );

                continue;

            }


            if (
                Number(count) > 0
            ) {

                return {
                    possuiDados: true,
                    tabela:
                        tabela.titulo,
                    quantidade:
                        Number(count)
                };

            }

        } catch (erro) {

            console.warn(
                "Erro ao verificar tabela:",
                tabela.nome,
                erro
            );

        }

    }


    return {
        possuiDados: false
    };

}


/* ==========================================
   EXCLUIR LOJA
========================================== */

async function excluirLoja(
    id
) {

    try {

        /* ==========================================
           LOCALIZAR LOJA
        ========================================== */

        const {
            data: loja,
            error: erroBusca
        } =
            await supabaseClient

                .from("lojas")

                .select(
                    "id, nome"
                )

                .eq(
                    "id",
                    id
                )

                .maybeSingle();


        if (
            erroBusca ||
            !loja
        ) {

            console.error(
                "Erro ao localizar loja:",
                erroBusca
            );

            mostrarMensagem(
                "Não foi possível localizar a loja.",
                "erro"
            );

            return;

        }


        /* ==========================================
           CONFIRMAÇÃO
        ========================================== */

        const confirmar =
            confirm(
                `ATENÇÃO!\n\n` +
                `Deseja realmente excluir a loja "${loja.nome}"?\n\n` +
                `Essa ação não poderá ser desfeita.`
            );


        if (!confirmar) {

            return;

        }


        /* ==========================================
           VERIFICAR DADOS
        ========================================== */

        const verificacao =
            await verificarDadosDaLoja(
                id
            );


        if (
            verificacao.possuiDados
        ) {

            alert(
                `Não é possível excluir a loja "${loja.nome}".\n\n` +
                `Ela possui ${verificacao.quantidade} registro(s) em ${verificacao.tabela}.\n\n` +
                `Recomendação: desative a loja em vez de excluí-la.`
            );

            return;

        }


        /* ==========================================
           EXCLUIR
        ========================================== */

        const {
            error
        } =
            await supabaseClient

                .from("lojas")

                .delete()

                .eq(
                    "id",
                    id
                );


        if (error) {

            console.error(
                "Erro ao excluir loja:",
                error
            );


            /*
               Caso existam registros relacionados
               protegidos por chave estrangeira.
            */

            if (
                error.code ===
                "23503"
            ) {

                mostrarMensagem(
                    "Esta loja possui dados relacionados e não pode ser excluída. Desative a loja.",
                    "erro"
                );

                return;

            }


            mostrarMensagem(
                "Não foi possível excluir a loja.",
                "erro"
            );

            return;

        }


        mostrarMensagem(
            "Loja excluída com sucesso!",
            "sucesso"
        );


        await carregarLojas();


    } catch (erro) {

        console.error(
            "Erro inesperado ao excluir loja:",
            erro
        );

        mostrarMensagem(
            "Ocorreu um erro ao excluir a loja.",
            "erro"
        );

    }

}


/* ==========================================
   BOTÕES DA TABELA
========================================== */

if (listaLojas) {

    listaLojas.addEventListener(
        "click",
        async function (evento) {

            const botao =
                evento.target.closest(
                    "button"
                );


            if (!botao) {
                return;
            }


            const id =
                botao.dataset.id;

            const acao =
                botao.dataset.acao;


            if (
                !id ||
                !acao
            ) {

                return;

            }


            /* ==========================================
               ATIVAR / DESATIVAR
            ========================================== */

            if (
                acao === "status"
            ) {

                const ativoAtual =
                    botao.dataset.ativo ===
                    "true";

                await alterarStatusLoja(
                    id,
                    !ativoAtual
                );

                return;

            }


            /* ==========================================
               EXCLUIR
            ========================================== */

            if (
                acao === "excluir"
            ) {

                await excluirLoja(
                    id
                );

            }

        }
    );

}


/* ==========================================
   CADASTRAR LOJA
========================================== */

if (formLoja) {

    formLoja.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            limparMensagem();


            const nome =
                nomeLoja.value
                    .trim();


            if (!nome) {

                mostrarMensagem(
                    "Digite o nome da loja.",
                    "erro"
                );

                nomeLoja.focus();

                return;

            }


            if (
                nome.length < 2
            ) {

                mostrarMensagem(
                    "O nome da loja é muito curto.",
                    "erro"
                );

                nomeLoja.focus();

                return;

            }


            btnCadastrar.disabled =
                true;

            btnCadastrar.textContent =
                "Cadastrando...";


            try {

                const {
                    error
                } =
                    await supabaseClient

                        .from("lojas")

                        .insert({

                            nome:
                                nome,

                            ativo:
                                true

                        });


                if (error) {

                    console.error(
                        "Erro ao cadastrar loja:",
                        error
                    );


                    if (
                        error.code ===
                        "23505"
                    ) {

                        mostrarMensagem(
                            "Já existe uma loja com esse nome.",
                            "erro"
                        );

                    } else {

                        mostrarMensagem(
                            "Não foi possível cadastrar a loja.",
                            "erro"
                        );

                    }

                    return;

                }


                mostrarMensagem(
                    "Loja cadastrada com sucesso!",
                    "sucesso"
                );


                formLoja.reset();


                await carregarLojas();


            } catch (erro) {

                console.error(
                    "Erro inesperado:",
                    erro
                );

                mostrarMensagem(
                    "Ocorreu um erro ao cadastrar a loja.",
                    "erro"
                );

            } finally {

                btnCadastrar.disabled =
                    false;

                btnCadastrar.textContent =
                    "Cadastrar Loja";

            }

        }
    );

}


/* ==========================================
   BOTÃO ATUALIZAR
========================================== */

if (btnAtualizar) {

    btnAtualizar.addEventListener(
        "click",
        async function () {

            limparMensagem();

            await carregarLojas();

        }
    );

}


/* ==========================================
   BOTÃO SAIR
========================================== */

if (btnSair) {

    btnSair.addEventListener(
        "click",
        async function () {

            btnSair.disabled =
                true;

            btnSair.textContent =
                "Saindo...";


            try {

                await supabaseClient
                    .auth
                    .signOut({
                        scope: "local"
                    });

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
    );

}


/* ==========================================
   ESTILO DOS BOTÕES DE AÇÃO
========================================== */

(function adicionarEstilosBotoes() {

    if (
        document.getElementById(
            "estilosBotoesLojas"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "estilosBotoesLojas";


    style.textContent = `

        .acoes-loja {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .botao-loja {
            border: none;
            border-radius: 6px;
            padding: 7px 11px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s;
        }

        .botao-loja:hover {
            opacity: 0.85;
            transform: translateY(-1px);
        }

        .botao-desativar {
            background: #fff0f0;
            color: #c62828;
            border: 1px solid #f3c1c1;
        }

        .botao-ativar {
            background: #eaf8ee;
            color: #168544;
            border: 1px solid #b9e3c5;
        }

        .botao-excluir-loja {
            background: #ffe5e5;
            color: #b91c1c;
            border: 1px solid #f1aaaa;
        }

        .status-loja {
            display: inline-block;
            padding: 4px 9px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
        }

        .status-ativa {
            background: #dff7e7;
            color: #168544;
        }

        .status-inativa {
            background: #ffe4e4;
            color: #c62828;
        }

        @media (max-width: 700px) {

            .acoes-loja {
                flex-direction: column;
                align-items: stretch;
            }

            .botao-loja {
                width: 100%;
            }

        }

    `;


    document.head.appendChild(
        style
    );

})();


/* ==========================================
   INICIAR PÁGINA
========================================== */

(async function iniciar() {

    const autorizado =
        await protegerPagina();


    if (!autorizado) {
        return;
    }


    await carregarLojas();

})();