/* ==========================================

   SISTEMA DA LOJA

   PAINEL ADMINISTRATIVO

   ADMIN.JS

========================================== */

/* ==========================================

   SUPABASE

========================================== */

const adminSupabase = supabaseClient;

/* ==========================================

   ELEMENTOS

========================================== */

const nomeAdministrador =

    document.getElementById("nomeAdministrador");

const avatarAdministrador =

    document.querySelector(".avatar-admin");

const dataAtual =

    document.getElementById("dataAtual");

/* ==========================================

   CONTROLE DA LICENÇA

========================================== */

let verificacaoLicencaEmAndamento = false;

let intervaloVerificacaoLicenca = null;

/* ==========================================

   CONVERTER DATA DA LICENÇA

   SEM CONSIDERAR HORÁRIO

========================================== */

function converterDataLicenca(data) {

    if (!data) {

        return null;

    }

    const partes =

        String(data).split("-");

    if (

        partes.length !== 3

    ) {

        return null;

    }

    const ano =

        Number(partes[0]);

    const mes =

        Number(partes[1]);

    const dia =

        Number(partes[2]);

    if (

        !ano ||

        !mes ||

        !dia

    ) {

        return null;

    }

    return new Date(

        ano,

        mes - 1,

        dia

    );

}

/* ==========================================

   OBTER DATA DE HOJE

   SEM CONSIDERAR HORÁRIO

========================================== */

function obterHojeSemHorario() {

    const agora =

        new Date();

    return new Date(

        agora.getFullYear(),

        agora.getMonth(),

        agora.getDate()

    );

}

/* ==========================================

   CALCULAR DIAS RESTANTES

========================================== */

function calcularDiasRestantes(

    dataVencimento

) {

    const hoje =

        obterHojeSemHorario();

    const vencimento =

        converterDataLicenca(

            dataVencimento

        );

    if (!vencimento) {

        return null;

    }

    const diferenca =

        vencimento.getTime() -

        hoje.getTime();

    return Math.round(

        diferenca /

        (1000 * 60 * 60 * 24)

    );

}

/* ==========================================

   AVISO DE LICENÇA

========================================== */

function mostrarAvisoLicenca(

    loja

) {

    const conteudoAdmin =

        document.querySelector(

            ".conteudo-admin"

        );

    if (!conteudoAdmin) {

        return;

    }

    let aviso =

        document.getElementById(

            "avisoLicenca"

        );

    /*

       Sem data de vencimento:

       remover aviso.

    */

    if (

        !loja ||

        !loja.data_vencimento

    ) {

        if (aviso) {

            aviso.remove();

        }

        return;

    }

    const diasRestantes =

        calcularDiasRestantes(

            loja.data_vencimento

        );

    /*

       Data inválida:

       remover aviso.

    */

    if (

        diasRestantes === null

    ) {

        if (aviso) {

            aviso.remove();

        }

        return;

    }

    /*

       Mais de 7 dias:

       não mostrar aviso.

    */

    if (

        diasRestantes > 7

    ) {

        if (aviso) {

            aviso.remove();

        }

        return;

    }

    /*

       Licença vencida:

       o sistema já deve bloquear

       o acesso.

    */

    if (

        diasRestantes < 0

    ) {

        if (aviso) {

            aviso.remove();

        }

        return;

    }

    /*

       Criar aviso caso ainda não exista.

    */

    if (!aviso) {

        aviso =

            document.createElement(

                "div"

            );

        aviso.id =

            "avisoLicenca";

        /*

           Estilo do aviso.

        */

        aviso.style.width =

            "100%";

        aviso.style.boxSizing =

            "border-box";

        aviso.style.marginBottom =

            "18px";

        aviso.style.padding =

            "14px 18px";

        aviso.style.borderRadius =

            "10px";

        aviso.style.display =

            "flex";

        aviso.style.alignItems =

            "center";

        aviso.style.gap =

            "12px";

        aviso.style.background =

            "#fff7ed";

        aviso.style.border =

            "1px solid #fed7aa";

        aviso.style.color =

            "#9a3412";

        aviso.style.fontSize =

            "14px";

        aviso.style.fontWeight =

            "600";

        /*

           Colocar antes do cabeçalho.

        */

        const cabecalho =

            conteudoAdmin.querySelector(

                ".cabecalho-admin"

            );

        if (cabecalho) {

            conteudoAdmin.insertBefore(

                aviso,

                cabecalho

            );

        } else {

            conteudoAdmin.prepend(

                aviso

            );

        }

    }

    /*

       Montar mensagem.

    */

    let mensagem = "";

    if (

        diasRestantes === 0

    ) {

        mensagem =

            "Atenção: a licença da sua loja vence hoje. Entre em contato com o Administrador Geral para renovar o acesso.";

    } else if (

        diasRestantes === 1

    ) {

        mensagem =

            "Atenção: a licença da sua loja vence em 1 dia. Entre em contato com o Administrador Geral para renovar o acesso.";

    } else {

        mensagem =

            "Atenção: a licença da sua loja vence em " +

            diasRestantes +

            " dias. Entre em contato com o Administrador Geral para renovar o acesso.";

    }

    aviso.innerHTML =

        `

        <span

            style="

                font-size:18px;

                line-height:1;

            "

        >

            ⚠️

        </span>

        <span>

            ${mensagem}

        </span>

        `;

}

