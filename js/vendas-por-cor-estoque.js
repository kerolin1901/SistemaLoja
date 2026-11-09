/* =========================================================
   SISTEMA DA LOJA — VENDAS POR COR NA ÁREA DE ESTOQUE
   Disponível para administrador e vendedor, sem exibir custos.
========================================================= */
(function () {
    "use strict";

    const supabase = supabaseClient;
    const analise = window.SistemaLojaAnaliseVendas;
    let perfil;
    let painel;
    let ultimaLista = [];

    const moeda = (valor) => (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const quantidade = (valor) => (Number(valor) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    const escapar = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

    function obterPeriodo(tipo) {
        const agora = new Date();
        const fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
        let inicio;
        if (tipo === "7") inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 6);
        else if (tipo === "90") inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 89);
        else if (tipo === "mes") inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        else inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 29);
        return { inicio, fim };
    }

    async function obterPerfil() {
        const { data: resultadoUsuario, error: erroUsuario } = await supabase.auth.getUser();
        if (erroUsuario) throw erroUsuario;
        if (!resultadoUsuario?.user?.id) throw new Error("Sessão não encontrada.");
        const { data, error } = await supabase.from("perfis")
            .select("id, loja_id, tipo, ativo")
            .eq("id", resultadoUsuario.user.id)
            .maybeSingle();
        if (error) throw error;
        if (!data?.loja_id || data.ativo !== true || !["admin", "vendedor"].includes(data.tipo)) {
            throw new Error("Não foi possível confirmar o acesso à loja.");
        }
        return data;
    }

    function criarPainel() {
        if (document.getElementById("painelVendasPorCorEstoque")) return document.getElementById("painelVendasPorCorEstoque");
        painel = document.createElement("section");
        painel.id = "painelVendasPorCorEstoque";
        painel.className = "sl-vendas-cor-painel";
        painel.innerHTML = `
            <div class="sl-vendas-cor-cabecalho">
                <div><span class="sl-vendas-cor-etiqueta">DESEMPENHO DAS VARIANTES</span><h2>Vendas por cor</h2><p>Veja quais cores tiveram mais saída e quanto venderam no período.</p></div>
                <div class="sl-vendas-cor-controles"><label for="slPeriodoVendasCor">Período</label><select id="slPeriodoVendasCor"><option value="7">Últimos 7 dias</option><option value="30" selected>Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="mes">Mês atual</option></select><button type="button" id="slAtualizarVendasCor">Atualizar</button></div>
            </div>
            <div class="sl-vendas-cor-resumo" id="slResumoVendasCor">Carregando vendas por cor...</div>
            <div class="sl-vendas-cor-filtro"><label for="slBuscaVendasCor">Localizar produto ou cor</label><input type="search" id="slBuscaVendasCor" placeholder="Digite o nome do produto ou da cor"></div>
            <div class="sl-vendas-cor-tabela-wrap"><table class="sl-vendas-cor-tabela"><thead><tr><th>Produto</th><th>Cor</th><th>Unidades vendidas</th><th>Faturamento</th></tr></thead><tbody id="slListaVendasCor"><tr><td colspan="4">Carregando...</td></tr></tbody></table></div>
            <p class="sl-vendas-cor-nota" id="slNotaVendasCor">Somente vendas finalizadas são consideradas. O faturamento por item respeita os descontos registrados na venda.</p>
        `;

        const tabelaEstoque = document.getElementById("listaEstoque");
        const movimento = document.getElementById("listaMovimentacoes");
        if (movimento?.closest(".painel-estoque")) {
            const secaoMovimentos = movimento.closest(".painel-estoque");
            secaoMovimentos.parentNode.insertBefore(painel, secaoMovimentos);
        } else if (tabelaEstoque?.closest(".painel-estoque-vendedor")) {
            const secaoEstoque = tabelaEstoque.closest(".painel-estoque-vendedor");
            secaoEstoque.parentNode.insertBefore(painel, secaoEstoque.nextSibling);
        } else if (tabelaEstoque?.closest(".painel-estoque")) {
            const secaoEstoque = tabelaEstoque.closest(".painel-estoque");
            secaoEstoque.parentNode.insertBefore(painel, secaoEstoque.nextSibling);
        } else {
            document.querySelector("main")?.appendChild(painel);
        }

        painel.querySelector("#slPeriodoVendasCor").addEventListener("change", carregar);
        painel.querySelector("#slAtualizarVendasCor").addEventListener("click", carregar);
        painel.querySelector("#slBuscaVendasCor").addEventListener("input", renderizarLista);
        return painel;
    }

    function renderizarLista() {
        const tbody = painel.querySelector("#slListaVendasCor");
        const termo = painel.querySelector("#slBuscaVendasCor").value.trim().toLocaleLowerCase("pt-BR");
        const filtrados = ultimaLista.filter((item) => `${item.produto} ${item.cor}`.toLocaleLowerCase("pt-BR").includes(termo));
        tbody.replaceChildren();

        if (!filtrados.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 4;
            td.textContent = ultimaLista.length ? "Nenhuma cor corresponde à busca." : "Nenhuma venda por cor encontrada neste período.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        filtrados.slice(0, 50).forEach((item) => {
            const tr = document.createElement("tr");
            [item.produto, item.cor, `${quantidade(item.quantidade)} un.`, moeda(item.faturamento)].forEach((valor) => {
                const td = document.createElement("td");
                td.textContent = valor;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    async function carregar() {
        const botao = painel.querySelector("#slAtualizarVendasCor");
        const tipo = painel.querySelector("#slPeriodoVendasCor").value;
        botao.disabled = true;
        botao.textContent = "Atualizando...";
        painel.querySelector("#slResumoVendasCor").textContent = "Consultando vendas finalizadas...";
        try {
            const periodo = obterPeriodo(tipo);
            const dados = await analise.carregarDados({ supabase, lojaId: perfil.loja_id, ...periodo, incluirCusto: false });
            ultimaLista = analise.agruparPorCor(dados.itens, dados.vendas, periodo);
            const totalUnidades = ultimaLista.reduce((soma, item) => soma + item.quantidade, 0);
            const totalFaturamento = ultimaLista.reduce((soma, item) => soma + item.faturamento, 0);
            painel.querySelector("#slResumoVendasCor").innerHTML = `<div><span>Combinações produto/cor</span><strong>${ultimaLista.length}</strong></div><div><span>Unidades vendidas</span><strong>${escapar(quantidade(totalUnidades))}</strong></div><div><span>Faturamento por cor</span><strong>${escapar(moeda(totalFaturamento))}</strong></div>`;
            painel.querySelector("#slNotaVendasCor").textContent = `Dados atualizados em ${new Date().toLocaleString("pt-BR")}. São exibidas até 50 combinações, ordenadas pela quantidade vendida.`;
            renderizarLista();
        } catch (erro) {
            console.error("Erro ao carregar vendas por cor:", erro);
            ultimaLista = [];
            painel.querySelector("#slResumoVendasCor").textContent = "Não foi possível consultar as vendas por cor.";
            painel.querySelector("#slListaVendasCor").innerHTML = `<tr><td colspan="4">Verifique a conexão e as permissões de leitura das vendas e dos itens.</td></tr>`;
        } finally {
            botao.disabled = false;
            botao.textContent = "Atualizar";
        }
    }

    async function iniciar() {
        if (!supabase || !analise || painel) return;
        try {
            perfil = await obterPerfil();
            criarPainel();
            await carregar();
        } catch (erro) {
            console.error("Não foi possível iniciar a análise de cores:", erro);
            if (painel) painel.querySelector("#slResumoVendasCor").textContent = "Não foi possível identificar a loja para consultar as vendas por cor.";
        }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();
