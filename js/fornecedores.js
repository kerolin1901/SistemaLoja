/* =========================================================
   SISTEMA DA LOJA — FORNECEDORES
   Cadastro isolado por loja. Exclusão lógica por status.
========================================================= */
(() => {
    "use strict";

    const db = supabaseClient;
    const $ = (id) => document.getElementById(id);
    const el = {
        nome: $("fornecedorNome"), cnpj: $("fornecedorCnpj"), contato: $("fornecedorContato"),
        telefone: $("fornecedorTelefone"), email: $("fornecedorEmail"), endereco: $("fornecedorEndereco"),
        observacoes: $("fornecedorObservacoes"), ativo: $("fornecedorAtivo"), form: $("formFornecedor"),
        titulo: $("tituloFormularioFornecedor"), salvar: $("btnSalvarFornecedor"), cancelar: $("btnCancelarFornecedor"),
        atualizar: $("btnAtualizarFornecedoresPagina"), busca: $("buscaFornecedores"), lista: $("listaFornecedores"),
        carregando: $("carregandoFornecedores"), vazio: $("semFornecedores"), semResultado: $("semResultadoFornecedores"),
        resumo: $("resumoFornecedores"), mensagem: $("mensagemFornecedores"), data: $("dataAtual")
    };

    let perfil = null;
    let fornecedores = [];
    let editandoId = null;

    const escapar = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
    const normalizar = (valor) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    function mensagem(texto, tipo = "info") {
        el.mensagem.textContent = texto;
        el.mensagem.className = texto ? `mensagem-admin visivel mensagem-${tipo}` : "mensagem-admin";
        el.mensagem.style.display = texto ? "block" : "none";
    }

    async function protegerPagina() {
        const { data: sessao, error: erroSessao } = await db.auth.getSession();
        if (erroSessao || !sessao?.session) { window.location.href = "index.html"; return false; }
        const { data, error } = await db.from("perfis")
            .select("id, nome_completo, usuario, tipo, ativo, loja_id")
            .eq("id", sessao.session.user.id).maybeSingle();
        if (error || !data || data.tipo !== "admin" || data.ativo !== true || !data.loja_id) {
            alert("Acesso permitido somente para administradores ativos da loja.");
            window.location.href = "index.html";
            return false;
        }
        perfil = data;
        const nome = data.nome_completo || data.usuario || "Administrador";
        const nomeEl = document.getElementById("nomeAdministrador");
        const avatar = document.querySelector(".avatar-admin");
        if (nomeEl) nomeEl.textContent = nome;
        if (avatar) avatar.textContent = nome.charAt(0).toUpperCase();
        return true;
    }

    function limparFormulario() {
        editandoId = null;
        el.form.reset();
        el.ativo.checked = true;
        el.titulo.textContent = "Cadastrar fornecedor";
        el.salvar.textContent = "Cadastrar fornecedor";
        el.cancelar.hidden = true;
    }

    function editarFornecedor(id) {
        const item = fornecedores.find((f) => String(f.id) === String(id));
        if (!item) return;
        editandoId = item.id;
        el.nome.value = item.nome || "";
        el.cnpj.value = item.cnpj || "";
        el.contato.value = item.contato || "";
        el.telefone.value = item.telefone || "";
        el.email.value = item.email || "";
        el.endereco.value = item.endereco || "";
        el.observacoes.value = item.observacoes || "";
        el.ativo.checked = item.ativo === true;
        el.titulo.textContent = "Editar fornecedor";
        el.salvar.textContent = "Salvar alterações";
        el.cancelar.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
        el.nome.focus();
    }

    async function salvarFornecedor(evento) {
        evento.preventDefault();
        mensagem("");
        const nome = el.nome.value.trim();
        if (!nome) { mensagem("Informe o nome ou a razão social do fornecedor.", "erro"); el.nome.focus(); return; }
        if (nome.length > 120) { mensagem("O nome do fornecedor deve ter até 120 caracteres.", "erro"); return; }

        const dados = {
            nome,
            cnpj: el.cnpj.value.trim() || null,
            contato: el.contato.value.trim() || null,
            telefone: el.telefone.value.trim() || null,
            email: el.email.value.trim() || null,
            endereco: el.endereco.value.trim() || null,
            observacoes: el.observacoes.value.trim() || null,
            ativo: el.ativo.checked,
            atualizado_em: new Date().toISOString()
        };

        el.salvar.disabled = true;
        el.salvar.textContent = editandoId ? "Salvando..." : "Cadastrando...";
        try {
            let resultado;
            if (editandoId) {
                resultado = await db.from("fornecedores").update(dados)
                    .eq("id", editandoId).eq("loja_id", perfil.loja_id);
            } else {
                resultado = await db.from("fornecedores").insert({ ...dados, loja_id: perfil.loja_id });
            }
            if (resultado.error) throw resultado.error;
            mensagem(editandoId ? "Fornecedor atualizado com sucesso." : "Fornecedor cadastrado com sucesso.", "sucesso");
            limparFormulario();
            await carregarFornecedores();
        } catch (erro) {
            console.error("Erro ao salvar fornecedor:", erro);
            const texto = /duplicate|unique/i.test(erro?.message || "")
                ? "Já existe um fornecedor com esse nome nesta loja."
                : (erro?.message || "Não foi possível salvar o fornecedor. Confira a migração e as permissões do Supabase.");
            mensagem(texto, "erro");
        } finally {
            el.salvar.disabled = false;
            if (editandoId) el.salvar.textContent = "Salvar alterações";
            else if (el.salvar.textContent.endsWith("...")) el.salvar.textContent = "Cadastrar fornecedor";
        }
    }

    async function alternarStatus(id) {
        const item = fornecedores.find((f) => String(f.id) === String(id));
        if (!item) return;
        const novoStatus = item.ativo !== true;
        const acao = novoStatus ? "reativar" : "inativar";
        if (!confirm(`Deseja ${acao} o fornecedor "${item.nome}"?\n\nOs produtos vinculados continuarão associados ao cadastro.`)) return;
        const { error } = await db.from("fornecedores")
            .update({ ativo: novoStatus, atualizado_em: new Date().toISOString() })
            .eq("id", item.id).eq("loja_id", perfil.loja_id);
        if (error) { console.error(error); mensagem(error.message || "Não foi possível alterar o fornecedor.", "erro"); return; }
        mensagem(novoStatus ? "Fornecedor reativado." : "Fornecedor inativado. Os vínculos dos produtos foram preservados.", "sucesso");
        await carregarFornecedores();
    }

    function renderizarFornecedores() {
        const termo = normalizar(el.busca.value);
        const filtrados = fornecedores.filter((item) => normalizar(`${item.nome} ${item.cnpj} ${item.contato} ${item.telefone} ${item.email}`).includes(termo));
        el.lista.replaceChildren();
        filtrados.forEach((item) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${escapar(item.nome)}</strong>${item.email ? `<br><small>${escapar(item.email)}</small>` : ""}</td>
                <td>${escapar(item.cnpj || "—")}</td>
                <td>${escapar(item.contato || "—")}</td>
                <td>${escapar(item.telefone || "—")}</td>
                <td><span class="status-fornecedor ${item.ativo ? "ativo" : "inativo"}">${item.ativo ? "Ativo" : "Inativo"}</span></td>
                <td><div class="acoes-linha-fornecedor"><button type="button" class="acao-fornecedor editar" data-acao="editar" data-id="${item.id}">Editar</button><button type="button" class="acao-fornecedor ${item.ativo ? "inativar" : "ativar"}" data-acao="status" data-id="${item.id}">${item.ativo ? "Inativar" : "Reativar"}</button></div></td>`;
            el.lista.appendChild(tr);
        });
        el.resumo.textContent = `${fornecedores.length} fornecedor(es) cadastrado(s) nesta loja.`;
        el.vazio.hidden = fornecedores.length !== 0;
        el.semResultado.hidden = fornecedores.length === 0 || filtrados.length !== 0;
    }

    async function carregarFornecedores() {
        el.carregando.hidden = false;
        el.vazio.hidden = true;
        el.semResultado.hidden = true;
        el.lista.replaceChildren();
        const { data, error } = await db.from("fornecedores")
            .select("id, loja_id, nome, cnpj, contato, telefone, email, endereco, observacoes, ativo, criado_em, atualizado_em")
            .eq("loja_id", perfil.loja_id)
            .order("nome", { ascending: true });
        el.carregando.hidden = true;
        if (error) {
            console.error("Erro ao consultar fornecedores:", error);
            mensagem("Não foi possível carregar fornecedores. Execute a migração SQL e confira as permissões no Supabase.", "erro");
            return;
        }
        fornecedores = data || [];
        renderizarFornecedores();
    }

    el.form.addEventListener("submit", salvarFornecedor);
    el.cancelar.addEventListener("click", () => { limparFormulario(); mensagem(""); });
    el.atualizar.addEventListener("click", carregarFornecedores);
    el.busca.addEventListener("input", renderizarFornecedores);
    el.lista.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button[data-acao]");
        if (!botao) return;
        if (botao.dataset.acao === "editar") editarFornecedor(botao.dataset.id);
        if (botao.dataset.acao === "status") alternarStatus(botao.dataset.id);
    });

    if (el.sair) {
        el.sair.addEventListener("click", async () => {
            if (!confirm("Deseja realmente sair do sistema?")) return;
            try { await db.auth.signOut(); }
            finally {
                sessionStorage.removeItem("sistemaLojaPerfil");
                window.location.href = "index.html";
            }
        });
    }

    const data = new Date();
    el.data.textContent = data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    (async () => {
        try {
            if (await protegerPagina()) await carregarFornecedores();
        } catch (erro) {
            console.error("Falha ao iniciar fornecedores:", erro);
            mensagem("Não foi possível iniciar o cadastro de fornecedores.", "erro");
        }
    })();
})();