/* ==========================================

   VERIFICAR LICENÇA DA LOJA

========================================== */

async function verificarLicencaLoja(

    lojaId,

    mostrarMensagem = true

) {

    if (!lojaId) {

        console.error(

            "Administrador não possui loja_id."

        );

        return false;

    }

    if (verificacaoLicencaEmAndamento) {

        return true;

    }

    verificacaoLicencaEmAndamento = true;

    try {

        const resultadoLoja =

            await adminSupabase

                .from("lojas")

                .select(

                    "id, nome, ativo, data_vencimento"

                )

                .eq("id", lojaId)

                .maybeSingle();

        /* ======================================

           ERRO AO CONSULTAR A LOJA

        ====================================== */

        if (resultadoLoja.error) {

            console.error(

                "Erro ao verificar licença da loja:",

                resultadoLoja.error

            );

            return true;

        }

        const loja =

            resultadoLoja.data;

        /* ======================================

           LOJA NÃO ENCONTRADA

        ====================================== */

        if (!loja) {

            await encerrarSessaoPorLicenca(

                "A loja vinculada ao seu usuário não foi encontrada."

            );

            return false;

        }

        /* ======================================

           LOJA DESATIVADA

        ====================================== */

        if (loja.ativo !== true) {

            await encerrarSessaoPorLicenca(

                "Esta loja está desativada. Procure o administrador."

            );

            return false;

        }

        /* ======================================

           SEM DATA DE VENCIMENTO

        ====================================== */

        if (!loja.data_vencimento) {

            mostrarAvisoLicenca(

                null

            );

            return true;

        }

        /* ======================================

           MOSTRAR AVISO

        ====================================== */

        mostrarAvisoLicenca(

            loja

        );

        /* ======================================

           VERIFICAR DATA DE VENCIMENTO

        ====================================== */

        const hoje =

            obterHojeSemHorario();

        const dataVencimento =

            converterDataLicenca(

                loja.data_vencimento

            );

        if (!dataVencimento) {

            console.error(

                "Data de vencimento inválida:",

                loja.data_vencimento

            );

            return true;

        }

        /* ======================================

           LICENÇA VENCIDA

        ====================================== */

        if (

            dataVencimento <

            hoje

        ) {

            await encerrarSessaoPorLicenca(

                "A licença desta loja está vencida. Procure o administrador."

            );

            return false;

        }

        /* ======================================

           LICENÇA VÁLIDA

        ====================================== */

        return true;

    }

    catch (erro) {

        console.error(

            "Erro ao verificar licença:",

            erro

        );

        return true;

    }

    finally {

        verificacaoLicencaEmAndamento =

            false;

    }

}

/* ==========================================

   ENCERRAR SESSÃO POR LICENÇA

========================================== */

async function encerrarSessaoPorLicenca(

    mensagem

) {

    try {

        await adminSupabase.auth.signOut({

            scope: "local"

        });

    }

    catch (erro) {

        console.error(

            "Erro ao encerrar sessão:",

            erro

        );

    }

    sessionStorage.removeItem(

        "sistemaLojaPerfil"

    );

    if (mensagem) {

        alert(mensagem);

    }

    window.location.href =

        "index.html";

}

/* ==========================================

   VERIFICAR LICENÇA DO USUÁRIO ATUAL

========================================== */

async function verificarLicencaUsuarioAtual() {

    try {

        const resultadoSessao =

            await adminSupabase.auth.getSession();

        const session =

            resultadoSessao.data.session;

        if (!session) {

            return false;

        }

        let perfil = null;

        /* ======================================

           TENTAR PEGAR PERFIL DA SESSÃO

        ====================================== */

        const perfilSalvo =

            sessionStorage.getItem(

                "sistemaLojaPerfil"

            );

        if (perfilSalvo) {

            try {

                perfil =

                    JSON.parse(

                        perfilSalvo

                    );

            }

            catch (erro) {

                console.warn(

                    "Perfil salvo inválido."

                );

                perfil = null;

            }

        }

        /* ======================================

           SE NÃO TEM PERFIL,

           BUSCAR NO SUPABASE

        ====================================== */

        if (!perfil) {

            const resultadoPerfil =

                await adminSupabase

                    .from("perfis")

                    .select(

                        "id, nome_completo, usuario, tipo, ativo, loja_id"

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

                return false;

            }

            perfil =

                resultadoPerfil.data;

        }

        /* ======================================

           SOMENTE ADMIN DA LOJA

        ====================================== */

        if (

            perfil.tipo !== "admin"

        ) {

            return true;

        }

        /* ======================================

           VERIFICAR LICENÇA

        ====================================== */

        return await verificarLicencaLoja(

            perfil.loja_id,

            false

        );

    }

    catch (erro) {

        console.error(

            "Erro ao verificar licença do usuário:",

            erro

        );

        return true;

    }

}

/* ==========================================

   MONITORAR LICENÇA

========================================== */

