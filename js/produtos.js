/* =========================================================
   SISTEMA DA LOJA
   GERENCIAMENTO DE PRODUTOS
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const produtosSupabase = supabaseClient;


/* =========================================================
   ELEMENTOS
========================================================= */

const formProduto =
    document.getElementById("formProduto");

const nomeProduto =
    document.getElementById("nomeProduto");

const skuProduto =
    document.getElementById("skuProduto");

const fornecedorProduto =
    document.getElementById("fornecedorProduto");

const categoriaProduto =
    document.getElementById("categoriaProduto");

const precoCusto =
    document.getElementById("precoCusto");

const precoVenda =
    document.getElementById("precoVenda");

const precoVendaMinimo = document.getElementById("precoVendaMinimo");

const estoque =
    document.getElementById("estoque");

const estoqueMinimo =
    document.getElementById("estoqueMinimo");

const produtoAtivo =
    document.getElementById("produtoAtivo");

const tituloFormulario =
    document.getElementById("tituloFormulario");

const btnSalvar =
    document.getElementById("btnSalvar");

const btnCancelar =
    document.getElementById("btnCancelar");

const btnAtualizar =
    document.getElementById("btnAtualizar");

const btnSair =
    document.getElementById("btnSair");

const listaProdutos =
    document.getElementById("listaProdutos");

const carregando =
    document.getElementById("carregando");

const semProdutos =
    document.getElementById("semProdutos");

const mensagemAdmin =
    document.getElementById("mensagemAdmin");

const dataAtual =
    document.getElementById("dataAtual");

const nomeAdministrador =
    document.getElementById("nomeAdministrador");


/* =========================================================
   ELEMENTOS DA BUSCA DE PRODUTOS
========================================================= */

const buscaProdutos =
    document.getElementById("buscaProdutos");

const limparBuscaProdutos =
    document.getElementById("limparBuscaProdutos");

const resultadoBuscaProdutos =
    document.getElementById("resultadoBuscaProdutos");

const nenhumResultadoBusca =
    document.getElementById("nenhumResultadoBusca");


/* =========================================================
   RELATÓRIO DE PRODUTOS — SOMENTE ADMINISTRADOR
========================================================= */

const painelRelatorioProdutos =
    document.getElementById("painelRelatorioProdutos");

const filtroRelatorioNome =
    document.getElementById("filtroRelatorioNome");

const filtroRelatorioCategoria =
    document.getElementById("filtroRelatorioCategoria");

const filtroRelatorioFornecedor =
    document.getElementById("filtroRelatorioFornecedor");

const resumoRelatorioProdutos =
    document.getElementById("resumoRelatorioProdutos");

const btnLimparFiltrosRelatorio =
    document.getElementById("btnLimparFiltrosRelatorio");

const btnImprimirRelatorioProdutos =
    document.getElementById("btnImprimirRelatorioProdutos");


/* =========================================================
   ESTADO
========================================================= */

let perfilAtual = null;

let produtoEditandoId = null;

let categorias = [];

let produtos = [];

let percentualDescontoAvistaProdutos = 8;
let descontoAvistaProdutosAtivo = true;


/* =========================================================
   MENSAGENS
========================================================= */

function mostrarMensagem(
    texto,
    tipo = "erro"
) {

    if (!mensagemAdmin) {
        return;
    }

    mensagemAdmin.textContent = texto;

    mensagemAdmin.className =
        "mensagem " + tipo;

}


function limparMensagem() {

    if (!mensagemAdmin) {
        return;
    }

    mensagemAdmin.textContent = "";

    mensagemAdmin.className =
        "mensagem";

}


/* =========================================================
   DATA ATUAL
========================================================= */

function mostrarDataAtual() {

    if (!dataAtual) {
        return;
    }

    const agora =
        new Date();

    const dataFormatada =
        agora.toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

    dataAtual.textContent =
        dataFormatada
            .charAt(0)
            .toUpperCase() +
        dataFormatada.slice(1);

}


/* =========================================================
   PROTEGER PÁGINA
========================================================= */

async function protegerPagina() {

    const {
        data: {
            session
        },
        error: erroSessao
    } =
        await produtosSupabase
            .auth
            .getSession();


    if (
        erroSessao ||
        !session
    ) {

        window.location.href =
            "index.html";

        return false;

    }


    const {
        data: usuario,
        error: erroUsuario
    } =
        await produtosSupabase
            .auth
            .getUser();


    if (
        erroUsuario ||
        !usuario?.user
    ) {

        window.location.href =
            "index.html";

        return false;

    }


    const {
        data: perfil,
        error
    } =
        await produtosSupabase
            .from("perfis")
            .select(`
                id,
                nome_completo,
                usuario,
                tipo,
                ativo,
                loja_id
            `)
            .eq(
                "id",
                usuario.user.id
            )
            .single();


    if (error) {

        console.error(
            "Erro ao carregar perfil:",
            error
        );

        mostrarMensagem(
            "Não foi possível verificar seu perfil.",
            "erro"
        );

        return false;

    }


    if (
        !perfil ||
        perfil.tipo !== "admin" ||
        perfil.ativo !== true ||
        !perfil.loja_id
    ) {

        alert(
            "Acesso permitido somente para administradores ativos."
        );

        window.location.href =
            "index.html";

        return false;

    }


    perfilAtual =
        perfil;


    if (nomeAdministrador) {

        nomeAdministrador.textContent =
            perfil.nome_completo ||
            perfil.usuario ||
            "Administrador";

    }


    return true;

}


/* =========================================================
   CARREGAR CATEGORIAS
========================================================= */

async function carregarCategorias() {

    if (!perfilAtual?.loja_id) {
        return;
    }


    const {
        data,
        error
    } =
        await produtosSupabase
            .from("categorias")
            .select(`
                id,
                nome,
                ativo
            `)
            .eq(
                "loja_id",
                perfilAtual.loja_id
            )
            .eq(
                "ativo",
                true
            )
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar categorias:",
            error
        );

        mostrarMensagem(
            "Não foi possível carregar as categorias.",
            "erro"
        );

        return;

    }


    categorias =
        data || [];


    preencherCategorias();

}


