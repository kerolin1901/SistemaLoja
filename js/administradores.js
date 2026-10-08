/* ==========================================
   SISTEMA DA LOJA
   ADMINISTRADORES
   ADMINISTRADOR GERAL
========================================== */

/* ==========================================
   CONFIGURAÇÃO
========================================== */

const FUNCAO_CRIAR_ADMINISTRADOR =
    "smart-task";

/* ==========================================
   ELEMENTOS
========================================== */

const nomeUsuario =
    document.getElementById("nomeUsuario");

const mensagem =
    document.getElementById("mensagem");

const formAdministrador =
    document.getElementById("formAdministrador");

const nomeAdministrador =
    document.getElementById("nomeAdministrador");

const usuarioAdministrador =
    document.getElementById("usuarioAdministrador");

const senhaAdministrador =
    document.getElementById("senhaAdministrador");

const lojaAdministrador =
    document.getElementById("lojaAdministrador");

const btnCadastrarAdministrador =
    document.getElementById(
        "btnCadastrarAdministrador"
    );

const btnCancelarAdministrador =
    document.getElementById(
        "btnCancelarAdministrador"
    );

const btnAtualizar =
    document.getElementById(
        "btnAtualizar"
    );

const btnSair =
    document.getElementById(
        "btnSair"
    );

const carregando =
    document.getElementById(
        "carregando"
    );

const semAdministradores =
    document.getElementById(
        "semAdministradores"
    );

const containerTabela =
    document.getElementById(
        "containerTabela"
    );

const listaAdministradores =
    document.getElementById(
        "listaAdministradores"
    );

const pesquisaAdministradores =
    document.getElementById(
        "pesquisaAdministradores"
    );

const semResultadoBuscaAdministradores =
    document.getElementById(
        "semResultadoBuscaAdministradores"
    );

const totalAdministradores =
    document.getElementById(
        "totalAdministradores"
    );

const administradoresAtivos =
    document.getElementById(
        "administradoresAtivos"
    );

const administradoresInativos =
    document.getElementById(
        "administradoresInativos"
    );

/* ==========================================
   MENSAGEM
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
        "mensagem " + tipo;
}

/* ==========================================
   ESCAPAR HTML
========================================== */

function escaparHTML(valor) {

    return String(
        valor ?? ""
    )

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

/* ==========================================
   OBTER PERFIL ATUAL
========================================== */

async function obterPerfilAtual() {

    const {
        data: {
            user
        },
        error: erroUsuario
    } =

        await supabaseClient
            .auth
            .getUser();

    if (
        erroUsuario ||
        !user
    ) {

        throw new Error(
            "Sessão não encontrada."
        );
    }

    const {
        data: perfil,
        error
    } =

        await supabaseClient

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
                user.id
            )

            .maybeSingle();

    if (error) {

        throw new Error(
            "Não foi possível verificar seu perfil."
        );
    }

    if (!perfil) {

        throw new Error(
            "Perfil não encontrado."
        );
    }

    return perfil;
}

/* ==========================================
   PROTEGER PÁGINA
========================================== */

