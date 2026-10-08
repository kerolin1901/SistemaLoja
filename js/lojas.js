/* =========================================================
   SISTEMA DA LOJA
   ADMINISTRADOR GERAL
   GERENCIAMENTO DE LOJAS
   JS COMPLETO
========================================================= */


/* =========================================================
   ELEMENTOS
========================================================= */

const formLoja =
    document.getElementById("formLoja");

const nomeLoja =
    document.getElementById("nomeLoja");

const cnpjLoja =
    document.getElementById("cnpjLoja");

const dataVencimentoLoja =
    document.getElementById("dataVencimentoLoja");

const tituloFormulario =
    document.getElementById("tituloFormulario");

const descricaoFormulario =
    document.getElementById("descricaoFormulario");

const btnCadastrar =
    document.getElementById("btnCadastrar");

const btnCancelarEdicao =
    document.getElementById("btnCancelarEdicao");

const mensagem =
    document.getElementById("mensagem");

const listaLojas =
    document.getElementById("listaLojas");

const carregandoLojas =
    document.getElementById("carregandoLojas") ||
    document.getElementById("carregando");

const semLojas =
    document.getElementById("semLojas");


/* =========================================================
   VARIÁVEIS
========================================================= */

let lojaEmEdicao = null;


/* =========================================================
   MENSAGEM
========================================================= */

function mostrarMensagem(
    texto,
    tipo = "sucesso"
) {

    if (!mensagem) {
        return;
    }

    mensagem.textContent = texto;

    mensagem.className = "";

    mensagem.classList.add("mensagem");

    if (tipo === "erro") {
        mensagem.classList.add("erro");
    }

    if (tipo === "sucesso") {
        mensagem.classList.add("sucesso");
    }

    if (tipo === "aviso") {
        mensagem.classList.add("aviso");
    }

    mensagem.style.display = "block";

    setTimeout(() => {

        if (mensagem) {
            mensagem.style.display = "none";
        }

    }, 5000);
}


/* =========================================================
   PROTEGER PÁGINA
========================================================= */

