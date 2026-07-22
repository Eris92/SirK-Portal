(function () {
    "use strict";

    if (window.__myCompanyStandaloneNavigationLoaded) return;
    window.__myCompanyStandaloneNavigationLoaded = true;

    function navigate(view) {
        view = String(view || "overview");
        var next = "#" + view;
        if (window.location.hash === next) {
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        } else {
            window.location.hash = next;
        }
    }

    function bind() {
        var root = document.getElementById("sirkStandaloneRoot");
        if (!root) return false;
        var buttons = root.querySelectorAll(".sirk-standalone-nav [data-view]");
        Array.prototype.forEach.call(buttons, function (button) {
            if (button.getAttribute("data-standalone-nav-bound") === "1") return;
            button.setAttribute("data-standalone-nav-bound", "1");
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
                navigate(button.getAttribute("data-view"));
            }, true);
        });
        return true;
    }

    function loadTerminalConnect() {
        if (document.getElementById("mycompany-portal-terminal-connect")) return;
        var base = String(window.__MYCOMPANY_ASSET_BASE__ || "").replace(/\/$/, "");
        if (!base) return;
        var script = document.createElement("script");
        script.id = "mycompany-portal-terminal-connect";
        script.src = base + "/portal-terminal-connect.js?v=" + encodeURIComponent(String(window.__MYCOMPANY_PORTAL_VERSION__ || ""));
        script.async = false;
        (document.head || document.documentElement).appendChild(script);
    }

    loadTerminalConnect();

    if (!bind()) {
        var attempts = 0;
        var timer = window.setInterval(function () {
            attempts++;
            if (bind() || attempts > 100) window.clearInterval(timer);
        }, 50);
    }
}());
