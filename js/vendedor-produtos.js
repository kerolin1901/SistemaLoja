/* ==========================================
   SISTEMA DA LOJA
   PRODUTOS DO VENDEDOR
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const vendedorProdutosSupabase =
    supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const listaProdutos =
    document.getElementById(
        "listaProdutos"
    );


const buscaProduto =
    document.getElementById(
        "buscaProduto"
    );


const filtroCategoria =
    document.getElementById(
        "filtroCategoria"
    );


const filtroStatus =
    document.getElementById(
        "filtroStatus"
    );


const contadorProdutos =
    document.getElementById(
        "contadorProdutos"
    );


const mensagemProdutos =
    document.getElementById(
        "mensagemProdutos"
    );


const nomeVendedor =
    document.getElementById(
        "nomeVendedor"
    );


const avatarVendedor =
    document.getElementById(
        "avatarVendedor"
    );


const dataAtual =
    document.getElementById(
        "dataAtual"
    );


const btnSair =
    document.getElementById(
        "btnSair"
    );


/* ==========================================
   ESTADO
========================================== */

let produtos =
    [];


/* ==========================================
   FORMATAÇÃO DE MOEDA
========================================== */

function formatarMoeda(valor) {

    const numero =
        Number(valor) || 0;


    return numero.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


/* ==========================================
   ESCAPAR HTML
========================================== */

function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texto ?? "";


    return div.innerHTML;
}


/* ==========================================
   DATA
========================================== */

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


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = ""
) {

    if (!mensagemProdutos) {

        return;
    }


    mensagemProdutos.textContent =
        texto;


    mensagemProdutos.className =
        "mensagem-produtos";


    if (tipo) {

        mensagemProdutos.classList.add(
            tipo
        );
    }
}


/* ==========================================
   PROTEGER VENDEDOR
========================================== */

async function protegerVendedor() {

    try {

        const resultadoSessao =
            await vendedorProdutosSupabase
                .auth
                .getSession();


        const session =
            resultadoSessao
                .data
                .session;


        if (!session) {

            window.location.href =
                "index.html";

            return false;
        }


        const resultadoPerfil =
            await vendedorProdutosSupabase
                .from("perfis")
                .select(
                    "id, nome_completo, usuario, tipo, ativo"
                )
                .eq(
                    "id",
                    session.user.id
                )
                .maybeSingle();


        if (
            resultadoPerfil.error ||
            !resultadoPerfil.data
        ) {

            console.error(
                "Erro ao buscar perfil:",
                resultadoPerfil.error
            );


            await vendedorProdutosSupabase
                .auth
                .signOut({
                    scope: "local"
                });


            window.location.href =
                "index.html";


            return false;
        }


        const perfil =
            resultadoPerfil.data;


        /* ======================================
           ADMIN
        ====================================== */

        if (
            perfil.tipo === "admin"
        ) {

            window.location.href =
                "admin.html";


            return false;
        }


        /* ======================================
           NÃO É VENDEDOR
        ====================================== */

        if (
            perfil.tipo !== "vendedor"
        ) {

            await vendedorProdutosSupabase
                .auth
                .signOut({
                    scope: "local"
                });


            window.location.href =
                "index.html";


            return false;
        }


        /* ======================================
           DESATIVADO
        ====================================== */

        if (
            perfil.ativo !== true
        ) {

            await vendedorProdutosSupabase
                .auth
                .signOut({
                    scope: "local"
                });


            sessionStorage.removeItem(
                "sistemaLojaPerfil"
            );


            alert(
                "Seu usuário está desativado. Procure o administrador."
            );


            window.location.href =
                "index.html";


            return false;
        }


        /* ======================================
           MOSTRAR USUÁRIO
        ====================================== */

        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "Vendedor";


        if (nomeVendedor) {

            nomeVendedor.textContent =
                nome;
        }


        if (avatarVendedor) {

            avatarVendedor.textContent =
                nome
                    .trim()
                    .charAt(0)
                    .toUpperCase();
        }


        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );


        return true;

    }

    catch (erro) {

        console.error(
            "Erro ao proteger página:",
            erro
        );


        window.location.href =
            "index.html";


        return false;
    }
}


