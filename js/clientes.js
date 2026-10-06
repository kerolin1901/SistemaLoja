/* ==========================================
   SISTEMA DA LOJA
   CLIENTES
========================================== */


/* ==========================================
   PROTEÇÃO
========================================== */

async function protegerPaginaClientes() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error || !session) {

        window.location.href = "index.html";

        return false;
    }


    const { data: perfil, error: erroPerfil } =
        await supabaseClient
            .from("perfis")
            .select("*")
            .eq("id", session.user.id)
            .single();


    if (erroPerfil || !perfil) {

        alert("Não foi possível carregar o perfil do usuário.");

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

        return false;
    }


    if (perfil.tipo !== "admin") {

        alert("Acesso permitido somente para administradores.");

        window.location.href = "vendedor.html";

        return false;
    }


    if (!perfil.ativo) {

        alert("Seu usuário está inativo.");

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

        return false;
    }


    const nomeAdministrador =
        document.getElementById("nomeAdministrador");

    const avatarAdministrador =
        document.querySelector(".avatar-admin");


    if (nomeAdministrador) {

        nomeAdministrador.textContent =
            perfil.nome_completo || perfil.usuario || "Administrador";
    }


    if (avatarAdministrador) {

        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "A";

        avatarAdministrador.textContent =
            nome.charAt(0).toUpperCase();
    }


    sessionStorage.setItem(
        "sistemaLojaPerfil",
        JSON.stringify(perfil)
    );


    return true;
}


/* ==========================================
   ELEMENTOS
========================================== */

const formCliente =
    document.getElementById("formCliente");

const nomeCliente =
    document.getElementById("nomeCliente");

const telefoneCliente =
    document.getElementById("telefoneCliente");

const cpfCliente =
    document.getElementById("cpfCliente");

const emailCliente =
    document.getElementById("emailCliente");

const enderecoCliente =
    document.getElementById("enderecoCliente");

const observacoesCliente =
    document.getElementById("observacoesCliente");

const tituloFormulario =
    document.getElementById("tituloFormulario");

const btnNovoCliente =
    document.getElementById("btnNovoCliente");

const btnCancelarCliente =
    document.getElementById("btnCancelarCliente");

const btnSalvarCliente =
    document.getElementById("btnSalvarCliente");

const btnAtualizarClientes =
    document.getElementById("btnAtualizarClientes");

const carregandoClientes =
    document.getElementById("carregandoClientes");

const semClientes =
    document.getElementById("semClientes");

const containerTabelaClientes =
    document.getElementById("containerTabelaClientes");

const listaClientes =
    document.getElementById("listaClientes");

const mensagemCliente =
    document.getElementById("mensagemCliente");

const btnSair =
    document.getElementById("btnSair");


/* ==========================================
   SUPABASE
========================================== */

const clientesSupabase =
    supabaseClient;


/* ==========================================
   ESTADO
========================================== */

let clienteEditandoId = null;


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(texto, tipo = "info") {

    mensagemCliente.textContent = texto;

    mensagemCliente.className =
        "mensagem-admin mensagem-" + tipo;

    mensagemCliente.style.display = "block";


    setTimeout(() => {

        mensagemCliente.style.display = "none";

    }, 4000);
}


/* ==========================================
   LIMPAR FORMULÁRIO
========================================== */

function limparFormulario() {

    clienteEditandoId = null;

    formCliente.reset();

    tituloFormulario.textContent =
        "Novo cliente";

    btnSalvarCliente.textContent =
        "Salvar cliente";
}


/* ==========================================
   NOVO CLIENTE
========================================== */

