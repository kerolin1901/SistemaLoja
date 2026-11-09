/* =========================================================
   SISTEMA DA LOJA — COMPARATIVO E RANKING DO DASHBOARD
   Área exclusiva do administrador (inclui lucro bruto).
========================================================= */
(function () {
    "use strict";

    const supabase = supabaseClient;
    const analise = window.SistemaLojaAnaliseVendas;
    let painel;
    let perfilAtual;
    let dadosAtuais = null;

    const moeda = (valor) => (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const numero = (valor) => (Number(valor) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    const esc = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

    function inicioDaSemana(data) {
        const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
        const deslocamento = (inicio.getDay() + 6) % 7;
        inicio.setDate(inicio.getDate() - deslocamento);
        return inicio;
    }

    function obterPeriodos(tipo) {
        const agora = new Date();
        let inicioAtual;
        let inicioAnterior;
        let fimAnterior;

        if (tipo === "semana") {
            inicioAtual = inicioDaSemana(agora);
            inicioAnterior = new Date(inicioAtual);
            inicioAnterior.setDate(inicioAnterior.getDate() - 7);
            fimAnterior = new Date(inicioAnterior.getTime() + (agora.getTime() - inicioAtual.getTime()));
        } else if (tipo === "mes") {
            inicioAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
            inicioAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
            const ultimoDiaAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate();
            fimAnterior = new Date(
                inicioAnterior.getFullYear(),
                inicioAnterior.getMonth(),
                Math.min(agora.getDate(), ultimoDiaAnterior),
                agora.getHours(), agora.getMinutes(), agora.getSeconds(), agora.getMilliseconds()
            );
        } else {
            inicioAtual = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
            inicioAnterior = new Date(inicioAtual);
            inicioAnterior.setDate(inicioAnterior.getDate() - 1);
            fimAnterior = new Date(inicioAnterior.getTime() + (agora.getTime() - inicioAtual.getTime()));
        }

        return {
            atual: { inicio: inicioAtual, fim: agora },
            anterior: { inicio: inicioAnterior, fim: fimAnterior }
        };
    }

    async function obterPerfil() {
        try {
            const salvo = JSON.parse(sessionStorage.getItem("sistemaLojaPerfil") || "null");
            if (salvo?.loja_id) return salvo;
        } catch (_) { /* consulta o perfil novamente */ }

        const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
        if (erroSessao) throw erroSessao;
        if (!sessao?.user?.id) throw new Error("Sessão administrativa não encontrada.");
        const { data, error } = await supabase.from("perfis")
            .select("id, loja_id, tipo, ativo")
            .eq("id", sessao.user.id)
            .maybeSingle();
        if (error) throw error;
        if (!data || data.tipo !== "admin" || !data.ativo || !data.loja_id) {
            throw new Error("Não foi possível confirmar o acesso administrativo à loja.");
        }
        return data;
    }

    function criarPainel() {
        if (document.getElementById("painelDashboardAnalitico")) return document.getElementById("painelDashboardAnalitico");
        const ancora = document.getElementById("painelGraficoVendasDashboard") || document.getElementById("indicadoresDashboard");
        if (!ancora || !ancora.parentNode) return null;

        painel = document.createElement("section");
        painel.id = "painelDashboardAnalitico";
        painel.className = "sl-dashboard-analitico";
        painel.innerHTML = `
            <div class="sl-analitico-cabecalho">
                <div><span class="sl-analitico-etiqueta">ANÁLISE DA LOJA</span><h2>Comparativo de desempenho</h2><p>Compare os resultados com o período anterior equivalente.</p></div>
                <div class="sl-analitico-controles"><label for="slPeriodoDashboard">Período</label><select id="slPeriodoDashboard"><option value="hoje">Hoje × ontem</option><option value="semana">Esta semana × semana anterior</option><option value="mes" selected>Este mês × mês anterior</option></select><button type="button" id="slAtualizarDashboard">Atualizar</button></div>
            </div>
            <div class="sl-analitico-indicadores" id="slIndicadoresComparativos"><div class="sl-analitico-carregando">Carregando comparativos...</div></div>
            <div class="sl-analitico-ranking-cabecalho"><div><h3>Produtos em destaque</h3><p>Ranking do período selecionado, considerando vendas finalizadas.</p></div></div>
            <div class="sl-analitico-rankings" id="slRankingsProdutos"><div class="sl-analitico-carregando">Carregando rankings...</div></div>
            <p class="sl-analitico-observacao" id="slObservacaoDashboard">Os indicadores consideram as vendas finalizadas e os itens registrados. O lucro bruto depende de custo gravado nos itens da venda.</p>
        `;
        ancora.parentNode.insertBefore(painel, ancora.nextSibling);
        painel.querySelector("#slPeriodoDashboard").addEventListener("change", atualizar);
        painel.querySelector("#slAtualizarDashboard").addEventListener("click", atualizar);
        return painel;
    }

    function variacao(atual, anterior) {
        if (atual === null || atual === undefined || anterior === null || anterior === undefined || !Number.isFinite(Number(atual)) || !Number.isFinite(Number(anterior))) return "Comparação indisponível";
        if (Number(anterior) === 0) return Number(atual) === 0 ? "Sem variação" : "Sem base no período anterior";
        const percentual = ((Number(atual) - Number(anterior)) / Math.abs(Number(anterior))) * 100;
        const sinal = percentual > 0 ? "+" : "";
        const classe = percentual > 0 ? "alta" : percentual < 0 ? "queda" : "neutra";
        return `<span class="sl-variacao ${classe}">${sinal}${percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>`;
    }

    function renderizarIndicadores(resumoAtual, resumoAnterior) {
        const container = painel.querySelector("#slIndicadoresComparativos");
        const indicadores = [
            { titulo: "Vendas finalizadas", atual: resumoAtual.quantidadeVendas, anterior: resumoAnterior.quantidadeVendas, formatar: numero },
            { titulo: "Faturamento", atual: resumoAtual.faturamento, anterior: resumoAnterior.faturamento, formatar: moeda },
            { titulo: "Unidades vendidas", atual: resumoAtual.unidades, anterior: resumoAnterior.unidades, formatar: numero },
            { titulo: "Lucro bruto", atual: resumoAtual.lucroBruto, anterior: resumoAnterior.lucroBruto, formatar: moeda }
        ];
        container.replaceChildren();

        indicadores.forEach((item) => {
            const card = document.createElement("article");
            card.className = "sl-analitico-indicador";
            const valorAnterior = item.anterior === null ? "Não disponível" : item.formatar(item.anterior);
            const valorAtual = item.atual === null ? "Não disponível" : item.formatar(item.atual);
            card.innerHTML = `<span>${esc(item.titulo)}</span><strong>${esc(valorAtual)}</strong><small>Período anterior: ${esc(valorAnterior)}</small><div>${variacao(item.atual, item.anterior)}</div>`;
            container.appendChild(card);
        });
    }

    function montarTabelaRanking(titulo, descricao, lista, chave, formatar) {
        const bloco = document.createElement("section");
        bloco.className = "sl-ranking-bloco";
        const cabecalho = document.createElement("div");
        cabecalho.className = "sl-ranking-titulo";
        cabecalho.innerHTML = `<h4>${esc(titulo)}</h4><p>${esc(descricao)}</p>`;
        bloco.appendChild(cabecalho);

        if (!lista.length) {
            const vazio = document.createElement("p");
            vazio.className = "sl-ranking-vazio";
            vazio.textContent = "Sem vendas de produtos neste período.";
            bloco.appendChild(vazio);
            return bloco;
        }

        const tabela = document.createElement("div");
        tabela.className = "sl-ranking-lista";
        lista.slice(0, 5).forEach((produto, indice) => {
            const linha = document.createElement("div");
            linha.className = "sl-ranking-linha";
            const posicao = document.createElement("span");
            posicao.className = "sl-ranking-posicao";
            posicao.textContent = String(indice + 1).padStart(2, "0");
            const nome = document.createElement("div");
            nome.className = "sl-ranking-produto";
            const strong = document.createElement("strong");
            strong.textContent = produto.nome;
            const detalhe = document.createElement("small");
            detalhe.textContent = produto.sku ? `SKU: ${produto.sku}` : `${numero(produto.quantidade)} unidade(s)`;
            nome.append(strong, detalhe);
            const valor = document.createElement("strong");
            valor.className = "sl-ranking-valor";
            valor.textContent = formatar(produto[chave]);
            linha.append(posicao, nome, valor);
            tabela.appendChild(linha);
        });
        bloco.appendChild(tabela);
        return bloco;
    }

    function renderizarRankings(dataset, periodo) {
        const container = painel.querySelector("#slRankingsProdutos");
        container.replaceChildren();
        const produtos = analise.agruparPorProduto(dataset.itens, dataset.vendas, periodo);
        const porQuantidade = [...produtos].sort((a, b) => b.quantidade - a.quantidade);
        const porFaturamento = [...produtos].sort((a, b) => b.faturamento - a.faturamento);
        const porLucro = produtos.filter((p) => p.lucroCompleto).sort((a, b) => b.lucro - a.lucro);

        container.append(
            montarTabelaRanking("Mais vendidos", "Por quantidade de unidades", porQuantidade, "quantidade", numero),
            montarTabelaRanking("Maior faturamento", "Por valor líquido vendido", porFaturamento, "faturamento", moeda),
            montarTabelaRanking("Maior lucro bruto", "Faturamento líquido menos custo", porLucro, "lucro", moeda)
        );

        const semCustoCompleto = produtos.some((p) => !p.lucroCompleto);
        const observacao = painel.querySelector("#slObservacaoDashboard");
        observacao.textContent = semCustoCompleto
            ? "O lucro bruto considera apenas produtos cujos itens vendidos possuem custo registrado. Confira os custos dos produtos para completar o ranking. Os valores consideram vendas finalizadas."
            : "Os indicadores consideram vendas finalizadas. O lucro bruto é calculado pelo valor líquido dos itens menos o custo unitário registrado no momento da venda.";
    }

    async function atualizar() {
        const botao = painel.querySelector("#slAtualizarDashboard");
        const seletor = painel.querySelector("#slPeriodoDashboard");
        botao.disabled = true;
        botao.textContent = "Atualizando...";
        try {
            const periodos = obterPeriodos(seletor.value);
            const dados = await analise.carregarDados({
                supabase,
                lojaId: perfilAtual.loja_id,
                inicio: periodos.anterior.inicio,
                fim: periodos.atual.fim,
                incluirCusto: true
            });
            dadosAtuais = dados;
            const atual = analise.resumir(dados, periodos.atual);
            const anterior = analise.resumir(dados, periodos.anterior);
            renderizarIndicadores(atual, anterior);
            renderizarRankings(dados, periodos.atual);
        } catch (erro) {
            console.error("Erro na análise comparativa do dashboard:", erro);
            painel.querySelector("#slIndicadoresComparativos").innerHTML = `<p class="sl-analitico-erro">Não foi possível carregar os comparativos. Verifique a conexão e as permissões de leitura da loja.</p>`;
            painel.querySelector("#slRankingsProdutos").innerHTML = `<p class="sl-analitico-erro">Os rankings não puderam ser carregados.</p>`;
        } finally {
            botao.disabled = false;
            botao.textContent = "Atualizar";
        }
    }

    async function iniciar() {
        if (!supabase || !analise || painel) return;
        const ancora = document.getElementById("painelGraficoVendasDashboard") || document.getElementById("indicadoresDashboard");
        if (!ancora) return;
        criarPainel();
        try {
            perfilAtual = await obterPerfil();
            await atualizar();
        } catch (erro) {
            console.error("Não foi possível iniciar o painel analítico:", erro);
            painel.querySelector("#slIndicadoresComparativos").innerHTML = `<p class="sl-analitico-erro">Não foi possível identificar a loja para consultar os indicadores.</p>`;
            painel.querySelector("#slRankingsProdutos").replaceChildren();
        }
    }

    function observarDashboard() {
        if (painel) return;
        const procurar = () => {
            if (document.getElementById("painelGraficoVendasDashboard") || document.getElementById("indicadoresDashboard")) {
                observador?.disconnect();
                iniciar();
            }
        };
        const observador = new MutationObserver(procurar);
        observador.observe(document.body, { childList: true, subtree: true });
        procurar();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observarDashboard);
    else observarDashboard();
})();
