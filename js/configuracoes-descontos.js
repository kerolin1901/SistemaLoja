/* ==========================================
   CONFIGURAÇÕES DE DESCONTO POR LOJA
========================================== */
const configuracoesDescontosSupabase = supabaseClient;
const formConfiguracoesDescontos = document.getElementById("formConfiguracoesDescontos");
const descontoMaximoAtivoInput = document.getElementById("descontoMaximoAtivo");
const descontoAvistaAtivoInput = document.getElementById("descontoAvistaAtivo");
const percentualDescontoAvistaInput = document.getElementById("percentualDescontoAvista");
const btnSalvarConfiguracoesDescontos = document.getElementById("btnSalvarConfiguracoesDescontos");
const mensagemConfiguracoesDescontos = document.getElementById("mensagemConfiguracoesDescontos");
let perfilAdministradorDescontos = null;
let usuarioAdministradorDescontos = null;

function mostrarMensagemConfiguracoesDescontos(texto, tipo = "info") {
    if (!mensagemConfiguracoesDescontos) return;
    mensagemConfiguracoesDescontos.textContent = texto;
    mensagemConfiguracoesDescontos.className = `mensagem-config-descontos ${tipo}`;
    mensagemConfiguracoesDescontos.hidden = false;
}

function bloquearFormularioConfiguracoesDescontos(bloquear) {
    [descontoMaximoAtivoInput, descontoAvistaAtivoInput, percentualDescontoAvistaInput]
        .forEach((campo) => {
            if (campo) campo.disabled = bloquear;
        });
    if (btnSalvarConfiguracoesDescontos) {
        btnSalvarConfiguracoesDescontos.disabled = bloquear;
    }
}

async function protegerPaginaConfiguracoesDescontos() {
    const { data: { user }, error: erroUsuario } = await configuracoesDescontosSupabase.auth.getUser();
    if (erroUsuario || !user) {
        window.location.href = "index.html";
        return false;
    }

    const { data: perfil, error: erroPerfil } = await configuracoesDescontosSupabase
        .from("perfis")
        .select("id, nome_completo, usuario, tipo, ativo, loja_id")
        .eq("id", user.id)
        .maybeSingle();

    if (erroPerfil || !perfil || perfil.ativo !== true) {
        mostrarMensagemConfiguracoesDescontos(
            "Não foi possível validar o usuário. Entre novamente no sistema.",
            "erro"
        );
        window.setTimeout(() => { window.location.href = "index.html"; }, 1400);
        return false;
    }

    if (perfil.tipo !== "admin") {
        window.location.href = perfil.tipo === "vendedor" ? "vendedor.html" : "admin-geral.html";
        return false;
    }
    if (!perfil.loja_id) {
        mostrarMensagemConfiguracoesDescontos(
            "Este administrador não está associado a uma loja. Peça ao administrador geral para conferir o cadastro.",
            "erro"
        );
        return false;
    }

    perfilAdministradorDescontos = perfil;
    usuarioAdministradorDescontos = user;
    const nome = perfil.nome_completo || perfil.usuario || "Administrador";
    document.getElementById("nomeAdministrador").textContent = nome;
    document.getElementById("avatarAdministrador").textContent = nome.trim().charAt(0).toUpperCase();
    return true;
}

