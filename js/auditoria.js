/* =========================================================
   SISTEMA DA LOJA — AUDITORIA GERAL
   Consulta somente eventos da loja do administrador atual.
========================================================= */
(function () {
    "use strict";

    const supabase = supabaseClient;
    const el = (id) => document.getElementById(id);
    const estado = {
        perfil: null,
        registros: [],
        nomesUsuarios: new Map()
    };

    const rotulosTabelas = {
        clientes: "Clientes",
        perfis: "Usuários",
        produtos: "Produtos",
        produtos_cores: "Cores dos produtos",
        vendas: "Vendas",
        itens_venda: "Itens e descontos",
        movimentacoes_estoque: "Movimentações de estoque",
        financeiro: "Financeiro",
        notinhas: "Notinhas",
        parcelas_notinha: "Parcelas de notinhas",
        recebimentos_notinha: "Recebimentos de notinhas",
        alocacoes_recebimento_notinha: "Baixas de parcelas"
    };

    const rotulosCampos = {
        nome: "Nome",
        nome_cor: "Cor",
        sku: "SKU",
        preco_custo: "Preço de custo",
        custo_unitario: "Custo unitário",
        preco_venda: "Preço de venda",
        preco_minimo: "Preço mínimo",
        estoque: "Estoque",
        estoque_minimo: "Estoque mínimo",
        quantidade: "Quantidade",
        desconto: "Desconto",
        desconto_item: "Desconto do item",
        desconto_percentual: "Desconto percentual",
        total: "Total",
        subtotal: "Subtotal",
        forma_pagamento: "Forma de pagamento",
        status: "Status",
        ativo: "Ativo",
        tipo: "Tipo",
        motivo: "Motivo",
        observacoes: "Observações",
        categoria: "Categoria",
        valor: "Valor",
        fornecedor: "Fornecedor",
        controla_cores: "Controle por cores",
        data_movimento: "Data do movimento",
        cor_movimentada: "Cor movimentada",
        estoque_anterior: "Estoque total anterior",
        estoque_novo: "Estoque total novo",
        estoque_cor_anterior: "Estoque da cor anterior",
        estoque_cor_novo: "Estoque da cor novo",
        produto_id: "ID do produto",
        cliente_id: "ID do cliente",
        usuario_id: "ID do usuário",
        cpf: "CPF (valor protegido)",
        email: "E-mail (valor protegido)",
        telefone: "Telefone (valor protegido)",
        endereco: "Endereço (valor protegido)",
        chave_pix: "Chave PIX (valor protegido)",
        observacoes: "Observações (valor protegido)",
        nome_completo: "Nome do usuário",
        usuario: "Login do usuário",
        permissoes: "Permissões"
    };

    const escapeHtml = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);

    function moedaOuNumero(chave, valor) {
        if (valor === null || valor === undefined || valor === "") return "—";
        if (typeof valor === "boolean") return valor ? "Sim" : "Não";
        if (typeof valor === "object") return JSON.stringify(valor);
        if (/^(preco|custo|valor|total|subtotal|desconto|lucro)/i.test(chave)) {
            const numero = Number(valor);
            if (Number.isFinite(numero)) return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        }
        if (typeof valor === "number") return valor.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
        return String(valor);
    }

    function dataHora(valor) {
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? "—" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    }

    function dataLocalISO(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    function definirPeriodoPadrao() {
        const hoje = new Date();
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        inicio.setDate(inicio.getDate() - 29);
        el("auditoriaDataInicio").value = dataLocalISO(inicio);
        el("auditoriaDataFim").value = dataLocalISO(hoje);
    }

    function criarDataLocal(valor, adicionarDia = false) {
        if (!valor) return null;
        const partes = valor.split("-").map(Number);
        if (partes.length !== 3 || partes.some(n => !n)) return null;
        const data = new Date(partes[0], partes[1] - 1, partes[2]);
        if (adicionarDia) data.setDate(data.getDate() + 1);
        return data;
    }

    async function protegerPagina() {
        if (!supabase) throw new Error("A configuração do Supabase não foi carregada.");
        const { data: sessao, error: erroSessao } = await supabase.auth.getSession();
        if (erroSessao || !sessao?.session?.user?.id) {
            window.location.href = "index.html";
            return false;
        }

        const { data: perfil, error } = await supabase.from("perfis")
            .select("id, nome_completo, usuario, tipo, ativo, loja_id")
            .eq("id", sessao.session.user.id)
            .maybeSingle();
        if (error) throw error;
        if (!perfil || perfil.tipo !== "admin" || perfil.ativo !== true || !perfil.loja_id) {
            alert("A Auditoria é exclusiva do administrador ativo da loja.");
            window.location.href = perfil?.tipo === "vendedor" ? "vendedor.html" : "index.html";
            return false;
        }

        estado.perfil = perfil;
        const nome = perfil.nome_completo || perfil.usuario || "Administrador";
        const nomeEl = el("nomeAdministrador");
        const avatar = document.querySelector(".avatar-admin");
        if (nomeEl) nomeEl.textContent = nome;
        if (avatar) avatar.textContent = nome.charAt(0).toUpperCase();
        sessionStorage.setItem("sistemaLojaPerfil", JSON.stringify(perfil));
        return true;
    }

    async function carregarNomesUsuarios(registros) {
        const ids = [...new Set(registros.map(r => r.usuario_id).filter(Boolean).map(String))];
        estado.nomesUsuarios = new Map();
        for (let i = 0; i < ids.length; i += 100) {
            const lote = ids.slice(i, i + 100);
            const { data, error } = await supabase.from("perfis")
                .select("id, nome_completo, usuario")
                .eq("loja_id", estado.perfil.loja_id)
                .in("id", lote);
            if (error) throw error;
            (data || []).forEach(u => estado.nomesUsuarios.set(String(u.id), u.nome_completo || u.usuario || "Usuário"));
        }
    }

    function diferencas(registro) {
        const anterior = registro.dados_anteriores || {};
        const novo = registro.dados_novos || {};
        const tecnicos = new Set(["id", "loja_id", "usuario_id", "cliente_id", "produto_id", "produto_cor_id", "venda_id", "notinha_id", "recebimento_id", "criado_em", "atualizado_em"]);
        if (registro.operacao === "INSERT") return Object.entries(novo).filter(([chave]) => !tecnicos.has(chave));
        if (registro.operacao === "DELETE") return Object.entries(anterior).filter(([chave]) => !tecnicos.has(chave));
        const chaves = new Set([...Object.keys(anterior), ...Object.keys(novo)]);
        return [...chaves]
            .filter(chave => !tecnicos.has(chave))
            .filter(chave => JSON.stringify(anterior[chave]) !== JSON.stringify(novo[chave]))
            .map(chave => [chave, { antes: anterior[chave], depois: novo[chave] }]);
    }

    function renderizarDetalhes(registro) {
        const campos = diferencas(registro);
        if (!campos.length) return '<p class="auditoria-sem-detalhe">O evento foi registrado, mas não há campos adicionais para exibir.</p>';
        if (registro.operacao === "UPDATE") {
            return `<div class="auditoria-alteracoes">${campos.map(([chave, valores]) => `
                <div class="auditoria-alteracao">
                    <strong>${escapeHtml(rotulosCampos[chave] || chave.replaceAll("_", " "))}</strong>
                    <div><span class="auditoria-valor-antigo">${escapeHtml(moedaOuNumero(chave, valores.antes))}</span><span class="auditoria-seta">→</span><span class="auditoria-valor-novo">${escapeHtml(moedaOuNumero(chave, valores.depois))}</span></div>
                </div>`).join("")}</div>`;
        }
        return `<div class="auditoria-alteracoes">${campos.slice(0, 12).map(([chave, valor]) => `
            <div class="auditoria-alteracao"><strong>${escapeHtml(rotulosCampos[chave] || chave.replaceAll("_", " "))}</strong><div><span class="auditoria-valor-novo">${escapeHtml(moedaOuNumero(chave, valor))}</span></div></div>`).join("")}</div>`;
    }

    function aplicarFiltros() {
        const operacao = el("auditoriaFiltroOperacao").value;
        const tabela = el("auditoriaFiltroTabela").value;
        const usuario = el("auditoriaFiltroUsuario").value;
        const termo = el("auditoriaBusca").value.trim().toLocaleLowerCase("pt-BR");

        const filtrados = estado.registros.filter(registro => {
            if (operacao && registro.operacao !== operacao) return false;
            if (tabela && registro.tabela !== tabela) return false;
            if (usuario && String(registro.usuario_id || "") !== usuario) return false;
            if (termo) {
                const pesquisavel = [
                    registro.registro_id, registro.tabela, registro.operacao,
                    estado.nomesUsuarios.get(String(registro.usuario_id)) || "",
                    JSON.stringify(registro.dados_anteriores || {}),
                    JSON.stringify(registro.dados_novos || {})
                ].join(" ").toLocaleLowerCase("pt-BR");
                if (!pesquisavel.includes(termo)) return false;
            }
            return true;
        });

        el("auditoriaContagem").textContent = `${filtrados.length.toLocaleString("pt-BR")} registro(s) exibido(s)`;
        const lista = el("auditoriaLista");
        if (!filtrados.length) {
            lista.innerHTML = '<div class="auditoria-estado">Nenhuma alteração encontrada com esses filtros.</div>';
            return;
        }

        lista.innerHTML = filtrados.map(registro => {
            const usuario = registro.usuario_id
                ? (estado.nomesUsuarios.get(String(registro.usuario_id)) || "Usuário não identificado")
                : "Operação sem usuário identificado";
            const operacao = { INSERT: "Criado", UPDATE: "Alterado", DELETE: "Removido" }[registro.operacao] || registro.operacao;
            const classe = { INSERT: "criado", UPDATE: "alterado", DELETE: "removido" }[registro.operacao] || "";
            return `
                <article class="auditoria-registro">
                    <div class="auditoria-registro-cabecalho">
                        <div class="auditoria-registro-identificacao">
                            <span class="auditoria-registro-icone">${registro.operacao === "DELETE" ? "−" : registro.operacao === "INSERT" ? "+" : "↻"}</span>
                            <div><strong>${escapeHtml(rotulosTabelas[registro.tabela] || registro.tabela)} · ${escapeHtml(operacao)}</strong><small>${escapeHtml(dataHora(registro.criado_em))} · ${escapeHtml(usuario)}</small></div>
                        </div>
                        <span class="auditoria-tag ${classe}">${escapeHtml(operacao)}</span>
                    </div>
                    <div class="auditoria-registro-meta"><span>Registro #${escapeHtml(registro.registro_id || "—")}</span><span>${escapeHtml(rotulosTabelas[registro.tabela] || registro.tabela)}</span></div>
                    ${renderizarDetalhes(registro)}
                </article>`;
        }).join("");
    }

    async function carregarAuditoria() {
        const inicio = criarDataLocal(el("auditoriaDataInicio").value);
        const fim = criarDataLocal(el("auditoriaDataFim").value, true);
        const erro = el("auditoriaErro");
        erro.hidden = true;
        if (!inicio || !fim || inicio >= fim) {
            erro.hidden = false;
            erro.textContent = "Informe um intervalo de datas válido.";
            return;
        }

        const carregando = el("auditoriaCarregando");
        carregando.hidden = false;
        carregando.textContent = "Consultando alterações da loja...";
        el("auditoriaLista").replaceChildren();
        try {
            const { data, error } = await supabase.from("auditoria_sistema")
                .select("id, loja_id, usuario_id, tabela, operacao, registro_id, dados_anteriores, dados_novos, criado_em")
                .eq("loja_id", estado.perfil.loja_id)
                .gte("criado_em", inicio.toISOString())
                .lt("criado_em", fim.toISOString())
                .order("criado_em", { ascending: false })
                .range(0, 499);
            if (error) throw error;
            estado.registros = data || [];
            await carregarNomesUsuarios(estado.registros);

            const filtroUsuario = el("auditoriaFiltroUsuario");
            const selecionado = filtroUsuario.value;
            const usuarios = [...new Set(estado.registros.map(r => r.usuario_id).filter(Boolean).map(String))];
            filtroUsuario.innerHTML = '<option value="">Todos os usuários</option>' + usuarios
                .map(id => `<option value="${escapeHtml(id)}">${escapeHtml(estado.nomesUsuarios.get(id) || "Usuário não identificado")}</option>`)
                .join("");
            if (usuarios.includes(selecionado)) filtroUsuario.value = selecionado;

            const avisoLimite = estado.registros.length === 500 ? " · exibindo os 500 registros mais recentes do intervalo" : "";
            el("auditoriaContagem").textContent = `${estado.registros.length.toLocaleString("pt-BR")} registro(s) carregado(s)${avisoLimite}`;
            aplicarFiltros();
        } catch (erroConsulta) {
            console.error("Erro ao consultar auditoria:", erroConsulta);
            erro.hidden = false;
            erro.textContent = `Não foi possível consultar a auditoria. Confira se a migração Migracao-Auditoria-Geral.sql foi executada no Supabase e se a sessão tem permissão. Detalhe: ${erroConsulta?.message || erroConsulta}`;
        } finally {
            carregando.hidden = true;
        }
    }

    async function sair() {
        if (!confirm("Deseja realmente sair do sistema?")) return;
        await supabase.auth.signOut({ scope: "local" });
        sessionStorage.removeItem("sistemaLojaPerfil");
        window.location.href = "index.html";
    }

    async function iniciar() {
        definirPeriodoPadrao();
        el("btnAtualizarAuditoria").addEventListener("click", carregarAuditoria);
        ["auditoriaFiltroOperacao", "auditoriaFiltroTabela", "auditoriaFiltroUsuario", "auditoriaBusca"].forEach(id => {
            el(id).addEventListener(id === "auditoriaBusca" ? "input" : "change", aplicarFiltros);
        });
        document.getElementById("btnSair")?.addEventListener("click", sair);
        try {
            const autorizado = await protegerPagina();
            if (autorizado) await carregarAuditoria();
        } catch (erro) {
            console.error("Não foi possível iniciar a auditoria:", erro);
            el("auditoriaCarregando").hidden = true;
            el("auditoriaErro").hidden = false;
            el("auditoriaErro").textContent = `Não foi possível abrir a Auditoria: ${erro?.message || erro}`;
        }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();