function iniciarMonitoramentoLicenca() {

    if (intervaloVerificacaoLicenca) {

        clearInterval(

            intervaloVerificacaoLicenca

        );

    }

    intervaloVerificacaoLicenca =

        setInterval(

            async function () {

                await verificarLicencaUsuarioAtual();

            },

            30000

        );

    /*

       Verificar quando a aba volta

       a ficar visível.

    */

    document.addEventListener(

        "visibilitychange",

        async function () {

            if (

                document.visibilityState ===

                "visible"

            ) {

                await verificarLicencaUsuarioAtual();

            }

        }

    );

    /*

       Verificar quando a janela

       recebe foco novamente.

    */

    window.addEventListener(

        "focus",

        async function () {

            await verificarLicencaUsuarioAtual();

        }

    );

}

/* ==========================================

   VERIFICAR ADMINISTRADOR

========================================== */

async function carregarAdministrador() {

    try {

        const resultado =

            await adminSupabase.auth.getUser();

        const usuario =

            resultado.data.user;

        /* ======================================

           NÃO ESTÁ LOGADO

        ====================================== */

        if (!usuario) {

            window.location.href =

                "index.html";

            return false;

        }

        /* ======================================

           BUSCAR PERFIL

        ====================================== */

        const perfilResultado =

            await adminSupabase

                .from("perfis")

                .select("*")

                .eq("id", usuario.id)

                .single();

        /* ======================================

           PERFIL NÃO ENCONTRADO

        ====================================== */

        if (

            perfilResultado.error ||

            !perfilResultado.data

        ) {

            await adminSupabase.auth.signOut({

                scope: "local"

            });

            sessionStorage.removeItem(

                "sistemaLojaPerfil"

            );

            window.location.href =

                "index.html";

            return false;

        }

        const perfil =

            perfilResultado.data;

        /* ======================================

           NÃO É ADMIN

        ====================================== */

        if (perfil.tipo !== "admin") {

            window.location.href =

                "vendedor.html";

            return false;

        }

        /* ======================================

           USUÁRIO DESATIVADO

        ====================================== */

        if (!perfil.ativo) {

            await adminSupabase.auth.signOut({

                scope: "local"

            });

            sessionStorage.removeItem(

                "sistemaLojaPerfil"

            );

            alert(

                "Seu usuário está desativado."

            );

            window.location.href =

                "index.html";

            return false;

        }

        /* ======================================

           VERIFICAR LICENÇA DA LOJA

        ====================================== */

        const licencaValida =

            await verificarLicencaLoja(

                perfil.loja_id,

                true

            );

        if (!licencaValida) {

            return false;

        }

        /* ======================================

           MOSTRAR NOME

        ====================================== */

        if (nomeAdministrador) {

            nomeAdministrador.textContent =

                perfil.nome_completo ||

                "Administrador";

        }

        /* ======================================

           MOSTRAR AVATAR

        ====================================== */

        if (avatarAdministrador) {

            const nome =

                perfil.nome_completo ||

                "Administrador";

            avatarAdministrador.textContent =

                nome

                    .charAt(0)

                    .toUpperCase();

        }

        /* ======================================

           SALVAR PERFIL

        ====================================== */

        sessionStorage.setItem(

            "sistemaLojaPerfil",

            JSON.stringify(perfil)

        );

        /* ======================================

           INICIAR MONITORAMENTO

        ====================================== */

        iniciarMonitoramentoLicenca();

        return true;

    }

    catch (erro) {

        console.error(

            "Erro ao carregar administrador:",

            erro

        );

        sessionStorage.removeItem(

            "sistemaLojaPerfil"

        );

        window.location.href =

            "index.html";

        return false;

    }

}

/* ==========================================

   INDICADORES DO DASHBOARD

========================================== */

function formatarMoedaDashboard(valor) {

    return Number(valor || 0).toLocaleString(

        "pt-BR",

        {

            style: "currency",

            currency: "BRL"

        }

    );

}

function obterInicioMesDashboard(data) {

    return new Date(

        data.getFullYear(),

        data.getMonth(),

        1

    );

}

function obterInicioProximoMesDashboard(data) {

    return new Date(

        data.getFullYear(),

        data.getMonth() + 1,

        1

    );

}

function obterInicioDiaSeguinteDashboard(data) {

    return new Date(

        data.getFullYear(),

        data.getMonth(),

        data.getDate() + 1

    );

}

/* ==========================================

   CRIAR CARTÕES DOS INDICADORES

========================================== */

