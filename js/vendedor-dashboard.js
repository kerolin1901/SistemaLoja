/* ==========================================
   SISTEMA DA LOJA
   DADOS REAIS DO DASHBOARD DO VENDEDOR
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const dashboardVendedorSupabase =
    supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const vendasHoje =
    document.getElementById(
        "vendasHoje"
    );


const totalVendidoHoje =
    document.getElementById(
        "totalVendidoHoje"
    );


const produtosVendidosHoje =
    document.getElementById(
        "produtosVendidosHoje"
    );


const clientesAtendidosHoje =
    document.getElementById(
        "clientesAtendidosHoje"
    );


const estoqueBaixo =
    document.getElementById(
        "estoqueBaixo"
    );


const produtosEsgotados =
    document.getElementById(
        "produtosEsgotados"
    );


const listaUltimasVendas =
    document.getElementById(
        "listaUltimasVendas"
    );


const mensagemDashboard =
    document.getElementById(
        "mensagemDashboard"
    );


const nomeVendedorBoasVindas =
    document.getElementById(
        "nomeVendedorBoasVindas"
    );


/* ==========================================
   MOEDA
========================================== */

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

function formatarData(data) {

    if (!data) {

        return "-";
    }


    return new Date(
        data
    ).toLocaleString(
        "pt-BR",
        {
            timeZone:
                "America/Sao_Paulo",

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}


/* ==========================================
   MENSAGEM
========================================== */

function mostrarErroDashboard(
    texto
) {

    if (!mensagemDashboard) {

        return;
    }


    mensagemDashboard.textContent =
        texto;


    mensagemDashboard.classList.add(
        "visivel"
    );
}


/* ==========================================
   MOSTRAR NOME
========================================== */

function mostrarNomeVendedor() {

    const perfilTexto =
        sessionStorage.getItem(
            "sistemaLojaPerfil"
        );


    if (!perfilTexto) {

        return;
    }


    try {

        const perfil =
            JSON.parse(
                perfilTexto
            );


        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "Vendedor";


        if (
            nomeVendedorBoasVindas
        ) {

            nomeVendedorBoasVindas.textContent =
                nome + "!";
        }

    }

    catch (erro) {

        console.error(
            "Erro ao ler perfil:",
            erro
        );
    }
}


/* ==========================================
   CARREGAR DASHBOARD
========================================== */

async function carregarDashboardVendedor() {

    const resultado =
        await dashboardVendedorSupabase
            .rpc(
                "obter_dashboard_vendedor"
            );


    if (resultado.error) {

        console.error(
            "Erro ao carregar dashboard:",
            resultado.error
        );


        mostrarErroDashboard(
            "Não foi possível carregar os dados do dashboard."
        );


        return;
    }


    const dados =
        resultado.data || {};


    /* ======================================
       INDICADORES
    ====================================== */

    vendasHoje.textContent =
        Number(
            dados.vendas_hoje
        ) || 0;


    totalVendidoHoje.textContent =
        formatarMoeda(
            dados.total_vendido_hoje
        );


    produtosVendidosHoje.textContent =
        Number(
            dados.produtos_vendidos_hoje
        ) || 0;


    clientesAtendidosHoje.textContent =
        Number(
            dados.clientes_atendidos_hoje
        ) || 0;


    estoqueBaixo.textContent =
        Number(
            dados.estoque_baixo
        ) || 0;


    produtosEsgotados.textContent =
        Number(
            dados.esgotados
        ) || 0;


    /* ======================================
       ÚLTIMAS VENDAS
    ====================================== */

    renderizarUltimasVendas(
        dados.ultimas_vendas || []
    );
}


/* ==========================================
   RENDERIZAR ÚLTIMAS VENDAS
========================================== */

function renderizarUltimasVendas(
    vendas
) {

    if (
        !vendas ||
        vendas.length === 0
    ) {

        listaUltimasVendas.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="dashboard-vazio"
                >
                    Nenhuma venda realizada ainda.
                </td>

            </tr>

        `;


        return;
    }


    listaUltimasVendas.innerHTML =
        vendas
            .map(
                function (venda) {

                    return `

                        <tr>

                            <td>

                                <span
                                    class="venda-numero"
                                >
                                    #${venda.id}
                                </span>

                            </td>


                            <td>

                                ${escaparHTML(
                                    venda.cliente ||
                                    "Consumidor não identificado"
                                )}

                            </td>


                            <td>

                                ${escaparHTML(
                                    venda.forma_pagamento ||
                                    "-"
                                )}

                            </td>


                            <td>

                                <span
                                    class="venda-total"
                                >
                                    ${formatarMoeda(
                                        venda.total
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="venda-data"
                                >
                                    ${formatarData(
                                        venda.criado_em
                                    )}
                                </span>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");
}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

async function iniciarDashboardVendedor() {

    mostrarNomeVendedor();


    await carregarDashboardVendedor();
}


/* ==========================================
   INICIAR
========================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarDashboardVendedor
    );

}
else {

    iniciarDashboardVendedor();

}