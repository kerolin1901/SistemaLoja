/* ==========================================================
   SISTEMA DA LOJA — NAVEGAÇÃO MOBILE
   Cria uma barra superior e transforma o menu lateral em
   gaveta recolhível em telas pequenas. Não altera operações.
========================================================== */

(function () {
    "use strict";

    function iniciarNavegacaoMobile() {
        const menu = document.querySelector(
            ".menu-lateral, .menu-lateral-vendedor, .menu-geral"
        );

        if (!menu || document.querySelector(".mobile-appbar")) {
            return;
        }

        const body = document.body;
        const menuId = menu.id || "menuNavegacaoMobile";
        menu.id = menuId;

        const tituloPagina = document.querySelector(
            ".cabecalho-admin h1, .cabecalho-admin h2, .cabecalho-vendedor h1, .cabecalho-geral h1, .conteudo-geral h1, main h1"
        );
        const subtitulo = tituloPagina && tituloPagina.textContent.trim()
            ? tituloPagina.textContent.trim()
            : "Navegação";

        const barra = document.createElement("header");
        barra.className = "mobile-appbar";
        barra.setAttribute("aria-label", "Barra de navegação mobile");

        const botaoAbrir = document.createElement("button");
        botaoAbrir.type = "button";
        botaoAbrir.className = "mobile-menu-toggle";
        botaoAbrir.setAttribute("aria-label", "Abrir menu");
        botaoAbrir.setAttribute("aria-controls", menuId);
        botaoAbrir.setAttribute("aria-expanded", "false");
        botaoAbrir.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>';

        const identidade = document.createElement("div");
        identidade.className = "mobile-appbar-identidade";

        const marca = document.createElement("strong");
        marca.textContent = "Sistema da Loja";

        const pagina = document.createElement("span");
        pagina.textContent = subtitulo;

        identidade.append(marca, pagina);
        barra.append(botaoAbrir, identidade);
        body.insertBefore(barra, body.firstChild);

        const overlay = document.createElement("button");
        overlay.type = "button";
        overlay.className = "mobile-menu-overlay";
        overlay.setAttribute("aria-label", "Fechar menu");
        overlay.tabIndex = -1;
        body.appendChild(overlay);

        const botaoFechar = document.createElement("button");
        botaoFechar.type = "button";
        botaoFechar.className = "mobile-menu-close";
        botaoFechar.setAttribute("aria-label", "Fechar menu");
        botaoFechar.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m18 6-12 12M6 6l12 12"></path></svg>';
        menu.insertBefore(botaoFechar, menu.firstChild);

        function abrirMenu() {
            body.classList.add("mobile-menu-open");
            botaoAbrir.setAttribute("aria-expanded", "true");
            botaoAbrir.setAttribute("aria-label", "Menu aberto");
        }

        function fecharMenu() {
            body.classList.remove("mobile-menu-open");
            botaoAbrir.setAttribute("aria-expanded", "false");
            botaoAbrir.setAttribute("aria-label", "Abrir menu");
        }

        botaoAbrir.addEventListener("click", abrirMenu);
        botaoFechar.addEventListener("click", fecharMenu);
        overlay.addEventListener("click", fecharMenu);

        menu.addEventListener("click", function (evento) {
            if (evento.target.closest("a")) {
                fecharMenu();
            }
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape") {
                fecharMenu();
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 768) {
                fecharMenu();
            }
        }, { passive: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarNavegacaoMobile, { once: true });
    } else {
        iniciarNavegacaoMobile();
    }
})();