/* =========================================================
   PREENCHER CATEGORIAS
========================================================= */

function preencherCategorias() {

    if (!categoriaProduto) {
        return;
    }


    categoriaProduto.innerHTML =
        `
        <option value="">
            Sem categoria
        </option>
        `;


    categorias.forEach(
        function (categoria) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                categoria.id;

            option.textContent =
                categoria.nome;

            categoriaProduto.appendChild(
                option
            );

        }
    );

}




async function carregarConfiguracoesPrecoAvistaProdutos() {
    if (!perfilAtual?.loja_id) return false;
    const { data, error } = await produtosSupabase
        .from("configuracoes_descontos")
        .select("desconto_avista_ativo, desconto_avista_percentual")
        .eq("loja_id", perfilAtual.loja_id)
        .maybeSingle();

    if (error) {
        console.error("Não foi possível carregar o percentual de desconto à vista para a tela de produtos:", error);
        mostrarMensagem("Não foi possível atualizar o preço mínimo à vista com a configuração da loja. Atualize a página ou confira as permissões.", "erro");
        return false;
    }

    const percentual = Number(data?.desconto_avista_percentual ?? 8);
    percentualDescontoAvistaProdutos = Number.isFinite(percentual)
        ? Math.max(0, Math.min(99.99, percentual))
        : 8;
    descontoAvistaProdutosAtivo = data?.desconto_avista_ativo !== false;
    return true;
}


/* =========================================================
   CARREGAR PRODUTOS
========================================================= */

async function carregarProdutos() {

    if (!perfilAtual?.loja_id) {
        return;
    }


    if (carregando) {

        carregando.style.display =
            "block";

    }


    if (semProdutos) {

        semProdutos.style.display =
            "none";

    }


    if (nenhumResultadoBusca) {

        nenhumResultadoBusca.hidden =
            true;

    }


    const {
        data,
        error
    } =
        await produtosSupabase
            .from("produtos")
            .select(`
                id,
                nome,
                sku,
                fornecedor,
                categoria_id,
                preco_custo,
                preco_venda,
                preco_venda_minimo,
                estoque,
                estoque_minimo,
                ativo,
                criado_em,
                atualizado_em,
                categorias (
                    nome
                )
            `)
            .eq(
                "loja_id",
                perfilAtual.loja_id
            )
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (carregando) {

        carregando.style.display =
            "none";

    }


    if (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );

        mostrarMensagem(
            "Não foi possível carregar os produtos.",
            "erro"
        );

        return;

    }


    produtos =
        data || [];


    preencherFiltrosRelatorioProdutos();

    renderizarProdutos();

    atualizarResumoRelatorioProdutos();

}


/* =========================================================
   FORMATAR MOEDA
========================================================= */

