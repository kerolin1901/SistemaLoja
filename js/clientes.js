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

    // Guarda o perfil autenticado para usar o loja_id ao cadastrar clientes.
    perfilClientesAtual = perfil;

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


/* ==========================================
   ELEMENTOS DA BUSCA
========================================== */

const buscaClientes =
    document.getElementById("buscaClientes");

const limparBuscaClientes =
    document.getElementById("limparBuscaClientes");

const resultadoBuscaClientes =
    document.getElementById("resultadoBuscaClientes");

const nenhumResultadoBuscaClientes =
    document.getElementById("nenhumResultadoBuscaClientes");


const mensagemCliente =
    document.getElementById("mensagemCliente");

const btnSair =
    document.getElementById("btnSair");

const modalHistoricoCliente = document.getElementById("modalHistoricoCliente");
const fecharHistoricoCliente = document.getElementById("fecharHistoricoCliente");
const historicoClienteTitulo = document.getElementById("historicoClienteTitulo");
const historicoClienteContato = document.getElementById("historicoClienteContato");
const historicoClienteCarregando = document.getElementById("historicoClienteCarregando");
const historicoClienteConteudo = document.getElementById("historicoClienteConteudo");
const historicoClienteIndicadores = document.getElementById("historicoClienteIndicadores");
const historicoClientePagamentos = document.getElementById("historicoClientePagamentos");
const historicoClienteCompras = document.getElementById("historicoClienteCompras");
const historicoClienteNotinhas = document.getElementById("historicoClienteNotinhas");
const historicoClienteErro = document.getElementById("historicoClienteErro");


/* ==========================================
   SUPABASE
========================================== */

const clientesSupabase =
    supabaseClient;


/* ==========================================
   ESTADO
========================================== */

let clienteEditandoId = null;
let perfilClientesAtual = null;


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
   BUSCA INSTANTÂNEA DE CLIENTES
========================================== */

function normalizarTextoBuscaClientes(valor) {

    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();

}


function aplicarBuscaClientes() {

    if (!listaClientes || !buscaClientes) {
        return;
    }


    const termo =
        normalizarTextoBuscaClientes(
            buscaClientes.value
        );


    const linhas =
        Array.from(
            listaClientes.querySelectorAll("tr")
        );


    let encontrados = 0;


    linhas.forEach(
        function (linha) {

            const textoCliente =
                normalizarTextoBuscaClientes(
                    linha.dataset.busca ||
                    linha.textContent
                );


            const corresponde =
                !termo ||
                textoCliente.includes(termo);


            linha.hidden =
                !corresponde;


            if (corresponde) {
                encontrados++;
            }

        }
    );


    /* Botão para limpar a busca */

    if (limparBuscaClientes) {

        limparBuscaClientes.classList.toggle(
            "visivel",
            termo.length > 0
        );

    }


    /* Contador de resultados */

    if (resultadoBuscaClientes) {

        resultadoBuscaClientes.textContent =
            termo
                ? encontrados + " de " + linhas.length +
                    " cliente(s) encontrado(s)"
                : linhas.length + " cliente(s) cadastrado(s)";

    }


    /* Mensagem quando a pesquisa não encontra resultados */

    if (nenhumResultadoBuscaClientes) {

        nenhumResultadoBuscaClientes.hidden =
            !termo ||
            linhas.length === 0 ||
            encontrados > 0;

    }

}


/* ==========================================
   EVENTOS DA BUSCA
========================================== */

if (buscaClientes) {

    buscaClientes.addEventListener(
        "input",
        aplicarBuscaClientes
    );

}


