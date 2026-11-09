/* ==========================================
   SISTEMA DA LOJA
   CONTROLE DE ESTOQUE
========================================== */

const formMovimentacao =
    document.getElementById("formMovimentacao");

const produtoEstoque =
    document.getElementById("produtoEstoque");

const corEstoqueCampo = document.getElementById("corEstoqueCampo");
const corEstoque = document.getElementById("corEstoque");
let coresProdutoSelecionado = [];

const tipoMovimentacao =
    document.getElementById("tipoMovimentacao");

const quantidadeMovimentacao =
    document.getElementById("quantidadeMovimentacao");

const motivoMovimentacao =
    document.getElementById("motivoMovimentacao");

const mensagemEstoque =
    document.getElementById("mensagemEstoque");

const btnCancelarMovimentacao =
    document.getElementById("btnCancelarMovimentacao");

const btnAtualizarEstoque =
    document.getElementById("btnAtualizarEstoque");

const btnSair =
    document.getElementById("btnSair");

const listaEstoque =
    document.getElementById("listaEstoque");

const listaMovimentacoes =
    document.getElementById("listaMovimentacoes");

const carregandoEstoque =
    document.getElementById("carregandoEstoque");

const carregandoMovimentacoes =
    document.getElementById("carregandoMovimentacoes");

const semEstoque =
    document.getElementById("semEstoque");

const semMovimentacoes =
    document.getElementById("semMovimentacoes");

const totalProdutos =
    document.getElementById("totalProdutos");

const totalItens =
    document.getElementById("totalItens");

const totalEstoqueBaixo =
    document.getElementById("totalEstoqueBaixo");

const nomeAdministrador =
    document.getElementById("nomeAdministrador");

const avatarAdministrador =
    document.querySelector(".avatar-admin");

const dataAtual =
    document.getElementById("dataAtual");


/* ==========================================
   SUPABASE
========================================== */

const estoqueSupabase = supabaseClient;

let usuarioAtual = null;
let movimentacaoEmAndamento = false;
let produtosSelectEstoque = [];


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(texto, tipo) {

    if (!mensagemEstoque) {
        return;
    }

    mensagemEstoque.textContent = texto || "";

    mensagemEstoque.className =
        "mensagem-estoque";

    if (tipo) {
        mensagemEstoque.classList.add(tipo);
    }
}


/* ==========================================
   DATA
========================================== */

function mostrarData() {

    if (!dataAtual) {
        return;
    }

    const agora = new Date();

    dataAtual.textContent =
        agora.toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
}


/* ==========================================
   PROTEGER PÁGINA
========================================== */

async function protegerPaginaEstoque() {

    try {

        const resultadoUsuario =
            await estoqueSupabase.auth.getUser();

        const usuario =
            resultadoUsuario.data.user;

        if (!usuario) {

            window.location.href =
                "index.html";

            return false;
        }


        const resultadoPerfil =
            await estoqueSupabase
                .from("perfis")
                .select("*")
                .eq("id", usuario.id)
                .single();


        if (
            resultadoPerfil.error ||
            !resultadoPerfil.data
        ) {

            await estoqueSupabase.auth.signOut();

            window.location.href =
                "index.html";

            return false;
        }


        const perfil =
            resultadoPerfil.data;


        if (perfil.tipo !== "admin") {

            window.location.href =
                "vendedor.html";

            return false;
        }


        if (!perfil.ativo) {

            await estoqueSupabase.auth.signOut();

            alert(
                "Seu usuário está desativado."
            );

            window.location.href =
                "index.html";

            return false;
        }


        usuarioAtual = perfil;


        if (nomeAdministrador) {

            nomeAdministrador.textContent =
                perfil.nome_completo ||
                "Administrador";
        }


        if (avatarAdministrador) {

            const nome =
                perfil.nome_completo ||
                "Administrador";

            avatarAdministrador.textContent =
                nome.charAt(0).toUpperCase();
        }


        return true;

    } catch (erro) {

        console.error(
            "Erro ao verificar usuário:",
            erro
        );

        window.location.href =
            "index.html";

        return false;
    }
}


/* ==========================================
   FORMATAÇÃO DE NÚMERO
========================================== */