function criarCartoesIndicadoresDashboard() {

    const cardsDashboard = document.querySelector(".cards-dashboard");

    if (!cardsDashboard) {
        console.warn("Área .cards-dashboard não encontrada. Indicadores não foram exibidos.");
        return false;
    }

    let secao = document.getElementById("indicadoresDashboard");

    if (!document.getElementById("estilosIndicadoresDashboard")) {
        const estilos = document.createElement("style");
        estilos.id = "estilosIndicadoresDashboard";
        estilos.textContent = `
            .indicadores-dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                gap: 16px;
                margin: 0 0 24px;
            }
            .dashboard-secao-cabecalho {
                grid-column: 1 / -1;
                margin: 0;
            }
            .dashboard-secao-cabecalho h3 {
                margin: 0;
                color: #0f172a;
                font-size: 20px;
                font-weight: 700;
            }
            .dashboard-secao-cabecalho p {
                margin: 6px 0 0;
                color: #64748b;
                font-size: 13px;
                line-height: 1.5;
            }
            .indicador-dashboard {
                min-width: 0;
                padding: 20px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
                transition: transform 160ms ease, box-shadow 160ms ease;
            }
            .indicador-dashboard:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
            }
            .indicador-dashboard-titulo {
                margin: 0 0 12px;
                color: #64748b;
                font-size: 13px;
                font-weight: 600;
            }
            .indicador-dashboard-valor {
                margin: 0;
                color: #0f172a;
                font-size: clamp(22px, 2.2vw, 29px);
                font-weight: 700;
                line-height: 1.25;
                overflow-wrap: anywhere;
                font-variant-numeric: tabular-nums;
            }
            .indicador-dashboard-descricao {
                margin: 8px 0 0;
                color: #64748b;
                font-size: 12px;
                line-height: 1.4;
            }
            .grafico-vendas-painel {
                box-sizing: border-box;
                width: 100%;
                margin: 0 0 26px;
                padding: 22px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
            }
            .grafico-vendas-cabecalho {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 18px;
                flex-wrap: wrap;
            }
            .grafico-vendas-titulo {
                margin: 0;
                color: #0f172a;
                font-size: 18px;
                font-weight: 700;
            }
            .grafico-vendas-subtitulo {
                margin: 6px 0 0;
                color: #64748b;
                font-size: 13px;
                line-height: 1.5;
            }
            .grafico-vendas-total {
                padding: 10px 14px;
                background: #eff6ff;
                border: 1px solid #dbeafe;
                border-radius: 12px;
                white-space: nowrap;
            }
            .grafico-vendas-total span {
                display: block;
                margin-bottom: 3px;
                color: #1d4ed8;
                font-size: 11px;
                font-weight: 600;
            }
            .grafico-vendas-total strong {
                color: #1e40af;
                font-size: 17px;
                font-weight: 700;
                font-variant-numeric: tabular-nums;
            }
            .grafico-vendas-colunas {
                display: grid;
                grid-template-columns: repeat(7, minmax(0, 1fr));
                align-items: end;
                gap: clamp(5px, 1.5vw, 16px);
                margin-top: 26px;
            }
            .grafico-vendas-coluna {
                display: flex;
                min-width: 0;
                flex-direction: column;
                align-items: center;
                gap: 7px;
                text-align: center;
            }
            .grafico-vendas-valor {
                max-width: 100%;
                color: #334155;
                font-size: 11px;
                font-weight: 700;
                line-height: 1.25;
                overflow-wrap: anywhere;
                font-variant-numeric: tabular-nums;
            }
            .grafico-vendas-barra-area {
                display: flex;
                width: 100%;
                height: 160px;
                align-items: flex-end;
                justify-content: center;
                overflow: hidden;
                border-bottom: 1px solid #cbd5e1;
                border-radius: 8px 8px 0 0;
                background: repeating-linear-gradient(
                    to top,
                    #f1f5f9 0,
                    #f1f5f9 1px,
                    transparent 1px,
                    transparent 40px
                );
            }
            .grafico-vendas-barra {
                width: min(58%, 44px);
                min-height: 3px;
                border-radius: 7px 7px 0 0;
                background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
                transition: height 200ms ease;
            }
            .grafico-vendas-dia {
                color: #334155;
                font-size: 12px;
                font-weight: 700;
                text-transform: capitalize;
            }
            .grafico-vendas-data {
                color: #64748b;
                font-size: 11px;
            }
            .grafico-vendas-quantidade {
                color: #64748b;
                font-size: 11px;
            }
            .grafico-vendas-mensagem {
                margin: 24px 0 4px;
                padding: 22px 14px;
                border: 1px dashed #cbd5e1;
                border-radius: 12px;
                color: #64748b;
                text-align: center;
                font-size: 14px;
            }
            @media (max-width: 760px) {
                .grafico-vendas-painel {
                    padding: 17px;
                }
                .grafico-vendas-barra-area {
                    height: 135px;
                }
                .grafico-vendas-valor {
                    font-size: 10px;
                }
            }
            @media (max-width: 520px) {
                .indicadores-dashboard {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }
                .indicador-dashboard {
                    padding: 14px;
                }
                .indicador-dashboard-valor {
                    font-size: 21px;
                }
                .grafico-vendas-painel {
                    padding: 14px 10px;
                }
                .grafico-vendas-titulo {
                    font-size: 16px;
                }
                .grafico-vendas-colunas {
                    gap: 4px;
                    margin-top: 20px;
                }
                .grafico-vendas-barra-area {
                    height: 115px;
                }
                .grafico-vendas-valor {
                    font-size: 9px;
                }
                .grafico-vendas-dia,
                .grafico-vendas-data {
                    font-size: 10px;
                }
                .grafico-vendas-quantidade {
                    display: none;
                }
                .grafico-vendas-total {
                    padding: 8px 10px;
                }
                .grafico-vendas-total strong {
                    font-size: 15px;
                }
            }
        `;
        document.head.appendChild(estilos);
    }

    if (!secao) {
        secao = document.createElement("section");
        secao.id = "indicadoresDashboard";
        secao.className = "indicadores-dashboard";
        secao.setAttribute("aria-label", "Resumo e indicadores da loja");

        const cabecalho = document.createElement("div");
        cabecalho.className = "dashboard-secao-cabecalho";
        cabecalho.innerHTML = `
            <h3>Resumo da loja</h3>
            <p>Indicadores das vendas finalizadas e da situação do estoque.</p>
        `;
        secao.appendChild(cabecalho);

        const indicadores = [
            {
                id: "indicadorVendasHoje",
                titulo: "Vendas de hoje",
                descricao: "Vendas finalizadas hoje",
                valor: "Carregando..."
            },
            {
                id: "indicadorFaturamentoHoje",
                titulo: "Faturamento de hoje",
                descricao: "Total das vendas finalizadas hoje",
                valor: "Carregando..."
            },
            {
                id: "indicadorVendasMes",
                titulo: "Vendas do mês",
                descricao: "Vendas finalizadas neste mês",
                valor: "Carregando..."
            },
            {
                id: "indicadorLucroMes",
                titulo: "Lucro bruto do mês",
                descricao: "Vendas líquidas menos custo dos itens vendidos",
                valor: "Carregando..."
            },
            {
                id: "indicadorLucroLiquidoMes",
                titulo: "Lucro líquido do mês",
                descricao: "Lucro bruto + outras entradas − despesas operacionais",
                valor: "Carregando..."
            },
            {
                id: "indicadorEstoqueBaixo",
                titulo: "Estoque baixo",
                descricao: "Produtos esgotados ou no mínimo",
                valor: "Carregando..."
            }
        ];

        indicadores.forEach(function (indicador) {
            const card = document.createElement("article");
            card.className = "indicador-dashboard";

            const titulo = document.createElement("p");
            titulo.className = "indicador-dashboard-titulo";
            titulo.textContent = indicador.titulo;

            const valor = document.createElement("p");
            valor.className = "indicador-dashboard-valor";
            valor.id = indicador.id;
            valor.textContent = indicador.valor;

            const descricao = document.createElement("p");
            descricao.className = "indicador-dashboard-descricao";
            descricao.textContent = indicador.descricao;

            card.append(titulo, valor, descricao);
            secao.appendChild(card);
        });

        cardsDashboard.parentNode.insertBefore(secao, cardsDashboard);
    }

    criarAreaGraficoVendasDashboard(secao, cardsDashboard);
    return true;
}

