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

const totalEsgotados =
    document.getElementById("totalEsgotados");

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
let produtosEstoqueListaCompras = [];
let coresEstoqueListaCompras = new Map();


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
                fornecedor,
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

    produtosEstoqueListaCompras = produtos;
    coresEstoqueListaCompras = coresPorProduto;
    configurarFiltrosListaCompras(produtos);

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

        if (totalEsgotados) {
            totalEsgotados.textContent =
                "0";
        }

        return;
    }


    let quantidadeTotal = 0;
    let quantidadeEstoqueBaixo = 0;
    let quantidadeEsgotados = 0;


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

        // Para produtos controlados por cor, a situação do produto considera
        // as variantes, e o indicador conta cada cor como um ponto de reposição.
        const variantesAtivas = (coresPorProduto.get(String(produto.id)) || [])
            .filter((cor) => cor.ativo === true);
        const statusVariantes = variantesAtivas.map((cor) => obterStatusEstoqueCompra(cor.estoque, cor.estoque_minimo));
        let statusListaProduto = [obterStatusEstoqueCompra(estoque, minimo)];
        if (produto.controla_cores === true && variantesAtivas.length) {
            statusListaProduto = [...new Set(statusVariantes)];
            const todasEsgotadas = variantesAtivas.every((cor) => Number(cor.estoque || 0) <= 0);
            const algumaAbaixoDoMinimo = variantesAtivas.some((cor) => Number(cor.estoque || 0) <= Number(cor.estoque_minimo || 0));
            if (todasEsgotadas) {
                statusTexto = "Esgotado";
                statusClasse = "status-esgotado";
            } else if (algumaAbaixoDoMinimo) {
                statusTexto = "Estoque baixo";
                statusClasse = "status-baixo";
            }
            variantesAtivas.forEach((cor) => {
                const saldoCor = Number(cor.estoque || 0);
                const minimoCor = Number(cor.estoque_minimo || 0);
                if (saldoCor <= 0) {
                    quantidadeEsgotados++;
                } else if (saldoCor <= minimoCor) {
                    quantidadeEstoqueBaixo++;
                }
            });
        } else {
            if (estoque <= 0) {
                statusTexto = "Esgotado";
                statusClasse = "status-esgotado";
                quantidadeEsgotados++;
            } else if (estoque <= minimo) {
                statusTexto = "Estoque baixo";
                statusClasse = "status-baixo";
                quantidadeEstoqueBaixo++;
            }
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
        tr.dataset.produtoId = String(produto.id);
        tr.dataset.fornecedor = normalizarTextoListaCompras(produto.fornecedor || "") || "__sem_fornecedor__";
        tr.dataset.statusList = statusListaProduto.join(" ");
        tr.dataset.busca = normalizarTextoListaCompras(`${produto.nome || ""} ${produto.sku || ""} ${produto.fornecedor || ""}`);
        tr.dataset.temCores = produto.controla_cores === true && variantesAtivas.length ? "true" : "false";


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
            linhaCores.dataset.produtoId = String(produto.id);
            linhaCores.dataset.fornecedor = tr.dataset.fornecedor;
            linhaCores.dataset.busca = tr.dataset.busca;

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
                    cartao.dataset.status = obterStatusEstoqueCompra(quantidadeCor, minimoCor);
                    cartao.dataset.busca = normalizarTextoListaCompras(`${produto.nome || ""} ${produto.sku || ""} ${produto.fornecedor || ""} ${cor.nome_cor || ""}`);

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

    if (totalEsgotados) {
        totalEsgotados.textContent =
            quantidadeEsgotados;
    }

    aplicarFiltrosListaCompras();
}


/* ==========================================
   FILTROS E IMPRESSÃO DA LISTA DE COMPRAS
========================================== */

function normalizarTextoListaCompras(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();
}

function obterStatusEstoqueCompra(estoque, minimo) {
    const atual = Number(estoque || 0);
    const limite = Number(minimo || 0);
    if (atual <= 0) return "esgotado";
    if (atual <= limite) return "baixo";
    return "normal";
}