if (limparBuscaClientes) {

    limparBuscaClientes.addEventListener(
        "click",
        function () {

            if (!buscaClientes) {
                return;
            }

            buscaClientes.value = "";

            aplicarBuscaClientes();

            buscaClientes.focus();

        }
    );

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

        aplicarBuscaClientes();

        return;
    }


    containerTabelaClientes.style.display =
        "block";


    data.forEach(cliente => {

        const tr =
            document.createElement("tr");


        /* Dados utilizados pela busca */

        tr.dataset.busca = [
            cliente.nome,
            cliente.telefone,
            cliente.cpf,
            cliente.email
        ].filter(Boolean).join(" ");


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


        const botaoHistorico = document.createElement("button");
        botaoHistorico.type = "button";
        botaoHistorico.className = "botao-acao botao-historico";
        botaoHistorico.textContent = "Histórico";
        botaoHistorico.addEventListener("click", () => verHistoricoCliente(cliente));


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


        acoes.appendChild(botaoHistorico);
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


    /* Reaplica a busca após reconstruir a tabela */

    aplicarBuscaClientes();
}


/* =========================================================
   HISTÓRICO INTELIGENTE DO CLIENTE
   Usa vendas finalizadas, itens e saldo real de notinhas.
========================================================= */

function formatarMoedaCliente(valor) {
    return (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHoraCliente(valor) {
    if (!valor) return "-";
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? "-" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function rotuloFormaPagamentoCliente(valor) {
    const chave = String(valor || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    const nomes = {
        dinheiro: "Dinheiro", pix: "PIX", cartao: "Cartão", credito: "Cartão de crédito",
        "cartao credito": "Cartão de crédito", "cartao de credito": "Cartão de crédito",
        debito: "Cartão de débito", "cartao debito": "Cartão de débito", "cartao de debito": "Cartão de débito",
        boleto: "Boleto", transferencia: "Transferência", outro: "Outro", outros: "Outros", "a prazo": "A prazo"
    };
    return nomes[chave] || (valor ? String(valor) : "Não informado");
}

async function buscarTodasPaginasCliente(criarConsulta) {
    const todos = [];
    const tamanho = 1000;
    let inicio = 0;
    while (true) {
        const { data, error } = await criarConsulta().range(inicio, inicio + tamanho - 1);
        if (error) throw error;
        const pagina = data || [];
        todos.push(...pagina);
        if (pagina.length < tamanho) break;
        inicio += tamanho;
    }
    return todos;
}

function abrirModalHistoricoCliente() {
    if (!modalHistoricoCliente) return;
    modalHistoricoCliente.hidden = false;
    document.body.classList.add("historico-cliente-modal-aberto");
    fecharHistoricoCliente?.focus();
}

function fecharModalHistoricoCliente() {
    if (!modalHistoricoCliente) return;
    modalHistoricoCliente.hidden = true;
    document.body.classList.remove("historico-cliente-modal-aberto");
}

function renderizarComprasCliente(vendas, itens, produtos) {
    if (!vendas.length) {
        historicoClienteCompras.innerHTML = '<div class="historico-cliente-vazio">Este cliente ainda não possui compras finalizadas.</div>';
        return;
    }
    const itensPorVenda = new Map();
    (itens || []).forEach(item => {
        const chave = String(item.venda_id);
        if (!itensPorVenda.has(chave)) itensPorVenda.set(chave, []);
        itensPorVenda.get(chave).push(item);
    });

    historicoClienteCompras.innerHTML = `
        <table class="historico-cliente-tabela">
            <thead><tr><th>Data</th><th>Venda</th><th>Produtos / cores</th><th>Pagamento</th><th>Total</th></tr></thead>
            <tbody>
                ${vendas.map(venda => {
                    const linhas = itensPorVenda.get(String(venda.id)) || [];
                    const resumoItens = linhas.length
                        ? linhas.map(item => {
                            const produto = produtos.get(String(item.produto_id));
                            const nome = item.descricao_avulsa || produto?.nome || "Produto";
                            const cor = String(item.cor_vendida || "").trim();
                            const quantidade = Number(item.quantidade) || 0;
                            return `<span class="historico-cliente-item">${escaparHtml(nome)}${cor ? ` <em>${escaparHtml(cor)}</em>` : ""} × ${quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}</span>`;
                        }).join("")
                        : '<span class="historico-cliente-sem-item">Itens não disponíveis</span>';
                    return `<tr>
                        <td>${escaparHtml(formatarDataHoraCliente(venda.criado_em))}</td>
                        <td>#${escaparHtml(venda.id)}</td>
                        <td><div class="historico-cliente-itens">${resumoItens}</div></td>
                        <td>${escaparHtml(rotuloFormaPagamentoCliente(venda.forma_pagamento))}</td>
                        <td><strong>${escaparHtml(formatarMoedaCliente(venda.total))}</strong></td>
                    </tr>`;
                }).join("")}
            </tbody>
        </table>
    `;
}

async function carregarNotinhasAbertasCliente(clienteId) {
    const { data: notinhas, error: erroNotinhas } = await clientesSupabase
        .from("notinhas")
        .select("id, loja_id, numero, cliente_id, venda_id, emitida_em, total, status")
        .eq("loja_id", perfilClientesAtual.loja_id)
        .eq("cliente_id", clienteId)
        .eq("status", "aberta")
        .order("emitida_em", { ascending: false });
    if (erroNotinhas) throw erroNotinhas;
    if (!notinhas?.length) return [];

    const ids = notinhas.map(n => n.id);
    const { data: parcelas, error: erroParcelas } = await clientesSupabase
        .from("parcelas_notinha")
        .select("id, loja_id, notinha_id, valor_original")
        .eq("loja_id", perfilClientesAtual.loja_id)
        .in("notinha_id", ids);
    if (erroParcelas) throw erroParcelas;

    const listaParcelas = parcelas || [];
    const idsParcelas = listaParcelas.map(p => p.id);
    let alocacoes = [];
    if (idsParcelas.length) {
        const { data, error } = await clientesSupabase
            .from("alocacoes_recebimento_notinha")
            .select("parcela_id, valor_aplicado")
            .eq("loja_id", perfilClientesAtual.loja_id)
            .in("parcela_id", idsParcelas);
        if (error) throw error;
        alocacoes = data || [];
    }

    const pagoPorParcela = new Map();
    alocacoes.forEach(a => {
        const chave = String(a.parcela_id);
        pagoPorParcela.set(chave, (pagoPorParcela.get(chave) || 0) + (Number(a.valor_aplicado) || 0));
    });
    const resumoPorNotinha = new Map();
    listaParcelas.forEach(p => {
        const chave = String(p.notinha_id);
        if (!resumoPorNotinha.has(chave)) resumoPorNotinha.set(chave, { total: 0, pago: 0, saldo: 0 });
        const resumo = resumoPorNotinha.get(chave);
        const original = Math.round((Number(p.valor_original) || 0) * 100);
        const pago = Math.min(original, Math.round((pagoPorParcela.get(String(p.id)) || 0) * 100));
        resumo.total += original;
        resumo.pago += pago;
        resumo.saldo += Math.max(0, original - pago);
    });
    return notinhas.map(n => {
        const r = resumoPorNotinha.get(String(n.id)) || { total: 0, pago: 0, saldo: Math.round((Number(n.total) || 0) * 100) };
        return { ...n, totalCalculado: r.total / 100, pagoCalculado: r.pago / 100, saldoCalculado: r.saldo / 100 };
    }).filter(n => n.saldoCalculado > 0);
}

async function verHistoricoCliente(cliente) {
    if (!perfilClientesAtual?.loja_id || !modalHistoricoCliente) return;
    abrirModalHistoricoCliente();
    historicoClienteTitulo.textContent = `Histórico — ${cliente.nome || "Cliente"}`;
    historicoClienteContato.textContent = [cliente.telefone, cliente.email].filter(Boolean).join(" · ") || "Ficha de relacionamento do cliente";
    historicoClienteCarregando.hidden = false;
    historicoClienteConteudo.hidden = true;
    historicoClienteErro.hidden = true;
    historicoClienteCarregando.textContent = "Carregando compras e pendências...";

    try {
        const vendas = await buscarTodasPaginasCliente(() => clientesSupabase
            .from("vendas")
            .select("id, loja_id, usuario_id, cliente_id, subtotal, desconto, total, forma_pagamento, status, observacoes, criado_em")
            .eq("loja_id", perfilClientesAtual.loja_id)
            .eq("cliente_id", cliente.id)
            .eq("status", "finalizada")
            .order("criado_em", { ascending: false }));

        const idsVendas = vendas.map(v => v.id);
        const itens = [];
        for (let i = 0; i < idsVendas.length; i += 100) {
            const lote = idsVendas.slice(i, i + 100);
            const dados = await buscarTodasPaginasCliente(() => clientesSupabase
                .from("itens_venda")
                .select("id, venda_id, produto_id, descricao_avulsa, cor_vendida, quantidade, preco_unitario, subtotal")
                .in("venda_id", lote)
                .order("id", { ascending: true }));
            itens.push(...dados);
        }

        const idsProdutos = [...new Set(itens.map(i => i.produto_id).filter(Boolean).map(String))];
        const produtos = new Map();
        for (let i = 0; i < idsProdutos.length; i += 100) {
            const lote = idsProdutos.slice(i, i + 100);
            const { data, error } = await clientesSupabase.from("produtos").select("id, nome").in("id", lote);
            if (error) throw error;
            (data || []).forEach(p => produtos.set(String(p.id), p));
        }

        const totalGasto = vendas.reduce((soma, venda) => soma + (Number(venda.total) || 0), 0);
        const ultimaCompra = vendas[0]?.criado_em;
        const pagamentos = new Map();
        vendas.forEach(venda => {
            const forma = rotuloFormaPagamentoCliente(venda.forma_pagamento);
            pagamentos.set(forma, (pagamentos.get(forma) || 0) + 1);
        });

        historicoClienteIndicadores.innerHTML = `
            <article><span>Total comprado</span><strong>${escaparHtml(formatarMoedaCliente(totalGasto))}</strong></article>
            <article><span>Compras finalizadas</span><strong>${vendas.length.toLocaleString("pt-BR")}</strong></article>
            <article><span>Última compra</span><strong>${escaparHtml(ultimaCompra ? formatarDataHoraCliente(ultimaCompra) : "Sem compras")}</strong></article>
        `;

        historicoClientePagamentos.innerHTML = pagamentos.size
            ? [...pagamentos.entries()].sort((a,b) => b[1]-a[1]).map(([nome,quantidade]) => `<span>${escaparHtml(nome)} <strong>${quantidade} ${quantidade===1?"compra":"compras"}</strong></span>`).join("")
            : '<div class="historico-cliente-vazio">Ainda não há formas de pagamento registradas.</div>';

        renderizarComprasCliente(vendas, itens, produtos);

        try {
            const notinhas = await carregarNotinhasAbertasCliente(cliente.id);
            const saldoAberto = notinhas.reduce((soma, n) => soma + n.saldoCalculado, 0);
            historicoClienteNotinhas.innerHTML = notinhas.length
                ? `<div class="historico-cliente-saldo"><span>Saldo total em aberto</span><strong>${escaparHtml(formatarMoedaCliente(saldoAberto))}</strong></div>
                   <div class="historico-cliente-notinhas-lista">${notinhas.map(n => `<article><div><strong>Notinha ${escaparHtml(n.numero || `#${n.id}`)}</strong><small>Emitida em ${escaparHtml(formatarDataHoraCliente(n.emitida_em))}</small></div><div><span>Total ${escaparHtml(formatarMoedaCliente(n.totalCalculado || n.total))}</span><strong>Em aberto: ${escaparHtml(formatarMoedaCliente(n.saldoCalculado))}</strong></div></article>`).join("")}</div>`
                : '<div class="historico-cliente-vazio">Nenhuma notinha com saldo pendente para este cliente.</div>';
        } catch (erroNotinhas) {
            console.error("Erro ao consultar notinhas do cliente:", erroNotinhas);
            historicoClienteNotinhas.innerHTML = '<div class="historico-cliente-vazio">Não foi possível consultar as notinhas deste cliente. Verifique a instalação e as permissões do módulo de fiado.</div>';
        }

        historicoClienteCarregando.hidden = true;
        historicoClienteConteudo.hidden = false;
    } catch (erro) {
        console.error("Erro ao carregar histórico do cliente:", erro);
        historicoClienteCarregando.hidden = true;
        historicoClienteErro.hidden = false;
        historicoClienteErro.textContent = `Não foi possível carregar o histórico: ${erro?.message || "Verifique a conexão e as permissões do Supabase."}`;
    }
}

if (fecharHistoricoCliente) fecharHistoricoCliente.addEventListener("click", fecharModalHistoricoCliente);
if (modalHistoricoCliente) {
    modalHistoricoCliente.addEventListener("click", evento => {
        if (evento.target === modalHistoricoCliente || (evento.target instanceof Element && evento.target.closest("[data-fechar-historico]"))) fecharModalHistoricoCliente();
    });
    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !modalHistoricoCliente.hidden) fecharModalHistoricoCliente();
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


    // Ao cadastrar, a política RLS exige o loja_id da loja do usuário.
    // Não altera essa informação durante a edição de um cliente existente.
    if (
        !clienteEditandoId &&
        (!perfilClientesAtual || !perfilClientesAtual.loja_id)
    ) {
        mostrarMensagem(
            "Não foi possível identificar a loja deste usuário. Saia do sistema e entre novamente.",
            "erro"
        );
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
                .insert({
                    ...dadosCliente,
                    loja_id: perfilClientesAtual.loja_id
                });
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