/* ==========================================
   SISTEMA DA LOJA
   ÁREA DO VENDEDOR
   VENDEDOR.JS
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const vendedorSupabase =
    supabaseClient;


/* ==========================================
   ELEMENTOS
========================================== */

const nomeVendedor =
    document.getElementById(
        "nomeVendedor"
    );

const avatarVendedor =
    document.getElementById(
        "avatarVendedor"
    );

const tituloBoasVindas =
    document.getElementById(
        "nomeVendedorBoasVindas"
    );

const dataAtual =
    document.getElementById(
        "dataAtual"
    );

const btnSair =
    document.getElementById(
        "btnSair"
    );

const nomeLojaVendedor =
    document.getElementById(
        "nomeLojaVendedor"
    );


/* ==========================================
   CONTROLE DA LICENÇA
========================================== */

let verificacaoLicencaEmAndamento =
    false;

let intervaloVerificacaoLicenca =
    null;


/* ==========================================
   CONVERTER DATA DA LICENÇA
   SEM CONSIDERAR HORÁRIO
========================================== */

function converterDataLicenca(
    data
) {

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

    const conteudoVendedor =
        document.querySelector(
            ".conteudo-vendedor"
        );


    if (!conteudoVendedor) {

        return;
    }


    let aviso =
        document.getElementById(
            "avisoLicencaVendedor"
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
            "avisoLicencaVendedor";


        /*
           Estilo do aviso.
           O layout existente não é alterado.
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
           Colocar antes do cabeçalho
           do dashboard.
        */

        const cabecalho =
            conteudoVendedor.querySelector(
                ".cabecalho-vendedor"
            );


        if (cabecalho) {

            conteudoVendedor.insertBefore(
                aviso,
                cabecalho
            );

        }
        else {

            conteudoVendedor.prepend(
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
            "Atenção: a licença da sua loja vence hoje. Entre em contato com o administrador para renovar o acesso.";

    }
    else if (
        diasRestantes === 1
    ) {

        mensagem =
            "Atenção: a licença da sua loja vence em 1 dia. Entre em contato com o administrador para renovar o acesso.";

    }
    else {

        mensagem =
            "Atenção: a licença da sua loja vence em " +
            diasRestantes +
            " dias. Entre em contato com o administrador para renovar o acesso.";

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
   MOSTRAR DATA ATUAL
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
   MOSTRAR NOME DA LOJA
========================================== */

async function mostrarNomeLoja(
    perfil
) {

    if (!nomeLojaVendedor) {

        return;
    }


    nomeLojaVendedor.textContent =
        "Carregando...";


    if (
        !perfil ||
        !perfil.loja_id
    ) {

        nomeLojaVendedor.textContent =
            "Sistema da Loja";

        return;
    }


    try {

        const resultadoLoja =
            await vendedorSupabase
                .from("lojas")
                .select("nome")
                .eq(
                    "id",
                    perfil.loja_id
                )
                .maybeSingle();


        if (
            resultadoLoja.error ||
            !resultadoLoja.data
        ) {

            nomeLojaVendedor.textContent =
                "Sistema da Loja";

            return;
        }


        nomeLojaVendedor.textContent =
            resultadoLoja.data.nome ||
            "Sistema da Loja";

    }

    catch (erro) {

        console.error(
            "Erro ao carregar nome da loja:",
            erro
        );

        nomeLojaVendedor.textContent =
            "Sistema da Loja";
    }
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
            "Vendedor não possui loja_id."
        );

        return false;
    }


    if (
        verificacaoLicencaEmAndamento
    ) {

        return true;
    }


    verificacaoLicencaEmAndamento =
        true;


    try {

        const resultadoLoja =
            await vendedorSupabase
                .from("lojas")
                .select(
                    "id, nome, ativo, data_vencimento"
                )
                .eq(
                    "id",
                    lojaId
                )
                .maybeSingle();


        /* ======================================
           ERRO AO CONSULTAR A LOJA
        ====================================== */

        if (
            resultadoLoja.error
        ) {

            console.error(
                "Erro ao verificar licença da loja:",
                resultadoLoja.error
            );

            /*
               Em caso de erro momentâneo,
               não derrubar a sessão.
            */

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

        if (
            loja.ativo !== true
        ) {

            await encerrarSessaoPorLicenca(
                "Esta loja está desativada. Procure o administrador."
            );

            return false;
        }


        /* ======================================
           SEM DATA DE VENCIMENTO
        ====================================== */

        if (
            !loja.data_vencimento
        ) {

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

        await vendedorSupabase.auth.signOut({
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

        alert(
            mensagem
        );
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
            await vendedorSupabase.auth.getSession();


        const session =
            resultadoSessao.data.session;


        if (!session) {

            return false;
        }


        let perfil = null;


        /* ======================================
           PEGAR PERFIL DA SESSÃO
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
                await vendedorSupabase
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
           SOMENTE VENDEDOR
        ====================================== */

        if (
            perfil.tipo !== "vendedor"
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

    if (
        intervaloVerificacaoLicenca
    ) {

        clearInterval(
            intervaloVerificacaoLicenca
        );
    }


    /*
       Verifica a licença a cada 30 segundos.
    */

    intervaloVerificacaoLicenca =
        setInterval(
            async function () {

                await verificarLicencaUsuarioAtual();

            },
            30000
        );


    /*
       Verificar quando a aba
       volta a ficar visível.
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
   PROTEGER VENDEDOR
========================================== */

async function protegerVendedor() {

    try {

        const resultadoSessao =
            await vendedorSupabase.auth.getSession();


        const session =
            resultadoSessao.data.session;


        /* ======================================
           NÃO ESTÁ LOGADO
        ====================================== */

        if (!session) {

            window.location.href =
                "index.html";

            return false;
        }


        /* ======================================
           BUSCAR PERFIL
        ====================================== */

        const resultadoPerfil =
            await vendedorSupabase
                .from("perfis")
                .select(
                    "id, nome_completo, usuario, tipo, ativo, loja_id"
                )
                .eq(
                    "id",
                    session.user.id
                )
                .maybeSingle();


        /* ======================================
           PERFIL NÃO ENCONTRADO
        ====================================== */

        if (
            resultadoPerfil.error ||
            !resultadoPerfil.data
        ) {

            await vendedorSupabase.auth.signOut({
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
            resultadoPerfil.data;


        /* ======================================
           NÃO É VENDEDOR
        ====================================== */

        if (
            perfil.tipo !== "vendedor"
        ) {

            if (
                perfil.tipo === "admin"
            ) {

                window.location.href =
                    "admin.html";

                return false;
            }


            await vendedorSupabase.auth.signOut({
                scope: "local"
            });

            sessionStorage.removeItem(
                "sistemaLojaPerfil"
            );

            window.location.href =
                "index.html";

            return false;
        }


        /* ======================================
           USUÁRIO DESATIVADO
        ====================================== */

        if (
            perfil.ativo !== true
        ) {

            await vendedorSupabase.auth.signOut({
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

        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "Vendedor";


        if (nomeVendedor) {

            nomeVendedor.textContent =
                nome;
        }


        /* ======================================
           MOSTRAR AVATAR
        ====================================== */

        if (avatarVendedor) {

            avatarVendedor.textContent =
                nome
                    .charAt(0)
                    .toUpperCase();
        }


        /* ======================================
           NOME NA BOAS-VINDAS
        ====================================== */

        if (tituloBoasVindas) {

            tituloBoasVindas.textContent =
                nome + "!";
        }


        /* ======================================
           DATA
        ====================================== */

        mostrarDataAtual();


        /* ======================================
           MOSTRAR LOJA
        ====================================== */

        await mostrarNomeLoja(
            perfil
        );


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
            "Erro ao proteger vendedor:",
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
   SAIR
========================================== */

async function sair() {

    try {

        console.log(
            "Saindo do sistema..."
        );


        if (
            intervaloVerificacaoLicenca
        ) {

            clearInterval(
                intervaloVerificacaoLicenca
            );

            intervaloVerificacaoLicenca =
                null;
        }


        const resultado =
            await vendedorSupabase.auth.signOut({
                scope: "local"
            });


        if (
            resultado.error
        ) {

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

    catch (erro) {

        console.error(
            "Erro ao sair:",
            erro
        );


        sessionStorage.removeItem(
            "sistemaLojaPerfil"
        );


        window.location.href =
            "index.html";
    }
}


/* ==========================================
   CONFIGURAR BOTÃO SAIR
========================================== */

function configurarBotaoSair() {

    if (!btnSair) {

        console.error(
            "Botão btnSair não encontrado."
        );

        return;
    }


    btnSair.addEventListener(
        "click",
        sair
    );


    console.log(
        "Botão Sair do vendedor configurado."
    );
}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

async function iniciarVendedor() {

    configurarBotaoSair();


    const autorizado =
        await protegerVendedor();


    if (!autorizado) {

        return;
    }
}


/* ==========================================
   INICIAR PÁGINA
========================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarVendedor
    );

}
else {

    iniciarVendedor();

}