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
            return Promise.resolve({ produto_cor_id: null, cor_vendida: null, estoque: Number(produto.estoque) || 0, foto_url: null });
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
                    <h3 id="slTituloCorVenda">Escolha a cor do produto</h3>
                    <p>${escapar(produto.nome)} · Quantidade: ${escapar(quantidade)}</p>
                    <div class="sl-cores-opcoes-venda" role="group" aria-label="Cores disponíveis">
                        ${cores.map((cor) => {
                            const saldo = Number(cor.estoque) || 0;
                            const indisponivel = saldo < quantidade;
                            const imagem = cor.foto_url
                                ? `<img src="${escapar(cor.foto_url)}" alt="Foto da cor ${escapar(cor.nome_cor)}" loading="lazy" style="display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;">`
                                : `<span class="sl-cor-opcao-sem-foto" aria-hidden="true">📷</span>`;
                            return `<button type="button" class="sl-cor-opcao" data-cor-id="${Number(cor.id)}" ${indisponivel ? "disabled" : ""} aria-pressed="false" style="display:flex;flex-direction:column;align-items:stretch;width:100%;min-width:0;max-width:100%;overflow:hidden;">
                                <span class="sl-cor-opcao-imagem" style="display:flex;width:100%;height:136px;min-height:136px;max-height:136px;align-items:center;justify-content:center;overflow:hidden;">${imagem}</span>
                                <span class="sl-cor-opcao-dados"><strong>${escapar(cor.nome_cor)}</strong><small>${saldo.toLocaleString("pt-BR")} em estoque${indisponivel ? " · insuficiente" : ""}</small></span>
                            </button>`;
                        }).join("")}
                    </div>
                    <div class="sl-cores-actions">
                        <button type="button" class="sl-btn-secundario" data-cancelar>Cancelar</button>
                        <button type="button" class="sl-btn-principal" data-confirmar disabled>Adicionar ao carrinho</button>
                    </div>
                </section>`;
            document.body.appendChild(overlay);

            let corSelecionada = null;
            const botaoConfirmar = overlay.querySelector("[data-confirmar]");
            const encerrar = (valor) => { overlay.remove(); resolve(valor); };

            overlay.querySelectorAll("[data-cor-id]").forEach((botao) => {
                botao.addEventListener("click", () => {
                    corSelecionada = cores.find((item) => String(item.id) === String(botao.dataset.corId)) || null;
                    overlay.querySelectorAll("[data-cor-id]").forEach((item) => {
                        const selecionado = item === botao;
                        item.classList.toggle("selecionada", selecionado);
                        item.setAttribute("aria-pressed", selecionado ? "true" : "false");
                    });
                    botaoConfirmar.disabled = !corSelecionada;
                });
            });

            overlay.querySelector("[data-cancelar]").addEventListener("click", () => encerrar(null));
            overlay.addEventListener("click", (evento) => { if (evento.target === overlay) encerrar(null); });
            botaoConfirmar.addEventListener("click", () => {
                if (!corSelecionada || Number(corSelecionada.estoque) < quantidade) return;
                encerrar({
                    produto_cor_id: Number(corSelecionada.id),
                    cor_vendida: corSelecionada.nome_cor,
                    estoque: Number(corSelecionada.estoque) || 0,
                    foto_url: corSelecionada.foto_url || null
                });
            });
        });
    }

    window.SistemaLojaCoresVenda = { carregar, selecionar };
})();
