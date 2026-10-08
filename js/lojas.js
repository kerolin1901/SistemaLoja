/* =========================================================
   SISTEMA DA LOJA
   ADMINISTRADOR GERAL
   GERENCIAMENTO DE LOJAS
   JS COMPLETO
========================================================= */


/* =========================================================
   ELEMENTOS
========================================================= */

const formLoja = document.getElementById("formLoja");
const nomeLoja = document.getElementById("nomeLoja");

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
    document.getElementById("carregandoLojas");

const semLojas =
    document.getElementById("semLojas");


/* =========================================================
   VARIÁVEIS
========================================================= */

let lojaEmEdicao = null;


/* =========================================================
   MENSAGEM
========================================================= */

function mostrarMensagem(texto, tipo = "sucesso") {

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

            window.location.href = "index.html";

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
            .eq("id", session.user.id)
            .maybeSingle();


        if (error) {

            console.error(
                "Erro ao verificar perfil:",
                error
            );

            window.location.href = "index.html";

            return false;
        }


        if (
            !perfil ||
            perfil.ativo !== true ||
            perfil.usuario !== "admingeral" ||
            perfil.tipo !== "admin_geral"
        ) {

            window.location.href = "index.html";

            return false;
        }


        return true;

    } catch (erro) {

        console.error(
            "Erro ao proteger página:",
            erro
        );

        window.location.href = "index.html";

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

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
        return "-";
    }

    return dataObj.toLocaleDateString(
        "pt-BR"
    );
}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   CARREGAR LOJAS
========================================================= */

async function carregarLojas() {

    if (carregandoLojas) {
        carregandoLojas.style.display = "block";
    }

    if (semLojas) {
        semLojas.style.display = "none";
    }

    if (listaLojas) {
        listaLojas.innerHTML = "";
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
                ativo,
                criado_em
            `)
            .order("nome", {
                ascending: true
            });


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
            .eq("tipo", "admin");


        if (erroAdministradores) {
            throw erroAdministradores;
        }


        /* =================================================
           CONTAGEM DE ADMINISTRADORES POR LOJA
        ================================================= */

        const quantidadeAdministradores = {};


        (administradores || []).forEach(admin => {

            if (!admin.loja_id) {
                return;
            }

            if (!quantidadeAdministradores[admin.loja_id]) {
                quantidadeAdministradores[admin.loja_id] = 0;
            }

            quantidadeAdministradores[admin.loja_id]++;
        });


        /* =================================================
           FINALIZAR CARREGAMENTO
        ================================================= */

        if (carregandoLojas) {
            carregandoLojas.style.display = "none";
        }


        if (!lojas || lojas.length === 0) {

            if (semLojas) {
                semLojas.style.display = "block";
            }

            return;
        }


        /* =================================================
           MONTAR TABELA
        ================================================= */

        lojas.forEach(loja => {

            const quantidade =
                quantidadeAdministradores[loja.id] || 0;


            const tr =
                document.createElement("tr");


            tr.innerHTML = `

                <td>
                    ${escaparHTML(loja.nome)}
                </td>

                <td>
                    <span class="quantidade-administradores">
                        ${quantidade}
                    </span>
                </td>

                <td>

                    ${
                        loja.ativo
                            ? `
                                <span class="status ativo">
                                    Ativa
                                </span>
                              `
                            : `
                                <span class="status inativo">
                                    Inativa
                                </span>
                              `
                    }

                </td>

                <td>
                    ${formatarData(loja.criado_em)}
                </td>

                <td>

                    <div class="acoes-loja">

                        <button
                            type="button"
                            class="btn-acao btn-editar"
                            onclick="editarLoja(
                                '${loja.id}',
                                '${escaparHTML(loja.nome).replace(/'/g, "\\'")}'
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
                                            '${loja.id}',
                                            '${escaparHTML(loja.nome).replace(/'/g, "\\'")}',
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
                                            '${loja.id}',
                                            '${escaparHTML(loja.nome).replace(/'/g, "\\'")}',
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
                                '${loja.id}',
                                '${escaparHTML(loja.nome).replace(/'/g, "\\'")}'
                            )"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </td>
            `;


            if (listaLojas) {
                listaLojas.appendChild(tr);
            }

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar lojas:",
            erro
        );


        if (carregandoLojas) {
            carregandoLojas.style.display = "none";
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

function editarLoja(id, nome) {

    lojaEmEdicao = id;


    if (nomeLoja) {
        nomeLoja.value = nome;
        nomeLoja.focus();
    }


    if (tituloFormulario) {
        tituloFormulario.textContent =
            "Editar loja";
    }


    if (descricaoFormulario) {
        descricaoFormulario.textContent =
            "Altere o nome da loja.";
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

    lojaEmEdicao = null;


    if (formLoja) {
        formLoja.reset();
    }


    if (tituloFormulario) {
        tituloFormulario.textContent =
            "Cadastrar nova loja";
    }


    if (descricaoFormulario) {
        descricaoFormulario.textContent =
            "Informe o nome da nova loja.";
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


            if (!nome) {

                mostrarMensagem(
                    "Informe o nome da loja.",
                    "erro"
                );

                return;
            }


            if (btnCadastrar) {
                btnCadastrar.disabled = true;
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
                            nome: nome
                        })
                        .eq("id", lojaEmEdicao);


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
                } = await supabaseClient.auth.getUser();


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
                        nome: nome
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
                    btnCadastrar.disabled = false;
                }

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


    const confirmar = confirm(
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
                ativo: !ativoAtual
            })
            .eq("id", id);


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

async function excluirLoja(id, nome) {

    /* =====================================================
       PRIMEIRA CONFIRMAÇÃO
    ===================================================== */

    const primeiraConfirmacao = confirm(
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

    const segundaConfirmacao = confirm(
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


        /* =================================================
           SE ESTAVA EDITANDO ESSA LOJA
        ================================================= */

        if (lojaEmEdicao === id) {
            cancelarEdicao();
        }


        /* =================================================
           ATUALIZAR LISTA
        ================================================= */

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


botoesAtualizar.forEach(botao => {

    botao.addEventListener(
        "click",
        async function () {

            await carregarLojas();

        }
    );

});


/* =========================================================
   SAIR
========================================================= */

const botoesSair =
    document.querySelectorAll(
        "[id='btnSair'], .btn-sair"
    );


botoesSair.forEach(botao => {

    botao.addEventListener(
        "click",
        async function () {

            try {

                await supabaseClient.auth.signOut();

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

});


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