function configurarFiltrosListaCompras(produtos) {
    const seletor = document.getElementById("filtroFornecedorEstoque");
    if (!seletor) return;

    const valorAnterior = seletor.value;
    const fornecedores = new Map();
    let existeSemFornecedor = false;

    (produtos || []).forEach((produto) => {
        const nome = String(produto.fornecedor || "").trim();
        if (!nome) {
            existeSemFornecedor = true;
            return;
        }
        const chave = normalizarTextoListaCompras(nome);
        if (!fornecedores.has(chave)) fornecedores.set(chave, nome);
    });

    seletor.innerHTML = "";
    seletor.add(new Option("Todos os fornecedores", ""));
    [...fornecedores.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "pt-BR", { sensitivity: "base" }))
        .forEach(([chave, nome]) => seletor.add(new Option(nome, chave)));
    if (existeSemFornecedor) seletor.add(new Option("Sem fornecedor cadastrado", "__sem_fornecedor_vazio__"));

    seletor.value = [...seletor.options].some((opcao) => opcao.value === valorAnterior) ? valorAnterior : "";
}

function aplicarFiltrosListaCompras() {
    if (!listaEstoque) return;

    const fornecedorSelecionado = document.getElementById("filtroFornecedorEstoque")?.value || "";
    const statusSelecionado = document.getElementById("filtroStatusEstoque")?.value || "todos";
    const termo = normalizarTextoListaCompras(document.getElementById("buscaProdutoEstoque")?.value || "");
    const linhasProduto = [...listaEstoque.querySelectorAll("tr:not(.sl-estoque-cores-row)")];
    let quantidadeVisivel = 0;

    linhasProduto.forEach((linha) => {
        const fornecedor = linha.dataset.fornecedor || "__sem_fornecedor__";
        const correspondeFornecedor = !fornecedorSelecionado || (
            fornecedorSelecionado === "__sem_fornecedor_vazio__"
                ? fornecedor === "__sem_fornecedor__"
                : fornecedor === fornecedorSelecionado
        );
        const statusProduto = (linha.dataset.statusList || "").split(/\s+/).filter(Boolean);
        const correspondeStatusProduto = statusSelecionado === "todos" || statusProduto.includes(statusSelecionado);
        const correspondeBuscaProduto = !termo || (linha.dataset.busca || "").includes(termo);
        const linhaCores = linha.nextElementSibling?.classList.contains("sl-estoque-cores-row")
            ? linha.nextElementSibling
            : null;
        let algumaCorVisivel = false;

        if (linhaCores) {
            linhaCores.querySelectorAll(".sl-estoque-cor-cartao").forEach((cartao) => {
                const correspondeStatus = statusSelecionado === "todos" || cartao.dataset.status === statusSelecionado;
                const correspondeBusca = !termo || (cartao.dataset.busca || "").includes(termo);
                const mostrar = correspondeFornecedor && correspondeStatus && correspondeBusca;
                cartao.style.display = mostrar ? "" : "none";
                if (mostrar) algumaCorVisivel = true;
            });
        }

        const correspondeBusca = correspondeBuscaProduto || algumaCorVisivel;
        const correspondeStatus = correspondeStatusProduto || algumaCorVisivel;
        const mostrarProduto = correspondeFornecedor && correspondeBusca && correspondeStatus;
        linha.style.display = mostrarProduto ? "" : "none";
        if (linhaCores) linhaCores.style.display = mostrarProduto && algumaCorVisivel ? "" : "none";
        if (mostrarProduto) quantidadeVisivel++;
    });

    const resumo = document.getElementById("resumoFiltroEstoque");
    if (resumo) resumo.textContent = `${quantidadeVisivel} ${quantidadeVisivel === 1 ? "produto" : "produtos"} na lista`;
}

function escaparHtmlListaCompras(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[caractere]);
}