function criarAreaGraficoVendasDashboard(secaoIndicadores, cardsDashboard) {
    let painel = document.getElementById("painelGraficoVendasDashboard");

    if (!painel) {
        painel = document.createElement("section");
        painel.id = "painelGraficoVendasDashboard";
        painel.className = "grafico-vendas-painel";
        painel.setAttribute("aria-label", "Gráfico de vendas dos últimos sete dias");

        const cabecalho = document.createElement("div");
        cabecalho.className = "grafico-vendas-cabecalho";

        const textos = document.createElement("div");
        const titulo = document.createElement("h3");
        titulo.className = "grafico-vendas-titulo";
        titulo.textContent = "Vendas dos últimos 7 dias";

        const subtitulo = document.createElement("p");
        subtitulo.className = "grafico-vendas-subtitulo";
        subtitulo.textContent = "Faturamento diário das vendas finalizadas. Passe o cursor sobre uma barra para ver os detalhes.";
        textos.append(titulo, subtitulo);

        const resumo = document.createElement("div");
        resumo.className = "grafico-vendas-total";
        const resumoRotulo = document.createElement("span");
        resumoRotulo.textContent = "Faturamento no período";
        const resumoValor = document.createElement("strong");
        resumoValor.id = "totalGraficoVendasDashboard";
        resumoValor.textContent = "Carregando...";
        resumo.append(resumoRotulo, resumoValor);

        cabecalho.append(textos, resumo);
        painel.appendChild(cabecalho);

        const colunas = document.createElement("div");
        colunas.id = "graficoVendasColunasDashboard";
        colunas.className = "grafico-vendas-colunas";
        colunas.setAttribute("aria-live", "polite");
        painel.appendChild(colunas);

        const pai = secaoIndicadores?.parentNode || cardsDashboard.parentNode;
        pai.insertBefore(painel, cardsDashboard);
    }

    return painel;
}

function formatarValorCompactoDashboard(valor) {
    const numero = Number(valor) || 0;

    if (numero >= 1000000) {
        return (numero / 1000000).toLocaleString("pt-BR", {
            maximumFractionDigits: 1
        }) + " mi";
    }

    if (numero >= 1000) {
        return (numero / 1000).toLocaleString("pt-BR", {
            maximumFractionDigits: 1
        }) + " mil";
    }

    return Math.round(numero).toLocaleString("pt-BR");
}

