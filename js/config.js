/* ==========================================
   SISTEMA DA LOJA
   CONFIGURAÇÃO SUPABASE
========================================== */

const SUPABASE_URL =
    "https://nzlocfpzhytddornause.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_M84hLcVlzdwkC7MLW7semg_iqFduNeu";


/* ==========================================
   CRIAR CONEXÃO COM SUPABASE
========================================== */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* ==========================================
   MENU GLOBAL — NOTINHAS / FIADO
========================================== */

async function adicionarMenuNotinhasGlobal() {

    const menus = Array.from(
        document.querySelectorAll(
            "nav.menu, nav.menu-vendedor, nav.sidebar-nav"
        )
    );

    if (menus.length === 0) {
        return;
    }


    try {
        const {
            data: { user },
            error: erroUsuario
        } = await supabaseClient.auth.getUser();

        if (erroUsuario || !user) {
            return;
        }

        const {
            data: perfil,
            error: erroPerfil
        } = await supabaseClient
            .from("perfis")
            .select("tipo, ativo")
            .eq("id", user.id)
            .maybeSingle();

        if (erroPerfil || !perfil || perfil.ativo !== true) {
            menus.forEach((menu) => {
                menu.querySelectorAll("a[href]").forEach((link) => {
                    if (normalizarDestinoMenu(link.getAttribute("href")).endsWith("notinhas.html")) {
                        link.remove();
                    }
                });
            });
            return;
        }

        const podeVerNotinhas = ["admin", "vendedor"].includes(perfil.tipo);

        if (!podeVerNotinhas) {
            menus.forEach((menu) => {
                menu.querySelectorAll("a[href]").forEach((link) => {
                    if (normalizarDestinoMenu(link.getAttribute("href")).endsWith("notinhas.html")) {
                        link.remove();
                    }
                });
            });
            return;
        }

        menus.forEach((menu) => {
            const linksExistentes = Array.from(menu.querySelectorAll("a[href]")).filter((link) =>
                normalizarDestinoMenu(link.getAttribute("href")).endsWith("notinhas.html")
            );

            // Remove duplicatas do mesmo grupo, mas preserva os links separados por perfil
// A pagina Notinhas contem um menu para cada perfil.
            const linksPorPerfil = new Map();
            linksExistentes.forEach((link) => {
                const perfilLink = String(link.getAttribute("data-role") || "").trim().toLowerCase() || "__sem_perfil__";
                if (linksPorPerfil.has(perfilLink)) {
                    link.remove();
                } else {
                    linksPorPerfil.set(perfilLink, link);
                }
            });

            const linkAdmin = linksPorPerfil.get("admin");
            const linkVendedor = linksPorPerfil.get("vendedor");
// Estes dois links sao intencionais: notinhas.js exibe o perfil correspondente.
            if (linkAdmin && linkVendedor) {
                return;
            }

            let linkNotinhas =
                linksPorPerfil.get(String(perfil.tipo || "").toLowerCase()) ||
                linksPorPerfil.get("__sem_perfil__") ||
                linksPorPerfil.values().next().value;

            if (!linkNotinhas) {
                linkNotinhas = document.createElement("a");
                linkNotinhas.href = "notinhas.html";

                if (menu.matches("nav.menu, nav.menu-vendedor")) {
                    linkNotinhas.className = "item-menu";
                    linkNotinhas.innerHTML = `
                        <span class="icone-menu" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                                <path d="M5 4h14v16H5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                                <path d="M8 9h8M8 13h8M8 17h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            </svg>
                        </span>
                        <span>Notinhas / Fiado</span>
                    `;
                } else {
                    linkNotinhas.className = "notinhas-menu-link";
                    linkNotinhas.textContent = "Notinhas / Fiado";
                    linkNotinhas.style.display = "block";
                    linkNotinhas.style.padding = "10px 12px";
                    linkNotinhas.style.color = "inherit";
                    linkNotinhas.style.textDecoration = "none";
                }
            }

            const linkFinanceiro = Array.from(menu.querySelectorAll("a[href]")).find((link) => {
                if (link === linkNotinhas) {
                    return false;
                }
                return normalizarDestinoMenu(link.getAttribute("href")).endsWith("financeiro.html");
            });

            if (linkFinanceiro) {
                if (linkFinanceiro.nextElementSibling !== linkNotinhas) {
                    linkFinanceiro.insertAdjacentElement("afterend", linkNotinhas);
                }
            } else if (!linkNotinhas.isConnected) {
                menu.appendChild(linkNotinhas);
            }
        });
    } catch (erro) {
        console.error("Erro ao organizar o menu Notinhas / Fiado:", erro);
    }
}