function obterItensListaComprasImpressao() {
    const fornecedorSelecionado = document.getElementById("filtroFornecedorEstoque")?.value || "";
    const statusSelecionado = document.getElementById("filtroStatusEstoque")?.value || "todos";
    const termo = normalizarTextoListaCompras(document.getElementById("buscaProdutoEstoque")?.value || "");
    const itens = [];

    (produtosEstoqueListaCompras || []).forEach((produto) => {
        const fornecedorNome = String(produto.fornecedor || "").trim() || "Sem fornecedor cadastrado";
        const fornecedorChave = normalizarTextoListaCompras(produto.fornecedor || "") || "__sem_fornecedor__";
        const correspondeFornecedor = !fornecedorSelecionado || (
            fornecedorSelecionado === "__sem_fornecedor_vazio__"
                ? fornecedorChave === "__sem_fornecedor__"
                : fornecedorChave === fornecedorSelecionado
        );
        if (!correspondeFornecedor) return;

        const variantes = produto.controla_cores === true
            ? (coresEstoqueListaCompras.get(String(produto.id)) || []).filter((cor) => cor.ativo === true)
            : [];
        const registros = variantes.length
            ? variantes.map((cor) => ({
                produto: produto.nome || "Produto sem nome",
                cor: cor.nome_cor || "Cor sem nome",
                sku: produto.sku || "-",
                estoque: Number(cor.estoque || 0),
                minimo: Number(cor.estoque_minimo || 0),
                fornecedor: fornecedorNome
            }))
            : [{
                produto: produto.nome || "Produto sem nome",
                cor: "-",
                sku: produto.sku || "-",
                estoque: Number(produto.estoque || 0),
                minimo: Number(produto.estoque_minimo || 0),
                fornecedor: fornecedorNome
            }];

        registros.forEach((item) => {
            item.status = obterStatusEstoqueCompra(item.estoque, item.minimo);
            const correspondeStatus = statusSelecionado === "todos" || item.status === statusSelecionado;
            const texto = normalizarTextoListaCompras(`${item.produto} ${item.cor} ${item.sku} ${item.fornecedor}`);
            const correspondeBusca = !termo || texto.includes(termo);
            if (correspondeStatus && correspondeBusca) itens.push(item);
        });
    });

    return itens;
}