async function protegerAdministradorGeral() {

    try {

        const perfil =
            await obterPerfilAtual();

        const autorizado =

            perfil.ativo === true

            &&

            (
                perfil.tipo ===
                    "admin_geral"

                ||

                perfil.usuario ===
                    "admingeral"
            );

        if (!autorizado) {

            window.location.href =
                "index.html";

            return false;
        }

        if (nomeUsuario) {

            nomeUsuario.textContent =

                perfil.nome_completo ||

                "Administrador Geral";
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

/* ==========================================
   CARREGAR LOJAS
========================================== */

async function carregarLojas() {

    if (!lojaAdministrador) {

        return;
    }

    lojaAdministrador.innerHTML = `

        <option value="">
            Carregando lojas...
        </option>

    `;

    const {
        data: lojas,
        error
    } =

        await supabaseClient

            .from("lojas")

            .select(
                "id, nome, ativo"
            )

            .eq(
                "ativo",
                true
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

        lojaAdministrador.innerHTML = `

            <option value="">
                Erro ao carregar lojas
            </option>

        `;

        mostrarMensagem(
            "Não foi possível carregar as lojas.",
            "erro"
        );

        return;
    }

    lojaAdministrador.innerHTML = `

        <option value="">
            Selecione a loja
        </option>

    `;

    (lojas || [])

        .forEach(

            loja => {

                const option =

                    document.createElement(
                        "option"
                    );

                option.value =
                    loja.id;

                option.textContent =
                    loja.nome;

                lojaAdministrador.appendChild(
                    option
                );
            }

        );

    if (
        !lojas ||
        lojas.length === 0
    ) {

        mostrarMensagem(
            "Não existem lojas ativas para cadastrar um administrador.",
            "erro"
        );
    }
}

/* ==========================================
   CARREGAR ADMINISTRADORES
========================================== */

async function carregarAdministradores() {

    if (carregando) {

        carregando.style.display =
            "block";
    }

    if (semAdministradores) {

        semAdministradores.style.display =
            "none";
    }

    if (containerTabela) {

        containerTabela.style.display =
            "none";
    }

    if (listaAdministradores) {

        listaAdministradores.innerHTML =
            "";
    }

    if (semResultadoBuscaAdministradores) {

        semResultadoBuscaAdministradores.style.display =
            "none";
    }

    try {

        /* ======================================
           BUSCAR ADMINISTRADORES
        ====================================== */

        const {
            data: perfis,
            error
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
                    "tipo",
                    "admin"
                )

                .order(
                    "nome_completo",
                    {
                        ascending: true
                    }
                );

        if (error) {

            console.error(
                "Erro ao buscar administradores:",
                error
            );

            throw new Error(
                "Não foi possível carregar os administradores."
            );
        }

        const administradores =
            perfis || [];

        /* ======================================
           BUSCAR LOJAS
        ====================================== */

        const {
            data: lojas,
            error: erroLojas
        } =

            await supabaseClient

                .from("lojas")

                .select(
                    "id, nome"
                )

                .order(
                    "nome",
                    {
                        ascending: true
                    }
                );

        if (erroLojas) {

            throw new Error(
                "Não foi possível carregar as lojas."
            );
        }

        /* ======================================
           MAPA DAS LOJAS
        ====================================== */

        const mapaLojas =
            new Map();

        (lojas || [])

            .forEach(

                loja => {

                    mapaLojas.set(
                        loja.id,
                        loja.nome
                    );
                }

            );

        /* ======================================
           CONTADORES
        ====================================== */

        const total =
            administradores.length;

        const ativos =

            administradores.filter(

                administrador =>

                    administrador.ativo === true

            ).length;

        const inativos =
            total - ativos;

        if (totalAdministradores) {

            totalAdministradores.textContent =
                total;
        }

        if (administradoresAtivos) {

            administradoresAtivos.textContent =
                ativos;
        }

        if (administradoresInativos) {

            administradoresInativos.textContent =
                inativos;
        }

        /* ======================================
           NENHUM ADMINISTRADOR
        ====================================== */

        if (total === 0) {

            if (carregando) {

                carregando.style.display =
                    "none";
            }

            if (semAdministradores) {

                semAdministradores.style.display =
                    "block";
            }

            return;
        }

        /* ======================================
           MONTAR TABELA
        ====================================== */

        administradores.forEach(

            administrador => {

                const linha =

                    document.createElement(
                        "tr"
                    );

                const nomeLoja =

                    administrador.loja_id

                        ?

                        mapaLojas.get(
                            administrador.loja_id
                        )

                        :

                        null;

                /* ==================================
                   STATUS
                ================================== */

                const textoStatus =

                    administrador.ativo

                        ? "Ativo"

                        : "Inativo";

                const classeStatus =

                    administrador.ativo

                        ? "status-ativo"

                        : "status-inativo";

                /* ==================================
                   BOTÃO ATIVAR / INATIVAR
                ================================== */

                const textoBotaoStatus =

                    administrador.ativo

                        ? "🔴 Inativar"

                        : "🟢 Ativar";

                const acaoStatus =

                    administrador.ativo

                        ? "false"

                        : "true";

                /* ==================================
                   LINHA
                ================================== */

                linha.innerHTML = `

                    <td>

                        <strong>

                            ${escaparHTML(
                                administrador.nome_completo
                            )}

                        </strong>

                    </td>

                    <td>

                        ${escaparHTML(
                            administrador.usuario
                        )}

                    </td>

                    <td>

                        ${

                            nomeLoja

                                ?

                                `

                                <span class="nome-loja">

                                    ${escaparHTML(
                                        nomeLoja
                                    )}

                                </span>

                                `

                                :

                                `

                                <span class="sem-loja">

                                    Sem loja

                                </span>

                                `
                        }

                    </td>

                    <td>

                        <span

                            class="

                                status-administrador

                                ${classeStatus}

                            "

                        >

                            ${textoStatus}

                        </span>

                    </td>

                    <td>

                        Administrador

                    </td>

                    <td>

                        <div

                            class="acoes-administrador"

                            style="

                                display:flex;

                                gap:6px;

                                flex-wrap:wrap;

                                align-items:center;

                            "

                        >

                            <button

                                type="button"

                                class="btn-acao btn-status-administrador"

                                onclick="alternarAdministrador(

                                    '${administrador.id}',

                                    '${escaparHTML(

                                        administrador.nome_completo

                                    ).replace(

                                        /'/g,

                                        "\\\'"

                                    )}',

                                    ${acaoStatus}

                                )"

                            >

                                ${textoBotaoStatus}

                            </button>

                            <button

                                type="button"

                                class="btn-acao btn-excluir-administrador"

                                onclick="excluirAdministrador(

                                    '${administrador.id}',

                                    '${escaparHTML(

                                        administrador.nome_completo

                                    ).replace(

                                        /'/g,

                                        "\\\'"

                                    )}',

                                    '${escaparHTML(

                                        administrador.usuario

                                    ).replace(

                                        /'/g,

                                        "\\\'"

                                    )}'

                                )"

                            >

                                🗑️ Excluir

                            </button>

                        </div>

                    </td>

                `;

                if (listaAdministradores) {

                    listaAdministradores.appendChild(
                        linha
                    );
                }
            }
        );

        if (carregando) {

            carregando.style.display =
                "none";
        }

        if (containerTabela) {

            containerTabela.style.display =
                "block";
        }

        filtrarAdministradores();

    } catch (erro) {

        console.error(
            "Erro ao carregar administradores:",
            erro
        );

        if (carregando) {

            carregando.style.display =
                "none";
        }

        mostrarMensagem(
            erro.message ||
            "Erro ao carregar administradores.",
            "erro"
        );
    }
}

/* ==========================================
   FILTRAR ADMINISTRADORES
========================================== */

function filtrarAdministradores() {

    if (!listaAdministradores) {

        return;
    }

    const termo =

        pesquisaAdministradores

            ? pesquisaAdministradores.value
                .trim()
                .toLowerCase()

            : "";

    const linhas =

        listaAdministradores.querySelectorAll("tr");

    let quantidadeVisivel = 0;

    linhas.forEach(linha => {

        const texto =

            (linha.textContent || "")
                .toLowerCase();

        const encontrou =

            termo === "" ||

            texto.includes(termo);

        linha.style.display =

            encontrou

                ? ""

                : "none";

        if (encontrou) {

            quantidadeVisivel++;
        }

    });

    if (semResultadoBuscaAdministradores) {

        semResultadoBuscaAdministradores.style.display =

            termo !== "" &&

            linhas.length > 0 &&

            quantidadeVisivel === 0

                ? "block"

                : "none";
    }
}

if (pesquisaAdministradores) {

    pesquisaAdministradores.addEventListener(

        "input",

        filtrarAdministradores

    );
}

/* ==========================================
   ALTERAR STATUS DO ADMINISTRADOR
========================================== */

async function alternarAdministrador(

    id,

    nome,

    ativar

) {

    const acao =

        ativar

            ? "ativar"

            : "inativar";

    const confirmar =

        confirm(

            `Deseja realmente ${acao} o administrador "${nome}"?`

        );

    if (!confirmar) {

        return;
    }

    try {

        mostrarMensagem(

            ativar

                ? "Ativando administrador..."

                : "Inativando administrador...",

            "aviso"

        );

        const {
            data,
            error
        } =

            await supabaseClient.rpc(

                "alternar_status_administrador",

                {
                    p_administrador_id:
                        id
                }

            );

        if (error) {

            throw error;
        }

        console.log(

            "Resultado alteração:",

            data

        );

        mostrarMensagem(

            ativar

                ? "Administrador ativado com sucesso."

                : "Administrador inativado com sucesso.",

            "sucesso"

        );

        await carregarAdministradores();

    } catch (erro) {

        console.error(

            "Erro ao alterar administrador:",

            erro

        );

        mostrarMensagem(

            erro.message ||

            "Não foi possível alterar o administrador.",

            "erro"

        );
    }
}

/* ==========================================
   EXCLUIR ADMINISTRADOR
========================================== */

async function excluirAdministrador(

    id,

    nome,

    usuario

) {

    /* ======================================
       PRIMEIRA CONFIRMAÇÃO
    ====================================== */

    const primeiraConfirmacao =

        confirm(

            `ATENÇÃO!\n\n` +

            `Você está prestes a excluir definitivamente ` +

            `o administrador "${nome}".\n\n` +

            `Usuário: ${usuario}\n\n` +

            `O acesso desse administrador ao sistema ` +

            `será removido permanentemente.\n\n` +

            `A loja, produtos, categorias, clientes, ` +

            `vendas, estoque e financeiro NÃO serão excluídos.\n\n` +

            `Deseja continuar?`

        );

    if (!primeiraConfirmacao) {

        return;
    }

    /* ======================================
       SEGUNDA CONFIRMAÇÃO
    ====================================== */

    const segundaConfirmacao =

        confirm(

            `CONFIRMAÇÃO FINAL\n\n` +

            `Excluir definitivamente o administrador:\n\n` +

            `${nome}\n` +

            `Usuário: ${usuario}\n\n` +

            `O usuário não poderá mais entrar no sistema.\n\n` +

            `Tem certeza absoluta que deseja excluir?`

        );

    if (!segundaConfirmacao) {

        return;
    }

    try {

        mostrarMensagem(

            "Excluindo administrador...",

            "aviso"

        );

        /* ==================================
           CHAMAR FUNÇÃO SEGURA
        ================================== */

        const {
            data,
            error
        } =

            await supabaseClient.rpc(

                "excluir_administrador",

                {
                    p_administrador_id:
                        id
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

            "Administrador excluído completamente com sucesso.",

            "sucesso"

        );

        /* ==================================
           ATUALIZAR LISTA
        ================================== */

        await carregarAdministradores();

    } catch (erro) {

        console.error(

            "Erro ao excluir administrador:",

            erro

        );

        mostrarMensagem(

            erro.message ||

            "Não foi possível excluir o administrador.",

            "erro"

        );
    }
}

/* ==========================================
   CADASTRAR ADMINISTRADOR
========================================== */

async function cadastrarAdministrador(

    evento

) {

    evento.preventDefault();

    const nome =

        nomeAdministrador.value.trim();

    const usuario =

        usuarioAdministrador.value

            .trim()

            .toLowerCase();

    const senha =

        senhaAdministrador.value;

    const lojaId =

        lojaAdministrador.value;

    /* ======================================
       VALIDAR NOME
    ====================================== */

    if (!nome) {

        mostrarMensagem(

            "Digite o nome completo.",

            "erro"

        );

        nomeAdministrador.focus();

        return;
    }

    /* ======================================
       VALIDAR USUÁRIO
    ====================================== */

    if (!usuario) {

        mostrarMensagem(

            "Digite o nome de usuário.",

            "erro"

        );

        usuarioAdministrador.focus();

        return;
    }

    /* ======================================
       VALIDAR SENHA
    ====================================== */

    if (senha.length < 6) {

        mostrarMensagem(

            "A senha deve ter pelo menos 6 caracteres.",

            "erro"

        );

        senhaAdministrador.focus();

        return;
    }

    /* ======================================
       VALIDAR LOJA
    ====================================== */

    if (!lojaId) {

        mostrarMensagem(

            "Selecione uma loja.",

            "erro"

        );

        lojaAdministrador.focus();

        return;
    }

    btnCadastrarAdministrador.disabled =
        true;

    btnCadastrarAdministrador.textContent =
        "Criando administrador...";

    try {

        /* ==================================
           PEGAR SESSÃO
        ================================== */

        const {
            data: sessaoData
        } =

            await supabaseClient

                .auth

                .getSession();

        const accessToken =

            sessaoData

                .session

                ?.access_token;

        if (!accessToken) {

            throw new Error(

                "Sua sessão expirou. Faça login novamente."

            );
        }

        /* ==================================
           CHAMAR EDGE FUNCTION
        ================================== */

        const resposta =

            await fetch(

                `${SUPABASE_URL}/functions/v1/${FUNCAO_CRIAR_ADMINISTRADOR}`,

                {

                    method:

                        "POST",

                    headers:

                        {

                            "Authorization":

                                "Bearer " +

                                accessToken,

                            "apikey":

                                SUPABASE_PUBLISHABLE_KEY,

                            "Content-Type":

                                "application/json"

                        },

                    body:

                        JSON.stringify(

                            {

                                nome_completo:

                                    nome,

                                usuario:

                                    usuario,

                                senha:

                                    senha,

                                loja_id:

                                    lojaId

                            }

                        )

                }

            );

        const resultado =

            await resposta.json();

        if (

            !resposta.ok ||

            !resultado.sucesso

        ) {

            throw new Error(

                resultado.mensagem ||

                "Não foi possível criar o administrador."

            );
        }

        mostrarMensagem(

            "Administrador criado com sucesso!",

            "sucesso"

        );

        formAdministrador.reset();

        await carregarLojas();

        await carregarAdministradores();

    } catch (erro) {

        console.error(

            "Erro ao criar administrador:",

            erro

        );

        mostrarMensagem(

            erro.message ||

            "Erro ao criar administrador.",

            "erro"

        );

    } finally {

        btnCadastrarAdministrador.disabled =
            false;

        btnCadastrarAdministrador.textContent =
            "👤 Cadastrar Administrador";
    }
}

/* ==========================================
   LIMPAR FORMULÁRIO
========================================== */

function limparFormulario() {

    if (formAdministrador) {

        formAdministrador.reset();
    }

    if (mensagem) {

        mensagem.textContent =
            "";

        mensagem.className =
            "mensagem";
    }
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

    window.location.href =
        "index.html";
}

/* ==========================================
   EVENTOS
========================================== */

if (formAdministrador) {

    formAdministrador.addEventListener(

        "submit",

        cadastrarAdministrador

    );
}

if (btnCancelarAdministrador) {

    btnCancelarAdministrador.addEventListener(

        "click",

        limparFormulario

    );
}

if (btnAtualizar) {

    btnAtualizar.addEventListener(

        "click",

        async () => {

            await carregarLojas();

            await carregarAdministradores();

        }

    );
}

if (btnSair) {

    btnSair.addEventListener(

        "click",

        sair

    );
}

/* ==========================================
   INICIAR
========================================== */

async function iniciarAdministradores() {

    const autorizado =

        await protegerAdministradorGeral();

    if (!autorizado) {

        return;
    }

    await carregarLojas();

    await carregarAdministradores();
}

iniciarAdministradores();