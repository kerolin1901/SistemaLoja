/* =========================================================
   SISTEMA DA LOJA — COMPARATIVO DO DASHBOARD DO VENDEDOR
   Exibe somente quantidade e faturamento, sem custos/lucro.
========================================================= */
(function () {
    "use strict";

    const supabase = supabaseClient;
    const analise = window.SistemaLojaAnaliseVendas;
    let perfil;
    let painel;

    const moeda = (valor) => (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const numero = (valor) => (Number(valor) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    const esc = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

    function inicioDaSemana(data) {
        const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
        inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
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
            fimAnterior = new Date(inicioAnterior.getTime() + agora.getTime() - inicioAtual.getTime());
        } else if (tipo === "mes") {
            inicioAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
            inicioAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
            const ultimoDia = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate();
            fimAnterior = new Date(inicioAnterior.getFullYear(), inicioAnterior.getMonth(), Math.min(agora.getDate(), ultimoDia), agora.getHours(), agora.getMinutes(), agora.getSeconds(), agora.getMilliseconds());
        } else {
            inicioAtual = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
            inicioAnterior = new Date(inicioAtual);
            inicioAnterior.setDate(inicioAnterior.getDate() - 1);
            fimAnterior = new Date(inicioAnterior.getTime() + agora.getTime() - inicioAtual.getTime());
        }
        return { atual: { inicio: inicioAtual, fim: agora }, anterior: { inicio: inicioAnterior, fim: fimAnterior } };
    }

    async function obterPerfil() {
        const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
        if (erroSessao) throw erroSessao;
        if (!sessao?.user?.id) throw new Error("Sessão do vendedor não encontrada.");
        const { data, error } = await supabase.from("perfis")
            .select("id, loja_id, tipo, ativo")
            .eq("id", sessao.user.id)
            .maybeSingle();
        if (error) throw error;
        if (!data || data.tipo !== "vendedor" || data.ativo !== true || !data.loja_id) throw new Error("Acesso de vendedor não confirmado.");
        return data;
    }

    function criarPainel() {
        const ancora = document.querySelector(".painel-ultimas-vendas");
        if (!ancora?.parentNode) return null;
        painel = document.createElement("section");
        painel.id = "painelComparativoVendedor";
        painel.className = "sl-dashboard-analitico sl-dashboard-analitico-vendedor";
        painel.innerHTML = `
            <div class="sl-analitico-cabecalho">
                <div><span class="sl-analitico-etiqueta">SEU DESEMPENHO</span><h2>Comparativo de vendas</h2><p>Compare suas vendas com o período anterior equivalente.</p></div>
                <div class="sl-analitico-controles"><label for="slPeriodoVendedor">Período</label><select id="slPeriodoVendedor"><option value="hoje">Hoje × ontem</option><option value="semana">Esta semana × semana anterior</option><option value="mes" selected>Este mês × mês anterior</option></select><button type="button" id="slAtualizarVendedor">Atualizar</button></div>
            </div>
            <div class="sl-analitico-indicadores" id="slIndicadoresVendedor"><div class="sl-analitico-carregando">Carregando comparativos...</div></div>
            <div class="sl-analitico-ranking-cabecalho"><div><h3>Seus produtos em destaque</h3><p>Mais vendidos por quantidade e faturamento no período escolhido.</p></div></div>
            <div class="sl-analitico-rankings sl-ranking-duplo" id="slRankingVendedor"><div class="sl-analitico-carregando">Carregando rankings...</div></div>
        `;
        ancora.parentNode.insertBefore(painel, ancora.nextSibling);
        painel.querySelector("#slPeriodoVendedor").addEventListener("change", atualizar);
        painel.querySelector("#slAtualizarVendedor").addEventListener("click", atualizar);
        return painel;
    }

    function variacao(atual, anterior) {
        if (Number(anterior) === 0) return Number(atual) === 0 ? "Sem variação" : "Sem base no período anterior";
        const percentual = ((Number(atual) - Number(anterior)) / Math.abs(Number(anterior))) * 100;
        const classe = percentual > 0 ? "alta" : percentual < 0 ? "queda" : "neutra";
        const sinal = percentual > 0 ? "+" : "";
        return `<span class="sl-variacao ${classe}">${sinal}${percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>`;
    }

    function renderizarIndicadores(atual, anterior) {
        const container = painel.querySelector("#slIndicadoresVendedor");
        const itens = [
            { titulo: "Vendas finalizadas", a: atual.quantidadeVendas, b: anterior.quantidadeVendas, formato: numero },
            { titulo: "Faturamento", a: atual.faturamento, b: anterior.faturamento, formato: moeda },
            { titulo: "Unidades vendidas", a: atual.unidades, b: anterior.unidades, formato: numero }
        ];
        container.replaceChildren();
        itens.forEach((item) => {
            const card = document.createElement("article");
            card.className = "sl-analitico-indicador";
            card.innerHTML = `<span>${esc(item.titulo)}</span><strong>${esc(item.formato(item.a))}</strong><small>Período anterior: ${esc(item.formato(item.b))}</small><div>${variacao(item.a, item.b)}</div>`;
            container.appendChild(card);
        });
    }

    function criarRanking(titulo, descricao, lista, chave, formato) {
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
        const listaEl = document.createElement("div");
        listaEl.className = "sl-ranking-lista";
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
            valor.textContent = formato(produto[chave]);
            linha.append(posicao, nome, valor);
            listaEl.appendChild(linha);
        });
        bloco.appendChild(listaEl);
        return bloco;
    }

    async function atualizar() {
        const botao = painel.querySelector("#slAtualizarVendedor");
        botao.disabled = true;
        botao.textContent = "Atualizando...";
        try {
            const periodos = obterPeriodos(painel.querySelector("#slPeriodoVendedor").value);
            const dados = await analise.carregarDados({
                supabase,
                lojaId: perfil.loja_id,
                usuarioId: perfil.id,
                inicio: periodos.anterior.inicio,
                fim: periodos.atual.fim,
                incluirCusto: false
            });
            const atual = analise.resumir(dados, periodos.atual);
            const anterior = analise.resumir(dados, periodos.anterior);
            renderizarIndicadores(atual, anterior);
            const produtos = analise.agruparPorProduto(dados.itens, dados.vendas, periodos.atual);
            const quantidade = [...produtos].sort((a, b) => b.quantidade - a.quantidade);
            const faturamento = [...produtos].sort((a, b) => b.faturamento - a.faturamento);
            const ranking = painel.querySelector("#slRankingVendedor");
            ranking.replaceChildren(
                criarRanking("Mais vendidos", "Por quantidade de unidades", quantidade, "quantidade", numero),
                criarRanking("Maior faturamento", "Por valor líquido vendido", faturamento, "faturamento", moeda)
            );
        } catch (erro) {
            console.error("Erro ao carregar comparativo do vendedor:", erro);
            painel.querySelector("#slIndicadoresVendedor").innerHTML = `<p class="sl-analitico-erro">Não foi possível carregar seus comparativos. Verifique a conexão e as permissões.</p>`;
            painel.querySelector("#slRankingVendedor").replaceChildren();
        } finally {
            botao.disabled = false;
            botao.textContent = "Atualizar";
        }
    }

    async function iniciar() {
        if (!analise || painel) return;
        if (!document.querySelector(".painel-ultimas-vendas")) return;
        criarPainel();
        try {
            perfil = await obterPerfil();
            await atualizar();
        } catch (erro) {
            console.error("Não foi possível iniciar o comparativo do vendedor:", erro);
            painel.querySelector("#slIndicadoresVendedor").innerHTML = `<p class="sl-analitico-erro">Não foi possível identificar o usuário para consultar as vendas.</p>`;
            painel.querySelector("#slRankingVendedor").replaceChildren();
        }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();