async function carregarGraficoVendasDashboard() {
    const colunas = document.getElementById("graficoVendasColunasDashboard");
    const totalElement = document.getElementById("totalGraficoVendasDashboard");

    if (!colunas || !totalElement) {
        return;
    }

    try {
        const agora = new Date();
        const inicioHoje = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
        );
        const inicioPeriodo = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate() - 6
        );
        const inicioAmanha = obterInicioDiaSeguinteDashboard(agora);

        const resultado = await adminSupabase
            .from("vendas")
            .select("total, criado_em")
            .eq("status", "finalizada")
            .gte("criado_em", inicioPeriodo.toISOString())
            .lt("criado_em", inicioAmanha.toISOString())
            .order("criado_em", { ascending: true });

        if (resultado.error) {
            throw resultado.error;
        }

        const vendas = resultado.data || [];
        const dias = [];
        const chaveData = function (data) {
            return [
                data.getFullYear(),
                String(data.getMonth() + 1).padStart(2, "0"),
                String(data.getDate()).padStart(2, "0")
            ].join("-");
        };

        for (let deslocamento = -6; deslocamento <= 0; deslocamento++) {
            const data = new Date(
                agora.getFullYear(),
                agora.getMonth(),
                agora.getDate() + deslocamento
            );

            dias.push({
                data: data,
                chave: chaveData(data),
                quantidade: 0,
                faturamento: 0
            });
        }

        const diasPorChave = new Map(dias.map(function (dia) {
            return [dia.chave, dia];
        }));

        vendas.forEach(function (venda) {
            if (!venda.criado_em) {
                return;
            }

            const dataVenda = new Date(venda.criado_em);
            const dia = diasPorChave.get(chaveData(dataVenda));

            if (!dia) {
                return;
            }

            dia.quantidade += 1;
            dia.faturamento += Number(venda.total) || 0;
        });

        const faturamentoPeriodo = dias.reduce(function (soma, dia) {
            return soma + dia.faturamento;
        }, 0);
        const maxFaturamento = Math.max(
            0,
            ...dias.map(function (dia) { return dia.faturamento; })
        );

        totalElement.textContent = formatarMoedaDashboard(faturamentoPeriodo);
        colunas.replaceChildren();

        if (vendas.length === 0) {
            const mensagem = document.createElement("p");
            mensagem.className = "grafico-vendas-mensagem";
            mensagem.textContent = "Nenhuma venda finalizada nos últimos 7 dias.";
            colunas.appendChild(mensagem);
            return;
        }

        dias.forEach(function (dia) {
            const coluna = document.createElement("div");
            coluna.className = "grafico-vendas-coluna";

            const dataCompleta = dia.data.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
            const informacao = dataCompleta + ": " + dia.quantidade +
                (dia.quantidade === 1 ? " venda finalizada" : " vendas finalizadas") +
                ", faturamento " + formatarMoedaDashboard(dia.faturamento);
            coluna.setAttribute("role", "img");
            coluna.setAttribute("aria-label", informacao);
            coluna.title = informacao;

            const valor = document.createElement("span");
            valor.className = "grafico-vendas-valor";
            valor.textContent = formatarValorCompactoDashboard(dia.faturamento);
            valor.title = formatarMoedaDashboard(dia.faturamento);

            const areaBarra = document.createElement("div");
            areaBarra.className = "grafico-vendas-barra-area";

            const barra = document.createElement("div");
            barra.className = "grafico-vendas-barra";
            const altura = maxFaturamento > 0
                ? Math.max(3, (dia.faturamento / maxFaturamento) * 100)
                : 3;
            barra.style.height = altura + "%";
            barra.title = informacao;
            areaBarra.appendChild(barra);

            const diaSemana = document.createElement("span");
            diaSemana.className = "grafico-vendas-dia";
            diaSemana.textContent = dia.data.toLocaleDateString("pt-BR", {
                weekday: "short"
            }).replace(".", "");

            const diaMes = document.createElement("span");
            diaMes.className = "grafico-vendas-data";
            diaMes.textContent = dia.data.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit"
            });

            const quantidade = document.createElement("span");
            quantidade.className = "grafico-vendas-quantidade";
            quantidade.textContent = dia.quantidade +
                (dia.quantidade === 1 ? " venda" : " vendas");

            coluna.append(valor, areaBarra, diaSemana, diaMes, quantidade);
            colunas.appendChild(coluna);
        });
    } catch (erro) {
        console.error("Erro ao carregar o gráfico de vendas dos últimos 7 dias:", erro);
        totalElement.textContent = "Indisponível";
        colunas.replaceChildren();

        const mensagem = document.createElement("p");
        mensagem.className = "grafico-vendas-mensagem";
        mensagem.textContent = "Não foi possível carregar o gráfico. Atualize a página e tente novamente.";
        colunas.appendChild(mensagem);
    }
}

function definirValorIndicadorDashboard(

    id,

    valor

) {

    const elemento =

        document.getElementById(id);

    if (elemento) {

        elemento.textContent = valor;

    }

}

/* ==========================================

   CARREGAR INDICADORES DO DASHBOARD

========================================== */