function imprimirListaComprasEstoque() {
    const itens = obterItensListaComprasImpressao();
    if (!itens.length) {
        alert("Não há produtos para imprimir com os filtros selecionados.");
        return;
    }

    const janela = window.open("", "_blank");
    if (!janela) {
        alert("O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.");
        return;
    }

    const fornecedorSelecionado = document.getElementById("filtroFornecedorEstoque")?.selectedOptions?.[0]?.textContent || "Todos os fornecedores";
    const statusSelecionado = document.getElementById("filtroStatusEstoque")?.selectedOptions?.[0]?.textContent || "Todas as situações";
    const busca = document.getElementById("buscaProdutoEstoque")?.value.trim() || "";
    const fornecedores = new Map();
    itens.forEach((item) => {
        if (!fornecedores.has(item.fornecedor)) fornecedores.set(item.fornecedor, []);
        fornecedores.get(item.fornecedor).push(item);
    });

    const ordemStatus = [
        ["esgotado", "Esgotados"],
        ["baixo", "Estoque baixo / no mínimo"],
        ["normal", "Estoque normal"]
    ];
    const formatar = (valor) => Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
    const secoesFornecedores = [...fornecedores.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], "pt-BR", { sensitivity: "base" }))
        .map(([nomeFornecedor, itensFornecedor], indiceFornecedor) => {
            const grupos = ordemStatus.map(([status, titulo]) => {
                const grupo = itensFornecedor.filter((item) => item.status === status);
                if (!grupo.length) return "";
                const linhas = grupo
                    .sort((a, b) => `${a.produto} ${a.cor}`.localeCompare(`${b.produto} ${b.cor}`, "pt-BR", { sensitivity: "base" }))
                    .map((item) => `<tr><td>${escaparHtmlListaCompras(item.produto)}</td><td>${escaparHtmlListaCompras(item.cor)}</td><td>${escaparHtmlListaCompras(item.sku)}</td><td class="numero">${formatar(item.estoque)}</td><td class="numero">${formatar(item.minimo)}</td><td class="numero">${formatar(Math.max(0, item.minimo - item.estoque))}</td></tr>`)
                    .join("");
                const classe = status === "esgotado" ? "grupo-esgotado" : status === "baixo" ? "grupo-baixo" : "grupo-normal";
                return `<section class="grupo ${classe}"><h3>${titulo} <span>${grupo.length} ${grupo.length === 1 ? "item" : "itens"}</span></h3><table><thead><tr><th>Produto</th><th>Cor / variante</th><th>SKU</th><th>Estoque atual</th><th>Estoque mínimo</th><th>Falta p/ mínimo</th></tr></thead><tbody>${linhas}</tbody></table></section>`;
            }).join("");
            return `<section class="fornecedor ${indiceFornecedor ? "quebra-pagina" : ""}"><h2>${escaparHtmlListaCompras(nomeFornecedor)}</h2>${grupos}</section>`;
        }).join("");

    const data = new Date().toLocaleDateString("pt-BR");
    const textoBusca = busca ? `<p><strong>Busca:</strong> ${escaparHtmlListaCompras(busca)}</p>` : "";
    const documento = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lista de compras - Estoque</title><style>
        *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#172033;margin:24px;font-size:11px}header{border-bottom:2px solid #1e3a8a;padding-bottom:12px;margin-bottom:16px}h1{font-size:22px;margin:0 0 6px}header p{margin:3px 0;color:#475569}.fornecedor{margin:18px 0 26px}.fornecedor h2{font-size:16px;background:#eef3fb;border-left:4px solid #1e3a8a;padding:9px 11px;margin:0 0 12px}.grupo{margin:12px 0 18px;break-inside:avoid}.grupo h3{font-size:12px;margin:0 0 6px;padding:7px 9px;background:#f3f4f6}.grupo h3 span{float:right;font-weight:normal}.grupo-esgotado h3{background:#fff0f0;color:#991b1b}.grupo-baixo h3{background:#fff7e8;color:#92400e}.grupo-normal h3{background:#eefbf3;color:#166534}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d9e0e9;padding:7px 8px;text-align:left}th{background:#f8fafc;font-size:9px;text-transform:uppercase;color:#475569}td.numero{text-align:right;font-variant-numeric:tabular-nums}.nota{margin-top:18px;color:#64748b;font-size:9px}.vazio{padding:20px;text-align:center}@media print{body{margin:12mm}.quebra-pagina{break-before:page;page-break-before:always}.grupo,table{break-inside:avoid}thead{display:table-header-group}tr{break-inside:avoid}}@page{size:A4 portrait;margin:12mm}
        </style></head><body><header><h1>Lista de compras / conferência de estoque</h1><p><strong>Data:</strong> ${data}</p><p><strong>Fornecedor filtrado:</strong> ${escaparHtmlListaCompras(fornecedorSelecionado)}</p><p><strong>Situação:</strong> ${escaparHtmlListaCompras(statusSelecionado)}</p>${textoBusca}</header>${secoesFornecedores}<p class="nota">Relatório gerado pelo Sistema da Loja. “Falta p/ mínimo” indica a quantidade necessária para alcançar o estoque mínimo cadastrado.</p><script>window.addEventListener('load',function(){setTimeout(function(){window.print();},250);});</script></body></html>`;

    janela.document.open();
    janela.document.write(documento);
    janela.document.close();
}

function configurarControlesListaCompras() {
    ["filtroFornecedorEstoque", "filtroStatusEstoque"].forEach((id) => {
        document.getElementById(id)?.addEventListener("change", aplicarFiltrosListaCompras);
    });
    document.getElementById("buscaProdutoEstoque")?.addEventListener("input", aplicarFiltrosListaCompras);
    document.getElementById("btnImprimirListaCompras")?.addEventListener("click", imprimirListaComprasEstoque);
}

configurarControlesListaCompras();


/* ==========================================
   FILTRO DO HISTÓRICO DE MOVIMENTAÇÕES
========================================== */

function configurarFiltroMovimentacoes() {
    const tabela = listaMovimentacoes?.closest(".tabela-container");
    if (!tabela || !tabela.parentNode) return;

    let campo = document.getElementById("filtroMovimentacoesEstoque");
    if (!campo) {
        const area = document.createElement("div");
        area.className = "sl-filtro-movimentacoes";
        area.innerHTML = '<label for="filtroMovimentacoesEstoque">Filtrar por produto ou cor</label><input id="filtroMovimentacoesEstoque" type="search" placeholder="Ex.: Óculos, azul, marrom...">';
        tabela.parentNode.insertBefore(area, tabela);
        campo = area.querySelector("input");
        campo.addEventListener("input", aplicarFiltroMovimentacoes);
    }
    aplicarFiltroMovimentacoes();
}

function aplicarFiltroMovimentacoes() {
    const campo = document.getElementById("filtroMovimentacoesEstoque");
    if (!campo || !listaMovimentacoes) return;
    const termo = campo.value.trim().toLocaleLowerCase("pt-BR");
    listaMovimentacoes.querySelectorAll("tr").forEach((linha) => {
        linha.style.display = !termo || linha.textContent.toLocaleLowerCase("pt-BR").includes(termo) ? "" : "none";
    });
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

    configurarFiltroMovimentacoes();

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

    configurarFiltroMovimentacoes();
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