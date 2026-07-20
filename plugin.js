"use strict";

var fs = require("fs");
var path = require("path");

module.exports.mycompany = function (parent) {
    var obj = {};
    var pluginRoot = path.join(parent.pluginPath, "mycompany");
    var embeddedRoot = path.join(pluginRoot, "embedded");
    var manifestPath = path.join(pluginRoot, "embedded-manifest.json");
    var manifest = [];
    var embedded = {};

    try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
    catch (error) { console.log("MyCompany embedded manifest is missing:", error.message); }

    function createParentProxy() {
        var proxy = Object.create(parent);
        Object.keys(parent || {}).forEach(function (key) { proxy[key] = parent[key]; });
        proxy.pluginPath = embeddedRoot;
        return proxy;
    }

    function loadEmbedded() {
        var proxy = createParentProxy();
        manifest.forEach(function (item) {
            try {
                var entry = path.join(embeddedRoot, item.shortName, item.entry);
                var factory = require(entry)[item.exportName];
                if (typeof factory !== "function") throw new Error("Plugin factory was not exported.");
                embedded[item.key] = { meta: item, instance: factory(proxy) };
                console.log("MyCompany loaded embedded module:", item.key);
            } catch (error) {
                embedded[item.key] = { meta: item, error: error };
                console.log("MyCompany failed to load embedded module " + item.key + ":", error.stack || error);
            }
        });
    }

    loadEmbedded();

    obj.parent = parent;
    obj.meshServer = parent && parent.parent;
    obj.exports = ["onWebUIStartupEnd", "goPageStart", "goPageEnd"];

    [
        ["scripts", "embeddedScriptsStartup"],
        ["commands", "embeddedCommandsStartup"],
        ["approvals", "embeddedApprovalsStartup"],
        ["move", "embeddedMoveStartup"]
    ].forEach(function (pair) {
        var record = embedded[pair[0]];
        if (record && record.instance && typeof record.instance.onWebUIStartupEnd === "function") {
            obj[pair[1]] = record.instance.onWebUIStartupEnd;
            obj.exports.push(pair[1]);
        }
    });

    obj.server_startup = function () {
        Object.keys(embedded).forEach(function (key) {
            var instance = embedded[key].instance;
            if (instance && typeof instance.server_startup === "function") {
                try { instance.server_startup(); }
                catch (error) { console.log("MyCompany module startup failed " + key + ":", error.stack || error); }
            }
        });
    };

    obj.handleAdminReq = function (req, res, user) {
        var key = String(req && req.query && req.query.module || "");
        var record = embedded[key];
        if (!record || !record.instance || typeof record.instance.handleAdminReq !== "function") {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: false, error: "Embedded module is unavailable: " + key }));
            return;
        }
        return record.instance.handleAdminReq(req, res, user);
    };

    obj.onWebUIStartupEnd = function () {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        if (window.MyCompany && window.MyCompany.initialized) return;

        var app = window.MyCompany = window.MyCompany || {};
        app.initialized = true;
        app.active = false;
        app.activeModule = "settings";
        app.nativeState = null;
        app.modules = {
            scripts: { label: "Scripts", viewmode: 101, globals: ["MyScripts"], startup: "embeddedScriptsStartup" },
            commands: { label: "Commands", viewmode: 102, globals: ["MyCommands"], startup: "embeddedCommandsStartup" },
            approvals: { label: "Approvals", viewmode: 105, globals: ["ApprovalCenter"], startup: "embeddedApprovalsStartup" },
            move: { label: "Move Requests", viewmode: 104, globals: ["MoveRequest", "MoveRequests"], startup: "embeddedMoveStartup" }
        };

        window.MyCompanyAssetUrl = function (moduleName, assetName) {
            var endpoint = new URL("pluginadmin.ashx", window.location.href);
            endpoint.searchParams.set("pin", "mycompany");
            endpoint.searchParams.set("module", moduleName);
            endpoint.searchParams.set("asset", assetName);
            return endpoint.href;
        };

        function getGlobal(definition) {
            for (var i = 0; i < definition.globals.length; i++) {
                if (window[definition.globals[i]]) return window[definition.globals[i]];
            }
            return null;
        }

        function removeEmbeddedMenus() {
            [
                "MainMenuMyScripts", "LeftMenuMyScripts",
                "MainMenuMyCommands", "LeftMenuMyCommands",
                "MainMenuApprovalCenter", "LeftMenuApprovalCenter",
                "MainMenuMoveRequest", "LeftMenuMoveRequest",
                "MainMenuMoveRequests", "LeftMenuMoveRequests"
            ].forEach(function (id) {
                var node = document.getElementById(id);
                if (node && node.parentNode) node.parentNode.removeChild(node);
            });
        }

        function bootstrapModules() {
            var api = window.pluginHandler && window.pluginHandler.mycompany;
            if (!api) return;
            Object.keys(app.modules).forEach(function (key) {
                var name = app.modules[key].startup;
                if (typeof api[name] === "function") {
                    try { api[name](); }
                    catch (error) { if (window.console) console.error("MyCompany module bootstrap failed: " + key, error); }
                }
            });
            window.setTimeout(removeEmbeddedMenus, 300);
            window.setTimeout(removeEmbeddedMenus, 1000);
            window.setTimeout(removeEmbeddedMenus, 3000);
        }

        function hideElement(element) {
            if (!element) return null;
            var state = { element: element, display: element.style.display };
            element.style.display = "none";
            return state;
        }

        function restoreElement(state) {
            if (state && state.element) state.element.style.display = state.display;
        }

        app.ensureWorkspace = function () {
            var page = document.getElementById("p1");
            var titleHost = document.getElementById("p1title");
            if (!page || !titleHost) return null;
            var host = document.getElementById("MyCompanyWorkspace");
            if (host) return host;
            host = document.createElement("div");
            host.id = "MyCompanyWorkspace";
            host.style.display = "none";
            host.style.boxSizing = "border-box";
            host.style.width = "100%";
            host.style.height = "calc(100vh - 104px)";
            host.style.overflow = "auto";
            host.style.padding = "8px 12px 18px";
            var nav = document.createElement("div");
            nav.id = "MyCompanyNavigation";
            nav.style.display = "flex";
            nav.style.flexWrap = "wrap";
            nav.style.gap = "8px";
            nav.style.marginBottom = "10px";
            [["Scripts", "scripts"], ["Commands", "commands"], ["Approvals", "approvals"], ["Move Requests", "move"], ["Settings", "settings"]].forEach(function (pair) {
                var button = document.createElement("button");
                button.type = "button";
                button.className = "btn btn-secondary btn-sm";
                button.textContent = pair[0];
                button.onclick = function () { return app.showModule(pair[1]); };
                nav.appendChild(button);
            });
            host.appendChild(nav);
            var content = document.createElement("div");
            content.id = "MyCompanyContent";
            content.style.border = "1px solid rgba(127,127,127,.65)";
            content.style.borderRadius = "5px";
            content.style.padding = "18px";
            content.style.minHeight = "260px";
            host.appendChild(content);
            page.appendChild(host);
            return host;
        };

        app.showNativePage = function () {
            var page = document.getElementById("p1");
            var titleHost = document.getElementById("p1title");
            var workspace = app.ensureWorkspace();
            if (!page || !titleHost || !workspace) return null;
            var heading = titleHost.querySelector("h1") || titleHost.querySelector(".fs-4") || titleHost.querySelector("h2");
            if (!app.nativeState) {
                var hidden = [];
                for (var child = page.firstElementChild; child; child = child.nextElementSibling) {
                    if (child !== titleHost && child !== workspace) hidden.push(hideElement(child));
                }
                app.nativeState = { heading: heading, headingText: heading ? heading.textContent : "", hidden: hidden };
            }
            if (heading) heading.textContent = "My Company";
            workspace.style.display = "block";
            page.style.display = "";
            return page;
        };

        app.restoreNativePage = function () {
            if (!app.nativeState) return;
            if (app.nativeState.heading) app.nativeState.heading.textContent = app.nativeState.headingText;
            (app.nativeState.hidden || []).forEach(restoreElement);
            var workspace = document.getElementById("MyCompanyWorkspace");
            if (workspace) workspace.style.display = "none";
            app.nativeState = null;
        };

        app.renderSettings = function () {
            if (!app.showNativePage()) return false;
            var content = document.getElementById("MyCompanyContent");
            content.innerHTML = "";
            var heading = document.createElement("h3");
            heading.textContent = "Embedded modules";
            content.appendChild(heading);
            Object.keys(app.modules).forEach(function (key) {
                var definition = app.modules[key];
                var row = document.createElement("div");
                row.style.padding = "10px 0";
                row.style.borderBottom = "1px solid rgba(127,127,127,.25)";
                var title = document.createElement("strong");
                title.textContent = definition.label;
                row.appendChild(title);
                var detail = document.createElement("div");
                detail.textContent = getGlobal(definition) ? "Embedded and initialized" : "Embedded - UI is initializing";
                detail.style.opacity = ".8";
                row.appendChild(detail);
                content.appendChild(row);
            });
            app.active = true;
            window.xxcurrentView = 106;
            return false;
        };

        app.showModule = function (key) {
            if (key === "settings") return app.renderSettings();
            var definition = app.modules[key];
            if (!definition) return false;
            app.restoreNativePage();
            app.active = false;
            app.activeModule = key;
            var target = getGlobal(definition);
            if (target && typeof target.open === "function") return target.open();
            if (typeof window.go === "function") return window.go(definition.viewmode);
            window.location.href = "?viewmode=" + definition.viewmode;
            return false;
        };

        app.open = function (event) {
            if (event) { event.preventDefault(); event.stopPropagation(); }
            if (typeof window.go === "function") window.go(1);
            return app.renderSettings();
        };

        app.ensureMenus = function () {
            var mainAnchor = document.getElementById("MainMenuMyDevices");
            if (mainAnchor && mainAnchor.parentNode && !document.getElementById("MainMenuMyCompany")) {
                var main = mainAnchor.cloneNode(false);
                main.id = "MainMenuMyCompany";
                main.textContent = "My Company";
                main.title = "My Company";
                main.href = "#";
                main.onclick = app.open;
                mainAnchor.parentNode.insertBefore(main, mainAnchor.nextSibling);
            }
            var leftAnchor = document.getElementById("LeftMenuMyDevices");
            if (leftAnchor && leftAnchor.parentNode && !document.getElementById("LeftMenuMyCompany")) {
                var left = leftAnchor.cloneNode(true);
                left.id = "LeftMenuMyCompany";
                left.title = "My Company";
                left.href = "#";
                left.onclick = app.open;
                leftAnchor.parentNode.insertBefore(left, leftAnchor.nextSibling);
            }
        };

        bootstrapModules();
        app.ensureWorkspace();
        app.ensureMenus();
        window.setTimeout(app.ensureMenus, 1000);
        window.setTimeout(app.ensureMenus, 3000);
    };

    obj.goPageStart = function (view) {
        if (typeof window !== "undefined" && window.MyCompany && window.MyCompany.active) window.MyCompany.restoreNativePage();
    };

    obj.goPageEnd = function () {
        if (typeof window !== "undefined" && window.MyCompany) window.MyCompany.ensureMenus();
    };

    return obj;
};