async function carregarIndicadoresDashboard() {

    if (

        !criarCartoesIndicadoresDashboard()

    ) {

        return;

    }

    const agora =

        new Date();

    const inicioHoje =

        new Date(

            agora.getFullYear(),

            agora.getMonth(),

            agora.getDate()

        );

    const inicioAmanha =

        obterInicioDiaSeguinteDashboard(

            agora

        );

    const inicioMes =

        obterInicioMesDashboard(

            agora

        );

    const inicioProximoMes =

        obterInicioProximoMesDashboard(

            agora

        );

    const inicioMesISO =

        inicioMes.toISOString();

    const inicioProximoMesISO =

        inicioProximoMes.toISOString();

    try {

        const resultadoVendas =

            await adminSupabase

                .from("vendas")

                .select(

                    "id, total, criado_em"

                )

                .eq(

                    "status",

                    "finalizada"

                )

                .gte(

                    "criado_em",

                    inicioMesISO

                )

                .lt(

                    "criado_em",

                    inicioProximoMesISO

                );

        if (resultadoVendas.error) {

            throw resultadoVendas.error;

        }

        const vendasMes =

            resultadoVendas.data || [];

        const vendasHoje =

            vendasMes.filter(

                function (venda) {

                    if (!venda.criado_em) {

                        return false;

                    }

                    const dataVenda =

                        new Date(

                            venda.criado_em

                        );

                    return (

                        dataVenda >= inicioHoje &&

                        dataVenda < inicioAmanha

                    );

                }

            );

        const faturamentoHoje =

            vendasHoje.reduce(

                function (total, venda) {

                    return total +

                        (Number(venda.total) || 0);

                },

                0

            );

        const faturamentoMes =

            vendasMes.reduce(

                function (total, venda) {

                    return total +

                        (Number(venda.total) || 0);

                },

                0

            );

        definirValorIndicadorDashboard(

            "indicadorVendasHoje",

            String(vendasHoje.length)

        );

        definirValorIndicadorDashboard(

            "indicadorFaturamentoHoje",

            formatarMoedaDashboard(

                faturamentoHoje

            )

        );

        definirValorIndicadorDashboard(

            "indicadorVendasMes",

            String(vendasMes.length)

        );

        const idsVendasMes =

            vendasMes

                .map(

                    function (venda) {

                        return venda.id;

                    }

                )

                .filter(Boolean);

        let lucroBrutoMes = null;

        if (

            idsVendasMes.length === 0

        ) {

            lucroBrutoMes = 0;

            definirValorIndicadorDashboard(

                "indicadorLucroMes",

                formatarMoedaDashboard(0)

            );

        } else {

            const resultadoItens =

                await adminSupabase

                    .from("itens_venda")

                    .select(

                        "venda_id, quantidade, custo_unitario"

                    )

                    .in(

                        "venda_id",

                        idsVendasMes

                    );

            if (resultadoItens.error) {

                console.error(

                    "Erro ao carregar custos dos itens vendidos:",

                    resultadoItens.error

                );

                definirValorIndicadorDashboard(

                    "indicadorLucroMes",

                    "—"

                );

            } else {

                const custoMes =

                    (resultadoItens.data || []).reduce(

                        function (total, item) {

                            return total +

                                (Number(item.custo_unitario) || 0) *

                                (Number(item.quantidade) || 0);

                        },

                        0

                    );

                lucroBrutoMes = faturamentoMes - custoMes;

                definirValorIndicadorDashboard(

                    "indicadorLucroMes",

                    formatarMoedaDashboard(

                        lucroBrutoMes

                    )

                );

            }

        }

        if (lucroBrutoMes === null) {

            definirValorIndicadorDashboard(

                "indicadorLucroLiquidoMes",

                "—"

            );

        } else {

            try {

                const formatarDataFinanceira = function (data) {
                    return String(data.getFullYear()) + "-" +
                        String(data.getMonth() + 1).padStart(2, "0") + "-" +
                        String(data.getDate()).padStart(2, "0");
                };

                const inicioMesFinanceiro =
                    formatarDataFinanceira(inicioMes);

                const inicioProximoMesFinanceiro =
                    formatarDataFinanceira(inicioProximoMes);

                const resultadoFinanceiro =
                    await adminSupabase
                        .from("financeiro")
                        .select("tipo, categoria, valor, data_movimento")
                        .gte("data_movimento", inicioMesFinanceiro)
                        .lt("data_movimento", inicioProximoMesFinanceiro);

                if (resultadoFinanceiro.error) {
                    throw resultadoFinanceiro.error;
                }

                const categoriasDespesasOperacionais = new Set([
                    "despesa",
                    "salario",
                    "aluguel",
                    "impostos",
                    "frete",
                    "outros"
                ]);

                const lancamentosFinanceiros =
                    resultadoFinanceiro.data || [];

                const despesasOperacionaisMes =
                    lancamentosFinanceiros.reduce(
                        function (total, lancamento) {
                            if (lancamento.tipo !== "saida") {
                                return total;
                            }

                            const categoria = String(lancamento.categoria || "")
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .trim()
                                .toLowerCase();

                            if (!categoriasDespesasOperacionais.has(categoria)) {
                                return total;
                            }

                            return total + (Number(lancamento.valor) || 0);
                        },
                        0
                    );

                // Entradas financeiras que não são vendas já estão fora do lucro bruto.
                // Somá-las evita ignorar receitas extras, como serviços prestados.
                const outrasEntradasOperacionaisMes =
                    lancamentosFinanceiros.reduce(
                        function (total, lancamento) {
                            if (lancamento.tipo !== "entrada") {
                                return total;
                            }

                            const categoria = String(lancamento.categoria || "")
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .trim()
                                .toLowerCase();

                            if (categoria === "venda") {
                                return total;
                            }

                            return total + (Number(lancamento.valor) || 0);
                        },
                        0
                    );

                const lucroLiquidoMes =
                    lucroBrutoMes +
                    outrasEntradasOperacionaisMes -
                    despesasOperacionaisMes;

                definirValorIndicadorDashboard(
                    "indicadorLucroLiquidoMes",
                    formatarMoedaDashboard(
                        lucroLiquidoMes
                    )
                );

            } catch (erroFinanceiro) {

                console.error(
                    "Erro ao calcular lucro líquido do mês:",
                    erroFinanceiro
                );

                definirValorIndicadorDashboard(
                    "indicadorLucroLiquidoMes",
                    "—"
                );

            }

        }

    }

    catch (erro) {

        console.error(

            "Erro ao carregar indicadores de vendas:",

            erro

        );

        definirValorIndicadorDashboard(

            "indicadorVendasHoje",

            "—"

        );

        definirValorIndicadorDashboard(

            "indicadorFaturamentoHoje",

            "—"

        );

        definirValorIndicadorDashboard(

            "indicadorVendasMes",

            "—"

        );

        definirValorIndicadorDashboard(

            "indicadorLucroMes",

            "—"

        );

        definirValorIndicadorDashboard(

            "indicadorLucroLiquidoMes",

            "—"

        );

    }

    await carregarGraficoVendasDashboard();

    try {

        const resultadoProdutos =

            await adminSupabase

                .from("produtos")

                .select(

                    "estoque, estoque_minimo, ativo"

                )

                .eq(

                    "ativo",

                    true

                );

        if (resultadoProdutos.error) {

            throw resultadoProdutos.error;

        }

        const quantidadeEstoqueBaixo =

            (resultadoProdutos.data || []).filter(

                function (produto) {

                    const estoque =

                        Number(produto.estoque) || 0;

                    const estoqueMinimo =

                        Number(produto.estoque_minimo) || 0;

                    return (

                        estoque <= 0 ||

                        estoque <= estoqueMinimo

                    );

                }

            ).length;

        definirValorIndicadorDashboard(

            "indicadorEstoqueBaixo",

            String(quantidadeEstoqueBaixo)

        );

    }

    catch (erro) {

        console.error(

            "Erro ao carregar indicador de estoque baixo:",

            erro

        );

        definirValorIndicadorDashboard(

            "indicadorEstoqueBaixo",

            "—"

        );

    }

}