async function carregarConfiguracoesDescontos() {
    const { data, error } = await configuracoesDescontosSupabase
        .from("configuracoes_descontos")
        .select("desconto_maximo_ativo, desconto_avista_ativo, desconto_avista_percentual")
        .eq("loja_id", perfilAdministradorDescontos.loja_id)
        .maybeSingle();

    if (error) {
        console.error("Erro ao carregar configurações de desconto:", error);
        bloquearFormularioConfiguracoesDescontos(true);
        mostrarMensagemConfiguracoesDescontos(
            "A tabela de configurações ainda não está disponível ou você não tem permissão para acessá-la. Execute o arquivo SQL incluído no pacote no SQL Editor do Supabase e recarregue esta página.",
            "erro"
        );
        return false;
    }

    // Lojas que ainda não salvaram suas preferências mantêm a regra atual: ambos ligados e 8%.
    const config = data || {
        desconto_maximo_ativo: true,
        desconto_avista_ativo: true,
        desconto_avista_percentual: 8
    };
    descontoMaximoAtivoInput.checked = config.desconto_maximo_ativo !== false;
    descontoAvistaAtivoInput.checked = config.desconto_avista_ativo !== false;
    percentualDescontoAvistaInput.value = String(Number(config.desconto_avista_percentual ?? 8));
    bloquearFormularioConfiguracoesDescontos(false);
    mostrarMensagemConfiguracoesDescontos(
        data ? "Configurações da loja carregadas." : "Esta loja ainda não salvou preferências. O padrão atual é 8%, com as duas funções ativadas.",
        "info"
    );
    return true;
}

async function salvarConfiguracoesDescontos(event) {
    event.preventDefault();
    if (!perfilAdministradorDescontos || !usuarioAdministradorDescontos) return;

    const percentual = Number(percentualDescontoAvistaInput.value);
    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 99.99) {
        mostrarMensagemConfiguracoesDescontos("Informe um percentual entre 0 e 99,99.", "erro");
        percentualDescontoAvistaInput.focus();
        return;
    }
    if (descontoAvistaAtivoInput.checked && percentual <= 0) {
        mostrarMensagemConfiguracoesDescontos("Para manter o desconto à vista ativado, informe um percentual maior que zero. Para desativar, desligue a opção acima.", "erro");
        percentualDescontoAvistaInput.focus();
        return;
    }

    bloquearFormularioConfiguracoesDescontos(true);
    btnSalvarConfiguracoesDescontos.textContent = "Salvando...";

    const valores = {
        loja_id: perfilAdministradorDescontos.loja_id,
        desconto_maximo_ativo: descontoMaximoAtivoInput.checked,
        desconto_avista_ativo: descontoAvistaAtivoInput.checked,
        desconto_avista_percentual: Math.round(percentual * 100) / 100,
        updated_at: new Date().toISOString()
    };

    const { error } = await configuracoesDescontosSupabase
        .from("configuracoes_descontos")
        .upsert(valores, { onConflict: "loja_id" });

    btnSalvarConfiguracoesDescontos.textContent = "Salvar configurações";
    bloquearFormularioConfiguracoesDescontos(false);

    if (error) {
        console.error("Erro ao salvar configurações de desconto:", error);
        mostrarMensagemConfiguracoesDescontos(
            "Não foi possível salvar. Confira se o SQL foi executado e se as políticas RLS estão instaladas corretamente.",
            "erro"
        );
        return;
    }

    mostrarMensagemConfiguracoesDescontos(
        `Configurações salvas! Desconto máximo: ${valores.desconto_maximo_ativo ? "ativado" : "desativado"}; desconto à vista: ${valores.desconto_avista_ativo ? "ativado em " + valores.desconto_avista_percentual.toLocaleString("pt-BR") + "%" : "desativado"}. As telas de vendas usarão essas regras ao serem atualizadas.`,
        "sucesso"
    );
}

if (formConfiguracoesDescontos) {
    formConfiguracoesDescontos.addEventListener("submit", salvarConfiguracoesDescontos);
}

const btnSairConfigDescontos = document.getElementById("btnSair");
if (btnSairConfigDescontos) {
    btnSairConfigDescontos.addEventListener("click", async () => {
        btnSairConfigDescontos.disabled = true;
        await configuracoesDescontosSupabase.auth.signOut({ scope: "local" });
        sessionStorage.removeItem("sistemaLojaPerfil");
        window.location.href = "index.html";
    });
}

async function iniciarConfiguracoesDescontos() {
    bloquearFormularioConfiguracoesDescontos(true);
    const autorizado = await protegerPaginaConfiguracoesDescontos();
    if (!autorizado) return;
    await carregarConfiguracoesDescontos();
}

iniciarConfiguracoesDescontos();