async function protegerPagina() {

    try {

        const {
            data: {
                session
            }
        } = await supabaseClient.auth.getSession();


        if (!session) {

            window.location.href =
                "index.html";

            return false;
        }


        const {
            data: perfil,
            error
        } = await supabaseClient
            .from("perfis")
            .select(`
                id,
                nome_completo,
                usuario,
                tipo,
                ativo
            `)
            .eq(
                "id",
                session.user.id
            )
            .maybeSingle();


        if (error) {

            console.error(
                "Erro ao verificar perfil:",
                error
            );

            window.location.href =
                "index.html";

            return false;
        }


        if (
            !perfil ||
            perfil.ativo !== true ||
            perfil.usuario !== "admingeral" ||
            perfil.tipo !== "admin_geral"
        ) {

            window.location.href =
                "index.html";

            return false;
        }


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


/* =========================================================
   FORMATAR DATA
========================================================= */

function formatarData(data) {

    if (!data) {
        return "-";
    }

    let dataObj;

    if (
        typeof data === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(data)
    ) {

        dataObj =
            new Date(`${data}T00:00:00`);

    } else {

        dataObj =
            new Date(data);
    }


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


/* =========================================================
   FORMATAR CNPJ
========================================================= */

function formatarCNPJ(valor) {

    const numeros =
        String(valor || "")
            .replace(/\D/g, "")
            .slice(0, 14);


    if (numeros.length <= 2) {

        return numeros;
    }


    if (numeros.length <= 5) {

        return numeros.replace(
            /^(\d{2})(\d+)/,
            "$1.$2"
        );
    }


    if (numeros.length <= 8) {

        return numeros.replace(
            /^(\d{2})(\d{3})(\d+)/,
            "$1.$2.$3"
        );
    }


    if (numeros.length <= 12) {

        return numeros.replace(
            /^(\d{2})(\d{3})(\d{3})(\d+)/,
            "$1.$2.$3/$4"
        );
    }


    return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
    );
}


/* =========================================================
   SOMENTE NÚMEROS DO CNPJ
========================================================= */

function somenteNumerosCNPJ(valor) {

    return String(valor || "")
        .replace(/\D/g, "")
        .slice(0, 14);
}


/* =========================================================
   STATUS DA LICENÇA
========================================================= */

function obterStatusLicenca(
    dataVencimento
) {

    if (!dataVencimento) {

        return {
            classe: "sem-vencimento",
            texto: "Sem vencimento"
        };
    }


    const hoje =
        new Date();

    hoje.setHours(
        0,
        0,
        0,
        0
    );


    const vencimento =
        new Date(
            `${dataVencimento}T00:00:00`
        );


    if (
        Number.isNaN(
            vencimento.getTime()
        )
    ) {

        return {
            classe: "sem-vencimento",
            texto: "Data inválida"
        };
    }


    vencimento.setHours(
        0,
        0,
        0,
        0
    );


    const diferenca =
        vencimento.getTime() -
        hoje.getTime();


    const dias =
        Math.round(
            diferenca /
            (1000 * 60 * 60 * 24)
        );


    if (dias < 0) {

        return {
            classe: "vencida",
            texto: "Licença vencida"
        };
    }


    if (dias === 0) {

        return {
            classe: "urgente",
            texto: "Vence hoje"
        };
    }


    if (dias === 1) {

        return {
            classe: "urgente",
            texto: "Vence em 1 dia"
        };
    }


    if (dias <= 7) {

        return {
            classe: "atencao",
            texto:
                `Vence em ${dias} dias`
        };
    }


    return {
        classe: "ativa",
        texto: "Licença ativa"
    };
}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";
    }


    return String(valor)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   CARREGAR LOJAS
========================================================= */

async function carregarLojas() {

    if (carregandoLojas) {

        carregandoLojas.style.display =
            "block";
    }


    if (semLojas) {

        semLojas.style.display =
            "none";
    }


    if (listaLojas) {

        listaLojas.innerHTML =
            "";
    }


    try {

        /* =================================================
           BUSCAR LOJAS
        ================================================= */

        const {
            data: lojas,
            error: erroLojas
        } = await supabaseClient

            .from("lojas")

            .select(`
                id,
                nome,
                cnpj,
                ativo,
                criado_em,
                data_vencimento
            `)

            .order(
                "nome",
                {
                    ascending: true
                }
            );


        if (erroLojas) {

            throw erroLojas;
        }


        /* =================================================
           BUSCAR ADMINISTRADORES
        ================================================= */

        const {
            data: administradores,
            error: erroAdministradores
        } = await supabaseClient

            .from("perfis")

            .select(`
                id,
                loja_id,
                nome_completo,
                usuario,
                ativo
            `)

            .eq(
                "tipo",
                "admin"
            );


        if (erroAdministradores) {

            throw erroAdministradores;
        }


        /* =================================================
           CONTAGEM DE ADMINISTRADORES
        ================================================= */

        const quantidadeAdministradores =
            {};


        (
            administradores || []
        ).forEach(admin => {

            if (!admin.loja_id) {
                return;
            }


            if (
                !quantidadeAdministradores[
                    admin.loja_id
                ]
            ) {

                quantidadeAdministradores[
                    admin.loja_id
                ] = 0;
            }


            quantidadeAdministradores[
                admin.loja_id
            ]++;

        });


        /* =================================================
           FINALIZAR CARREGAMENTO
        ================================================= */

        if (carregandoLojas) {

            carregandoLojas.style.display =
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


        /* =================================================
           MONTAR TABELA
        ================================================= */

        lojas.forEach(loja => {

            const quantidade =
                quantidadeAdministradores[
                    loja.id
                ] || 0;


            const statusLicenca =
                obterStatusLicenca(
                    loja.data_vencimento
                );


            const cnpjFormatado =
                formatarCNPJ(
                    loja.cnpj
                );


            const dataVencimentoFormatada =
                formatarData(
                    loja.data_vencimento
                );


            const nomeSeguro =
                escaparHTML(
                    loja.nome
                );


            const cnpjSeguro =
                escaparHTML(
                    loja.cnpj || ""
                );


            const dataVencimentoSegura =
                escaparHTML(
                    loja.data_vencimento || ""
                );


            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>
                    ${nomeSeguro}
                </td>

                <td>
                    ${
                        cnpjFormatado
                            ? escaparHTML(
                                cnpjFormatado
                            )
                            : "-"
                    }
                </td>

                <td>
                    <span
                        class="quantidade-administradores"
                    >
                        ${quantidade}
                    </span>
                </td>

                <td>

                    <span
                        class="status-licenca ${statusLicenca.classe}"
                    >
                        ${statusLicenca.texto}
                    </span>

                    ${
                        loja.data_vencimento
                            ? `
                                <small
                                    style="
                                        display:block;
                                        margin-top:4px;
                                        color:#64748b;
                                    "
                                >
                                    ${dataVencimentoFormatada}
                                </small>
                            `
                            : ""
                    }

                </td>

                <td>

                    ${
                        loja.ativo
                            ? `
                                <span
                                    class="status ativo"
                                >
                                    Ativa
                                </span>
                            `
                            : `
                                <span
                                    class="status inativo"
                                >
                                    Inativa
                                </span>
                            `
                    }

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
                            class="btn-acao btn-editar"
                            onclick="editarLoja(
                                '${escaparHTML(
                                    loja.id
                                )}',
                                '${nomeSeguro.replace(
                                    /'/g,
                                    "\\'"
                                )}',
                                '${cnpjSeguro.replace(
                                    /'/g,
                                    "\\'"
                                )}',
                                '${dataVencimentoSegura.replace(
                                    /'/g,
                                    "\\'"
                                )}'
                            )"
                        >
                            ✏️ Editar
                        </button>


                        ${
                            loja.ativo
                                ? `
                                    <button
                                        type="button"
                                        class="btn-acao btn-desativar"
                                        onclick="alternarStatusLoja(
                                            '${escaparHTML(
                                                loja.id
                                            )}',
                                            '${nomeSeguro.replace(
                                                /'/g,
                                                "\\'"
                                            )}',
                                            true
                                        )"
                                    >
                                        🔴 Desativar
                                    </button>
                                `
                                : `
                                    <button
                                        type="button"
                                        class="btn-acao btn-ativar"
                                        onclick="alternarStatusLoja(
                                            '${escaparHTML(
                                                loja.id
                                            )}',
                                            '${nomeSeguro.replace(
                                                /'/g,
                                                "\\'"
                                            )}',
                                            false
                                        )"
                                    >
                                        🟢 Ativar
                                    </button>
                                `
                        }


                        <button
                            type="button"
                            class="btn-acao btn-excluir"
                            onclick="excluirLoja(
                                '${escaparHTML(
                                    loja.id
                                )}',
                                '${nomeSeguro.replace(
                                    /'/g,
                                    "\\'"
                                )}'
                            )"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </td>

            `;


            if (listaLojas) {

                listaLojas.appendChild(
                    tr
                );
            }

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar lojas:",
            erro
        );


        if (carregandoLojas) {

            carregandoLojas.style.display =
                "none";
        }


        mostrarMensagem(
            "Não foi possível carregar as lojas.",
            "erro"
        );
    }
}


/* =========================================================
   EDITAR LOJA
========================================================= */

function editarLoja(
    id,
    nome,
    cnpj = "",
    dataVencimento = ""
) {

    lojaEmEdicao =
        id;


    if (nomeLoja) {

        nomeLoja.value =
            nome || "";
    }


    if (cnpjLoja) {

        cnpjLoja.value =
            formatarCNPJ(
                cnpj
            );
    }


    if (dataVencimentoLoja) {

        dataVencimentoLoja.value =
            dataVencimento || "";
    }


    if (tituloFormulario) {

        tituloFormulario.textContent =
            "Editar loja";
    }


    if (descricaoFormulario) {

        descricaoFormulario.textContent =
            "Altere o nome, CNPJ e vencimento da loja.";
    }


    if (btnCadastrar) {

        btnCadastrar.textContent =
            "Salvar alterações";
    }


    if (btnCancelarEdicao) {

        btnCancelarEdicao.style.display =
            "inline-block";
    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}


/* =========================================================
   CANCELAR EDIÇÃO
========================================================= */

function cancelarEdicao() {

    lojaEmEdicao =
        null;


    if (formLoja) {

        formLoja.reset();
    }


    if (tituloFormulario) {

        tituloFormulario.textContent =
            "Cadastrar nova loja";
    }


    if (descricaoFormulario) {

        descricaoFormulario.textContent =
            "Informe o nome, CNPJ e vencimento da nova loja.";
    }


    if (btnCadastrar) {

        btnCadastrar.textContent =
            "Cadastrar Loja";
    }


    if (btnCancelarEdicao) {

        btnCancelarEdicao.style.display =
            "none";
    }
}


/* =========================================================
   FORMATAR CNPJ AO DIGITAR
========================================================= */

if (cnpjLoja) {

    cnpjLoja.addEventListener(
        "input",
        function () {

            const cursor =
                cnpjLoja.selectionStart;

            const valorAntes =
                cnpjLoja.value;

            cnpjLoja.value =
                formatarCNPJ(
                    valorAntes
                );

            if (
                cursor !== null
            ) {

                cnpjLoja.selectionStart =
                    cnpjLoja.value.length;

                cnpjLoja.selectionEnd =
                    cnpjLoja.value.length;
            }

        }
    );
}


/* =========================================================
   BOTÃO CANCELAR EDIÇÃO
========================================================= */

if (btnCancelarEdicao) {

    btnCancelarEdicao.addEventListener(
        "click",
        cancelarEdicao
    );
}


/* =========================================================
   SALVAR / CADASTRAR LOJA
========================================================= */

if (formLoja) {

    formLoja.addEventListener(

        "submit",

        async function (evento) {

            evento.preventDefault();


            const nome =
                nomeLoja
                    ? nomeLoja.value.trim()
                    : "";


            const cnpj =
                cnpjLoja
                    ? somenteNumerosCNPJ(
                        cnpjLoja.value
                    )
                    : "";


            const dataVencimento =
                dataVencimentoLoja
                    ? dataVencimentoLoja.value
                    : "";


            if (!nome) {

                mostrarMensagem(
                    "Informe o nome da loja.",
                    "erro"
                );

                return;
            }


            if (cnpj.length !== 14) {

                mostrarMensagem(
                    "Informe um CNPJ válido com 14 números.",
                    "erro"
                );

                return;
            }


            if (!dataVencimento) {

                mostrarMensagem(
                    "Informe a data de vencimento da licença.",
                    "erro"
                );

                return;
            }


            if (btnCadastrar) {

                btnCadastrar.disabled =
                    true;
            }


            try {

                /* =========================================
                   EDITAR
                ========================================= */

                if (lojaEmEdicao) {

                    const {
                        error
                    } = await supabaseClient

                        .from("lojas")

                        .update({

                            nome: nome,

                            cnpj: cnpj,

                            data_vencimento:
                                dataVencimento

                        })

                        .eq(
                            "id",
                            lojaEmEdicao
                        );


                    if (error) {

                        throw error;
                    }


                    mostrarMensagem(
                        "Loja atualizada com sucesso.",
                        "sucesso"
                    );


                    cancelarEdicao();


                    await carregarLojas();


                    return;
                }


                /* =========================================
                   CADASTRAR
                ========================================= */

                const {
                    data: {
                        user
                    }
                } =
                    await supabaseClient
                        .auth
                        .getUser();


                if (!user) {

                    throw new Error(
                        "Sessão do administrador não encontrada."
                    );
                }


                const {
                    error
                } = await supabaseClient

                    .from("lojas")

                    .insert({

                        nome: nome,

                        cnpj: cnpj,

                        data_vencimento:
                            dataVencimento

                    });


                if (error) {

                    throw error;
                }


                mostrarMensagem(
                    "Loja cadastrada com sucesso.",
                    "sucesso"
                );


                if (formLoja) {

                    formLoja.reset();
                }


                await carregarLojas();


            } catch (erro) {

                console.error(
                    "Erro ao salvar loja:",
                    erro
                );


                let mensagemErro =
                    "Não foi possível salvar a loja.";


                if (erro?.message) {

                    mensagemErro =
                        erro.message;
                }


                mostrarMensagem(
                    mensagemErro,
                    "erro"
                );


            } finally {

                if (btnCadastrar) {

                    btnCadastrar.disabled =
                        false;
                }

            }

        }

    );
}


/* =========================================================
   ATIVAR / DESATIVAR LOJA
========================================================= */

async function alternarStatusLoja(
    id,
    nome,
    ativoAtual
) {

    const acao =
        ativoAtual
            ? "desativar"
            : "ativar";


    const confirmar =
        confirm(
            `Deseja realmente ${acao} a loja "${nome}"?`
        );


    if (!confirmar) {

        return;
    }


    try {

        const {
            error
        } = await supabaseClient

            .from("lojas")

            .update({

                ativo:
                    !ativoAtual

            })

            .eq(
                "id",
                id
            );


        if (error) {

            throw error;
        }


        mostrarMensagem(

            ativoAtual
                ? "Loja desativada com sucesso."
                : "Loja ativada com sucesso.",

            "sucesso"

        );


        await carregarLojas();


    } catch (erro) {

        console.error(
            "Erro ao alterar status da loja:",
            erro
        );


        mostrarMensagem(

            erro?.message ||
            "Não foi possível alterar o status da loja.",

            "erro"

        );
    }
}


/* =========================================================
   EXCLUIR LOJA COMPLETAMENTE
========================================================= */

async function excluirLoja(
    id,
    nome
) {

    /* =====================================================
       PRIMEIRA CONFIRMAÇÃO
    ===================================================== */

    const primeiraConfirmacao =
        confirm(

            `ATENÇÃO!\n\n` +

            `Você está prestes a excluir definitivamente ` +

            `a loja "${nome}".\n\n` +

            `Todos os dados vinculados a esta loja serão excluídos, ` +

            `incluindo:\n\n` +

            `• produtos\n` +

            `• clientes\n` +

            `• vendas\n` +

            `• itens das vendas\n` +

            `• estoque\n` +

            `• financeiro\n` +

            `• categorias\n` +

            `• usuários e administradores\n\n` +

            `Essa operação não poderá ser desfeita.\n\n` +

            `Deseja continuar?`

        );


    if (!primeiraConfirmacao) {

        return;
    }


    /* =====================================================
       SEGUNDA CONFIRMAÇÃO
    ===================================================== */

    const segundaConfirmacao =
        confirm(

            `CONFIRMAÇÃO FINAL\n\n` +

            `Você está prestes a excluir definitivamente ` +

            `a loja "${nome}".\n\n` +

            `TODOS os dados dessa loja serão apagados.\n\n` +

            `Essa ação NÃO poderá ser desfeita.\n\n` +

            `Tem certeza absoluta que deseja excluir?`

        );


    if (!segundaConfirmacao) {

        return;
    }


    try {

        mostrarMensagem(
            "Excluindo a loja e todos os dados relacionados...",
            "aviso"
        );


        /* =================================================
           CHAMAR FUNÇÃO SEGURA DO SUPABASE
        ================================================= */

        const {
            data,
            error
        } = await supabaseClient.rpc(

            "excluir_loja",

            {
                p_loja_id: id
            }

        );


        if (error) {

            throw error;
        }


        console.log(
            "Resultado da exclusão:",
            data
        );


        mostrarMensagem(
            "Loja excluída completamente com sucesso.",
            "sucesso"
        );


        if (
            lojaEmEdicao === id
        ) {

            cancelarEdicao();
        }


        await carregarLojas();


    } catch (erro) {

        console.error(
            "Erro ao excluir loja:",
            erro
        );


        let mensagemErro =
            "Não foi possível excluir a loja.";


        if (erro?.message) {

            mensagemErro =
                erro.message;
        }


        mostrarMensagem(
            mensagemErro,
            "erro"
        );
    }
}


/* =========================================================
   ATUALIZAR
========================================================= */

const botoesAtualizar =
    document.querySelectorAll(
        "[id='btnAtualizar'], .btn-atualizar"
    );


botoesAtualizar.forEach(
    botao => {

        botao.addEventListener(
            "click",
            async function () {

                await carregarLojas();

            }
        );

    }
);


/* =========================================================
   SAIR
========================================================= */

const botoesSair =
    document.querySelectorAll(
        "[id='btnSair'], .btn-sair"
    );


botoesSair.forEach(
    botao => {

        botao.addEventListener(

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

                }


                window.location.href =
                    "index.html";

            }

        );

    }
);


/* =========================================================
   INICIAR PÁGINA
========================================================= */

(async function iniciar() {

    const autorizado =
        await protegerPagina();


    if (!autorizado) {

        return;
    }


    await carregarLojas();

})();