function novoCliente() {

    limparFormulario();

    nomeCliente.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ==========================================
   CANCELAR
========================================== */

function cancelarCliente() {

    limparFormulario();
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


    if (Number.isNaN(dataObj.getTime())) {
        return "-";
    }


    return dataObj.toLocaleDateString(
        "pt-BR"
    );
}


/* ==========================================
   ESCAPAR HTML
========================================== */

function escaparHtml(valor) {

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


/* ==========================================
   CARREGAR CLIENTES
========================================== */

async function carregarClientes() {

    carregandoClientes.style.display =
        "block";

    semClientes.style.display =
        "none";

    containerTabelaClientes.style.display =
        "none";

    listaClientes.innerHTML = "";


    const {
        data,
        error
    } = await clientesSupabase
        .from("clientes")
        .select(`
            id,
            nome,
            telefone,
            cpf,
            email,
            endereco,
            observacoes,
            ativo,
            criado_em,
            atualizado_em
        `)
        .order("nome", {
            ascending: true
        });


    carregandoClientes.style.display =
        "none";


    if (error) {

        console.error(
            "Erro ao carregar clientes:",
            error
        );

        mostrarMensagem(
            "Não foi possível carregar os clientes.",
            "erro"
        );

        return;
    }


    if (!data || data.length === 0) {

        semClientes.style.display =
            "block";

        return;
    }


    containerTabelaClientes.style.display =
        "block";


    data.forEach(cliente => {

        const tr =
            document.createElement("tr");


        const tdNome =
            document.createElement("td");

        tdNome.innerHTML =
            `
            <div class="nome-cliente-tabela">
                ${escaparHtml(cliente.nome)}
            </div>
            `;


        const tdTelefone =
            document.createElement("td");

        tdTelefone.textContent =
            cliente.telefone || "-";


        const tdCpf =
            document.createElement("td");

        tdCpf.textContent =
            cliente.cpf || "-";


        const tdEmail =
            document.createElement("td");

        tdEmail.textContent =
            cliente.email || "-";


        const tdStatus =
            document.createElement("td");

        const status =
            document.createElement("span");

        status.className =
            cliente.ativo
                ? "status-cliente status-ativo"
                : "status-cliente status-inativo";

        status.textContent =
            cliente.ativo
                ? "Ativo"
                : "Inativo";

        tdStatus.appendChild(status);


        const tdAcoes =
            document.createElement("td");

        const acoes =
            document.createElement("div");

        acoes.className =
            "acoes-cliente";


        const botaoEditar =
            document.createElement("button");

        botaoEditar.type =
            "button";

        botaoEditar.className =
            "botao-acao botao-editar";

        botaoEditar.textContent =
            "Editar";

        botaoEditar.addEventListener(
            "click",
            () => editarCliente(cliente)
        );


        const botaoStatus =
            document.createElement("button");

        botaoStatus.type =
            "button";

        botaoStatus.className =
            "botao-acao botao-status";

        botaoStatus.textContent =
            cliente.ativo
                ? "Inativar"
                : "Ativar";

        botaoStatus.addEventListener(
            "click",
            () => alterarStatusCliente(cliente)
        );


        const botaoExcluir =
            document.createElement("button");

        botaoExcluir.type =
            "button";

        botaoExcluir.className =
            "botao-acao botao-excluir";

        botaoExcluir.textContent =
            "Excluir";

        botaoExcluir.addEventListener(
            "click",
            () => excluirCliente(cliente)
        );


        acoes.appendChild(botaoEditar);
        acoes.appendChild(botaoStatus);
        acoes.appendChild(botaoExcluir);

        tdAcoes.appendChild(acoes);


        tr.appendChild(tdNome);
        tr.appendChild(tdTelefone);
        tr.appendChild(tdCpf);
        tr.appendChild(tdEmail);
        tr.appendChild(tdStatus);
        tr.appendChild(tdAcoes);


        listaClientes.appendChild(tr);

    });
}


/* ==========================================
   EDITAR CLIENTE
========================================== */

function editarCliente(cliente) {

    clienteEditandoId =
        cliente.id;


    nomeCliente.value =
        cliente.nome || "";

    telefoneCliente.value =
        cliente.telefone || "";

    cpfCliente.value =
        cliente.cpf || "";

    emailCliente.value =
        cliente.email || "";

    enderecoCliente.value =
        cliente.endereco || "";

    observacoesCliente.value =
        cliente.observacoes || "";


    tituloFormulario.textContent =
        "Editar cliente";

    btnSalvarCliente.textContent =
        "Atualizar cliente";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    nomeCliente.focus();
}


/* ==========================================
   SALVAR CLIENTE
========================================== */

async function salvarCliente(evento) {

    evento.preventDefault();


    const nome =
        nomeCliente.value.trim();


    if (!nome) {

        mostrarMensagem(
            "Informe o nome do cliente.",
            "erro"
        );

        nomeCliente.focus();

        return;
    }


    btnSalvarCliente.disabled =
        true;

    btnSalvarCliente.textContent =
        clienteEditandoId
            ? "Atualizando..."
            : "Salvando...";


    const dadosCliente = {

        nome: nome,

        telefone:
            telefoneCliente.value.trim() || null,

        cpf:
            cpfCliente.value.trim() || null,

        email:
            emailCliente.value.trim() || null,

        endereco:
            enderecoCliente.value.trim() || null,

        observacoes:
            observacoesCliente.value.trim() || null
    };


    let resultado;


    if (clienteEditandoId) {

        resultado =
            await clientesSupabase
                .from("clientes")
                .update(dadosCliente)
                .eq("id", clienteEditandoId);

    } else {

        resultado =
            await clientesSupabase
                .from("clientes")
                .insert(dadosCliente);
    }


    btnSalvarCliente.disabled =
        false;


    if (resultado.error) {

        console.error(
            "Erro ao salvar cliente:",
            resultado.error
        );


        mostrarMensagem(
            "Não foi possível salvar o cliente.",
            "erro"
        );


        btnSalvarCliente.textContent =
            clienteEditandoId
                ? "Atualizar cliente"
                : "Salvar cliente";

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
   ALTERAR STATUS
========================================== */

async function alterarStatusCliente(cliente) {

    const novoStatus =
        !cliente.ativo;


    const acao =
        novoStatus
            ? "ativar"
            : "inativar";


    const confirmou =
        confirm(
            `Deseja ${acao} o cliente "${cliente.nome}"?`
        );


    if (!confirmou) {
        return;
    }


    const {
        error
    } = await clientesSupabase
        .from("clientes")
        .update({
            ativo: novoStatus
        })
        .eq("id", cliente.id);


    if (error) {

        console.error(
            "Erro ao alterar status:",
            error
        );


        mostrarMensagem(
            "Não foi possível alterar o status do cliente.",
            "erro"
        );

        return;
    }


    mostrarMensagem(
        novoStatus
            ? "Cliente ativado com sucesso!"
            : "Cliente inativado com sucesso!",
        "sucesso"
    );


    await carregarClientes();
}


/* ==========================================
   EXCLUIR CLIENTE
========================================== */

async function excluirCliente(cliente) {

    const confirmou =
        confirm(
            `Deseja realmente excluir o cliente "${cliente.nome}"?\n\nEssa ação não poderá ser desfeita.`
        );


    if (!confirmou) {
        return;
    }


    const {
        error
    } = await clientesSupabase
        .from("clientes")
        .delete()
        .eq("id", cliente.id);


    if (error) {

        console.error(
            "Erro ao excluir cliente:",
            error
        );


        mostrarMensagem(
            "Não foi possível excluir o cliente.",
            "erro"
        );

        return;
    }


    mostrarMensagem(
        "Cliente excluído com sucesso!",
        "sucesso"
    );


    await carregarClientes();
}


/* ==========================================
   SAIR
========================================== */

async function sair() {

    const confirmou =
        confirm(
            "Deseja realmente sair do sistema?"
        );


    if (!confirmou) {
        return;
    }


    await clientesSupabase.auth.signOut();

    sessionStorage.removeItem(
        "sistemaLojaPerfil"
    );

    window.location.href =
        "index.html";
}


/* ==========================================
   MENU FUTURO
========================================== */

document.querySelectorAll(
    "[data-futuro]"
).forEach(item => {

    item.addEventListener(
        "click",
        evento => {

            evento.preventDefault();

            const nome =
                item.getAttribute("data-futuro");

            alert(
                `A área de ${nome} será desenvolvida nas próximas etapas.`
            );

        }
    );

});


/* ==========================================
   EVENTOS
========================================== */

formCliente.addEventListener(
    "submit",
    salvarCliente
);


btnNovoCliente.addEventListener(
    "click",
    novoCliente
);


btnCancelarCliente.addEventListener(
    "click",
    cancelarCliente
);


btnAtualizarClientes.addEventListener(
    "click",
    carregarClientes
);


btnSair.addEventListener(
    "click",
    sair
);


/* ==========================================
   INICIAR
========================================== */

async function iniciarClientes() {

    const autorizado =
        await protegerPaginaClientes();


    if (!autorizado) {
        return;
    }


    limparFormulario();

    await carregarClientes();
}


iniciarClientes();