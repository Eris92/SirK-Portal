(function () {
    "use strict";

    if (window.__myCompanySirkLoginLoaded) return;
    window.__myCompanySirkLoginLoaded = true;

    function visible(element) {
        return !!(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
    }

    function findWorkspace() {
        var selectors = ["#p10desktop", "#p1", "#column_l", "#MainMenu", "#page_content"];
        for (var i = 0; i < selectors.length; i += 1) {
            var item = document.querySelector(selectors[i]);
            if (visible(item)) return item;
        }
        return null;
    }

    function findLoginForm() {
        var password = document.querySelector('input[type="password"]');
        if (password && password.closest("form") && visible(password.closest("form"))) return password.closest("form");
        var forms = document.querySelectorAll("form");
        for (var i = 0; i < forms.length; i += 1) {
            if (visible(forms[i]) && forms[i].querySelector('input[type="text"],input[type="email"],input[type="password"]')) return forms[i];
        }
        return null;
    }

    function shellHtml() {
        return '<section class="sirk-login-hero"><div class="sirk-login-hero-content"><div class="sirk-login-mark">S</div><div class="sirk-login-product">SirK Portal</div><h1>Zarządzaj infrastrukturą z jednego miejsca.</h1><p>Urządzenia, automatyzacja, akceptacje i monitoring z wykorzystaniem bezpiecznej sesji MeshCentral.</p><div class="sirk-login-points"><span><i></i>Natywne uwierzytelnianie MeshCentral</span><span><i></i>Jedna sesja i te same uprawnienia</span><span><i></i>Niezależny frontend operacyjny</span></div></div><div class="sirk-login-watermark">SIRK</div></section><section class="sirk-login-panel"><div class="sirk-login-card"><header><span>SECURE ACCESS</span><h2>Zaloguj się</h2><p>Użyj konta skonfigurowanego w MeshCentral.</p></header><div id="sirkNativeLoginHost"></div><footer>Authentication and session provided by MeshCentral</footer></div></section>';
    }

    function install() {
        if (findWorkspace()) return false;
        var form = findLoginForm();
        if (!form) return false;
        document.documentElement.classList.add("sirk-login-active");
        var shell = document.getElementById("sirkLoginShell");
        if (!shell) {
            shell = document.createElement("main");
            shell.id = "sirkLoginShell";
            shell.innerHTML = shellHtml();
            document.body.appendChild(shell);
        }
        var host = document.getElementById("sirkNativeLoginHost");
        if (host && form.parentNode !== host) {
            form.classList.add("sirk-native-login-form");
            host.appendChild(form);
        }
        return true;
    }

    function boot() {
        if (install()) return;
        var attempts = 0;
        var timer = window.setInterval(function () {
            attempts += 1;
            if (install() || attempts >= 80) window.clearInterval(timer);
        }, 100);
        new MutationObserver(function () { install(); }).observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
    else boot();
}());