/* ==========================================
   CARREGAR CATEGORIAS
========================================== */

async function carregarCategorias() {

    if (!filtroCategoria) {

        return;
    }


    const resultado =
        await vendedorProdutosSupabase
            .from("categorias")
            .select(
                "id, nome"
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


    if (resultado.error) {

        console.error(
            "Erro ao carregar categorias:",
            resultado.error
        );

        return;
    }


    const categorias =
        resultado.data || [];


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


            filtroCategoria.appendChild(
                option
            );

        }
    );
}


/* ==========================================
   CARREGAR PRODUTOS
========================================== */

async function carregarProdutos() {

    if (!listaProdutos) {

        return;
    }


    listaProdutos.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="carregando"
            >
                Carregando produtos...
            </td>

        </tr>

    `;


    const resultado =
        await vendedorProdutosSupabase
            .from("produtos_para_venda")
            .select(
                "id, nome, sku, categoria_id, preco_venda, estoque, estoque_minimo, ativo"
            )
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


        mostrarMensagem(
            "Não foi possível carregar os produtos.",
            "erro"
        );


        listaProdutos.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="lista-vazia"
                >
                    Não foi possível carregar os produtos.
                </td>

            </tr>

        `;


        return;
    }


    produtos =
        resultado.data || [];


    await associarCategorias();


    aplicarFiltros();
}


/* ==========================================
   ASSOCIAR CATEGORIAS
========================================== */

async function associarCategorias() {

    const ids =
        [
            ...new Set(
                produtos
                    .map(
                        produto =>
                            produto.categoria_id
                    )
                    .filter(
                        id =>
                            id !== null &&
                            id !== undefined
                    )
            )
        ];


    if (
        ids.length === 0
    ) {

        produtos =
            produtos.map(
                produto => {

                    return {

                        ...produto,

                        categoria_nome:
                            "Sem categoria"

                    };

                }
            );


        return;
    }


    const resultado =
        await vendedorProdutosSupabase
            .from("categorias")
            .select(
                "id, nome"
            )
            .in(
                "id",
                ids
            );


    if (resultado.error) {

        console.error(
            "Erro ao carregar categorias dos produtos:",
            resultado.error
        );


        produtos =
            produtos.map(
                produto => {

                    return {

                        ...produto,

                        categoria_nome:
                            "Sem categoria"

                    };

                }
            );


        return;
    }


    const mapaCategorias =
        {};


    (resultado.data || [])
        .forEach(
            categoria => {

                mapaCategorias[
                    categoria.id
                ] =
                    categoria.nome;

            }
        );


    produtos =
        produtos.map(
            produto => {

                return {

                    ...produto,

                    categoria_nome:
                        mapaCategorias[
                            produto.categoria_id
                        ] ||
                        "Sem categoria"

                };

            }
        );
}


/* ==========================================
   APLICAR FILTROS
========================================== */