/* ==========================================
   NORMALIZAR DESTINO DOS LINKS
========================================== */

function normalizarDestinoMenu(destino) {

    return String(destino || "")
        .split(/[?#]/)[0]
        .replace(/\\/g, "/")
        .replace(/^\.\//, "")
        .toLowerCase();

}


/* ==========================================
   INICIALIZAR MENU
========================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        adicionarMenuNotinhasGlobal,
        { once: true }
    );

} else {

    adicionarMenuNotinhasGlobal();

}
/* ==========================================
   MENU — CONFIGURAÇÕES DE DESCONTO
   Visível somente para administradores de loja.
========================================== */
async function adicionarMenuConfiguracoesDescontosGlobal() {
    const menus = Array.from(document.querySelectorAll("nav.menu"));
    if (menus.length === 0) return;

    try {
        const { data: { user }, error: erroUsuario } = await supabaseClient.auth.getUser();
        let podeConfigurar = false;

        if (!erroUsuario && user) {
            const { data: perfil, error: erroPerfil } = await supabaseClient
                .from("perfis")
                .select("tipo, ativo")
                .eq("id", user.id)
                .maybeSingle();
            podeConfigurar = !erroPerfil && perfil?.tipo === "admin" && perfil.ativo === true;
        }

        menus.forEach((menu) => {
            let link = Array.from(menu.querySelectorAll("a[href]")).find((item) =>
                normalizarDestinoMenu(item.getAttribute("href")).endsWith("configuracoes-descontos.html")
            );

            if (!podeConfigurar) {
                if (link) link.remove();
                return;
            }

            if (!link) {
                link = document.createElement("a");
                link.href = "configuracoes-descontos.html";
                link.className = "item-menu";
                link.innerHTML = `
                    <span class="icone-menu" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="none" stroke="currentColor" stroke-width="2"/>
                            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.9.2l-.2.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.7-1l-.2.1-2.9-1.7.1-.2a1.7 1.7 0 0 0-.2-1.9l-.1-.2v-3.4l.2-.1a1.7 1.7 0 0 0 1-1.7l-.1-.2 1.7-2.9.2.1a1.7 1.7 0 0 0 1.9-.2l.2-.1h3.4l.1.2a1.7 1.7 0 0 0 1.7 1l.2-.1 2.9 1.7-.1.2a1.7 1.7 0 0 0 .2 1.9l.1.2v3.4Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" transform="translate(-1 -1) scale(.94)"/>
                        </svg>
                    </span>
                    <span>Configurações de desconto</span>
                `;
            }

            const paginaAtual = String(window.location.pathname.split("/").pop() || "")
                .split(/[?#]/)[0].toLowerCase();
            link.classList.toggle("ativo", paginaAtual === "configuracoes-descontos.html");

            const linkVendas = Array.from(menu.querySelectorAll("a[href]")).find((item) =>
                normalizarDestinoMenu(item.getAttribute("href")) === "vendas.html"
            );
            if (linkVendas && linkVendas.nextElementSibling !== link) {
                linkVendas.insertAdjacentElement("afterend", link);
            } else if (!link.isConnected) {
                menu.appendChild(link);
            }
        });
    } catch (erro) {
        console.error("Erro ao organizar o menu de configurações de desconto:", erro);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", adicionarMenuConfiguracoesDescontosGlobal, { once: true });
} else {
    adicionarMenuConfiguracoesDescontosGlobal();
}
