(function () {
    "use strict";

    var link = document.querySelector(".sirk-standalone-native");

    function apply(config) {
        if (!link) return;
        var visible = !config || config.showNativeLink !== false;
        link.hidden = !visible;
        link.style.display = visible ? "" : "none";
        link.setAttribute("aria-hidden", visible ? "false" : "true");
        if (!visible) link.setAttribute("tabindex", "-1");
        else link.removeAttribute("tabindex");
    }

    function currentConfig() {
        var runtime = window.MyCompanyRuntime;
        var bootstrap = runtime && runtime.state && runtime.state.bootstrap;
        return bootstrap && bootstrap.modules && bootstrap.modules.portal && bootstrap.modules.portal.config;
    }

    function language() {
        try { return localStorage.getItem("sirkPortal.language") === "en" ? "en" : "pl"; }
        catch (error) { return document.documentElement.lang === "en" ? "en" : "pl"; }
    }

    function text(pl, en) { return language() === "en" ? en : pl; }

    function installViewModeStyle() {
        if (document.getElementById("sirkDeviceViewModeStyle")) return;
        var style = document.createElement("style");
        style.id = "sirkDeviceViewModeStyle";
        style.textContent = [
            ".sirk-device-tabs-standalone{position:relative!important;padding-right:54px!important;overflow:visible!important}",
            ".sirk-device-view-mode{position:absolute;right:12px;top:50%;transform:translateY(-50%);z-index:2147483000}",
            ".sirk-device-view-mode-toggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:32px;height:32px;padding:0!important;line-height:0!important;border:1px solid var(--sirk-border,#dce3ec);border-radius:9px;background:var(--sirk-panel,#fff);color:var(--sirk-muted,#657187);cursor:pointer;box-shadow:0 3px 10px rgba(15,23,42,.08)}",
            ".sirk-device-view-mode-toggle:hover,.sirk-device-view-mode-toggle:focus-visible{border-color:#60a5fa;color:#2563eb;outline:none}",
            ".sirk-device-view-mode-toggle svg{display:block!important;flex:0 0 auto;width:17px;height:17px;margin:0!important;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
            ".sirk-device-view-mode-menu{position:fixed!important;z-index:2147483647!important;display:grid;min-width:230px;padding:6px;border:1px solid var(--sirk-border,#dce3ec);border-radius:10px;background:var(--sirk-panel,#fff);color:var(--sirk-text,#172033);box-shadow:0 14px 35px rgba(15,23,42,.28)}",
            ".sirk-device-view-mode-menu[hidden]{display:none!important}",
            ".sirk-device-view-mode-menu button{display:flex;align-items:center;gap:9px;min-height:36px;padding:8px 10px;border:0;border-radius:7px;background:transparent;color:inherit;text-align:left;font:600 13px Segoe UI,Arial,sans-serif;cursor:pointer}",
            ".sirk-device-view-mode-menu button:hover,.sirk-device-view-mode-menu button:focus-visible{background:var(--sirk-hover,#eef3f9);outline:none}",
            ".sirk-device-view-mode-menu button.is-active{background:rgba(59,130,246,.12);color:#2563eb}",
            "html.sirk-device-focus-mode .sirk-standalone-sidebar{display:none!important}",
            "html.sirk-device-focus-mode .sirk-standalone-root{grid-template-columns:minmax(0,1fr)!important}",
            "html.sirk-device-focus-mode .sirk-standalone-main>header,html.sirk-device-focus-mode .sirk-standalone-topbar{display:none!important}",
            "html.sirk-device-focus-mode #sirkPortalRoot,html.sirk-device-focus-mode #sirkStandaloneRoot,html.sirk-device-focus-mode .sirk-standalone-main{width:100%!important;height:100%!important;min-height:100%!important}",
            "html.sirk-device-focus-mode #sirkStandaloneContent{min-height:0!important}",
            "html.sirk-device-workspace-child .sirk-device-view-mode{display:none!important}"
        ].join("");
        (document.head || document.documentElement).appendChild(style);
    }

    function activeSessionFrame() {
        return document.querySelector(".sirk-device-session-pane.is-active iframe,.sirk-device-isolated-workspace.is-active iframe");
    }

    function enterConnectionFullscreen() {
        var frame = activeSessionFrame();
        if (!frame) return;
        try {
            var doc = frame.contentDocument;
            var target = doc && (doc.querySelector("#sirkDeviceTabBody .sirk-native-bridge-stage") || doc.querySelector("#sirkDeviceTabBody") || doc.documentElement);
            if (target && typeof target.requestFullscreen === "function") {
                target.requestFullscreen().catch(function () {
                    if (typeof frame.requestFullscreen === "function") frame.requestFullscreen().catch(function () {});
                });
                return;
            }
        } catch (error) {}
        if (typeof frame.requestFullscreen === "function") frame.requestFullscreen().catch(function () {});
    }

    function setFocusMode(enabled) {
        document.documentElement.classList.toggle("sirk-device-focus-mode", enabled);
        try { localStorage.setItem("mycompany.sirkportal.focusMode", enabled ? "1" : "0"); }
        catch (error) {}
        window.dispatchEvent(new Event("resize"));
    }

    function restoreFocusMode() {
        try { setFocusMode(localStorage.getItem("mycompany.sirkportal.focusMode") === "1"); }
        catch (error) { setFocusMode(false); }
    }

    function mountViewModeButton() {
        var bar = document.querySelector(".sirk-device-tabs-standalone");
        if (!bar || bar.querySelector(".sirk-device-view-mode")) return false;

        var host = document.createElement("div");
        host.className = "sirk-device-view-mode";

        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "sirk-device-view-mode-toggle";
        toggle.setAttribute("aria-haspopup", "menu");
        toggle.setAttribute("aria-expanded", "false");
        toggle.title = text("Lewy klik: widok szeroki. Prawy klik: menu.", "Left click: wide view. Right click: menu.");
        toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>';

        var menu = document.createElement("div");
        menu.className = "sirk-device-view-mode-menu";
        menu.hidden = true;
        menu.setAttribute("role", "menu");

        var focus = document.createElement("button");
        focus.type = "button";
        focus.setAttribute("role", "menuitem");
        focus.innerHTML = '<span>▣</span><span></span>';

        var fullscreen = document.createElement("button");
        fullscreen.type = "button";
        fullscreen.setAttribute("role", "menuitem");
        fullscreen.innerHTML = '<span>⛶</span><span>' + text("Pełny ekran połączenia", "Connection fullscreen") + '</span>';

        function refresh() {
            var active = document.documentElement.classList.contains("sirk-device-focus-mode");
            focus.classList.toggle("is-active", active);
            focus.lastChild.textContent = active ? text("Widok normalny", "Normal view") : text("Widok szeroki", "Wide view");
            toggle.classList.toggle("is-active", active);
        }

        function hideMenu() {
            menu.hidden = true;
            toggle.setAttribute("aria-expanded", "false");
        }

        function showMenu() {
            refresh();
            menu.hidden = false;
            toggle.setAttribute("aria-expanded", "true");
            var rect = toggle.getBoundingClientRect();
            var menuWidth = Math.max(menu.offsetWidth || 230, 230);
            var left = Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth));
            var top = rect.bottom + 7;
            if (top + (menu.offsetHeight || 92) > window.innerHeight - 8) top = Math.max(8, rect.top - (menu.offsetHeight || 92) - 7);
            menu.style.left = left + "px";
            menu.style.top = top + "px";
        }

        toggle.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            hideMenu();
            setFocusMode(!document.documentElement.classList.contains("sirk-device-focus-mode"));
            refresh();
        });

        toggle.addEventListener("contextmenu", function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (menu.hidden) showMenu();
            else hideMenu();
        });

        focus.addEventListener("click", function () {
            setFocusMode(!document.documentElement.classList.contains("sirk-device-focus-mode"));
            hideMenu();
            refresh();
        });

        fullscreen.addEventListener("click", function () {
            hideMenu();
            enterConnectionFullscreen();
        });

        document.addEventListener("click", function (event) {
            if (!host.contains(event.target) && !menu.contains(event.target)) hideMenu();
        });
        window.addEventListener("resize", hideMenu);
        window.addEventListener("scroll", hideMenu, true);

        menu.appendChild(focus);
        menu.appendChild(fullscreen);
        host.appendChild(toggle);
        bar.appendChild(host);
        document.body.appendChild(menu);
        refresh();
        return true;
    }

    installViewModeStyle();
    restoreFocusMode();

    var config = currentConfig();
    if (config) apply(config);
    else {
        var attempts = 0;
        var timer = window.setInterval(function () {
            attempts += 1;
            var value = currentConfig();
            if (value || attempts >= 50) {
                window.clearInterval(timer);
                apply(value || {});
            }
        }, 100);
    }

    if (!mountViewModeButton()) {
        var mountAttempts = 0;
        var mountTimer = window.setInterval(function () {
            mountAttempts += 1;
            if (mountViewModeButton() || mountAttempts >= 200) window.clearInterval(mountTimer);
        }, 100);
    }

    new MutationObserver(function () { mountViewModeButton(); }).observe(document.documentElement, { childList: true, subtree: true });
}());