/* ==========================================
   SISTEMA DA LOJA
   ADMINISTRADORES
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
    document.getElementById(
        "formAdministrador"
    );

const nomeAdministrador =
    document.getElementById(
        "nomeAdministrador"
    );

const usuarioAdministrador =
    document.getElementById(
        "usuarioAdministrador"
    );

const senhaAdministrador =
    document.getElementById(
        "senhaAdministrador"
    );

const lojaAdministrador =
    document.getElementById(
        "lojaAdministrador"
    );

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


        if (
            !autorizado
        ) {

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

    carregando.style.display =
        "block";

    semAdministradores.style.display =
        "none";

    containerTabela.style.display =
        "none";

    listaAdministradores.innerHTML =
        "";


    try {


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


        const total =
            administradores.length;


        const ativos =
            administradores.filter(
                administrador =>
                    administrador.ativo === true
            ).length;


        const inativos =
            total - ativos;


        totalAdministradores.textContent =
            total;

        administradoresAtivos.textContent =
            ativos;

        administradoresInativos.textContent =
            inativos;


        if (
            total === 0
        ) {

            carregando.style.display =
                "none";

            semAdministradores.style.display =
                "block";

            return;

        }


        administradores.forEach(
            administrador => {

                const linha =
                    document.createElement(
                        "tr"
                    );


                const nomeLoja =
                    administrador.loja_id
                        ? mapaLojas.get(
                            administrador.loja_id
                        )
                        : null;


                const textoBotao =
                    administrador.ativo
                        ? "🔴 Inativar"
                        : "🟢 Ativar";


                const classeBotao =
                    administrador.ativo
                        ? "btn-inativar-administrador"
                        : "btn-ativar-administrador";


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
                                ${
                                    administrador.ativo
                                        ? "status-ativo"
                                        : "status-inativo"
                                }
                            "
                        >

                            ${
                                administrador.ativo
                                    ? "Ativo"
                                    : "Inativo"
                            }

                        </span>

                    </td>

                    <td>

                        <span class="tipo-administrador">
                            Administrador
                        </span>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn-status-administrador ${classeBotao}"
                            onclick="alternarAdministrador('${administrador.id}', '${escaparHTML(administrador.nome_completo)}', ${administrador.ativo})"
                        >
                            ${textoBotao}
                        </button>

                    </td>

                `;


                listaAdministradores.appendChild(
                    linha
                );

            }
        );


        carregando.style.display =
            "none";

        containerTabela.style.display =
            "block";


    } catch (erro) {

        console.error(
            erro
        );

        carregando.style.display =
            "none";

        mostrarMensagem(
            erro.message ||
            "Erro ao carregar administradores.",
            "erro"
        );

    }

}


/* ==========================================
   ATIVAR / INATIVAR ADMINISTRADOR
========================================== */

async function alternarAdministrador(
    id,
    nome,
    ativoAtual
) {

    const acao =
        ativoAtual
            ? "inativar"
            : "ativar";


    const confirmado =
        confirm(

            ativoAtual

                ?

                `Tem certeza que deseja INATIVAR o administrador "${nome}"?\n\nEle não poderá mais entrar no sistema enquanto estiver inativo.`

                :

                `Deseja ATIVAR novamente o administrador "${nome}"?`

        );


    if (!confirmado) {

        return;

    }


    mostrarMensagem(
        "Alterando status do administrador...",
        "sucesso"
    );


    try {


        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "alternar_status_administrador",
                    {
                        p_administrador_id:
                            id
                    }
                );


        if (error) {

            console.error(
                "Erro ao alterar status:",
                error
            );

            throw new Error(
                error.message ||
                "Não foi possível alterar o status."
            );

        }


        if (
            !data ||
            data.sucesso !== true
        ) {

            throw new Error(
                data?.mensagem ||
                "Não foi possível alterar o status."
            );

        }


        mostrarMensagem(
            data.mensagem ||
            "Status alterado com sucesso.",
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
            "Erro ao alterar o administrador.",
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


    if (!nome) {

        mostrarMensagem(
            "Digite o nome completo.",
            "erro"
        );

        nomeAdministrador.focus();

        return;

    }


    if (!usuario) {

        mostrarMensagem(
            "Digite o nome de usuário.",
            "erro"
        );

        usuarioAdministrador.focus();

        return;

    }


    if (
        senha.length < 6
    ) {

        mostrarMensagem(
            "A senha deve ter pelo menos 6 caracteres.",
            "erro"
        );

        senhaAdministrador.focus();

        return;

    }


    if (!lojaId) {

        mostrarMensagem(
            "Selecione a loja.",
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

    formAdministrador.reset();

    mensagem.textContent =
        "";

    mensagem.className =
        "mensagem";

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
            erro
        );

    }


    window.location.href =
        "index.html";

}


/* ==========================================
   EVENTOS
========================================== */

if (
    formAdministrador
) {

    formAdministrador.addEventListener(
        "submit",
        cadastrarAdministrador
    );

}


if (
    btnCancelarAdministrador
) {

    btnCancelarAdministrador.addEventListener(
        "click",
        limparFormulario
    );

}


if (
    btnAtualizar
) {

    btnAtualizar.addEventListener(
        "click",
        async () => {

            await carregarLojas();

            await carregarAdministradores();

        }
    );

}


if (
    btnSair
) {

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