function formatarNumero(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        }
    );
}


/* ==========================================
   FORMATAÇÃO DE DATA
========================================== */

function formatarData(data) {

    if (!data) {
        return "-";
    }

    return new Date(data).toLocaleString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* ==========================================
   CARREGAR PRODUTOS NO SELECT
========================================== */

async function carregarProdutosSelect() {

    if (!produtoEstoque) {
        return;
    }


    const resultado =
        await estoqueSupabase
            .from("produtos")
            .select(
                "id, nome, sku, ativo, controla_cores"
            )
            .eq("ativo", true)
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (resultado.error) {

        console.error(
            "Erro ao carregar produtos:",
            resultado.error
        );

        produtoEstoque.innerHTML =
            '<option value="">Erro ao carregar produtos</option>';

        return;
    }


    produtoEstoque.innerHTML =
        '<option value="">Selecione um produto</option>';


    const produtos =
        resultado.data || [];

    produtosSelectEstoque = produtos;

    produtos.forEach(function (produto) {

        const option =
            document.createElement("option");


        option.value =
            produto.id;


        option.dataset.controlaCores =
            produto.controla_cores === true ? "true" : "false";

        if (produto.sku) {

            option.textContent =
                produto.nome +
                " - " +
                produto.sku;

        } else {

            option.textContent =
                produto.nome;
        }

        if (produto.controla_cores === true) {
            option.textContent += " (estoque por cores)";
        }

        produtoEstoque.appendChild(option);
    });
}


async function atualizarSeletorCoresEstoque() {
    coresProdutoSelecionado = [];
    if (corEstoque) corEstoque.innerHTML = '<option value="">Selecione uma cor</option>';
    const produto = produtosSelectEstoque.find((item) => String(item.id) === String(produtoEstoque?.value));
    const usaCores = produto?.controla_cores === true;
    corEstoqueCampo?.classList.toggle("ativo", usaCores);
    if (!usaCores) return;

    const { data, error } = await estoqueSupabase.from("produtos_cores")
        .select("id, nome_cor, estoque, estoque_minimo, ativo")
        .eq("produto_id", Number(produto.id))
        .eq("ativo", true)
        .order("nome_cor", { ascending: true });
    if (error) {
        console.error("Erro ao carregar cores para movimentação:", error);
        mostrarMensagem("Não foi possível carregar as cores deste produto.", "erro");
        return;
    }
    coresProdutoSelecionado = data || [];
    for (const cor of coresProdutoSelecionado) {
        const option = document.createElement("option");
        option.value = cor.id;
        option.textContent = `${cor.nome_cor} — estoque: ${formatarNumero(cor.estoque)}`;
        corEstoque?.appendChild(option);
    }
}

/* ==========================================
   CARREGAR ESTOQUE
========================================== */

async function carregarEstoque() {

    if (carregandoEstoque) {
        carregandoEstoque.style.display =
            "block";
    }


    if (semEstoque) {
        semEstoque.style.display =
            "none";
    }


    if (listaEstoque) {
        listaEstoque.innerHTML = "";
    }


    const resultado =
        await estoqueSupabase
            .from("produtos")
            .select(`
                id,
                nome,
                sku,
                estoque,
                estoque_minimo,
                controla_cores,
                ativo,
                categorias (
                    nome
                )
            `)
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (resultado.error) {

        console.error(
            "Erro ao carregar estoque:",
            resultado.error
        );


        if (carregandoEstoque) {
            carregandoEstoque.style.display =
                "none";
        }


        if (listaEstoque) {

            listaEstoque.innerHTML =
                "<tr>" +
                "<td colspan=\"6\">" +
                "Erro ao carregar o estoque." +
                "</td>" +
                "</tr>";
        }

        return;
    }


    if (carregandoEstoque) {
        carregandoEstoque.style.display =
            "none";
    }


    const produtos =
        resultado.data || [];

    const idsProdutosComCores = produtos.filter((produto) => produto.controla_cores === true).map((produto) => Number(produto.id));
    let coresPorProduto = new Map();
    if (idsProdutosComCores.length) {
        const resultadoCores = await estoqueSupabase.from("produtos_cores")
            .select("id, produto_id, nome_cor, estoque, estoque_minimo, ativo")
            .in("produto_id", idsProdutosComCores)
            .order("nome_cor", { ascending: true });
        if (resultadoCores.error) {
            console.error("Erro ao carregar detalhes das cores:", resultadoCores.error);
        } else {
            for (const cor of (resultadoCores.data || [])) {
                const chave = String(cor.produto_id);
                if (!coresPorProduto.has(chave)) coresPorProduto.set(chave, []);
                coresPorProduto.get(chave).push(cor);
            }
        }
    }

    if (produtos.length === 0) {

        if (semEstoque) {
            semEstoque.style.display =
                "block";
        }


        if (totalProdutos) {
            totalProdutos.textContent =
                "0";
        }


        if (totalItens) {
            totalItens.textContent =
                "0";
        }


        if (totalEstoqueBaixo) {
            totalEstoqueBaixo.textContent =
                "0";
        }


        return;
    }


    let quantidadeTotal = 0;
    let quantidadeEstoqueBaixo = 0;


    produtos.forEach(function (produto) {

        const estoque =
            Number(produto.estoque || 0);

        const minimo =
            Number(produto.estoque_minimo || 0);


        quantidadeTotal += estoque;


        let statusTexto =
            "Normal";

        let statusClasse =
            "status-normal";


        if (estoque <= 0) {

            statusTexto =
                "Esgotado";

            statusClasse =
                "status-esgotado";

            quantidadeEstoqueBaixo++;

        } else if (estoque <= minimo) {

            statusTexto =
                "Estoque baixo";

            statusClasse =
                "status-baixo";

            quantidadeEstoqueBaixo++;
        }


        let categoria =
            "Sem categoria";


        if (
            produto.categorias &&
            produto.categorias.nome
        ) {

            categoria =
                produto.categorias.nome;
        }


        const tr =
            document.createElement("tr");


        const tdProduto =
            document.createElement("td");

        const strongProduto =
            document.createElement("strong");

        strongProduto.textContent =
            produto.nome || "";

        tdProduto.appendChild(
            strongProduto
        );


        const tdSku =
            document.createElement("td");

        tdSku.textContent =
            produto.sku || "-";


        const tdCategoria =
            document.createElement("td");

        tdCategoria.textContent =
            categoria;


        const tdEstoque =
            document.createElement("td");

        tdEstoque.textContent =
            formatarNumero(estoque);


        const tdMinimo =
            document.createElement("td");

        tdMinimo.textContent =
            formatarNumero(minimo);


        const tdStatus =
            document.createElement("td");


        const spanStatus =
            document.createElement("span");


        spanStatus.className =
            "status-estoque " +
            statusClasse;


        spanStatus.textContent =
            statusTexto;


        tdStatus.appendChild(
            spanStatus
        );


        tr.appendChild(tdProduto);
        tr.appendChild(tdSku);
        tr.appendChild(tdCategoria);
        tr.appendChild(tdEstoque);
        tr.appendChild(tdMinimo);
        tr.appendChild(tdStatus);


        listaEstoque.appendChild(tr);

        if (produto.controla_cores === true) {
            const cores = coresPorProduto.get(String(produto.id)) || [];
            const linhaCores = document.createElement("tr");
            linhaCores.className = "sl-estoque-cores-row";

            const detalhe = document.createElement("td");
            detalhe.colSpan = 6;
            detalhe.className = "sl-estoque-cores-celula";

            if (!cores.length) {
                detalhe.textContent = "O controle por cores está ativo, mas nenhuma variante foi encontrada.";
                detalhe.classList.add("sl-estoque-cores-vazio");
            } else {
                const painelCores = document.createElement("section");
                painelCores.className = "sl-estoque-cores";
                painelCores.setAttribute("aria-label", `Estoque por cor de ${produto.nome || "produto"}`);

                const cabecalhoCores = document.createElement("div");
                cabecalhoCores.className = "sl-estoque-cores-cabecalho";

                const textosCabecalho = document.createElement("div");
                const tituloCores = document.createElement("strong");
                tituloCores.textContent = "Estoque por cor";
                const subtituloCores = document.createElement("small");
                subtituloCores.textContent = "Saldo e estoque mínimo de cada variante";
                textosCabecalho.append(tituloCores, subtituloCores);

                const totalCores = document.createElement("span");
                totalCores.className = "sl-estoque-cores-contagem";
                totalCores.textContent = `${cores.length} ${cores.length === 1 ? "cor cadastrada" : "cores cadastradas"}`;
                cabecalhoCores.append(textosCabecalho, totalCores);

                const gradeCores = document.createElement("div");
                gradeCores.className = "sl-estoque-cores-grade";

                for (const cor of cores) {
                    const quantidadeCor = Number(cor.estoque || 0);
                    const minimoCor = Number(cor.estoque_minimo || 0);
                    let textoStatus = "Normal";
                    let classeStatus = "normal";

                    if (cor.ativo !== true) {
                        textoStatus = "Inativa";
                        classeStatus = "inativa";
                    } else if (quantidadeCor <= 0) {
                        textoStatus = "Esgotado";
                        classeStatus = "esgotado";
                    } else if (quantidadeCor <= minimoCor) {
                        textoStatus = "Estoque baixo";
                        classeStatus = "baixo";
                    }

                    const cartao = document.createElement("article");
                    cartao.className = "sl-estoque-cor-cartao";

                    const topoCartao = document.createElement("div");
                    topoCartao.className = "sl-estoque-cor-topo";

                    const nomeCor = document.createElement("strong");
                    nomeCor.className = "sl-estoque-cor-nome";
                    nomeCor.textContent = cor.nome_cor || "Cor sem nome";

                    const statusCor = document.createElement("span");
                    statusCor.className = `sl-estoque-cor-status ${classeStatus}`;
                    statusCor.textContent = textoStatus;
                    topoCartao.append(nomeCor, statusCor);

                    const metricas = document.createElement("div");
                    metricas.className = "sl-estoque-cor-metricas";

                    const blocoDisponivel = document.createElement("div");
                    const labelDisponivel = document.createElement("span");
                    labelDisponivel.textContent = "Disponível";
                    const valorDisponivel = document.createElement("strong");
                    valorDisponivel.textContent = `${formatarNumero(quantidadeCor)} un.`;
                    blocoDisponivel.append(labelDisponivel, valorDisponivel);

                    const blocoMinimo = document.createElement("div");
                    const labelMinimo = document.createElement("span");
                    labelMinimo.textContent = "Mínimo";
                    const valorMinimo = document.createElement("strong");
                    valorMinimo.textContent = `${formatarNumero(minimoCor)} un.`;
                    blocoMinimo.append(labelMinimo, valorMinimo);

                    metricas.append(blocoDisponivel, blocoMinimo);
                    cartao.append(topoCartao, metricas);
                    gradeCores.appendChild(cartao);
                }

                painelCores.append(cabecalhoCores, gradeCores);
                detalhe.appendChild(painelCores);
            }

            linhaCores.appendChild(detalhe);
            listaEstoque.appendChild(linhaCores);
        }
    });


    if (totalProdutos) {

        totalProdutos.textContent =
            produtos.length;
    }


    if (totalItens) {

        totalItens.textContent =
            formatarNumero(
                quantidadeTotal
            );
    }


    if (totalEstoqueBaixo) {

        totalEstoqueBaixo.textContent =
            quantidadeEstoqueBaixo;
    }
}


/* ==========================================
   CARREGAR MOVIMENTAÇÕES
========================================== */

async function carregarMovimentacoes() {

    if (carregandoMovimentacoes) {

        carregandoMovimentacoes.style.display =
            "block";
    }


    if (semMovimentacoes) {

        semMovimentacoes.style.display =
            "none";
    }


    if (listaMovimentacoes) {

        listaMovimentacoes.innerHTML =
            "";
    }


    const resultado =
        await estoqueSupabase
            .from("movimentacoes_estoque")
            .select(`
                id,
                tipo,
                quantidade,
                estoque_anterior,
                estoque_novo,
                cor_movimentada,
                motivo,
                criado_em,
                produtos (
                    nome
                )
            `)
            .order(
                "criado_em",
                {
                    ascending: false
                }
            )
            .limit(50);


    if (resultado.error) {

        console.error(
            "Erro ao carregar movimentações:",
            resultado.error
        );


        if (carregandoMovimentacoes) {

            carregandoMovimentacoes.style.display =
                "none";
        }


        if (listaMovimentacoes) {

            listaMovimentacoes.innerHTML =
                "<tr>" +
                "<td colspan=\"7\">" +
                "Erro ao carregar as movimentações." +
                "</td>" +
                "</tr>";
        }

        return;
    }


    if (carregandoMovimentacoes) {

        carregandoMovimentacoes.style.display =
            "none";
    }


    const movimentacoes =
        resultado.data || [];


    if (movimentacoes.length === 0) {

        if (semMovimentacoes) {

            semMovimentacoes.style.display =
                "block";
        }

        return;
    }


    movimentacoes.forEach(
        function (movimentacao) {

            let tipoTexto =
                "Ajuste";

            let tipoClasse =
                "tipo-ajuste";


            if (
                movimentacao.tipo ===
                "entrada"
            ) {

                tipoTexto =
                    "Entrada";

                tipoClasse =
                    "tipo-entrada";

            } else if (
                movimentacao.tipo ===
                "saida"
            ) {

                tipoTexto =
                    "Saída";

                tipoClasse =
                    "tipo-saida";
            }


            let nomeProduto =
                "Produto";


            if (
                movimentacao.produtos &&
                movimentacao.produtos.nome
            ) {

                nomeProduto =
                    movimentacao.produtos.nome;
            }


            const tr =
                document.createElement("tr");


            const tdData =
                document.createElement("td");

            tdData.textContent =
                formatarData(
                    movimentacao.criado_em
                );


            const tdProduto =
                document.createElement("td");

            const strongProduto =
                document.createElement("strong");

            strongProduto.textContent =
                movimentacao.cor_movimentada
                    ? `${nomeProduto} — ${movimentacao.cor_movimentada}`
                    : nomeProduto;

            tdProduto.appendChild(
                strongProduto
            );


            const tdTipo =
                document.createElement("td");

            const spanTipo =
                document.createElement("span");

            spanTipo.className =
                "tipo-movimentacao " +
                tipoClasse;

            spanTipo.textContent =
                tipoTexto;

            tdTipo.appendChild(
                spanTipo
            );


            const tdQuantidade =
                document.createElement("td");

            tdQuantidade.textContent =
                formatarNumero(
                    movimentacao.quantidade
                );


            const tdAnterior =
                document.createElement("td");

            tdAnterior.textContent =
                formatarNumero(
                    movimentacao.estoque_anterior
                );


            const tdNovo =
                document.createElement("td");

            tdNovo.textContent =
                formatarNumero(
                    movimentacao.estoque_novo
                );


            const tdMotivo =
                document.createElement("td");

            tdMotivo.textContent =
                movimentacao.motivo ||
                "-";


            tr.appendChild(tdData);
            tr.appendChild(tdProduto);
            tr.appendChild(tdTipo);
            tr.appendChild(tdQuantidade);
            tr.appendChild(tdAnterior);
            tr.appendChild(tdNovo);
            tr.appendChild(tdMotivo);


            listaMovimentacoes.appendChild(
                tr
            );
        }
    );
}


/* ==========================================
   REGISTRAR MOVIMENTAÇÃO
========================================== */

async function registrarMovimentacao(event) {

    event.preventDefault();

    if (movimentacaoEmAndamento) {
        return;
    }

    const produtoId = Number(produtoEstoque.value);
    const tipo = tipoMovimentacao.value;
    const quantidade = Number(quantidadeMovimentacao.value);
    const motivo = motivoMovimentacao.value.trim();

    if (!produtoId) {
        mostrarMensagem("Selecione um produto.", "erro");
        return;
    }

    const produtoSelecionado = produtosSelectEstoque.find(
        (produto) => Number(produto.id) === produtoId
    );
    const usaCores = produtoSelecionado?.controla_cores === true;
    const quantidadeValida = Number.isFinite(quantidade) && (tipo === "ajuste" && usaCores ? quantidade >= 0 : quantidade > 0);
    if (!quantidadeValida) {
        mostrarMensagem(
            tipo === "ajuste" && usaCores
                ? "Informe um estoque final válido (zero ou maior)."
                : "Informe uma quantidade válida e maior que zero.",
            "erro"
        );
        return;
    }

    if (!usuarioAtual) {
        mostrarMensagem("Usuário administrador não identificado.", "erro");
        return;
    }

    if (!produtoSelecionado) {
        mostrarMensagem("Produto não encontrado. Atualize a página e tente novamente.", "erro");
        return;
    }

    const corSelecionada = usaCores
        ? coresProdutoSelecionado.find((cor) => String(cor.id) === String(corEstoque?.value))
        : null;
    if (usaCores && !corSelecionada) {
        mostrarMensagem("Selecione a cor que deseja movimentar.", "erro");
        corEstoque?.focus();
        return;
    }

    movimentacaoEmAndamento = true;
    mostrarMensagem("Registrando movimentação...");

    try {
        const { data, error } = usaCores
            ? await estoqueSupabase.rpc("movimentar_estoque_cor", {
                p_produto_cor_id: Number(corSelecionada.id),
                p_tipo: tipo,
                p_quantidade: quantidade,
                p_motivo: motivo || null
            })
            : await estoqueSupabase.rpc("registrar_movimentacao_estoque_produto", {
                p_produto_id: produtoId,
                p_tipo: tipo,
                p_quantidade: quantidade,
                p_motivo: motivo || null
            });

        if (error) {
            throw error;
        }

        if (!data || data.sucesso !== true) {
            throw new Error("O banco não confirmou a movimentação do estoque.");
        }

        mostrarMensagem("Movimentação registrada com sucesso.", "sucesso");

        formMovimentacao.reset();
        tipoMovimentacao.value = "entrada";

        await carregarProdutosSelect();
        // O reset do formulário não dispara o evento change do seletor.
        // Atualize a área de cores para não deixar uma variante antiga visível.
        await atualizarSeletorCoresEstoque();
        await carregarEstoque();
        await carregarMovimentacoes();

    } catch (erro) {
        console.error("Erro ao registrar movimentação:", erro);
        mostrarMensagem(
            erro.message || "Não foi possível registrar a movimentação.",
            "erro"
        );
    } finally {
        movimentacaoEmAndamento = false;
    }
}

/* ==========================================
   CANCELAR
========================================== */

function cancelarMovimentacao() {

    if (formMovimentacao) {

        formMovimentacao.reset();
    }


    if (tipoMovimentacao) {

        tipoMovimentacao.value =
            "entrada";
    }


    mostrarMensagem("");
}


/* ==========================================
   SAIR
========================================== */

async function sair() {

    const resultado =
        await estoqueSupabase.auth.signOut();


    if (resultado.error) {

        console.error(
            "Erro ao sair:",
            resultado.error
        );

        alert(
            "Não foi possível sair."
        );

        return;
    }


    sessionStorage.removeItem(
        "sistemaLojaPerfil"
    );


    window.location.href =
        "index.html";
}


/* ==========================================
   EVENTOS
========================================== */

if (produtoEstoque) {
    produtoEstoque.addEventListener("change", atualizarSeletorCoresEstoque);
}

if (formMovimentacao) {

    formMovimentacao.addEventListener(
        "submit",
        registrarMovimentacao
    );
}


if (btnCancelarMovimentacao) {

    btnCancelarMovimentacao.addEventListener(
        "click",
        cancelarMovimentacao
    );
}


if (btnAtualizarEstoque) {

    btnAtualizarEstoque.addEventListener(
        "click",
        async function () {

            await carregarProdutosSelect();

            await carregarEstoque();

            await carregarMovimentacoes();
        }
    );
}


if (btnSair) {

    btnSair.addEventListener(
        "click",
        sair
    );
}


/* ==========================================
   INICIAR
========================================== */

async function iniciarEstoque() {

    mostrarData();


    const autorizado =
        await protegerPaginaEstoque();


    if (!autorizado) {
        return;
    }


    await carregarProdutosSelect();

    await carregarEstoque();

    await carregarMovimentacoes();
}


iniciarEstoque();