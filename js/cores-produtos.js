/* =========================================================
   SISTEMA DA LOJA — CADASTRO E GESTÃO DE CORES NO PRODUTO
   A ativação redistribui somente a quantidade já existente.
========================================================= */
(function () {
    const supabase = supabaseClient;
    const BUCKET_FOTOS_CORES = "sistema-loja-fotos-cores";
    let overlay = null;
    let produtoAtual = null;
    let coresTemporarias = [];

    const escapar = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);
    const numero = (valor) => Number(Number(valor || 0).toFixed(3));
    const formatar = (valor) => numero(valor).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

    function criarOverlay() {
        if (overlay) overlay.remove();
        overlay = document.createElement("div");
        overlay.className = "sl-cores-overlay";
        overlay.innerHTML = `<section class="sl-cores-dialog sl-cores-modal" role="dialog" aria-modal="true" aria-labelledby="slTituloGestaoCores">
            <div class="sl-cores-modal-conteudo"></div>
            <div class="sl-cores-actions"><button type="button" class="sl-btn-secundario" data-fechar>Fechar</button></div>
        </section>`;
        document.body.appendChild(overlay);
        overlay.querySelector("[data-fechar]").addEventListener("click", fechar);
        overlay.addEventListener("click", (evento) => { if (evento.target === overlay) fechar(); });
        return overlay.querySelector(".sl-cores-modal-conteudo");
    }

    function fechar() {
        overlay?.remove();
        overlay = null;
        produtoAtual = null;
        coresTemporarias = [];
    }

    function adicionarLinhaAtivacao() {
        const container = overlay.querySelector("[data-lista-cores]");
        const indice = coresTemporarias.length;
        coresTemporarias.push({ nome_cor: "", estoque: 0, estoque_minimo: 0 });
        const linha = document.createElement("div");
        linha.className = "sl-cores-linha";
        linha.dataset.indice = String(indice);
        linha.innerHTML = `
            <label>Nome da cor<input type="text" maxlength="60" data-campo="nome_cor" placeholder="Ex.: Azul" required></label>
            <label>Quantidade atual<input type="number" min="0" step="0.001" value="0" data-campo="estoque" required></label>
            <label>Estoque mínimo<input type="number" min="0" step="0.001" value="0" data-campo="estoque_minimo" required></label>
            <button type="button" class="sl-btn-secundario" data-remover>Remover</button>`;
        linha.querySelectorAll("input").forEach((input) => input.addEventListener("input", atualizarResumoAtivacao));
        linha.querySelector("[data-remover]").addEventListener("click", () => {
            coresTemporarias[indice] = null;
            linha.remove();
            atualizarResumoAtivacao();
        });
        container.appendChild(linha);
        atualizarResumoAtivacao();
    }

    function atualizarResumoAtivacao() {
        let soma = 0;
        overlay.querySelectorAll("[data-indice]").forEach((linha) => {
            const estoque = Number(linha.querySelector('[data-campo="estoque"]').value);
            soma += Number.isFinite(estoque) ? estoque : 0;
        });
        const atual = Number(produtoAtual.estoque || 0);
        const resumo = overlay.querySelector("[data-resumo]");
        const ok = numero(soma) === numero(atual);
        resumo.classList.toggle("erro", !ok);
        resumo.innerHTML = `<span>Estoque total atual: <strong>${formatar(atual)}</strong></span><span>Soma distribuída: <strong>${formatar(soma)}</strong></span><span>${ok ? "A soma confere" : "A soma precisa ser exatamente igual ao estoque atual"}</span>`;
        const botao = overlay.querySelector("[data-ativar]");
        if (botao) botao.disabled = !ok || !overlay.querySelectorAll("[data-indice]").length;
    }

    function abrirAtivacao(produto) {
        produtoAtual = produto;
        const conteudo = criarOverlay();
        conteudo.innerHTML = `
            <h3 id="slTituloGestaoCores">Ativar estoque por cores</h3>
            <p>Produto: <strong>${escapar(produto.nome)}</strong></p>
            <div class="sl-cores-explicacao">O estoque atual é <strong>${formatar(produto.estoque)}</strong>. Distribua essa quantidade entre as cores. A soma precisa ser exatamente igual ao saldo atual; nenhuma unidade será criada nem removida.</div>
            <div class="sl-cores-linhas" data-lista-cores></div>
            <div class="sl-cores-resumo" data-resumo></div>
            <button type="button" class="sl-btn-secundario sl-cores-add" data-adicionar>+ Adicionar cor</button>
            <div class="sl-cores-actions"><button type="button" class="sl-btn-principal" data-ativar disabled>Ativar controle por cores</button></div>`;
        conteudo.querySelector("[data-adicionar]").addEventListener("click", adicionarLinhaAtivacao);
        conteudo.querySelector("[data-ativar]").addEventListener("click", ativarControle);
        adicionarLinhaAtivacao();
    }

    async function ativarControle() {
        const botao = overlay.querySelector("[data-ativar]");
        const lista = [];
        for (const linha of overlay.querySelectorAll("[data-indice]")) {
            const nome = linha.querySelector('[data-campo="nome_cor"]').value.trim();
            const quantidade = Number(linha.querySelector('[data-campo="estoque"]').value);
            const minimo = Number(linha.querySelector('[data-campo="estoque_minimo"]').value);
            if (!nome || !Number.isFinite(quantidade) || quantidade < 0 || !Number.isFinite(minimo) || minimo < 0) {
                alert("Preencha corretamente o nome, a quantidade e o estoque mínimo de cada cor.");
                return;
            }
            lista.push({ nome_cor: nome, estoque: numero(quantidade), estoque_minimo: numero(minimo) });
        }
        if (!lista.length) return;
        const soma = numero(lista.reduce((total, cor) => total + cor.estoque, 0));
        if (soma !== numero(produtoAtual.estoque)) {
            alert(`A soma das cores (${formatar(soma)}) precisa ser igual ao estoque atual (${formatar(produtoAtual.estoque)}).`);
            return;
        }
        botao.disabled = true;
        botao.textContent = "Ativando...";
        try {
            const { data, error } = await supabase.rpc("configurar_cores_produto", {
                p_produto_id: Number(produtoAtual.id),
                p_cores: lista
            });
            if (error) throw error;
            if (!data?.sucesso) throw new Error("O banco não confirmou a ativação do controle por cores.");
            const nomeProdutoAtivado = produtoAtual.nome;
            fechar();
            if (typeof carregarProdutos === "function") await carregarProdutos();
            alert(`Controle por cores ativado para ${nomeProdutoAtivado}.`);
        } catch (erro) {
            console.error("Erro ao ativar cores:", erro);
            alert(erro.message || "Não foi possível ativar o controle por cores.");
            botao.disabled = false;
            botao.textContent = "Ativar controle por cores";
        }
    }

    async function abrirGestao(produto) {
        produtoAtual = produto;
        const conteudo = criarOverlay();
        conteudo.innerHTML = `<h3 id="slTituloGestaoCores">Gerenciar cores</h3><p>Produto: <strong>${escapar(produto.nome)}</strong> · Estoque total: <strong>${formatar(produto.estoque)}</strong></p><div class="sl-cores-linhas" data-lista-cores>Carregando cores...</div><button type="button" class="sl-btn-secundario sl-cores-add" data-adicionar>+ Cadastrar nova cor (estoque inicial zero)</button><div class="sl-cores-explicacao" style="margin-top:12px;"><strong style="display:block;margin-bottom:5px;">📷 Tamanho recomendado para as fotos</strong><span>Use imagens de <strong>800 × 800 px</strong> (formato quadrado), com o produto centralizado e uma pequena margem ao redor. São aceitos JPG, PNG e WebP de até 5 MB. O sistema ajusta a foto automaticamente, sem deformar ou cortar o produto.</span></div><p class="sl-cores-explicacao">O saldo de cada cor só muda por meio de uma movimentação de estoque. Aqui você pode alterar nome, estoque mínimo e status.</p>`;
        const container = conteudo.querySelector("[data-lista-cores]");
        const { data, error } = await supabase.from("produtos_cores")
            .select("id, produto_id, loja_id, nome_cor, estoque, estoque_minimo, ativo, foto_path")
            .eq("produto_id", Number(produto.id))
            .order("id", { ascending: true });
        if (error) {
            container.textContent = error.message || "Não foi possível carregar as cores.";
            return;
        }
        container.innerHTML = "";
        for (const cor of (data || [])) {
            cor.foto_url = await criarUrlFoto(cor.foto_path);
            container.appendChild(criarLinhaGestao(cor));
        }
        conteudo.querySelector("[data-adicionar]").addEventListener("click", () => container.appendChild(criarLinhaGestao(null)));
    }

    function criarLinhaGestao(cor) {
        const linha = document.createElement("div");
        linha.className = "sl-cores-linha sl-cores-linha-com-foto";
        linha.innerHTML = `
            <div class="sl-cor-foto-gestao">
                ${cor?.foto_url
                    ? `<img src="${escapar(cor.foto_url)}" alt="Foto da cor ${escapar(cor.nome_cor)}" loading="lazy" style="display:block;width:112px;height:92px;max-width:112px;max-height:92px;object-fit:contain;object-position:center;">`
                    : `<div class="sl-cor-foto-vazia"><span aria-hidden="true">📷</span><small>Sem foto</small></div>`}
                <div class="sl-cor-foto-acoes">
                    <button type="button" class="sl-btn-secundario" data-escolher-foto ${cor ? "" : "disabled"}>${cor?.foto_path ? "Trocar foto" : "Adicionar foto"}</button>
                    ${cor?.foto_path ? `<button type="button" class="sl-btn-secundario sl-btn-remover-foto" data-remover-foto>Remover foto</button>` : ""}
                    <input type="file" accept="image/jpeg,image/png,image/webp" data-foto-input hidden>
                </div>
                <small class="sl-cor-foto-ajuda">JPG, PNG ou WebP · até 5 MB</small>
            </div>
            <label>Nome da cor<input type="text" maxlength="60" data-nome value="${escapar(cor?.nome_cor || "")}" placeholder="Ex.: Azul" required></label>
            <label>Estoque atual<input type="text" value="${cor ? formatar(cor.estoque) : "0"}" disabled><small>Alterado na tela Estoque</small></label>
            <label>Estoque mínimo<input type="number" min="0" step="0.001" data-minimo value="${cor ? Number(cor.estoque_minimo || 0) : 0}" required></label>
            <label>Status<select data-ativo ${cor ? "" : "disabled"}><option value="true" ${!cor || cor.ativo ? "selected" : ""}>Ativa</option><option value="false" ${cor && !cor.ativo ? "selected" : ""}>Inativa</option></select></label>
            <div class="sl-cores-linha-acoes"><button type="button" class="sl-btn-principal" data-salvar>${cor ? "Salvar" : "Cadastrar cor"}</button></div>`;
        linha.querySelector("[data-salvar]").addEventListener("click", () => salvarLinhaGestao(linha, cor));
        const inputFoto = linha.querySelector("[data-foto-input]");
        linha.querySelector("[data-escolher-foto]").addEventListener("click", () => inputFoto.click());
        inputFoto.addEventListener("change", () => {
            const arquivo = inputFoto.files?.[0];
            if (arquivo && cor) enviarFotoCor(cor, arquivo, linha);
            inputFoto.value = "";
        });
        linha.querySelector("[data-remover-foto]")?.addEventListener("click", () => removerFotoCor(cor, linha));
        return linha;
    }

    async function criarUrlFoto(caminho) {
        if (!caminho) return null;
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_FOTOS_CORES)
                .createSignedUrl(caminho, 60 * 60);
            if (error) throw error;
            return data?.signedUrl || null;
        } catch (erro) {
            console.warn("Não foi possível gerar a URL da foto da cor:", erro);
            return null;
        }
    }

    function extensaoFoto(arquivo) {
        const tipo = String(arquivo.type || "").toLowerCase();
        const porTipo = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
        return porTipo[tipo] || null;
    }

    async function enviarFotoCor(cor, arquivo, linha) {
        const extensao = extensaoFoto(arquivo);
        if (!extensao) {
            alert("Escolha uma imagem JPG, PNG ou WebP.");
            return;
        }
        if (arquivo.size > 5 * 1024 * 1024) {
            alert("A foto deve ter no máximo 5 MB.");
            return;
        }
        const botao = linha.querySelector("[data-escolher-foto]");
        const botaoRemover = linha.querySelector("[data-remover-foto]");
        botao.disabled = true;
        if (botaoRemover) botaoRemover.disabled = true;
        botao.textContent = "Enviando...";
        const caminhoAntigo = cor.foto_path || null;
        const caminhoNovo = `${cor.loja_id}/${cor.produto_id}/${cor.id}/foto-${Date.now()}-${Math.floor(Math.random() * 1000000)}.${extensao}`;
        try {
            const { error: erroUpload } = await supabase.storage
                .from(BUCKET_FOTOS_CORES)
                .upload(caminhoNovo, arquivo, {
                    cacheControl: "3600",
                    contentType: arquivo.type,
                    upsert: false
                });
            if (erroUpload) throw erroUpload;

            const { data, error } = await supabase.rpc("atualizar_foto_produto_cor", {
                p_produto_cor_id: Number(cor.id),
                p_foto_path: caminhoNovo
            });
            if (error) {
                await supabase.storage.from(BUCKET_FOTOS_CORES).remove([caminhoNovo]).catch(() => {});
                throw error;
            }
            if (!data?.sucesso) {
                await supabase.storage.from(BUCKET_FOTOS_CORES).remove([caminhoNovo]);
                throw new Error("O banco não confirmou o vínculo da foto com a cor.");
            }

            if (caminhoAntigo && caminhoAntigo !== caminhoNovo) {
                const { error: erroRemocao } = await supabase.storage.from(BUCKET_FOTOS_CORES).remove([caminhoAntigo]);
                if (erroRemocao) console.warn("A foto anterior permaneceu armazenada:", erroRemocao);
            }
            await abrirGestao(produtoAtual);
            alert("Foto da cor salva com sucesso.");
        } catch (erro) {
            console.error("Erro ao enviar foto da cor:", erro);
            alert(erro.message || "Não foi possível enviar a foto.");
            botao.disabled = false;
            botao.textContent = caminhoAntigo ? "Trocar foto" : "Adicionar foto";
            if (botaoRemover) botaoRemover.disabled = false;
        }
    }

    async function removerFotoCor(cor, linha) {
        if (!cor?.foto_path || !confirm(`Remover a foto da cor ${cor.nome_cor}?`)) return;
        const botao = linha.querySelector("[data-remover-foto]");
        botao.disabled = true;
        botao.textContent = "Removendo...";
        try {
            const { data, error } = await supabase.rpc("atualizar_foto_produto_cor", {
                p_produto_cor_id: Number(cor.id),
                p_foto_path: null
            });
            if (error) throw error;
            if (!data?.sucesso) throw new Error("O banco não confirmou a remoção da foto.");
            const { error: erroStorage } = await supabase.storage.from(BUCKET_FOTOS_CORES).remove([cor.foto_path]);
            if (erroStorage) console.warn("O vínculo foi removido, mas o arquivo antigo permaneceu no Storage:", erroStorage);
            await abrirGestao(produtoAtual);
            alert("Foto removida da cor.");
        } catch (erro) {
            console.error("Erro ao remover foto da cor:", erro);
            alert(erro.message || "Não foi possível remover a foto.");
            botao.disabled = false;
            botao.textContent = "Remover foto";
        }
    }

    async function salvarLinhaGestao(linha, cor) {
        const nome = linha.querySelector("[data-nome]").value.trim();
        const minimo = Number(linha.querySelector("[data-minimo]").value);
        const ativo = cor ? linha.querySelector("[data-ativo]").value === "true" : true;
        if (!nome || !Number.isFinite(minimo) || minimo < 0) {
            alert("Informe um nome de cor e um estoque mínimo válido.");
            return;
        }
        const botao = linha.querySelector("[data-salvar]");
        botao.disabled = true;
        botao.textContent = "Salvando...";
        try {
            const { data, error } = await supabase.rpc("salvar_cor_produto", {
                p_produto_id: Number(produtoAtual.id),
                p_produto_cor_id: cor ? Number(cor.id) : null,
                p_nome_cor: nome,
                p_estoque_minimo: numero(minimo),
                p_ativo: ativo
            });
            if (error) throw error;
            if (!data?.sucesso) throw new Error("O banco não confirmou a alteração da cor.");
            await abrirGestao(produtoAtual);
            if (typeof carregarProdutos === "function") await carregarProdutos();
        } catch (erro) {
            console.error("Erro ao salvar cor:", erro);
            alert(erro.message || "Não foi possível salvar a cor.");
            botao.disabled = false;
            botao.textContent = cor ? "Salvar" : "Cadastrar cor";
        }
    }

    async function gerenciar(id) {
        const produto = (produtos || []).find((item) => String(item.id) === String(id));
        if (!produto) {
            alert("Produto não encontrado. Atualize a lista e tente novamente.");
            return;
        }
        if (produto.controla_cores === true) return abrirGestao(produto);
        return abrirAtivacao(produto);
    }

    document.addEventListener("click", (evento) => {
        const botao = evento.target.closest("[data-gerenciar-cores]");
        if (!botao) return;
        evento.preventDefault();
        gerenciar(botao.dataset.gerenciarCores);
    });

    window.gerenciarCoresProduto = gerenciar;
})();
