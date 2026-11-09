/* =========================================================
   SISTEMA DA LOJA — ESCOLHA DE COR EM DEVOLUÇÕES ANTIGAS
   Usado para vendas históricas sem produto_cor_id registrado.
========================================================= */
(function () {
    function escapar(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        })[c]);
    }

    async function obter(supabase, vendaId) {
        const { data: itens, error: erroItens } = await supabase
            .from("itens_venda")
            .select("id, produto_id, produto_cor_id, cor_vendida, quantidade, descricao_avulsa")
            .eq("venda_id", Number(vendaId))
            .order("id", { ascending: true });
        if (erroItens) throw erroItens;

        const itensProduto = (itens || []).filter((item) => item.produto_id != null);
        const ids = [...new Set(itensProduto.map((item) => Number(item.produto_id)))];
        if (!ids.length) return [];

        const { data: produtos, error: erroProdutos } = await supabase
            .from("produtos")
            .select("id, nome, controla_cores")
            .in("id", ids);
        if (erroProdutos) throw erroProdutos;

        const produtosMap = new Map((produtos || []).map((p) => [String(p.id), p]));
        const itensAntigos = itensProduto.filter((item) => {
            const produto = produtosMap.get(String(item.produto_id));
            return produto?.controla_cores === true && item.produto_cor_id == null;
        });
        if (!itensAntigos.length) return [];

        const idsAntigos = [...new Set(itensAntigos.map((item) => Number(item.produto_id)))];
        const { data: cores, error: erroCores } = await supabase
            .from("produtos_cores")
            .select("id, produto_id, nome_cor, estoque, ativo")
            .in("produto_id", idsAntigos)
            .eq("ativo", true)
            .order("nome_cor", { ascending: true });
        if (erroCores) throw erroCores;

        const coresMap = new Map();
        for (const cor of (cores || [])) {
            const chave = String(cor.produto_id);
            if (!coresMap.has(chave)) coresMap.set(chave, []);
            coresMap.get(chave).push(cor);
        }

        for (const item of itensAntigos) {
            if (!(coresMap.get(String(item.produto_id)) || []).length) {
                const nome = produtosMap.get(String(item.produto_id))?.nome || "produto";
                throw new Error(`O produto "${nome}" está configurado por cores, mas não possui uma cor ativa para receber esta devolução.`);
            }
        }

        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "sl-cores-overlay";
            const linhas = itensAntigos.map((item, indice) => {
                const produto = produtosMap.get(String(item.produto_id));
                const opcoes = (coresMap.get(String(item.produto_id)) || []).map((cor) =>
                    `<option value="${Number(cor.id)}">${escapar(cor.nome_cor)} — saldo atual: ${Number(cor.estoque || 0).toLocaleString("pt-BR")}</option>`
                ).join("");
                return `<label class="sl-devolucao-linha"><span><strong>${escapar(produto?.nome || "Produto")}</strong><small>Item #${Number(item.id)} · quantidade ${Number(item.quantidade)}</small></span><select data-item-id="${Number(item.id)}"><option value="">Selecione a cor de retorno</option>${opcoes}</select></label>`;
            }).join("");
            overlay.innerHTML = `
                <div class="sl-cores-dialog sl-devolucao-dialog" role="dialog" aria-modal="true" aria-labelledby="slTituloDevolucao">
                    <h3 id="slTituloDevolucao">Identificar cores da devolução</h3>
                    <p>Esta venda é antiga e não registrou a cor dos itens. Escolha para qual cor cada item deve retornar ao estoque.</p>
                    <div class="sl-devolucao-lista">${linhas}</div>
                    <div class="sl-cores-actions"><button type="button" class="sl-btn-secundario" data-cancelar>Cancelar</button><button type="button" class="sl-btn-principal" data-confirmar>Confirmar cores</button></div>
                </div>`;
            document.body.appendChild(overlay);
            const encerrar = (valor) => { overlay.remove(); resolve(valor); };
            overlay.querySelector("[data-cancelar]").addEventListener("click", () => encerrar(null));
            overlay.addEventListener("click", (evento) => { if (evento.target === overlay) encerrar(null); });
            overlay.querySelector("[data-confirmar]").addEventListener("click", () => {
                const selects = [...overlay.querySelectorAll("select[data-item-id]")];
                if (selects.some((select) => !select.value)) {
                    selects.find((select) => !select.value)?.focus();
                    return;
                }
                encerrar(selects.map((select) => ({
                    item_id: Number(select.dataset.itemId),
                    produto_cor_id: Number(select.value)
                })));
            });
        });
    }

    window.SistemaLojaCoresDevolucao = { obter };
})();