function aplicarFiltros() {

    const texto =
        (
            buscaProduto?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const categoria =
        filtroCategoria?.value ||
        "";


    const status =
        filtroStatus?.value ||
        "";


    const produtosFiltrados =
        produtos.filter(
            function (produto) {


                /* ==============================
                   BUSCA
                ============================== */

                const nome =
                    (
                        produto.nome ||
                        ""
                    )
                        .toLowerCase();


                const sku =
                    (
                        produto.sku ||
                        ""
                    )
                        .toLowerCase();


                const correspondeBusca =
                    !texto ||
                    nome.includes(texto) ||
                    sku.includes(texto);


                if (
                    !correspondeBusca
                ) {

                    return false;
                }


                /* ==============================
                   CATEGORIA
                ============================== */

                const correspondeCategoria =
                    !categoria ||
                    String(
                        produto.categoria_id
                    ) ===
                    String(
                        categoria
                    );


                if (
                    !correspondeCategoria
                ) {

                    return false;
                }


                /* ==============================
                   STATUS
                ============================== */

                if (
                    status === "ativo" &&
                    produto.ativo !== true
                ) {

                    return false;
                }


                if (
                    status === "inativo" &&
                    produto.ativo === true
                ) {

                    return false;
                }


                return true;

            }
        );


    renderizarProdutos(
        produtosFiltrados
    );
}


/* ==========================================
   RENDERIZAR PRODUTOS
========================================== */

function renderizarProdutos(
    produtosParaMostrar
) {

    if (contadorProdutos) {

        const quantidade =
            produtosParaMostrar.length;


        contadorProdutos.textContent =
            quantidade +
            (
                quantidade === 1
                    ? " produto"
                    : " produtos"
            );
    }


    if (
        produtosParaMostrar.length === 0
    ) {

        listaProdutos.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="lista-vazia"
                >

                    <strong>
                        Nenhum produto encontrado
                    </strong>

                    <span>
                        Tente alterar a pesquisa ou os filtros.
                    </span>

                </td>

            </tr>

        `;


        return;
    }


    listaProdutos.innerHTML =
        produtosParaMostrar
            .map(
                function (produto) {


                    /* ==========================
                       ESTOQUE
                    ========================== */

                    const estoque =
                        Number(
                            produto.estoque
                        ) || 0;


                    const estoqueMinimo =
                        Number(
                            produto.estoque_minimo
                        ) || 0;


                    let classeEstoque =
                        "estoque-normal";


                    if (
                        estoque <= 0
                    ) {

                        classeEstoque =
                            "estoque-esgotado";

                    }
                    else if (
                        estoque <= estoqueMinimo
                    ) {

                        classeEstoque =
                            "estoque-baixo";
                    }


                    /* ==========================
                       STATUS
                    ========================== */

                    const statusHTML =
                        produto.ativo === true

                            ? `
                                <span
                                    class="status-produto status-ativo"
                                >
                                    Ativo
                                </span>
                              `

                            : `
                                <span
                                    class="status-produto status-inativo"
                                >
                                    Inativo
                                </span>
                              `;


                    return `

                        <tr>

                            <td>

                                <div
                                    class="nome-produto"
                                >
                                    ${escaparHTML(
                                        produto.nome
                                    )}
                                </div>

                            </td>


                            <td>

                                <span
                                    class="sku-produto"
                                >
                                    ${escaparHTML(
                                        produto.sku ||
                                        "-"
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="categoria-produto"
                                >
                                    ${escaparHTML(
                                        produto.categoria_nome ||
                                        "Sem categoria"
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="preco-venda"
                                >
                                    ${formatarMoeda(
                                        produto.preco_venda
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="${classeEstoque}"
                                >
                                    ${estoque}
                                </span>

                            </td>


                            <td>

                                ${statusHTML}

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");
}


/* ==========================================
   PESQUISA
========================================== */

if (buscaProduto) {

    buscaProduto.addEventListener(
        "input",
        aplicarFiltros
    );
}


if (filtroCategoria) {

    filtroCategoria.addEventListener(
        "change",
        aplicarFiltros
    );
}


if (filtroStatus) {

    filtroStatus.addEventListener(
        "change",
        aplicarFiltros
    );
}


/* ==========================================
   SAIR
========================================== */

function configurarBotaoSair() {

    const botao =
        document.getElementById(
            "btnSair"
        );


    if (!botao) {

        return;
    }


    botao.addEventListener(
        "click",
        async function () {

            try {

                await vendedorProdutosSupabase
                    .auth
                    .signOut({
                        scope: "local"
                    });

            }

            catch (erro) {

                console.error(
                    "Erro ao sair:",
                    erro
                );
            }


            sessionStorage.removeItem(
                "sistemaLojaPerfil"
            );


            window.location.href =
                "index.html";

        }
    );
}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

async function iniciarVendedorProdutos() {

    mostrarDataAtual();


    configurarBotaoSair();


    const autorizado =
        await protegerVendedor();


    if (!autorizado) {

        return;
    }


    await carregarCategorias();


    await carregarProdutos();
}


/* ==========================================
   INICIAR
========================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarVendedorProdutos
    );

}
else {

    iniciarVendedorProdutos();

}