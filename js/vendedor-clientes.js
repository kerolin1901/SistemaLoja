/* ==========================================
   SISTEMA DA LOJA
   CLIENTES DO VENDEDOR
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const vendedorClientesSupabase =
    supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const formCliente =
    document.getElementById(
        "formCliente"
    );


const clienteNome =
    document.getElementById(
        "clienteNome"
    );


const clienteTelefone =
    document.getElementById(
        "clienteTelefone"
    );


const clienteCPF =
    document.getElementById(
        "clienteCPF"
    );


const clienteEmail =
    document.getElementById(
        "clienteEmail"
    );


const clienteEndereco =
    document.getElementById(
        "clienteEndereco"
    );


const clienteObservacoes =
    document.getElementById(
        "clienteObservacoes"
    );


const listaClientes =
    document.getElementById(
        "listaClientes"
    );


const buscaCliente =
    document.getElementById(
        "buscaCliente"
    );


const filtroStatusCliente =
    document.getElementById(
        "filtroStatusCliente"
    );


const contadorClientes =
    document.getElementById(
        "contadorClientes"
    );


const mensagemCliente =
    document.getElementById(
        "mensagemCliente"
    );


const tituloFormulario =
    document.getElementById(
        "tituloFormulario"
    );


const btnSalvarCliente =
    document.getElementById(
        "btnSalvarCliente"
    );


const btnCancelarEdicao =
    document.getElementById(
        "btnCancelarEdicao"
    );


const nomeVendedor =
    document.getElementById(
        "nomeVendedor"
    );


const avatarVendedor =
    document.getElementById(
        "avatarVendedor"
    );


const dataAtual =
    document.getElementById(
        "dataAtual"
    );


/* ==========================================
   ESTADO
========================================== */

let clientes =
    [];


let clienteEditandoId =
    null;


/* ==========================================
   ESCAPAR HTML
========================================== */

function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texto ?? "";


    return div.innerHTML;
}


/* ==========================================
   DATA
========================================== */

function mostrarDataAtual() {

    const agora =
        new Date();


    const texto =
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
        texto.charAt(0).toUpperCase() +
        texto.slice(1);
}


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = ""
) {

    mensagemCliente.textContent =
        texto;


    mensagemCliente.className =
        "mensagem-cliente";


    if (tipo) {

        mensagemCliente.classList.add(
            tipo
        );
    }
}


/* ==========================================
   PROTEGER VENDEDOR
========================================== */

async function protegerVendedor() {

    try {

        const resultadoSessao =
            await vendedorClientesSupabase
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


        const resultadoPerfil =
            await vendedorClientesSupabase
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

            await vendedorClientesSupabase
                .auth
                .signOut({
                    scope: "local"
                });


            window.location.href =
                "index.html";


            return false;
        }


        const perfil =
            resultadoPerfil.data;


        if (
            perfil.tipo === "admin"
        ) {

            window.location.href =
                "admin.html";


            return false;
        }


        if (
            perfil.tipo !== "vendedor"
        ) {

            await vendedorClientesSupabase
                .auth
                .signOut({
                    scope: "local"
                });


            window.location.href =
                "index.html";


            return false;
        }


        if (
            perfil.ativo !== true
        ) {

            await vendedorClientesSupabase
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


        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "Vendedor";


        nomeVendedor.textContent =
            nome;


        avatarVendedor.textContent =
            nome
                .trim()
                .charAt(0)
                .toUpperCase();


        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );


        return true;

    }

    catch (erro) {

        console.error(
            "Erro ao proteger vendedor:",
            erro
        );


        window.location.href =
            "index.html";


        return false;
    }
}


/* ==========================================
   CARREGAR CLIENTES
========================================== */