function formatarMoeda(valor) {

    return (
        Number(valor) || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


/* =========================================================
   PRECO MINIMO A VISTA: minimo cadastrado menos 8%
========================================================= */

function calcularPrecoMinimoAvista(precoMinimo) {
    if (precoMinimo === null || precoMinimo === undefined || precoMinimo === "") return "—";
    const minimo = Number(precoMinimo);
    if (!Number.isFinite(minimo) || minimo < 0) return "—";
    const percentual = descontoAvistaProdutosAtivo ? percentualDescontoAvistaProdutos : 0;
    const valorComDesconto = Math.round((minimo * (1 - percentual / 100) + Number.EPSILON) * 100) / 100;
    return formatarMoeda(valorComDesconto);
}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        texto ?? "";

    return div.innerHTML;

}


/* =========================================================
   NORMALIZAR TEXTO DA BUSCA
   IGNORA MAIÚSCULAS E ACENTOS
========================================================= */

function normalizarTextoBusca(valor) {

    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();

}


/* =========================================================
   BUSCA INSTANTÂNEA DE PRODUTOS
========================================================= */

function aplicarBuscaProdutos() {

    if (
        !listaProdutos ||
        !buscaProdutos
    ) {

        return;

    }


    const termo =
        normalizarTextoBusca(
            buscaProdutos.value
        );


    const linhas =
        Array.from(
            listaProdutos.querySelectorAll("tr")
        );


    let encontrados = 0;


    linhas.forEach(
        function (linha) {

            const textoProduto =
                normalizarTextoBusca(
                    linha.dataset.busca ||
                    linha.textContent
                );


            const corresponde =
                !termo ||
                textoProduto.includes(termo);


            linha.hidden =
                !corresponde;


            if (corresponde) {

                encontrados++;

            }

        }
    );


    /* Botão para limpar a pesquisa */

    if (limparBuscaProdutos) {

        limparBuscaProdutos.classList.toggle(
            "visivel",
            termo.length > 0
        );

    }


    /* Contador de produtos */

    if (resultadoBuscaProdutos) {

        if (termo) {

            resultadoBuscaProdutos.textContent =
                encontrados +
                " de " +
                linhas.length +
                " produto(s) encontrado(s)";

        } else {

            resultadoBuscaProdutos.textContent =
                linhas.length +
                " produto(s) cadastrado(s)";

        }

    }


    /* Mensagem quando a pesquisa não encontra resultados */

    if (nenhumResultadoBusca) {

        nenhumResultadoBusca.hidden =
            !termo ||
            linhas.length === 0 ||
            encontrados > 0;

    }

}


/* =========================================================
   FILTROS E RELATÓRIO PARA IMPRESSÃO/PDF
   Esta funcionalidade existe somente em produtos.html,
   página já protegida para administradores da loja.
========================================================= */

function preencherFiltrosRelatorioProdutos() {

    if (!filtroRelatorioCategoria || !filtroRelatorioFornecedor) {
        return;
    }

    const categoriaSelecionada = filtroRelatorioCategoria.value;
    const fornecedorSelecionado = filtroRelatorioFornecedor.value;
    const categoriasEncontradas = new Map();
    const fornecedoresEncontrados = new Map();
    let existeProdutoSemCategoria = false;
    let existeProdutoSemFornecedor = false;

    produtos.forEach((produto) => {
        const categoriaId = String(produto.categoria_id || "");
        const categoriaNome = String(produto.categorias?.nome || "").trim();

        if (!categoriaId) {
            existeProdutoSemCategoria = true;
        } else {
            categoriasEncontradas.set(
                categoriaId,
                categoriaNome || "Categoria sem nome"
            );
        }

        const fornecedorNome = String(produto.fornecedor || "").trim();

        if (!fornecedorNome) {
            existeProdutoSemFornecedor = true;
        } else {
            const chaveFornecedor = normalizarTextoBusca(fornecedorNome);
            if (!fornecedoresEncontrados.has(chaveFornecedor)) {
                fornecedoresEncontrados.set(chaveFornecedor, fornecedorNome);
            }
        }
    });

    filtroRelatorioCategoria.innerHTML = "";
    filtroRelatorioCategoria.add(new Option("Todas as categorias", ""));

    Array.from(categoriasEncontradas.entries())
        .sort((a, b) => a[1].localeCompare(b[1], "pt-BR", { sensitivity: "base" }))
        .forEach(([id, nome]) => {
            filtroRelatorioCategoria.add(new Option(nome, id));
        });

    if (existeProdutoSemCategoria) {
        filtroRelatorioCategoria.add(new Option("Sem categoria", "__sem_categoria__"));
    }

    filtroRelatorioFornecedor.innerHTML = "";
    filtroRelatorioFornecedor.add(new Option("Todos os fornecedores", ""));

    Array.from(fornecedoresEncontrados.entries())
        .sort((a, b) => a[1].localeCompare(b[1], "pt-BR", { sensitivity: "base" }))
        .forEach(([chave, nome]) => {
            filtroRelatorioFornecedor.add(new Option(nome, chave));
        });

    if (existeProdutoSemFornecedor) {
        filtroRelatorioFornecedor.add(new Option("Sem fornecedor", "__sem_fornecedor_vazio__"));
    }

    const categoriaAindaExiste = Array.from(filtroRelatorioCategoria.options)
        .some((option) => option.value === categoriaSelecionada);
    const fornecedorAindaExiste = Array.from(filtroRelatorioFornecedor.options)
        .some((option) => option.value === fornecedorSelecionado);

    filtroRelatorioCategoria.value = categoriaAindaExiste ? categoriaSelecionada : "";
    filtroRelatorioFornecedor.value = fornecedorAindaExiste ? fornecedorSelecionado : "";
}


function obterProdutosFiltradosRelatorio() {

    const nomePesquisado = normalizarTextoBusca(filtroRelatorioNome?.value || "");
    const categoriaSelecionada = filtroRelatorioCategoria?.value || "";
    const fornecedorSelecionado = filtroRelatorioFornecedor?.value || "";

    return produtos.filter((produto) => {
        const nomeProdutoNormalizado = normalizarTextoBusca(produto.nome || "");
        const categoriaId = String(produto.categoria_id || "");
        const fornecedorNormalizado = normalizarTextoBusca(produto.fornecedor || "");

        const correspondeNome = !nomePesquisado || nomeProdutoNormalizado.includes(nomePesquisado);
        const correspondeCategoria = !categoriaSelecionada || (
            categoriaSelecionada === "__sem_categoria__"
                ? !categoriaId
                : categoriaId === categoriaSelecionada
        );
        const correspondeFornecedor = !fornecedorSelecionado || (
            fornecedorSelecionado === "__sem_fornecedor_vazio__"
                ? !String(produto.fornecedor || "").trim()
                : fornecedorNormalizado === fornecedorSelecionado
        );

        return correspondeNome && correspondeCategoria && correspondeFornecedor;
    });
}


function obterColunasSelecionadasRelatorio() {

    const colunas = {};

    document.querySelectorAll("[data-relatorio-coluna]").forEach((controle) => {
        colunas[controle.dataset.relatorioColuna] = controle.checked;
    });

    return colunas;
}


function formatarQuantidadeRelatorio(valor) {

    const numero = Number(valor);

    return (Number.isFinite(numero) ? numero : 0).toLocaleString("pt-BR", {
        maximumFractionDigits: 3
    });
}


function obterPrecoMinimoAvistaNumerico(precoMinimo) {
    if (precoMinimo === null || precoMinimo === undefined || precoMinimo === "") return null;
    const numero = Number(precoMinimo);
    if (!Number.isFinite(numero) || numero < 0) return null;
    const percentual = descontoAvistaProdutosAtivo ? percentualDescontoAvistaProdutos : 0;
    return Math.round((numero * (1 - percentual / 100) + Number.EPSILON) * 100) / 100;
}


function atualizarResumoRelatorioProdutos() {

    if (!resumoRelatorioProdutos) {
        return;
    }

    const quantidade = obterProdutosFiltradosRelatorio().length;
    resumoRelatorioProdutos.textContent = quantidade === 1
        ? "1 produto será incluído no relatório. Os totais aparecerão no final da impressão."
        : `${quantidade} produtos serão incluídos no relatório. Os totais aparecerão no final da impressão.`;

    if (btnImprimirRelatorioProdutos) {
        btnImprimirRelatorioProdutos.disabled = quantidade === 0 || perfilAtual?.tipo !== "admin";
    }
}


function construirHtmlRelatorioProdutos(listaProdutos, colunas) {

    const colunasTabela = [
        { chave: "nome", titulo: "Produto", classe: "texto" },
        { chave: "sku", titulo: "SKU", classe: "texto" },
        { chave: "fornecedor", titulo: "Fornecedor", classe: "texto" },
        { chave: "categoria", titulo: "Categoria", classe: "texto" }
    ];

    if (colunas.custo) colunasTabela.push({ chave: "custo", titulo: "Custo", classe: "numero" });
    if (colunas.venda) colunasTabela.push({ chave: "venda", titulo: "Venda", classe: "numero" });
    if (colunas.precoMinimo) colunasTabela.push({ chave: "precoMinimo", titulo: "Preço mínimo", classe: "numero" });
    if (colunas.precoMinimoAvista) colunasTabela.push({ chave: "precoMinimoAvista", titulo: "Preço mínimo à vista", classe: "numero" });
    if (colunas.estoque) colunasTabela.push({ chave: "estoque", titulo: "Estoque", classe: "numero" });

    const compararTextoRelatorio = (valorA, valorB) =>
        String(valorA || "").localeCompare(String(valorB || ""), "pt-BR", {
            sensitivity: "base",
            numeric: true
        });

    const produtosOrdenados = [...listaProdutos].sort((produtoA, produtoB) => {
        const categoriaA = produtoA.categorias?.nome || "Sem categoria";
        const categoriaB = produtoB.categorias?.nome || "Sem categoria";
        const comparacaoCategoria = compararTextoRelatorio(categoriaA, categoriaB);

        if (!filtroRelatorioCategoria?.value && comparacaoCategoria !== 0) {
            return comparacaoCategoria;
        }

        const comparacaoNome = compararTextoRelatorio(produtoA.nome, produtoB.nome);
        if (comparacaoNome !== 0) return comparacaoNome;

        return compararTextoRelatorio(produtoA.sku, produtoB.sku);
    });

    const criarLinhaProdutoRelatorio = (produto, indice) => {
        const valores = {
            nome: produto.nome || "Sem nome",
            sku: produto.sku || "-",
            fornecedor: produto.fornecedor || "-",
            categoria: produto.categorias?.nome || "Sem categoria",
            custo: formatarMoeda(produto.preco_custo),
            venda: formatarMoeda(produto.preco_venda),
            precoMinimo: formatarMoeda(produto.preco_venda_minimo),
            precoMinimoAvista: calcularPrecoMinimoAvista(produto.preco_venda_minimo),
            estoque: formatarQuantidadeRelatorio(produto.estoque)
        };

        const classeFaixa = indice % 2 === 0 ? "linha-impar" : "linha-par";
        const celulas = colunasTabela.map((coluna) =>
            `<td class="${coluna.classe}">${escaparHTML(valores[coluna.chave])}</td>`
        ).join("");

        return `<tr class="linha-produto ${classeFaixa}">${celulas}</tr>`;
    };

    let corpoTabelaHtml = "";
    const todasCategoriasSelecionadas = !filtroRelatorioCategoria?.value;

    if (todasCategoriasSelecionadas) {
        const gruposPorCategoria = new Map();

        produtosOrdenados.forEach((produto) => {
            const categoriaId = String(produto.categoria_id || "__sem_categoria__");
            const nomeCategoria = String(produto.categorias?.nome || "Sem categoria").trim() || "Sem categoria";

            if (!gruposPorCategoria.has(categoriaId)) {
                gruposPorCategoria.set(categoriaId, {
                    nome: nomeCategoria,
                    produtos: []
                });
            }

            gruposPorCategoria.get(categoriaId).produtos.push(produto);
        });

        const gruposOrdenados = Array.from(gruposPorCategoria.values())
            .sort((grupoA, grupoB) => compararTextoRelatorio(grupoA.nome, grupoB.nome));

        corpoTabelaHtml = gruposOrdenados.map((grupo) => {
            const linhasGrupo = grupo.produtos
                .map((produto, indice) => criarLinhaProdutoRelatorio(produto, indice))
                .join("");

            return `
                <tbody class="grupo-categoria">
                    <tr class="titulo-categoria">
                        <td colspan="${colunasTabela.length}">
                            ${escaparHTML(grupo.nome)}
                            <span class="quantidade-categoria">${grupo.produtos.length} ${grupo.produtos.length === 1 ? "produto" : "produtos"}</span>
                        </td>
                    </tr>
                    ${linhasGrupo}
                </tbody>
            `;
        }).join("");
    } else {
        const linhasOrdenadas = [...listaProdutos]
            .sort((produtoA, produtoB) => {
                const comparacaoNome = compararTextoRelatorio(produtoA.nome, produtoB.nome);
                return comparacaoNome !== 0
                    ? comparacaoNome
                    : compararTextoRelatorio(produtoA.sku, produtoB.sku);
            })
            .map((produto, indice) => criarLinhaProdutoRelatorio(produto, indice))
            .join("");

        corpoTabelaHtml = `<tbody>${linhasOrdenadas}</tbody>`;
    }

    const totais = listaProdutos.reduce((soma, produto) => {
        const quantidade = Number(produto.estoque);
        const estoqueAtual = Number.isFinite(quantidade) ? quantidade : 0;
        const custo = Number(produto.preco_custo);
        const venda = Number(produto.preco_venda);
        const minimo = Number(produto.preco_venda_minimo);
        const minimoAvista = obterPrecoMinimoAvistaNumerico(produto.preco_venda_minimo);

        soma.estoque += estoqueAtual;
        soma.custo += (Number.isFinite(custo) ? custo : 0) * estoqueAtual;
        soma.venda += (Number.isFinite(venda) ? venda : 0) * estoqueAtual;
        soma.precoMinimo += (Number.isFinite(minimo) && produto.preco_venda_minimo !== null && produto.preco_venda_minimo !== "" ? minimo : 0) * estoqueAtual;
        soma.precoMinimoAvista += (minimoAvista === null ? 0 : minimoAvista) * estoqueAtual;

        return soma;
    }, { estoque: 0, custo: 0, venda: 0, precoMinimo: 0, precoMinimoAvista: 0 });

    const resumo = [
        { chave: "produtos", titulo: "Total de produtos", valor: String(listaProdutos.length), mostrar: true },
        { chave: "estoque", titulo: "Total em estoque", valor: `${formatarQuantidadeRelatorio(totais.estoque)} unidades`, mostrar: Boolean(colunas.estoque) },
        { chave: "custo", titulo: "Valor total a custo", valor: formatarMoeda(totais.custo), mostrar: Boolean(colunas.custo) },
        { chave: "venda", titulo: "Valor total a preço de venda", valor: formatarMoeda(totais.venda), mostrar: Boolean(colunas.venda) },
        { chave: "precoMinimo", titulo: "Valor total a preço mínimo", valor: formatarMoeda(totais.precoMinimo), mostrar: Boolean(colunas.precoMinimo) },
        { chave: "precoMinimoAvista", titulo: "Valor total a preço mínimo à vista", valor: formatarMoeda(totais.precoMinimoAvista), mostrar: Boolean(colunas.precoMinimoAvista) }
    ].filter((item) => item.mostrar);

    const resumoHtml = resumo.map((item) => `
        <div class="cartao-resumo">
            <span>${escaparHTML(item.titulo)}</span>
            <strong>${escaparHTML(item.valor)}</strong>
        </div>
    `).join("");

    const partesFiltro = [];
    if (filtroRelatorioNome?.value.trim()) {
        partesFiltro.push(`Produto contém: ${filtroRelatorioNome.value.trim()}`);
    }
    if (filtroRelatorioCategoria?.value) {
        const textoCategoria = filtroRelatorioCategoria.selectedOptions[0]?.textContent || "";
        partesFiltro.push(`Categoria: ${textoCategoria}`);
    }
    if (filtroRelatorioFornecedor?.value) {
        const textoFornecedor = filtroRelatorioFornecedor.selectedOptions[0]?.textContent || "";
        partesFiltro.push(`Fornecedor: ${textoFornecedor}`);
    }

    const descricaoFiltros = partesFiltro.length
        ? partesFiltro.join(" | ")
        : "Todos os produtos da loja";

    const cabecalhoHtml = colunasTabela.map((coluna) =>
        `<th class="${coluna.classe}">${escaparHTML(coluna.titulo)}</th>`
    ).join("");

    const dataGeracao = new Date().toLocaleString("pt-BR");
    const notaCalculo = "Os totais financeiros representam preço unitário multiplicado pela quantidade atual em estoque, somado para os produtos filtrados.";

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de produtos - Sistema da Loja</title>
    <style>
        @page { size: A4 landscape; margin: 11mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 10px; }
        .cabecalho { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 14px; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; }
        h1 { margin: 0 0 5px; font-size: 21px; }
        .subtitulo { margin: 0; color: #475569; font-size: 11px; }
        .data-geracao { color: #475569; font-size: 10px; text-align: right; white-space: nowrap; }
        .filtros-aplicados { margin: 0 0 12px; padding: 8px 10px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; table-layout: auto; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; page-break-inside: avoid; }
        th, td { padding: 6px 7px; border: 1px solid #cbd5e1; vertical-align: top; }
        th { background: #eaf0f8; color: #172033; text-align: left; font-size: 9px; }
        .linha-impar { background-color: #ffffff; }
        .linha-par { background-color: #f1f5f9; }
        .titulo-categoria td { padding: 8px 9px; background: #dbeafe; color: #1e3a8a; border-top: 2px solid #93c5fd; font-size: 10px; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .quantidade-categoria { float: right; color: #475569; font-size: 9px; font-weight: 600; text-transform: none; }
        .linha-produto td { font-size: 9px; overflow-wrap: anywhere; }
        .numero { text-align: right; white-space: nowrap; }
        .grupo-categoria { break-inside: auto; page-break-inside: auto; }
        .titulo-categoria { break-after: avoid; page-break-after: avoid; }
        .resumo { margin-top: 15px; break-inside: avoid; page-break-inside: avoid; }
        .resumo h2 { margin: 0 0 8px; font-size: 14px; }
        .cartoes-resumo { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .cartao-resumo { min-height: 53px; border: 1px solid #cbd5e1; border-radius: 5px; padding: 9px; }
        .cartao-resumo span { display: block; margin-bottom: 5px; color: #475569; font-size: 9px; }
        .cartao-resumo strong { display: block; font-size: 13px; }
        .nota { margin-top: 9px; color: #475569; font-size: 9px; line-height: 1.4; }
        @media screen { body { padding: 22px; max-width: 1400px; margin: 0 auto; } }
        @media print {
            body { padding: 0; }
            .filtros-aplicados,
            th,
            .linha-impar,
            .linha-par,
            .titulo-categoria td {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <header class="cabecalho">
        <div>
            <h1>Relatório de produtos e estoque</h1>
            <p class="subtitulo">Sistema da Loja — relatório administrativo</p>
        </div>
        <div class="data-geracao">Gerado em: ${escaparHTML(dataGeracao)}</div>
    </header>
    <p class="filtros-aplicados"><strong>Filtros:</strong> ${escaparHTML(descricaoFiltros)} · <strong>Produtos listados:</strong> ${listaProdutos.length}</p>
    <table>
        <thead><tr>${cabecalhoHtml}</tr></thead>
        ${corpoTabelaHtml || `<tbody><tr><td colspan="${colunasTabela.length}">Nenhum produto encontrado.</td></tr></tbody>`}
    </table>
    <section class="resumo">
        <h2>Resumo final do relatório</h2>
        <div class="cartoes-resumo">${resumoHtml}</div>
        <p class="nota">${escaparHTML(notaCalculo)}</p>
    </section>
    <script>window.addEventListener("load", function () { window.setTimeout(function () { window.focus(); window.print(); }, 250); });</script>
</body>
</html>`;
}

function imprimirRelatorioProdutos() {

    if (perfilAtual?.tipo !== "admin") {
        alert("Esta função está disponível somente para o administrador da loja.");
        return;
    }

    const listaFiltrada = obterProdutosFiltradosRelatorio();

    if (listaFiltrada.length === 0) {
        alert("Nenhum produto corresponde aos filtros selecionados.");
        atualizarResumoRelatorioProdutos();
        return;
    }

    const colunas = obterColunasSelecionadasRelatorio();
    const janelaRelatorio = window.open("", "_blank");

    if (!janelaRelatorio) {
        alert("O navegador bloqueou a nova janela. Permita pop-ups para este site e tente novamente.");
        return;
    }

    janelaRelatorio.document.open();
    janelaRelatorio.document.write(construirHtmlRelatorioProdutos(listaFiltrada, colunas));
    janelaRelatorio.document.close();
}


function limparFiltrosRelatorioProdutos() {

    if (filtroRelatorioNome) filtroRelatorioNome.value = "";
    if (filtroRelatorioCategoria) filtroRelatorioCategoria.value = "";
    if (filtroRelatorioFornecedor) filtroRelatorioFornecedor.value = "";

    document.querySelectorAll("[data-relatorio-coluna]").forEach((controle) => {
        controle.checked = true;
    });

    atualizarResumoRelatorioProdutos();
}


/* =========================================================
   EVENTOS DA BUSCA
========================================================= */

if (buscaProdutos) {

    buscaProdutos.addEventListener(
        "input",
        aplicarBuscaProdutos
    );

}


if (limparBuscaProdutos) {

    limparBuscaProdutos.addEventListener(
        "click",
        function () {

            if (!buscaProdutos) {
                return;
            }


            buscaProdutos.value = "";


            aplicarBuscaProdutos();


            buscaProdutos.focus();

        }
    );

}


/* =========================================================
   RENDERIZAR PRODUTOS
========================================================= */

function renderizarProdutos() {

    if (!listaProdutos) {
        return;
    }


    listaProdutos.innerHTML =
        "";


    if (
        !produtos ||
        produtos.length === 0
    ) {

        if (semProdutos) {

            semProdutos.style.display =
                "block";

        }


        if (nenhumResultadoBusca) {

            nenhumResultadoBusca.hidden =
                true;

        }


        aplicarBuscaProdutos();


        return;

    }


    if (semProdutos) {

        semProdutos.style.display =
            "none";

    }


    produtos.forEach(
        function (produto) {

            const tr =
                document.createElement(
                    "tr"
                );


            const nome =
                escaparHTML(
                    produto.nome ||
                    "Sem nome"
                );


            const sku =
                escaparHTML(
                    produto.sku ||
                    "-"
                );


            const fornecedor =
                escaparHTML(
                    produto.fornecedor ||
                    "-"
                );


            const categoriaNome =
                produto.categorias?.nome ||
                "Sem categoria";


            const categoria =
                escaparHTML(
                    categoriaNome
                );


            const custo =
                formatarMoeda(
                    produto.preco_custo
                );


            const venda =
                formatarMoeda(
                    produto.preco_venda
                );

            const minimo = formatarMoeda(produto.preco_venda_minimo);

            const minimoAvista = calcularPrecoMinimoAvista(produto.preco_venda_minimo);


            const estoqueAtual =
                Number(
                    produto.estoque
                ) || 0;


            const ativo =
                produto.ativo === true;


            /*
             * Dados usados pela pesquisa.
             * Nome, SKU, fornecedor e categoria.
             */

            tr.dataset.busca = [
                produto.nome,
                produto.sku,
                produto.fornecedor,
                categoriaNome
            ].filter(Boolean).join(" ");


            tr.innerHTML = `
                <td>
                    ${nome}
                </td>

                <td>
                    ${sku}
                </td>

                <td>
                    ${fornecedor}
                </td>

                <td>
                    ${categoria}
                </td>

                <td>
                    ${custo}
                </td>

                <td>
                    ${venda}
                </td>
                <td>${minimo}</td>

                <td><span class="preco-minimo-avista">${minimoAvista}</span></td>

                <td>
                    ${estoqueAtual}
                </td>

                <td>
                    <span
                        class="status-produto ${
                            ativo
                                ? "ativo"
                                : "inativo"
                        }"
                    >
                        ${
                            ativo
                                ? "Ativo"
                                : "Inativo"
                        }
                    </span>
                </td>

                <td>

                    <div
                        class="acoes-produto"
                    >

                        <button
                            type="button"
                            class="btn-acao btn-editar"
                            onclick="editarProduto('${produto.id}')"
                            title="Editar produto"
                        >
                            Editar
                        </button>


                        <button
                            type="button"
                            class="btn-acao btn-status"
                            onclick="alternarStatusProduto(
                                '${produto.id}',
                                ${ativo}
                            )"
                            title="${
                                ativo
                                    ? "Desativar produto"
                                    : "Ativar produto"
                            }"
                        >
                            ${
                                ativo
                                    ? "Desativar"
                                    : "Ativar"
                            }
                        </button>


                        <button
                            type="button"
                            class="btn-acao btn-excluir"
                            onclick="excluirProduto('${produto.id}')"
                            title="Excluir produto"
                        >
                            Excluir
                        </button>

                    </div>

                </td>
            `;


            listaProdutos.appendChild(
                tr
            );

        }
    );


    /*
     * Aplica novamente a busca depois de renderizar
     * a tabela, sem apagar o texto já digitado.
     */

    aplicarBuscaProdutos();

}


/* =========================================================
   LIMPAR FORMULÁRIO
========================================================= */

function limparFormulario() {

    if (formProduto) {
        formProduto.reset();
    }


    produtoEditandoId =
        null;


    if (produtoAtivo) {

        produtoAtivo.checked =
            true;

    }


    if (categoriaProduto) {

        categoriaProduto.value =
            "";

    }


    if (tituloFormulario) {

        tituloFormulario.textContent =
            "Cadastrar produto";

    }


    if (btnSalvar) {

        btnSalvar.textContent =
            "Cadastrar produto";

    }

}


/* =========================================================
   EDITAR PRODUTO
========================================================= */

function editarProduto(id) {

    const produto =
        produtos.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(id)
                );

            }
        );


    if (!produto) {

        alert(
            "Produto não encontrado."
        );

        return;

    }


    produtoEditandoId =
        produto.id;


    if (tituloFormulario) {

        tituloFormulario.textContent =
            "Editar produto";

    }


    if (btnSalvar) {

        btnSalvar.textContent =
            "Salvar alterações";

    }


    nomeProduto.value =
        produto.nome || "";


    skuProduto.value =
        produto.sku || "";


    fornecedorProduto.value =
        produto.fornecedor || "";


    categoriaProduto.value =
        produto.categoria_id || "";


    precoCusto.value =
        produto.preco_custo ?? "";


    precoVenda.value =
        produto.preco_venda ?? "";

    precoVendaMinimo.value = produto.preco_venda_minimo ?? "";


    estoque.value =
        produto.estoque ?? 0;


    estoqueMinimo.value =
        produto.estoque_minimo ?? 0;


    produtoAtivo.checked =
        produto.ativo === true;


    limparMensagem();


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   SALVAR PRODUTO
========================================================= */

async function salvarProduto(event) {

    if (event) {

        event.preventDefault();

    }


    limparMensagem();


    if (!perfilAtual?.loja_id) {

        mostrarMensagem(
            "Loja do administrador não encontrada.",
            "erro"
        );

        return;

    }


    const nome =
        nomeProduto.value
            .trim();


    const sku =
        skuProduto.value
            .trim();


    const fornecedor =
        fornecedorProduto.value
            .trim();


    const categoriaId =
        categoriaProduto.value ||
        null;


    const precoCustoValor =
        Number(
            precoCusto.value
        );


    const precoVendaValor =
        Number(
            precoVenda.value
        );

    const precoVendaMinimoValor = Number(precoVendaMinimo.value);


    const estoqueValor =
        Number(
            estoque.value
        );


    const estoqueMinimoValor =
        Number(
            estoqueMinimo.value
        );


    const ativo =
        produtoAtivo.checked;


    if (!nome) {

        mostrarMensagem(
            "Digite o nome do produto.",
            "erro"
        );

        nomeProduto.focus();

        return;

    }


    if (
        !Number.isFinite(
            precoCustoValor
        ) ||
        precoCustoValor < 0
    ) {

        mostrarMensagem(
            "Digite um preço de custo válido.",
            "erro"
        );

        precoCusto.focus();

        return;

    }


    if (
        !Number.isFinite(
            precoVendaValor
        ) ||
        precoVendaValor < 0
    ) {

        mostrarMensagem(
            "Digite um preço de venda válido.",
            "erro"
        );

        precoVenda.focus();

        return;

    }
    if (
        !Number.isFinite(precoVendaMinimoValor) ||
        precoVendaMinimo.value.trim() === "" ||
        precoVendaMinimoValor < 0 ||
        precoVendaMinimoValor > precoVendaValor
    ) {
        mostrarMensagem(
            "O preço mínimo deve ser válido e não pode superar o preço de venda.",
            "erro"
        );
        precoVendaMinimo.focus();
        return;
    }


    if (
        !Number.isFinite(
            estoqueValor
        ) ||
        estoqueValor < 0
    ) {

        mostrarMensagem(
            "Digite um estoque válido.",
            "erro"
        );

        estoque.focus();

        return;

    }


    if (
        !Number.isFinite(
            estoqueMinimoValor
        ) ||
        estoqueMinimoValor < 0
    ) {

        mostrarMensagem(
            "Digite um estoque mínimo válido.",
            "erro"
        );

        estoqueMinimo.focus();

        return;

    }


    const dadosProduto = {

        nome:
            nome,

        sku:
            sku || null,

        fornecedor:
            fornecedor || null,

        categoria_id:
            categoriaId,

        preco_custo:
            precoCustoValor,

        preco_venda:
            precoVendaValor,

        preco_venda_minimo: precoVendaMinimoValor,

        estoque:
            estoqueValor,

        estoque_minimo:
            estoqueMinimoValor,

        ativo:
            ativo

    };


    if (btnSalvar) {

        btnSalvar.disabled =
            true;

    }


    try {

        /* =================================================
           CADASTRAR
        ================================================= */

        if (!produtoEditandoId) {

            dadosProduto.loja_id =
                perfilAtual.loja_id;


            const {
                error
            } =
                await produtosSupabase
                    .from("produtos")
                    .insert(
                        dadosProduto
                    );


            if (error) {

                console.error(
                    "Erro ao cadastrar produto:",
                    error
                );

                mostrarMensagem(
                    "Não foi possível cadastrar o produto: " +
                    error.message,
                    "erro"
                );

                return;

            }


            mostrarMensagem(
                "Produto cadastrado com sucesso!",
                "sucesso"
            );

        }

        /* =================================================
           EDITAR
        ================================================= */

        else {

            const {
                error
            } =
                await produtosSupabase
                    .from("produtos")
                    .update(
                        dadosProduto
                    )
                    .eq(
                        "id",
                        produtoEditandoId
                    )
                    .eq(
                        "loja_id",
                        perfilAtual.loja_id
                    );


            if (error) {

                console.error(
                    "Erro ao atualizar produto:",
                    error
                );

                mostrarMensagem(
                    "Não foi possível atualizar o produto: " +
                    error.message,
                    "erro"
                );

                return;

            }


            mostrarMensagem(
                "Produto atualizado com sucesso!",
                "sucesso"
            );

        }


        limparFormulario();

        await carregarProdutos();


    } catch (erro) {

        console.error(
            "Erro ao salvar produto:",
            erro
        );

        mostrarMensagem(
            "Ocorreu um erro ao salvar o produto.",
            "erro"
        );

    } finally {

        if (btnSalvar) {

            btnSalvar.disabled =
                false;

        }

    }

}


/* =========================================================
   ALTERNAR STATUS
========================================================= */

async function alternarStatusProduto(
    id,
    ativoAtual
) {

    const novoStatus =
        !ativoAtual;


    const mensagemConfirmacao =
        novoStatus
            ? "Deseja ativar este produto?"
            : "Deseja desativar este produto?";


    if (
        !confirm(
            mensagemConfirmacao
        )
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await produtosSupabase
                .from("produtos")
                .update(
                    {
                        ativo:
                            novoStatus
                    }
                )
                .eq(
                    "id",
                    id
                )
                .eq(
                    "loja_id",
                    perfilAtual.loja_id
                );


        if (error) {

            console.error(
                "Erro ao alterar status:",
                error
            );

            mostrarMensagem(
                "Não foi possível alterar o status do produto: " +
                error.message,
                "erro"
            );

            return;

        }


        mostrarMensagem(
            novoStatus
                ? "Produto ativado com sucesso!"
                : "Produto desativado com sucesso!",
            "sucesso"
        );


        await carregarProdutos();


    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );

        mostrarMensagem(
            "Ocorreu um erro ao alterar o status.",
            "erro"
        );

    }

}


/* =========================================================
   EXCLUIR PRODUTO
========================================================= */

async function excluirProduto(id) {

    const produto =
        produtos.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(id)
                );

            }
        );


    const nome =
        produto?.nome ||
        "este produto";


    /* =====================================================
       PRIMEIRA CONFIRMAÇÃO
    ===================================================== */

    const confirmar =
        confirm(
            `Deseja excluir o produto "${nome}"?`
        );


    if (!confirmar) {

        return;

    }


    /* =====================================================
       SEGUNDA CONFIRMAÇÃO
    ===================================================== */

    const confirmarNovamente =
        confirm(
            `Confirme novamente:\n\nExcluir definitivamente "${nome}"?`
        );


    if (!confirmarNovamente) {

        return;

    }


    try {

        /* =================================================
           IMPORTANTE:
           AQUI É RPC DO BANCO.

           NÃO É EDGE FUNCTION.

           NÃO USAR:
           /functions/v1/excluir_produto
        ================================================= */

        const {
            data,
            error
        } =
            await produtosSupabase
                .rpc(
                    "excluir_produto",
                    {
                        p_produto_id:
                            id
                    }
                );


        console.log(
            "Resposta da exclusão:",
            data
        );


        if (error) {

            console.error(
                "Erro RPC ao excluir produto:",
                error
            );


            let mensagemErro =
                error.message ||
                "Não foi possível excluir o produto.";


            if (
                mensagemErro
                    .toLowerCase()
                    .includes(
                        "já possui vendas"
                    )
            ) {

                mensagemErro =
                    "Este produto já possui vendas registradas e não pode ser excluído. Desative o produto em vez de excluí-lo.";

            }


            mostrarMensagem(
                mensagemErro,
                "erro"
            );

            return;

        }


        mostrarMensagem(
            "Produto excluído com sucesso!",
            "sucesso"
        );


        await carregarProdutos();


    } catch (erro) {

        console.error(
            "Erro ao excluir produto:",
            erro
        );

        mostrarMensagem(
            "Ocorreu um erro ao excluir o produto: " +
            (
                erro?.message ||
                "erro desconhecido."
            ),
            "erro"
        );

    }

}


/* =========================================================
   CANCELAR
========================================================= */

function cancelarEdicao() {

    limparFormulario();

    limparMensagem();

}


/* =========================================================
   EVENTOS
========================================================= */

if (formProduto) {

    formProduto.addEventListener(
        "submit",
        salvarProduto
    );

}


if (btnCancelar) {

    btnCancelar.addEventListener(
        "click",
        cancelarEdicao
    );

}


if (btnAtualizar) {

    btnAtualizar.addEventListener(
        "click",
        async function () {

            limparMensagem();

            await carregarConfiguracoesPrecoAvistaProdutos();

            await carregarCategorias();

            await carregarProdutos();

        }
    );

}


/* =========================================================
   EVENTOS DO RELATÓRIO — SOMENTE ADMINISTRADOR
========================================================= */

[filtroRelatorioNome, filtroRelatorioCategoria, filtroRelatorioFornecedor].forEach((controle) => {
    if (!controle) return;
    controle.addEventListener(
        controle === filtroRelatorioNome ? "input" : "change",
        atualizarResumoRelatorioProdutos
    );
});

document.querySelectorAll("[data-relatorio-coluna]").forEach((controle) => {
    controle.addEventListener("change", atualizarResumoRelatorioProdutos);
});

if (btnLimparFiltrosRelatorio) {
    btnLimparFiltrosRelatorio.addEventListener("click", limparFiltrosRelatorioProdutos);
}

if (btnImprimirRelatorioProdutos) {
    btnImprimirRelatorioProdutos.addEventListener("click", imprimirRelatorioProdutos);
}


/* =========================================================
   SAIR
========================================================= */

async function sairProdutos() {

    if (btnSair) {
        btnSair.disabled = true;
        btnSair.setAttribute("aria-busy", "true");
    }

    try {
        const { error } = await produtosSupabase.auth.signOut({
            scope: "local"
        });

        if (error) {
            console.error("Erro ao sair da tela de produtos:", error);
        }
    } catch (erro) {
        console.error("Erro ao sair da tela de produtos:", erro);
    } finally {
        sessionStorage.removeItem("sistemaLojaPerfil");
        window.location.href = "index.html";
    }
}

if (btnSair) {
    btnSair.addEventListener("click", sairProdutos);
}


/* =========================================================
   INICIAR
========================================================= */

async function iniciarProdutos() {

    mostrarDataAtual();


    const acesso =
        await protegerPagina();


    if (!acesso) {

        return;

    }


    await carregarConfiguracoesPrecoAvistaProdutos();

    await carregarCategorias();

    await carregarProdutos();

    if (painelRelatorioProdutos && perfilAtual?.tipo === "admin") {
        painelRelatorioProdutos.hidden = false;
    }

    atualizarResumoRelatorioProdutos();
}


iniciarProdutos();