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

    const cardsDashboard =
        document.querySelector(
            ".cards-dashboard"
        );

    if (!cardsDashboard) {

        console.warn(
            "Área .cards-dashboard não encontrada. Indicadores não foram exibidos."
        );

        return false;

    }

    if (
        document.getElementById(
            "indicadoresDashboard"
        )
    ) {

        return true;

    }

    const estilos =
        document.createElement("style");

    estilos.id =
        "estilosIndicadoresDashboard";

    estilos.textContent = `
        .indicadores-dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 16px;
            margin: 0 0 24px;
        }

        .indicador-dashboard {
            min-width: 0;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
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
        }

        .indicador-dashboard-descricao {
            margin: 8px 0 0;
            color: #64748b;
            font-size: 12px;
            line-height: 1.4;
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
        }
    `;

    document.head.appendChild(estilos);

    const secao =
        document.createElement("section");

    secao.id =
        "indicadoresDashboard";

    secao.className =
        "indicadores-dashboard";

    secao.setAttribute(
        "aria-label",
        "Indicadores da loja"
    );

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
            descricao: "Faturamento menos custo dos itens vendidos",
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

        const card =
            document.createElement("article");

        card.className =
            "indicador-dashboard";

        card.innerHTML = `
            <p class="indicador-dashboard-titulo">${indicador.titulo}</p>
            <p class="indicador-dashboard-valor" id="${indicador.id}">${indicador.valor}</p>
            <p class="indicador-dashboard-descricao">${indicador.descricao}</p>
        `;

        secao.appendChild(card);

    });

    cardsDashboard.parentNode.insertBefore(
        secao,
        cardsDashboard
    );

    return true;

}


/* ==========================================
   ATUALIZAR VALOR DE UM INDICADOR
========================================== */

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

        if (
            idsVendasMes.length === 0
        ) {

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

                definirValorIndicadorDashboard(
                    "indicadorLucroMes",
                    formatarMoedaDashboard(
                        faturamentoMes - custoMes
                    )
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

    }

    try {

        const resultadoProdutos =
            await adminSupabase
                .from("produtos")
                .select(
                    "estoque, estoque_minimo"
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