async function carregarClientes() {

    listaClientes.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="carregando"
            >
                Carregando clientes...
            </td>

        </tr>

    `;


    const resultado =
        await vendedorClientesSupabase
            .from("clientes")
            .select(
                "id, nome, telefone, cpf, email, endereco, observacoes, ativo"
            )
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (resultado.error) {

        console.error(
            "Erro ao carregar clientes:",
            resultado.error
        );


        mostrarMensagem(
            "Não foi possível carregar os clientes.",
            "erro"
        );


        listaClientes.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="lista-vazia"
                >
                    Não foi possível carregar os clientes.
                </td>

            </tr>

        `;


        return;
    }


    clientes =
        resultado.data || [];


    aplicarFiltros();
}


/* ==========================================
   APLICAR FILTROS
========================================== */

function aplicarFiltros() {

    const texto =
        (
            buscaCliente.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        filtroStatusCliente.value ||
        "";


    const filtrados =
        clientes.filter(
            function (cliente) {

                const nome =
                    (
                        cliente.nome ||
                        ""
                    )
                        .toLowerCase();


                const telefone =
                    (
                        cliente.telefone ||
                        ""
                    )
                        .toLowerCase();


                const cpf =
                    (
                        cliente.cpf ||
                        ""
                    )
                        .toLowerCase();


                const correspondeBusca =
                    !texto ||
                    nome.includes(texto) ||
                    telefone.includes(texto) ||
                    cpf.includes(texto);


                if (
                    !correspondeBusca
                ) {

                    return false;
                }


                if (
                    status === "ativo" &&
                    cliente.ativo !== true
                ) {

                    return false;
                }


                if (
                    status === "inativo" &&
                    cliente.ativo !== false
                ) {

                    return false;
                }


                return true;

            }
        );


    renderizarClientes(
        filtrados
    );
}


/* ==========================================
   RENDERIZAR CLIENTES
========================================== */

function renderizarClientes(
    clientesParaMostrar
) {

    contadorClientes.textContent =
        clientesParaMostrar.length +
        (
            clientesParaMostrar.length === 1
                ? " cliente"
                : " clientes"
        );


    if (
        clientesParaMostrar.length === 0
    ) {

        listaClientes.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="lista-vazia"
                >

                    <strong>
                        Nenhum cliente encontrado
                    </strong>

                    <span>
                        Cadastre um cliente ou altere a pesquisa.
                    </span>

                </td>

            </tr>

        `;


        return;
    }


    listaClientes.innerHTML =
        clientesParaMostrar
            .map(
                function (cliente) {

                    const statusHTML =
                        cliente.ativo === true

                            ? `
                                <span
                                    class="status-cliente status-ativo"
                                >
                                    Ativo
                                </span>
                              `

                            : `
                                <span
                                    class="status-cliente status-inativo"
                                >
                                    Inativo
                                </span>
                              `;


                    return `

                        <tr>

                            <td>

                                <div
                                    class="nome-cliente"
                                >
                                    ${escaparHTML(
                                        cliente.nome
                                    )}
                                </div>

                            </td>


                            <td>

                                <span
                                    class="dado-cliente"
                                >
                                    ${escaparHTML(
                                        cliente.telefone ||
                                        "-"
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="dado-cliente"
                                >
                                    ${escaparHTML(
                                        cliente.cpf ||
                                        "-"
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="dado-cliente"
                                >
                                    ${escaparHTML(
                                        cliente.email ||
                                        "-"
                                    )}
                                </span>

                            </td>


                            <td>

                                ${statusHTML}

                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="botao-editar-cliente"
                                    data-id="${cliente.id}"
                                >
                                    Editar
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            ".botao-editar-cliente"
        )
        .forEach(
            function (botao) {

                botao.addEventListener(
                    "click",
                    function () {

                        editarCliente(
                            Number(
                                botao.dataset.id
                            )
                        );

                    }
                );

            }
        );
}


/* ==========================================
   EDITAR CLIENTE
========================================== */

function editarCliente(id) {

    const cliente =
        clientes.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!cliente) {

        return;
    }


    clienteEditandoId =
        cliente.id;


    clienteNome.value =
        cliente.nome ||
        "";


    clienteTelefone.value =
        cliente.telefone ||
        "";


    clienteCPF.value =
        cliente.cpf ||
        "";


    clienteEmail.value =
        cliente.email ||
        "";


    clienteEndereco.value =
        cliente.endereco ||
        "";


    clienteObservacoes.value =
        cliente.observacoes ||
        "";


    tituloFormulario.textContent =
        "Editar cliente";


    btnSalvarCliente.textContent =
        "Salvar alterações";


    btnCancelarEdicao.hidden =
        false;


    mostrarMensagem(
        ""
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );
}


/* ==========================================
   LIMPAR FORMULÁRIO
========================================== */

function limparFormulario() {

    clienteEditandoId =
        null;


    formCliente.reset();


    tituloFormulario.textContent =
        "Novo cliente";


    btnSalvarCliente.textContent =
        "Salvar cliente";


    btnCancelarEdicao.hidden =
        true;


    mostrarMensagem(
        ""
    );
}


/* ==========================================
   SALVAR CLIENTE
========================================== */

async function salvarCliente(
    evento
) {

    evento.preventDefault();


    mostrarMensagem(
        ""
    );


    const nome =
        clienteNome.value
            .trim();


    if (!nome) {

        mostrarMensagem(
            "Informe o nome do cliente.",
            "erro"
        );


        clienteNome.focus();


        return;
    }


    const dados = {

        nome:
            nome,

        telefone:
            clienteTelefone.value
                .trim() ||
            null,

        cpf:
            clienteCPF.value
                .trim() ||
            null,

        email:
            clienteEmail.value
                .trim() ||
            null,

        endereco:
            clienteEndereco.value
                .trim() ||
            null,

        observacoes:
            clienteObservacoes.value
                .trim() ||
            null

    };


    btnSalvarCliente.disabled =
        true;


    btnSalvarCliente.textContent =
        clienteEditandoId
            ? "Salvando..."
            : "Cadastrando...";


    let resultado;


    if (clienteEditandoId) {

        resultado =
            await vendedorClientesSupabase
                .from("clientes")
                .update(
                    dados
                )
                .eq(
                    "id",
                    clienteEditandoId
                );

    }
    else {

        dados.ativo =
            true;


        resultado =
            await vendedorClientesSupabase
                .from("clientes")
                .insert(
                    dados
                );
    }


    btnSalvarCliente.disabled =
        false;


    btnSalvarCliente.textContent =
        clienteEditandoId
            ? "Salvar alterações"
            : "Salvar cliente";


    if (resultado.error) {

        console.error(
            "Erro ao salvar cliente:",
            resultado.error
        );


        mostrarMensagem(
            resultado.error.message ||
            "Não foi possível salvar o cliente.",
            "erro"
        );


        return;
    }


    mostrarMensagem(
        clienteEditandoId
            ? "Cliente atualizado com sucesso!"
            : "Cliente cadastrado com sucesso!",
        "sucesso"
    );


    limparFormulario();


    await carregarClientes();
}


/* ==========================================
   EVENTOS
========================================== */

formCliente.addEventListener(
    "submit",
    salvarCliente
);


btnCancelarEdicao.addEventListener(
    "click",
    limparFormulario
);


buscaCliente.addEventListener(
    "input",
    aplicarFiltros
);


filtroStatusCliente.addEventListener(
    "change",
    aplicarFiltros
);


/* ==========================================
   BOTÃO SAIR
========================================== */

function configurarBotaoSair() {

    const botao =
        document.getElementById(
            "btnSair"
        );


    if (!botao) {

        return;
    }


    botao.addEventListener(
        "click",
        async function () {

            try {

                await vendedorClientesSupabase
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
    );
}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

async function iniciarVendedorClientes() {

    mostrarDataAtual();


    configurarBotaoSair();


    const autorizado =
        await protegerVendedor();


    if (!autorizado) {

        return;
    }


    await carregarClientes();
}


/* ==========================================
   INICIAR
========================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarVendedorClientes
    );

}
else {

    iniciarVendedorClientes();

}