(function () {
    "use strict";

    if (window.__myCompanyStandaloneNavigationLoaded) return;
    window.__myCompanyStandaloneNavigationLoaded = true;

    var DEVICE_TABS_STORAGE = "mycompany.sirkportal.deviceTabs";
    var CHILD_PARAM = "sirkWorkspaceChild";

    function readSavedDeviceTabs() {
        try {
            var value = JSON.parse(localStorage.getItem(DEVICE_TABS_STORAGE) || "{}");
            return value && typeof value === "object" ? value : {};
        } catch (error) {
            return {};
        }
    }

    function workspaceChild() {
        try { return new URL(window.location.href).searchParams.get(CHILD_PARAM) === "1"; }
        catch (error) { return false; }
    }

    function installRestoreGuard() {
        var child = workspaceChild();
        var saved = readSavedDeviceTabs();
        var savedActive = String(saved.active || "all");
        var devicesRequested = window.location.hash === "#devices";
        var restoreHost = !child && devicesRequested && savedActive !== "all";

        if (child && window.location.hash !== "#devices") {
            try {
                var url = new URL(window.location.href);
                url.hash = "devices";
                history.replaceState(history.state, "", url.href);
            } catch (error) {
                window.location.hash = "devices";
            }
        }

        if (!child && !restoreHost) return;

        var content = document.getElementById("sirkStandaloneContent");
        if (!content) return;

        document.documentElement.classList.add("sirk-device-restore-pending");
        content.style.visibility = "hidden";
        content.style.pointerEvents = "none";
        content.setAttribute("aria-busy", "true");

        var finished = false;
        var observer = null;
        var timer = null;

        function finish() {
            if (finished) return;
            finished = true;
            if (observer) observer.disconnect();
            if (timer) window.clearTimeout(timer);
            document.documentElement.classList.remove("sirk-device-restore-pending");
            content.style.visibility = "";
            content.style.pointerEvents = "";
            content.removeAttribute("aria-busy");
            window.dispatchEvent(new Event("resize"));
        }

        function ready() {
            if (finished) return;

            var currentView = String(content.getAttribute("data-active-view") || "");
            if (currentView && currentView !== "devices") {
                finish();
                return;
            }

            if (child) {
                if (content.querySelector(".sirk-device-workspace,.sirk-device-compact-header,[data-device-workspace-ready='1']")) finish();
                return;
            }

            var activeTab = document.querySelector(".sirk-device-tabs-standalone .sirk-device-tab.is-active[data-device-workspace-key]");
            var activeKey = activeTab && String(activeTab.getAttribute("data-device-workspace-key") || "");
            if (activeKey && activeKey !== "all" && content.querySelector(".sirk-device-isolated-workspace iframe")) finish();
        }

        observer = new MutationObserver(ready);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "hidden", "data-active-view", "data-device-workspace-key"]
        });
        timer = window.setTimeout(finish, 15000);
        ready();
    }

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

    installRestoreGuard();
    loadTerminalConnect();

    if (!bind()) {
        var attempts = 0;
        var timer = window.setInterval(function () {
            attempts++;
            if (bind() || attempts > 100) window.clearInterval(timer);
        }, 50);
    }
}());