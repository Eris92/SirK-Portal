(function () {
    "use strict";

    if (window.__myCompanyStandaloneDeviceTabsV2Loaded) return;
    window.__myCompanyStandaloneDeviceTabsV2Loaded = true;

    var state = {
        root: null,
        main: null,
        content: null,
        bar: null,
        cache: null,
        panes: Object.create(null),
        active: "all",
        pending: null,
        finalizeTimer: 0,
        observer: null
    };

    function text(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function safeKey(value) {
        return text(value).replace(/[^a-z0-9._:-]/gi, "_").slice(0, 180);
    }

    function currentView() {
        var active = document.querySelector('.sirk-standalone-nav button.is-active[data-view]');
        return active ? String(active.getAttribute("data-view") || "") : "";
    }

    function devicesActive() {
        return currentView() === "devices";
    }

    function createStore(key) {
        var store = document.createElement("div");
        store.className = "sirk-device-tab-store";
        store.setAttribute("data-device-tab-store", key);
        return store;
    }

    function moveChildren(source, target) {
        if (!source || !target) return;
        while (source.firstChild) target.appendChild(source.firstChild);
    }

    function workspaceHasContent() {
        return !!(state.content && state.content.childNodes.length);
    }

    function ensureInfrastructure() {
        var root = document.getElementById("sirkPortalRoot");
        var content = document.getElementById("sirkStandaloneContent");
        var main = content && content.closest(".sirk-standalone-main");
        if (!root || !content || !main) return false;

        state.root = root;
        state.content = content;
        state.main = main;

        document.querySelectorAll(".sirk-standalone-sidebar .sirk-device-tabs,.sirk-standalone-nav .sirk-device-tabs").forEach(function (wrong) {
            wrong.remove();
        });

        if (!state.cache || !state.cache.isConnected) {
            state.cache = document.createElement("div");
            state.cache.className = "sirk-device-tab-cache";
            state.cache.hidden = true;
            state.cache.setAttribute("aria-hidden", "true");
            root.appendChild(state.cache);
        }

        if (!state.bar || !state.bar.isConnected) {
            state.bar = document.createElement("div");
            state.bar.className = "sirk-device-tabs sirk-device-tabs-standalone";
            state.bar.setAttribute("role", "tablist");
            state.bar.setAttribute("aria-label", "Otwarte urządzenia");
            main.insertBefore(state.bar, content);
        }

        if (!state.panes.all) {
            state.panes.all = {
                key: "all",
                name: "ALL | Wszystkie",
                nodeId: "",
                store: createStore("all")
            };
            state.cache.appendChild(state.panes.all.store);
        }

        syncVisibility();
        renderTabs();
        bind();
        return true;
    }

    function syncVisibility() {
        if (!state.bar) return;
        var visible = devicesActive();
        state.bar.hidden = !visible;
        state.bar.style.display = visible ? "flex" : "none";
    }

    function stashActive() {
        var pane = state.panes[state.active];
        if (!pane || !state.content) return;
        moveChildren(state.content, pane.store);
    }

    function activate(key) {
        var pane = state.panes[key];
        if (!pane || !state.content) return;
        if (key !== state.active) stashActive();
        state.active = key;
        moveChildren(pane.store, state.content);
        renderTabs();
        window.dispatchEvent(new Event("resize"));
        state.content.dispatchEvent(new CustomEvent("mycompany:device-tab-activated", {
            bubbles: true,
            detail: { key: key, nodeId: pane.nodeId }
        }));
    }

    function disconnectPane(pane) {
        if (!pane || !pane.store) return;
        pane.store.querySelectorAll("button").forEach(function (button) {
            var label = text(button.textContent).toLowerCase();
            if (label === "rozłącz" || label === "disconnect") {
                try { button.click(); } catch (error) {}
            }
        });
        pane.store.remove();
    }

    function closeTab(key) {
        if (key === "all" || !state.panes[key]) return;
        var pane = state.panes[key];
        if (state.active === key) {
            stashActive();
            state.active = "all";
            moveChildren(state.panes.all.store, state.content);
        }
        disconnectPane(pane);
        delete state.panes[key];
        renderTabs();
        window.dispatchEvent(new Event("resize"));
    }

    function renderTabs() {
        if (!state.bar) return;
        state.bar.textContent = "";
        Object.keys(state.panes).forEach(function (key) {
            var pane = state.panes[key];
            var tab = document.createElement("button");
            tab.type = "button";
            tab.className = "sirk-device-tab" + (state.active === key ? " is-active" : "");
            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-selected", state.active === key ? "true" : "false");
            tab.title = pane.name;

            var label = document.createElement("span");
            label.className = "sirk-device-tab-label";
            label.textContent = pane.name;
            tab.appendChild(label);
            tab.addEventListener("click", function () { activate(key); });

            if (key !== "all") {
                var close = document.createElement("span");
                close.className = "sirk-device-tab-close";
                close.textContent = "×";
                close.setAttribute("role", "button");
                close.setAttribute("aria-label", "Zamknij " + pane.name);
                close.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeTab(key);
                });
                tab.appendChild(close);
            }
            state.bar.appendChild(tab);
        });
    }

    function attributeValue(element) {
        if (!element) return "";
        var names = ["data-node-id", "data-nodeid", "data-device-id", "data-deviceid", "data-node", "data-device"];
        var nodes = [element].concat(Array.prototype.slice.call(element.querySelectorAll ? element.querySelectorAll("[data-node-id],[data-nodeid],[data-device-id],[data-deviceid],[data-node],[data-device],a[href]") : []));
        for (var n = 0; n < nodes.length; n++) {
            for (var i = 0; i < names.length; i++) {
                var value = nodes[n].getAttribute && nodes[n].getAttribute(names[i]);
                if (value) return value;
            }
            var href = nodes[n].getAttribute && nodes[n].getAttribute("href") || "";
            var match = href.match(/[?&#](?:nodeid|node|device)=([^&#]+)/i);
            if (match) return decodeURIComponent(match[1]);
        }
        return "";
    }

    function candidate(target) {
        if (!devicesActive() || state.active !== "all" || !state.content || !target || !target.closest) return null;
        var element = target.closest('[data-node-id],[data-nodeid],[data-device-id],[data-deviceid],[data-node],[data-device],.sirk-device-row,.sirk-device-card,.sirk-device-item,.device-row,.device-card,[role="row"]');
        if (!element || !state.content.contains(element)) return null;
        if (target.closest("button,input,select,textarea") && !target.closest(".sirk-device-row,.sirk-device-card,.sirk-device-item,.device-row,.device-card")) return null;

        var nodeId = attributeValue(element);
        var nameNode = element.querySelector && element.querySelector('[data-device-name],.sirk-device-name,.device-name,[data-host-name],strong,b');
        var name = text(nameNode && nameNode.textContent || element.getAttribute("data-device-name") || element.getAttribute("data-host-name") || "");
        if (!name) name = text(element.textContent).split(/\s{2,}| · |\n/)[0];
        if (!nodeId) nodeId = safeKey(name);
        if (!name || name.length > 100 || !nodeId) return null;
        return {
            key: "node:" + safeKey(nodeId),
            nodeId: nodeId,
            name: name.slice(0, 64)
        };
    }

    function beginOpen(info) {
        if (state.panes[info.key]) {
            activate(info.key);
            return false;
        }
        state.pending = info;
        stashActive();
        window.clearTimeout(state.finalizeTimer);
        state.finalizeTimer = window.setTimeout(finalizeOpen, 180);
        return true;
    }

    function finalizeOpen() {
        if (!state.pending || !state.content) return;
        if (!workspaceHasContent()) {
            state.finalizeTimer = window.setTimeout(finalizeOpen, 120);
            return;
        }
        var info = state.pending;
        state.pending = null;
        var pane = {
            key: info.key,
            name: info.name,
            nodeId: info.nodeId,
            store: createStore(info.key)
        };
        state.cache.appendChild(pane.store);
        state.panes[info.key] = pane;
        state.active = info.key;
        renderTabs();
        window.dispatchEvent(new Event("resize"));
    }

    function bind() {
        if (!state.root || state.root.__myCompanyStandaloneDeviceTabsBound) return;
        state.root.__myCompanyStandaloneDeviceTabsBound = true;

        state.root.addEventListener("click", function (event) {
            ensureInfrastructure();
            var info = candidate(event.target);
            if (!info) return;
            if (state.panes[info.key]) {
                event.preventDefault();
                event.stopPropagation();
                if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
                activate(info.key);
                return;
            }
            beginOpen(info);
        }, true);

        state.root.addEventListener("click", function () {
            window.setTimeout(syncVisibility, 0);
        });
    }

    function schedule() {
        window.clearTimeout(state.finalizeTimer);
        window.setTimeout(function () {
            ensureInfrastructure();
            syncVisibility();
            if (state.pending) state.finalizeTimer = window.setTimeout(finalizeOpen, 100);
        }, 20);
    }

    function start() {
        ensureInfrastructure();
        if (!state.observer) {
            state.observer = new MutationObserver(schedule);
            state.observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["class", "hidden", "style"]
            });
        }
        window.setInterval(function () {
            ensureInfrastructure();
            syncVisibility();
        }, 1000);
    }

    window.MyCompanyDeviceTabs = {
        mount: ensureInfrastructure,
        activateAll: function () { activate("all"); },
        close: closeTab
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
}());
