(function () {
    "use strict";

    if (window.__myCompanyPortalModuleLoaded) return;
    window.__myCompanyPortalModuleLoaded = true;

    var core = window.MyCompanyCore;
    var state = {
        bootstrap: null,
        activeView: "overview",
        actions: [],
        selectedNode: null,
        deviceSearch: "",
        deviceFilter: "all",
        refreshTimer: 0
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function moduleState(key) {
        return window.MyCompanyRuntime && window.MyCompanyRuntime.state &&
            window.MyCompanyRuntime.state.bootstrap &&
            window.MyCompanyRuntime.state.bootstrap.modules &&
            window.MyCompanyRuntime.state.bootstrap.modules[key] || null;
    }

    function moduleEnabled(key) {
        var value = moduleState(key);
        return !!(value && value.enabled && value.ready !== false && value.access && value.access.allowed !== false);
    }

    function isSiteAdmin() {
        return !!(state.bootstrap && state.bootstrap.access && state.bootstrap.access.siteAdmin);
    }

    function ensureStyle() {
        if (document.getElementById("mycompany-portal-style")) return;
        var link = document.createElement("link");
        link.id = "mycompany-portal-style";
        link.rel = "stylesheet";
        link.href = core.assetUrl("", "portal.css");
        (document.head || document.documentElement).appendChild(link);
    }

    function values(value) {
        if (!value || typeof value !== "object") return [];
        if (Array.isArray(value)) return value.slice();
        return Object.keys(value).map(function (key) { return value[key]; });
    }

    function findCollection(names, validator) {
        for (var index = 0; index < names.length; index++) {
            var source = window[names[index]];
            if (!source || typeof source !== "object") continue;
            var result = values(source).filter(validator);
            if (result.length || Array.isArray(source)) return result;
        }
        return [];
    }

    function nodeId(node) {
        return String(node && (node._id || node.nodeid || node.id) || "");
    }

    function meshId(mesh) {
        return String(mesh && (mesh._id || mesh.meshid || mesh.id) || "");
    }

    function nodeMeshId(node) {
        return String(node && (node.meshid || node.meshId || node.groupid) || "");
    }

    function nodeName(node) {
        return String(node && (node.name || node.hostname || node.host || nodeId(node).split("/").pop()) || "Nieznany host");
    }

    function nodeOs(node) {
        return String(node && (node.osdesc || node.osDescription || node.os || node.platform || "") || "Brak danych");
    }

    function nodeIp(node) {
        return String(node && (node.ip || node.ipaddr || node.ipAddress || "") || "");
    }

    function connectionValue(node) {
        return Number(node && (node.conn != null ? node.conn : node.connectionState != null ? node.connectionState : node.connectivity) || 0);
    }

    function online(node) {
        return connectionValue(node) > 0;
    }

    function nodes() {
        return findCollection(["nodes", "meshNodes", "xxnodes", "allNodes", "deviceNodes"], function (item) {
            return !!nodeId(item);
        });
    }

    function meshes() {
        return findCollection(["meshes", "meshGroups", "xxmeshes", "allMeshes"], function (item) {
            return !!meshId(item);
        });
    }

    function meshMap() {
        var result = Object.create(null);
        meshes().forEach(function (mesh) {
            result[meshId(mesh)] = mesh;
        });
        return result;
    }

    function groupName(node, map) {
        var mesh = map[nodeMeshId(node)];
        return String(mesh && (mesh.name || mesh.desc) || node.meshname || node.groupname || "Bez grupy");
    }

    function currentContext() {
        var node = state.selectedNode || window.currentNode || window.xxcurrentNode || null;
        return {
            page: window.location.href,
            nodeId: nodeId(node) || null,
            meshId: nodeMeshId(node) || null,
            node: node
        };
    }

    function launcher() {
        var button = byId("sirkPortalLauncher");
        if (button) return button;
        button = document.createElement("button");
        button.id = "sirkPortalLauncher";
        button.className = "sirk-portal-launcher";
        button.type = "button";
        button.textContent = "SirK Portal";
        button.onclick = function () { showPortal(state.activeView === "mesh" ? "overview" : state.activeView); };
        document.body.appendChild(button);
        return button;
    }

    function portalHtml() {
        return [
            '<aside class="sirk-sidebar">',
            '<div class="sirk-brand"><div class="sirk-logo">S</div><span>SirK Portal</span></div>',
            '<nav class="sirk-nav">',
            '<button type="button" data-sirk-view="overview"><span class="sirk-nav-icon">⌂</span><span>Przegląd</span></button>',
            '<button type="button" data-sirk-view="devices"><span class="sirk-nav-icon">▣</span><span>Urządzenia</span></button>',
            '<button type="button" data-sirk-view="management"><span class="sirk-nav-icon">⚙</span><span>Zarządzanie</span></button>',
            '<button type="button" data-sirk-view="approvals"><span class="sirk-nav-icon">✓</span><span>Akceptacje</span></button>',
            '<button type="button" data-sirk-view="settings" data-site-admin-only="1"><span class="sirk-nav-icon">🛡</span><span>Ustawienia</span></button>',
            '<button type="button" data-sirk-view="mesh"><span class="sirk-nav-icon">▦</span><span>Mesh</span></button>',
            '</nav>',
            '</aside>',
            '<header class="sirk-header">',
            '<strong id="sirkViewTitle">Przegląd</strong>',
            '<div class="sirk-header-actions"><button class="sirk-button" id="sirkOpenMesh" type="button">Otwórz Mesh</button></div>',
            '</header>',
            '<main class="sirk-main">',
            '<section class="sirk-view" data-view="overview"></section>',
            '<section class="sirk-view" data-view="devices" hidden></section>',
            '<section class="sirk-view sirk-module-view" data-view="management" hidden></section>',
            '<section class="sirk-view sirk-module-view" data-view="approvals" hidden></section>',
            '<section class="sirk-view sirk-settings-view" data-view="settings" hidden></section>',
            '</main>'
        ].join("");
    }

    function ensureRoot() {
        var existing = byId("sirkPortalRoot");
        if (existing) {
            if (existing.getAttribute("data-mycompany-portal") !== "1") {
                throw new Error("Standalone SirKPortal is active. Disable or uninstall it before enabling the MyCompany Portal module.");
            }
            return existing;
        }
        var root = document.createElement("div");
        root.id = "sirkPortalRoot";
        root.setAttribute("data-mycompany-portal", "1");
        root.innerHTML = portalHtml();
        document.body.appendChild(root);
        bind(root);
        return root;
    }

    function titleFor(view) {
        if (view === "devices") return "Urządzenia";
        if (view === "management") return "Zarządzanie · MyScripts";
        if (view === "approvals") return "Akceptacje · Approval Center";
        if (view === "settings") return "Ustawienia · MyCompany";
        return "Przegląd";
    }

    function overviewCard(title, text, view, badge) {
        return [
            '<button type="button" class="sirk-card sirk-overview-card" data-sirk-open="', escapeHtml(view), '">',
            '<span class="sirk-card-badge">', escapeHtml(badge || ""), '</span>',
            '<h3>', escapeHtml(title), '</h3>',
            '<p>', escapeHtml(text), '</p>',
            '</button>'
        ].join("");
    }

    function renderOverview(host) {
        var all = nodes();
        var onlineCount = all.filter(online).length;
        host.innerHTML = [
            '<div class="sirk-grid">',
            overviewCard("Urządzenia", all.length + " urządzeń, " + onlineCount + " online.", "devices", String(all.length)),
            overviewCard("Zarządzanie", moduleEnabled("myscripts") ? "Biblioteka MyScripts i wykonywanie automatyzacji." : "Moduł MyScripts jest wyłączony.", "management", "PS"),
            overviewCard("Akceptacje", moduleEnabled("approvalcenter") ? "Approval Center dla skryptów, komend i przenoszenia hostów." : "Approval Center jest wyłączony.", "approvals", "✓"),
            isSiteAdmin() ? overviewCard("Ustawienia", "Panel administracyjny MyCompany i konfiguracja integracji.", "settings", "⚙") : "",
            '</div>'
        ].join("");
    }

    function renderDevices(host) {
        var all = nodes();
        var map = meshMap();
        var search = state.deviceSearch.trim().toLowerCase();
        var filtered = all.filter(function (node) {
            if (state.deviceFilter === "online" && !online(node)) return false;
            if (state.deviceFilter === "offline" && online(node)) return false;
            if (!search) return true;
            return [nodeName(node), nodeOs(node), nodeIp(node), groupName(node, map)].join(" ").toLowerCase().indexOf(search) >= 0;
        });

        host.innerHTML = [
            '<div class="sirk-device-toolbar">',
            '<div class="sirk-device-summary"><span><strong>', String(all.length), '</strong> wszystkie</span><span><strong>', String(all.filter(online).length), '</strong> online</span></div>',
            '<div class="sirk-device-controls"><input id="sirkDeviceSearch" class="sirk-input" type="search" placeholder="Szukaj hosta, grupy lub systemu..." value="', escapeHtml(state.deviceSearch), '">',
            '<select id="sirkDeviceFilter" class="sirk-select"><option value="all">Wszystkie</option><option value="online">Online</option><option value="offline">Offline</option></select></div>',
            '</div>',
            '<div class="sirk-device-groups">',
            filtered.length ? filtered.sort(function (a, b) { return nodeName(a).localeCompare(nodeName(b)); }).map(function (node) {
                return [
                    '<button type="button" class="sirk-device-row" data-sirk-node="', escapeHtml(nodeId(node)), '">',
                    '<span class="sirk-device-icon">▣</span>',
                    '<span class="sirk-device-primary"><strong>', escapeHtml(nodeName(node)), '</strong><small>', escapeHtml(groupName(node, map)), '</small></span>',
                    '<span class="sirk-device-os">', escapeHtml(nodeOs(node)), '</span>',
                    '<span class="sirk-device-network">', escapeHtml(nodeIp(node) || "-"), '</span>',
                    '<span class="sirk-device-connection ', online(node) ? "is-online" : "is-offline", '"><i></i>', online(node) ? "Online" : "Offline", '</span>',
                    '<span class="sirk-device-open">Otwórz</span>',
                    '</button>'
                ].join("");
            }).join("") : '<div class="sirk-card"><h3>Brak urządzeń</h3><p>Nie znaleziono urządzeń zgodnych z filtrem lub lista MeshCentral nie jest jeszcze dostępna.</p></div>',
            '</div>'
        ].join("");

        var searchInput = byId("sirkDeviceSearch");
        var filterInput = byId("sirkDeviceFilter");
        if (filterInput) filterInput.value = state.deviceFilter;
        if (searchInput) searchInput.oninput = function () { state.deviceSearch = searchInput.value || ""; renderDevices(host); };
        if (filterInput) filterInput.onchange = function () { state.deviceFilter = filterInput.value || "all"; renderDevices(host); };
        host.querySelectorAll("[data-sirk-node]").forEach(function (button) {
            button.onclick = function () {
                var id = button.getAttribute("data-sirk-node");
                state.selectedNode = all.find(function (node) { return nodeId(node) === id; }) || null;
                openNativeNode(id);
            };
        });
    }

    function moduleError(host, title, message) {
        host.innerHTML = '<div class="sirk-card"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(message) + '</p></div>';
    }

    function mountModule(key, host, title) {
        if (!moduleEnabled(key)) {
            moduleError(host, title, "Moduł jest wyłączony albo użytkownik nie ma do niego dostępu.");
            return;
        }
        var module = window.MyCompanyModules && window.MyCompanyModules[key];
        if (!module || typeof module.mount !== "function") {
            moduleError(host, title, "Moduł nie udostępnia jeszcze wspólnego punktu montowania.");
            return;
        }
        module.mount(host, "portal-" + key);
    }

    function renderSettings(host) {
        if (!isSiteAdmin()) {
            moduleError(host, "Ustawienia", "Panel administracyjny jest dostępny tylko dla Site Admin.");
            return;
        }
        if (host.querySelector("iframe")) return;
        var frame = document.createElement("iframe");
        frame.className = "sirk-settings-frame";
        frame.title = "MyCompany settings";
        var url = new URL("pluginadmin.ashx", window.location.href);
        url.searchParams.set("pin", "MyCompany");
        frame.src = url.href;
        host.innerHTML = "";
        host.appendChild(frame);
    }

    function renderView(view) {
        var root = ensureRoot();
        var host = root.querySelector('[data-view="' + view + '"]');
        if (!host) return;
        if (view === "overview") renderOverview(host);
        else if (view === "devices") renderDevices(host);
        else if (view === "management") mountModule("myscripts", host, "Zarządzanie");
        else if (view === "approvals") mountModule("approvalcenter", host, "Akceptacje");
        else if (view === "settings") renderSettings(host);
    }

    function showPortal(view) {
        var root;
        try { root = ensureRoot(); }
        catch (error) {
            if (window.console) console.error("MyCompany Portal startup failed", error);
            return false;
        }
        view = ["overview", "devices", "management", "approvals", "settings"].indexOf(String(view || "")) >= 0 ? String(view) : "overview";
        if (view === "settings" && !isSiteAdmin()) view = "overview";
        state.activeView = view;
        try { window.localStorage.setItem("mycompany.portal.view", view); } catch (error) {}
        root.hidden = false;
        document.documentElement.classList.add("sirk-portal-active");
        launcher().hidden = true;
        root.querySelectorAll("[data-view]").forEach(function (section) {
            section.hidden = section.getAttribute("data-view") !== view;
        });
        root.querySelectorAll("[data-sirk-view]").forEach(function (button) {
            button.classList.toggle("is-active", button.getAttribute("data-sirk-view") === view);
        });
        var title = byId("sirkViewTitle");
        if (title) title.textContent = titleFor(view);
        renderView(view);
        return true;
    }

    function showMesh() {
        var root = byId("sirkPortalRoot");
        if (root) root.hidden = true;
        document.documentElement.classList.remove("sirk-portal-active");
        state.activeView = "mesh";
        var button = launcher();
        button.hidden = !(state.bootstrap && state.bootstrap.config && state.bootstrap.config.showLauncher !== false);
    }

    function openNativeNode(id) {
        showMesh();
        if (!id) return;
        var url = new URL(window.location.href);
        url.searchParams.set("gotonode", id);
        window.location.href = url.href;
    }

    function bind(root) {
        root.onclick = function (event) {
            var nav = event.target.closest("[data-sirk-view]");
            if (nav) {
                var view = nav.getAttribute("data-sirk-view");
                if (view === "mesh") showMesh();
                else showPortal(view);
                return;
            }
            var card = event.target.closest("[data-sirk-open]");
            if (card) showPortal(card.getAttribute("data-sirk-open"));
        };
        var meshButton = byId("sirkOpenMesh");
        if (meshButton) meshButton.onclick = showMesh;
        root.querySelectorAll("[data-site-admin-only]").forEach(function (item) {
            item.hidden = !isSiteAdmin();
        });
    }

    function registerAction(action) {
        if (!action || !action.id || typeof action.handler !== "function") throw new Error("SirKPortal.registerAction requires id and handler.");
        state.actions = state.actions.filter(function (item) { return item.id !== action.id; });
        state.actions.push(action);
    }

    function initialize(bootstrapState) {
        state.bootstrap = bootstrapState || {};
        ensureStyle();
        if (window.__sirkPortalBootstrapLoaded && !byId("sirkPortalRoot")) {
            return Promise.reject(new Error("Standalone SirKPortal bootstrap is already loaded."));
        }
        window.__sirkPortalBootstrapLoaded = true;
        var preferred = state.bootstrap.config && state.bootstrap.config.defaultView || "overview";
        try { preferred = window.localStorage.getItem("mycompany.portal.view") || preferred; } catch (error) {}
        showPortal(preferred);
        if (!state.refreshTimer) {
            state.refreshTimer = window.setInterval(function () {
                if (state.activeView === "devices") {
                    var host = byId("sirkPortalRoot") && byId("sirkPortalRoot").querySelector('[data-view="devices"]');
                    if (host) renderDevices(host);
                }
            }, 5000);
        }
        return Promise.resolve();
    }

    window.SirKPortal = window.SirKPortal || {};
    window.SirKPortal.registerAction = registerAction;
    window.SirKPortal.open = showPortal;
    window.SirKPortal.openMesh = showMesh;
    window.SirKPortal.getContext = currentContext;
    window.SirKPortal.refreshDevices = function () {
        var host = byId("sirkPortalRoot") && byId("sirkPortalRoot").querySelector('[data-view="devices"]');
        if (host) renderDevices(host);
    };

    window.MyCompanyModules.portal = {
        initialize: initialize,
        open: showPortal,
        openMesh: showMesh,
        onNativePageStart: function () {},
        onNativePageEnd: function () {},
        onDeviceRefreshEnd: function () {
            if (state.activeView === "devices") window.SirKPortal.refreshDevices();
        }
    };
}());
