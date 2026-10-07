/* ==========================================
   SISTEMA DA LOJA
   ESTOQUE DO VENDEDOR
   SOMENTE CONSULTA
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const vendedorEstoqueSupabase =
    supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const listaEstoque =
    document.getElementById(
        "listaEstoque"
    );


const buscaEstoque =
    document.getElementById(
        "buscaEstoque"
    );


const filtroSituacao =
    document.getElementById(
        "filtroSituacao"
    );


const totalProdutos =
    document.getElementById(
        "totalProdutos"
    );


const totalItens =
    document.getElementById(
        "totalItens"
    );


const totalBaixo =
    document.getElementById(
        "totalBaixo"
    );


const totalEsgotados =
    document.getElementById(
        "totalEsgotados"
    );


const mensagemEstoque =
    document.getElementById(
        "mensagemEstoque"
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


/* ==========================================
   ESTADO
========================================== */

let produtos =
    [];


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

    const agora =
        new Date();


    const texto =
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
        texto.charAt(0).toUpperCase() +
        texto.slice(1);
}


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(
    texto,
    tipo = ""
) {

    mensagemEstoque.textContent =
        texto;


    mensagemEstoque.className =
        "mensagem-estoque-vendedor";


    if (tipo) {

        mensagemEstoque.classList.add(
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
            await vendedorEstoqueSupabase
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
            await vendedorEstoqueSupabase
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

            await vendedorEstoqueSupabase
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


        if (
            perfil.tipo === "admin"
        ) {

            window.location.href =
                "admin.html";


            return false;
        }


        if (
            perfil.tipo !== "vendedor"
        ) {

            await vendedorEstoqueSupabase
                .auth
                .signOut({
                    scope: "local"
                });


            window.location.href =
                "index.html";


            return false;
        }


        if (
            perfil.ativo !== true
        ) {

            await vendedorEstoqueSupabase
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


        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "Vendedor";


        nomeVendedor.textContent =
            nome;


        avatarVendedor.textContent =
            nome
                .trim()
                .charAt(0)
                .toUpperCase();


        sessionStorage.setItem(
            "sistemaLojaPerfil",
            JSON.stringify(perfil)
        );


        return true;

    }

    catch (erro) {

        console.error(
            "Erro ao proteger vendedor:",
            erro
        );


        window.location.href =
            "index.html";


        return false;
    }
}


/* ==========================================
   CARREGAR ESTOQUE
========================================== */

async function carregarEstoque() {

    listaEstoque.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="carregando"
            >
                Carregando estoque...
            </td>

        </tr>

    `;


    const resultado =
        await vendedorEstoqueSupabase
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
            "Erro ao carregar estoque:",
            resultado.error
        );


        mostrarMensagem(
            "Não foi possível carregar o estoque.",
            "erro"
        );


        listaEstoque.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="lista-vazia"
                >
                    Não foi possível carregar o estoque.
                </td>

            </tr>

        `;


        return;
    }


    produtos =
        resultado.data || [];


    await carregarNomesCategorias();


    atualizarIndicadores();

    aplicarFiltros();
}


/* ==========================================
   CATEGORIAS
========================================== */

async function carregarNomesCategorias() {

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
        await vendedorEstoqueSupabase
            .from("categorias")
            .select(
                "id, nome"
            )
            .in(
                "id",
                ids
            );


    const mapa =
        {};


    if (
        !resultado.error
    ) {

        (resultado.data || [])
            .forEach(
                categoria => {

                    mapa[
                        categoria.id
                    ] =
                        categoria.nome;

                }
            );
    }


    produtos =
        produtos.map(
            produto => {

                return {

                    ...produto,

                    categoria_nome:
                        mapa[
                            produto.categoria_id
                        ] ||
                        "Sem categoria"

                };

            }
        );
}


/* ==========================================
   SITUAÇÃO
========================================== */

function obterSituacao(
    produto
) {

    const estoque =
        Number(
            produto.estoque
        ) || 0;


    const minimo =
        Number(
            produto.estoque_minimo
        ) || 0;


    if (
        estoque <= 0
    ) {

        return "esgotado";
    }


    if (
        estoque <= minimo
    ) {

        return "baixo";
    }


    return "normal";
}


/* ==========================================
   INDICADORES
========================================== */

function atualizarIndicadores() {

    const ativos =
        produtos.filter(
            produto =>
                produto.ativo === true
        );


    const quantidadeItens =
        ativos.reduce(
            function (total, produto) {

                return total +
                    (
                        Number(
                            produto.estoque
                        ) || 0
                    );

            },
            0
        );


    const quantidadeBaixo =
        ativos.filter(
            produto =>
                obterSituacao(
                    produto
                ) === "baixo"
        ).length;


    const quantidadeEsgotados =
        ativos.filter(
            produto =>
                obterSituacao(
                    produto
                ) === "esgotado"
        ).length;


    totalProdutos.textContent =
        ativos.length;


    totalItens.textContent =
        quantidadeItens;


    totalBaixo.textContent =
        quantidadeBaixo;


    totalEsgotados.textContent =
        quantidadeEsgotados;
}


/* ==========================================
   FILTROS
========================================== */

function aplicarFiltros() {

    const texto =
        (
            buscaEstoque.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const situacaoFiltro =
        filtroSituacao.value ||
        "";


    const filtrados =
        produtos.filter(
            function (produto) {

                if (
                    produto.ativo !== true
                ) {

                    return false;
                }


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


                const situacao =
                    obterSituacao(
                        produto
                    );


                if (
                    situacaoFiltro &&
                    situacao !== situacaoFiltro
                ) {

                    return false;
                }


                return true;

            }
        );


    renderizarEstoque(
        filtrados
    );
}


/* ==========================================
   RENDERIZAR
========================================== */

function renderizarEstoque(
    produtosParaMostrar
) {

    if (
        produtosParaMostrar.length === 0
    ) {

        listaEstoque.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="lista-vazia"
                >

                    Nenhum produto encontrado.

                </td>

            </tr>

        `;


        return;
    }


    listaEstoque.innerHTML =
        produtosParaMostrar
            .map(
                function (produto) {

                    const estoque =
                        Number(
                            produto.estoque
                        ) || 0;


                    const minimo =
                        Number(
                            produto.estoque_minimo
                        ) || 0;


                    const situacao =
                        obterSituacao(
                            produto
                        );


                    let classeQuantidade =
                        "quantidade-normal";


                    let classeSituacao =
                        "situacao-normal";


                    let textoSituacao =
                        "Normal";


                    if (
                        situacao === "baixo"
                    ) {

                        classeQuantidade =
                            "quantidade-baixa";

                        classeSituacao =
                            "situacao-baixo";

                        textoSituacao =
                            "Estoque baixo";

                    }


                    if (
                        situacao === "esgotado"
                    ) {

                        classeQuantidade =
                            "quantidade-esgotada";

                        classeSituacao =
                            "situacao-esgotado";

                        textoSituacao =
                            "Esgotado";

                    }


                    return `

                        <tr>

                            <td>

                                <div
                                    class="nome-produto-estoque"
                                >
                                    ${escaparHTML(
                                        produto.nome
                                    )}
                                </div>

                            </td>


                            <td>

                                <span
                                    class="sku-produto-estoque"
                                >
                                    ${escaparHTML(
                                        produto.sku ||
                                        "-"
                                    )}
                                </span>

                            </td>


                            <td>

                                ${escaparHTML(
                                    produto.categoria_nome ||
                                    "Sem categoria"
                                )}

                            </td>


                            <td>

                                <strong
                                    class="${classeQuantidade}"
                                >
                                    ${estoque}
                                </strong>

                            </td>


                            <td>

                                ${minimo}

                            </td>


                            <td>

                                <span
                                    class="situacao-estoque ${classeSituacao}"
                                >
                                    ${textoSituacao}
                                </span>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");
}


/* ==========================================
   EVENTOS DE FILTRO
========================================== */

buscaEstoque.addEventListener(
    "input",
    aplicarFiltros
);


filtroSituacao.addEventListener(
    "change",
    aplicarFiltros
);


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

                await vendedorEstoqueSupabase
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

async function iniciarVendedorEstoque() {

    mostrarDataAtual();


    configurarBotaoSair();


    const autorizado =
        await protegerVendedor();


    if (!autorizado) {

        return;
    }


    await carregarEstoque();
}


/* ==========================================
   INICIAR
========================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarVendedorEstoque
    );

}
else {

    iniciarVendedorEstoque();

}