/* ==========================================

   DATA ATUAL

========================================== */

function mostrarDataAtual() {

    if (!dataAtual) {

        return;

    }

    const agora =

        new Date();

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

   SAIR DO SISTEMA

========================================== */

async function sair() {

    try {

        console.log(

            "Saindo do sistema..."

        );

        if (intervaloVerificacaoLicenca) {

            clearInterval(

                intervaloVerificacaoLicenca

            );

            intervaloVerificacaoLicenca =

                null;

        }

        const resultado =

            await adminSupabase.auth.signOut({

                scope: "local"

            });

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

        /* ======================================

           LIMPAR PERFIL

        ====================================== */

        sessionStorage.removeItem(

            "sistemaLojaPerfil"

        );

        /* ======================================

           VOLTAR PARA LOGIN

        ====================================== */

        window.location.href =

            "index.html";

    }

    catch (erro) {

        console.error(

            "Erro ao sair:",

            erro

        );

        /* ======================================

           MESMO COM ERRO,

           LIMPAR SESSÃO LOCAL

        ====================================== */

        sessionStorage.removeItem(

            "sistemaLojaPerfil"

        );

        window.location.href =

            "index.html";

    }

}

/* ==========================================

   ÁREAS FUTURAS

========================================== */

function configurarMenuFuturo() {

    const itens =

        document.querySelectorAll(

            "[data-futuro]"

        );

    itens.forEach(function (item) {

        item.addEventListener(

            "click",

            function (event) {

                event.preventDefault();

                const nome =

                    item.getAttribute(

                        "data-futuro"

                    );

                alert(

                    'A área "' +

                    nome +

                    '" será desenvolvida nesta etapa.'

                );

            }

        );

    });

}

/* ==========================================

   CONFIGURAR BOTÃO SAIR

========================================== */

function configurarBotaoSair() {

    const botaoSair =

        document.getElementById(

            "btnSair"

        );

    if (!botaoSair) {

        console.error(

            "Botão btnSair não encontrado."

        );

        return;

    }

    botaoSair.addEventListener(

        "click",

        sair

    );

    console.log(

        "Botão Sair configurado."

    );

}

/* ==========================================

   INICIALIZAÇÃO

========================================== */

async function iniciarAdmin() {

    mostrarDataAtual();

    configurarBotaoSair();

    const administradorValido =

        await carregarAdministrador();

    if (!administradorValido) {

        return;

    }

    await carregarIndicadoresDashboard();

    configurarMenuFuturo();

}

/* ==========================================

   INICIAR PÁGINA

========================================== */

if (

    document.readyState === "loading"

) {

    document.addEventListener(

        "DOMContentLoaded",

        iniciarAdmin

    );

} else {

    iniciarAdmin();

}