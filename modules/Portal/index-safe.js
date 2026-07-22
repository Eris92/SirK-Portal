"use strict";

var fs = require("fs");
var path = require("path");
var originalFactory = require("./index.js");

var CUSTOM_FILES_KEY = "mycompany-sirk-login";

function isPortalEntry(entry) {
    if (!entry || typeof entry !== "object") return false;
    return entry.name === "mycompany-sirk-portal" ||
        entry.name === CUSTOM_FILES_KEY ||
        entry.myCompanyPortal === true ||
        entry.sirkPortal === true ||
        entry.name === "sirk-portal";
}

function removePortalEntries(current) {
    if (Array.isArray(current)) return current.filter(function (entry) { return !isPortalEntry(entry); });
    if (current && typeof current === "object") {
        var result = Object.assign({}, current);
        Object.keys(result).forEach(function (key) {
            if (key === CUSTOM_FILES_KEY || key === "mycompany-sirk-portal" || isPortalEntry(result[key])) delete result[key];
        });
        return result;
    }
    return {};
}

function portalSettings(context) {
    var current = context.settings.read();
    return current && current.modules && current.modules.portal || {};
}

function meshServer(context) {
    return context && context.parent && context.parent.parent;
}

function copyLoginAssets(context) {
    var server = meshServer(context);
    if (!server || !server.datapath) throw new Error("MeshCentral datapath is unavailable.");
    var webRoot = path.join(path.dirname(server.datapath), "meshcentral-web", "public");
    var scripts = path.join(webRoot, "scripts");
    var styles = path.join(webRoot, "styles");
    fs.mkdirSync(scripts, { recursive: true });
    fs.mkdirSync(styles, { recursive: true });
    fs.copyFileSync(path.join(context.pluginRoot, "public", "sirk-login.js"), path.join(scripts, "mycompany-sirk-login.js"));
    fs.copyFileSync(path.join(context.pluginRoot, "public", "sirk-login.css"), path.join(styles, "mycompany-sirk-login.css"));
}

function loginCustomEntry() {
    return {
        name: CUSTOM_FILES_KEY,
        myCompanyLogin: true,
        css: ["mycompany-sirk-login.css"],
        js: ["mycompany-sirk-login.js"],
        scope: ["all"]
    };
}

function applyLoginIntegration(context) {
    var server = meshServer(context);
    var config = server && server.config;
    if (!config || !config.domains || typeof config.domains !== "object") return;
    var enabled = portalSettings(context).loginPanel === true;
    if (enabled) copyLoginAssets(context);
    Object.keys(config.domains).forEach(function (domainId) {
        var domain = config.domains[domainId];
        if (!domain || typeof domain !== "object") return;
        var current = domain.customFiles != null ? domain.customFiles : domain.customfiles;
        var cleaned = removePortalEntries(current);
        if (enabled) {
            if (Array.isArray(cleaned)) cleaned.push(loginCustomEntry());
            else cleaned[CUSTOM_FILES_KEY] = loginCustomEntry();
            domain.newAccounts = false;
            domain.newaccounts = false;
        }
        domain.customFiles = cleaned;
        domain.customfiles = cleaned;
    });
}

module.exports.createModule = function (context) {
    var module = originalFactory.createModule(context);
    var originalInitialize = module.initialize;
    var originalApiGet = module.apiGet;
    var originalApiPost = module.apiPost;
    var originalClientConfig = module.clientConfig;

    module.initialize = function () {
        return Promise.resolve(originalInitialize.call(module)).then(function (value) {
            applyLoginIntegration(context);
            return value;
        }, function (error) {
            applyLoginIntegration(context);
            throw error;
        });
    };

    module.apiGet = function (asset, req, user) {
        if (asset === "devices") {
            if (!user) return Promise.reject(new Error("Permission denied."));
            return Promise.resolve(context.device.visibleNodes(user)).then(function (value) {
                return { ok: true, nodes: value && value.nodes || [], meshes: value && value.meshes || [] };
            });
        }
        return Promise.resolve(originalApiGet.call(module, asset, req, user)).then(function (value) {
            if (value && value.vendor) value.vendor.earlyOverlay = false;
            return value;
        });
    };

    module.apiPost = function (asset, req, user) {
        var body = req && req.body || {};
        return Promise.resolve(originalApiPost.call(module, asset, req, user)).then(function (value) {
            return context.settings.update(function (current) {
                current.modules.portal = current.modules.portal || {};
                if (typeof body.showNativeLink === "boolean") current.modules.portal.showNativeLink = body.showNativeLink;
                if (typeof body.loginPanel === "boolean") current.modules.portal.loginPanel = body.loginPanel;
                return current;
            }).then(function () {
                applyLoginIntegration(context);
                var settings = portalSettings(context);
                if (value && typeof value === "object") value.module = settings;
                return value;
            });
        });
    };

    module.clientConfig = function () {
        var value = originalClientConfig.call(module);
        var settings = portalSettings(context);
        value.showLauncher = settings.showLauncher !== false;
        value.showNativeLink = settings.showNativeLink !== false;
        value.loginPanel = settings.loginPanel === true;
        value.earlyOverlay = false;
        value.loginIntegration = settings.loginPanel === true;
        return value;
    };

    return module;
};
