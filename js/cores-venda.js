/* =========================================================
   SISTEMA DA LOJA — SELEÇÃO VISUAL DE CORES NAS VENDAS
   Compartilhado entre administrador e vendedor.
   As fotos são privadas e carregadas por URL assinada.
========================================================= */
(function () {
    const BUCKET_FOTOS_CORES = "sistema-loja-fotos-cores";

    function escapar(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        })[c]);
    }

    async function urlFoto(supabase, caminho) {
        if (!caminho) return null;
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_FOTOS_CORES)
                .createSignedUrl(caminho, 60 * 60);
            if (error) throw error;
            return data?.signedUrl || null;
        } catch (erro) {
            console.warn("Foto da cor indisponível nesta venda:", erro);
            return null;
        }
    }

    async function carregar(supabase, produtos) {
        const ids = [...new Set((produtos || []).map((p) => Number(p.id)).filter(Number.isFinite))];
        if (!ids.length) return { controle: new Map(), cores: new Map() };

        const [produtosResult, coresResult] = await Promise.all([
            supabase.from("produtos").select("id, controla_cores").in("id", ids),
            supabase.from("produtos_cores")
                .select("id, produto_id, loja_id, nome_cor, estoque, estoque_minimo, ativo, foto_path")
                .in("produto_id", ids)
                .eq("ativo", true)
                .order("nome_cor", { ascending: true })
        ]);

        if (produtosResult.error) throw produtosResult.error;
        if (coresResult.error) throw coresResult.error;

        const controle = new Map((produtosResult.data || []).map((p) => [String(p.id), p.controla_cores === true]));
        const cores = new Map();
        for (const cor of (coresResult.data || [])) {
            cor.foto_url = await urlFoto(supabase, cor.foto_path);
            const chave = String(cor.produto_id);
            if (!cores.has(chave)) cores.set(chave, []);
            cores.get(chave).push(cor);
        }
        return { controle, cores };
    }

    function selecionar(produto, quantidade, dados) {
        const chave = String(produto.id);
        if (dados?.controle?.get(chave) !== true) {
            const estoque = Number(produto.estoque) || 0;
            if (estoque < quantidade) {
                return Promise.reject(new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${estoque}.`));
            }
            return Promise.resolve([{
                produto_cor_id: null, cor_vendida: null, estoque, foto_url: null, quantidade
            }]);
        }

        const cores = dados.cores.get(chave) || [];
        if (!cores.length) {
            return Promise.reject(new Error(`O produto "${produto.nome}" está configurado por cores, mas não possui cor ativa disponível. Procure o administrador.`));
        }

        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "sl-cores-overlay";
            overlay.innerHTML = `
                <section class="sl-cores-dialog sl-cores-venda-dialog" role="dialog" aria-modal="true" aria-labelledby="slTituloCorVenda">
                    <h3 id="slTituloCorVenda">Escolha as cores do produto</h3>
                    <p>${escapar(produto.nome)} · Quantidade da venda: ${escapar(quantidade)}</p>
                    <div class="sl-cores-opcoes-venda" role="group" aria-label="Cores e quantidades disponíveis">
                        ${cores.map((cor) => {
                            const saldo = Math.max(0, Number(cor.estoque) || 0);
                            const imagem = cor.foto_url
                                ? `<img src="${escapar(cor.foto_url)}" alt="Foto da cor ${escapar(cor.nome_cor)}" loading="lazy" style="display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;">`
                                : `<span class="sl-cor-opcao-sem-foto" aria-hidden="true">📷</span>`;
                            return `<article class="sl-cor-opcao sl-cor-quantidade-card" data-cor-card="${Number(cor.id)}" style="display:flex;flex-direction:column;align-items:stretch;width:100%;min-width:0;max-width:100%;overflow:hidden;">
                                <span class="sl-cor-opcao-imagem" style="display:flex;width:100%;height:110px;min-height:110px;max-height:110px;align-items:center;justify-content:center;overflow:hidden;">${imagem}</span>
                                <span class="sl-cor-opcao-dados"><strong>${escapar(cor.nome_cor)}</strong><small>${saldo.toLocaleString("pt-BR")} em estoque</small></span>
                                <span class="sl-cor-quantidade-controle">
                                    <button type="button" data-diminuir="${Number(cor.id)}" aria-label="Diminuir ${escapar(cor.nome_cor)}">−</button>
                                    <input type="number" min="0" max="${saldo}" step="1" value="0" inputmode="numeric" data-quantidade-cor="${Number(cor.id)}" aria-label="Quantidade ${escapar(cor.nome_cor)}" ${saldo <= 0 ? "disabled" : ""}>
                                    <button type="button" data-aumentar="${Number(cor.id)}" aria-label="Aumentar ${escapar(cor.nome_cor)}" ${saldo <= 0 ? "disabled" : ""}>+</button>
                                </span>
                            </article>`;
                        }).join("")}
                    </div>
                    <div class="sl-cores-resumo-quantidade">
                        <span>Quantidade selecionada</span>
                        <strong data-total-selecionado>0 de ${escapar(quantidade)}</strong>
                    </div>
                    <p class="sl-cores-aviso-quantidade" data-aviso-quantidade aria-live="polite">Distribua a quantidade entre as cores.</p>
                    <div class="sl-cores-actions">
                        <button type="button" class="sl-btn-secundario" data-cancelar>Cancelar</button>
                        <button type="button" class="sl-btn-principal" data-confirmar disabled>Adicionar ao carrinho</button>
                    </div>
                </section>`;
            document.body.appendChild(overlay);

            const botaoConfirmar = overlay.querySelector("[data-confirmar]");
            const totalSelecionado = overlay.querySelector("[data-total-selecionado]");
            const aviso = overlay.querySelector("[data-aviso-quantidade]");
            const encerrar = (valor) => { overlay.remove(); resolve(valor); };

            function atualizar() {
                let total = 0;
                overlay.querySelectorAll("[data-quantidade-cor]").forEach((input) => {
                    const valor = Math.max(0, Math.min(Number(input.max), Math.floor(Number(input.value) || 0)));
                    input.value = String(valor);
                    total += valor;
                    const card = input.closest("[data-cor-card]");
                    card?.classList.toggle("selecionada", valor > 0);
                });
                totalSelecionado.textContent = `${total} de ${quantidade}`;
                const excedeu = total > quantidade;
                const completo = total === quantidade;
                aviso.textContent = excedeu
                    ? `Você selecionou ${total}; reduza para ${quantidade}.`
                    : completo ? "Quantidade distribuída corretamente." : `Faltam ${quantidade - total} unidade(s) para completar a venda.`;
                botaoConfirmar.disabled = !completo;
                aviso.classList.toggle("erro", excedeu);
            }

            function alterar(input, delta) {
                const atual = Math.max(0, Math.floor(Number(input.value) || 0));
                const novo = Math.max(0, Math.min(Number(input.max), atual + delta));
                const totalAtual = [...overlay.querySelectorAll("[data-quantidade-cor]")]
                    .reduce((soma, campo) => soma + (Math.floor(Number(campo.value) || 0)), 0);
                if (delta > 0 && totalAtual >= quantidade) return;
                input.value = String(novo);
                atualizar();
            }

            overlay.querySelectorAll("[data-quantidade-cor]").forEach((input) => {
                input.addEventListener("input", () => {
                    const outros = [...overlay.querySelectorAll("[data-quantidade-cor]")]
                        .filter((campo) => campo !== input)
                        .reduce((soma, campo) => soma + (Math.floor(Number(campo.value) || 0)), 0);
                    const limite = Math.min(Number(input.max), Math.max(0, quantidade - outros));
                    if (Number(input.value) > limite) input.value = String(limite);
                    if (Number(input.value) < 0) input.value = "0";
                    atualizar();
                });
                input.addEventListener("change", atualizar);
            });
            overlay.querySelectorAll("[data-aumentar]").forEach((botao) => {
                botao.addEventListener("click", () => {
                    const input = overlay.querySelector(`[data-quantidade-cor="${botao.dataset.aumentar}"]`);
                    alterar(input, 1);
                });
            });
            overlay.querySelectorAll("[data-diminuir]").forEach((botao) => {
                botao.addEventListener("click", () => {
                    const input = overlay.querySelector(`[data-quantidade-cor="${botao.dataset.diminuir}"]`);
                    alterar(input, -1);
                });
            });

            overlay.querySelector("[data-cancelar]").addEventListener("click", () => encerrar(null));
            overlay.addEventListener("click", (evento) => { if (evento.target === overlay) encerrar(null); });
            botaoConfirmar.addEventListener("click", () => {
                atualizar();
                const selecionadas = [];
                overlay.querySelectorAll("[data-quantidade-cor]").forEach((input) => {
                    const qtd = Math.floor(Number(input.value) || 0);
                    if (qtd <= 0) return;
                    const cor = cores.find((item) => String(item.id) === String(input.dataset.quantidadeCor));
                    if (!cor || qtd > (Number(cor.estoque) || 0)) return;
                    selecionadas.push({
                        produto_cor_id: Number(cor.id),
                        cor_vendida: cor.nome_cor,
                        estoque: Number(cor.estoque) || 0,
                        foto_url: cor.foto_url || null,
                        quantidade: qtd
                    });
                });
                if (selecionadas.reduce((soma, item) => soma + item.quantidade, 0) !== quantidade) return;
                encerrar(selecionadas);
            });
        });
    }

    window.SistemaLojaCoresVenda = { carregar, selecionar };
})();
