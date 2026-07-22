"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var root = path.resolve(__dirname, "..");

var required = [
    "MyCompany.js", "plugin-main.js", "plugin-main-1.4.0.js", "MyCompanyAdmin.js",
    "config.json", "package.json",
    "core/runtime.js", "core/runtime-portal.js", "core/approval-service.js", "core/session-persistence.js",
    "core/plugin-admin-service.js", "core/plugin-admin-service-rollback.js", "core/plugin-admin-service-backup-discovery.js",
    "core/server-admin-service.js", "core/atomic-json.js", "core/settings-store.js", "core/script-library.js",
    "core/folder-access.js", "core/script-confirmation-library.js", "core/script-admin-service.js",
    "core/server-script-executor.js", "modules/ApprovalCenter/index.js", "modules/MoveRequests/index.js",
    "modules/MyCommands/index.js", "modules/MyScripts/index.js", "modules/MyJira/index.js",
    "modules/DefenderTools/index.js", "modules/Portal/index.js", "public/approvalcenter.js",
    "public/myscripts.js", "public/mycommands.js", "public/portal.js", "public/portal-management.js",
    "public/portal.css", "public/runtime.js", "public/module-shell.js", "public/core.js",
    "public/shared-ui/results.js", "public/shared-ui/script-tools.js",
    "public/shared-ui/confirm-execution-form.js", "public/shared-ui/result-layout.js",
    "web/admin.js", "web/admin-layout.js", "web/admin.css", "web/admin-portal.js",
    "web/admin-plugin-updates.js", "web/admin-marketplace.js", "views/MyCompany.handlebars",
    "marketplace.json", "seed/MyScripts", "seed/MyCommands"
];

function read(relative) {
    return fs.readFileSync(path.join(root, relative), "utf8");
}

function need(source, value, message, errors) {
    if (source.indexOf(value) < 0) errors.push(message);
}

function reject(source, value, message, errors) {
    if (source.indexOf(value) >= 0) errors.push(message);
}

function validateSyntax() {
    var errors = [];
    required.filter(function (relative) { return /\.js$/i.test(relative); }).forEach(function (relative) {
        if (!fs.existsSync(path.join(root, relative))) return;
        try { new Function(read(relative)); }
        catch (error) { errors.push("Syntax error in " + relative + ": " + error.message); }
    });
    if (errors.length) throw new Error(errors.join("\n"));
}

function validateArchitecture() {
    var errors = [];
    required.forEach(function (relative) {
        if (!fs.existsSync(path.join(root, relative))) errors.push("Missing: " + relative);
    });

    var config = JSON.parse(read("config.json").replace(/^\uFEFF/, ""));
    var packageConfig = JSON.parse(read("package.json").replace(/^\uFEFF/, ""));
    if (config.shortName !== "MyCompany") errors.push("config.shortName must be MyCompany.");
    if (config.version !== packageConfig.version) errors.push("config.json and package.json versions must match.");

    var pluginMain = read("plugin-main.js");
    need(pluginMain, 'var browserVersion = "' + config.version + '"', "Browser bootstrap version must match config.json.", errors);
    ["mycompany-shared-tree", "mycompany-shared-catalog", "mycompany-shared-results", "mycompany-shared-script-tools"].forEach(function (value) {
        need(pluginMain, value, "Native Commands dependency missing from browser bootstrap: " + value, errors);
    });
    if (pluginMain.indexOf("mycompany-shared-tree") > pluginMain.indexOf("mycompany-shared-catalog")) {
        errors.push("Native Commands catalog must load after the shared tree.");
    }

    var pluginAdmin = read("core/plugin-admin-service.js");
    [
        "shared.isSiteAdmin",
        "protectedShortName",
        'backupPlugin(plugin, "removed")',
        'parsed.protocol !== "https:"',
        "parsed.username || parsed.password",
        "disablePlugin",
        "removePlugin",
        "installPlugin",
        "backupPlugin(plugin, \"before-update-\"",
        "restoreBackup(plugin, payload.backupId)"
    ].forEach(function (value) {
        need(pluginAdmin, value, "Secure plugin administration missing: " + value, errors);
    });

    var rollback = read("core/plugin-admin-service-rollback.js");
    ["listBackups", 'action === "backups"', 'action === "rollback"'].forEach(function (value) {
        need(rollback, value, "Plugin rollback adapter missing: " + value, errors);
    });

    var discovery = read("core/plugin-admin-service-backup-discovery.js");
    ["candidateRoots", "normalizeAll", "plugin-backups"].forEach(function (value) {
        need(discovery, value, "Backup discovery integration missing: " + value, errors);
    });

    var adminServer = read("MyCompanyAdmin.js");
    [
        "plugin-admin-service-backup-discovery.js",
        'action === "plugin-state"',
        'action === "plugin-operation"',
        'action === "server-state"',
        'action === "server-restart"',
        '"marketplace.json"',
        '"admin-marketplace.js"'
    ].forEach(function (value) {
        need(adminServer, value, "Administrative operations integration missing: " + value, errors);
    });

    var serverAdmin = read("core/server-admin-service.js");
    ["shared.isSiteAdmin", "Get-CimInstance Win32_Service", "Service does not belong", "Restart-Service", "-EncodedCommand"].forEach(function (value) {
        need(serverAdmin, value, "Secure server administration missing: " + value, errors);
    });

    var marketplace = JSON.parse(read("marketplace.json").replace(/^\uFEFF/, ""));
    if (!marketplace || !Array.isArray(marketplace.plugins) || marketplace.plugins.length < 1) {
        errors.push("Marketplace catalog must contain at least one plugin.");
    } else {
        marketplace.plugins.forEach(function (entry) {
            if (!entry.name || !entry.shortName || !entry.configUrl) errors.push("Marketplace entry is incomplete.");
            if (String(entry.configUrl).indexOf("https://") !== 0) errors.push("Marketplace configUrl must use HTTPS.");
        });
    }

    var portalModule = read("modules/Portal/index.js");
    ["validateBundledAssets", "vendorReady", "forceNewLogin", "forcePortalInterface", "updateViews", "VIEW_KEYS"].forEach(function (value) {
        need(portalModule, value, "Portal server module missing: " + value, errors);
    });
    ["sessionPersistence.configure", "keepSessionsAfterRestart", "serviceRestartRequired", "sessionKeyManaged"].forEach(function (value) {
        need(portalModule, value, "Portal session persistence integration missing: " + value, errors);
    });
    ["raw.githubusercontent.com", "ensureVendorAssets", "copyEarlyAssets"].forEach(function (value) {
        reject(portalModule, value, "Portal server must not download or mutate runtime assets: " + value, errors);
    });

    var sessionManager = read("core/session-persistence.js");
    ["crypto.randomBytes(64)", "SessionKey", "config-backups", "managedExternally", "sessionKeyHash"].forEach(function (value) {
        need(sessionManager, value, "Secure session persistence manager missing: " + value, errors);
    });

    var portal = read("public/portal.js");
    ["MyCompanyPortalManagement.mount", 'core.assetUrl("", "portal-management.js")', 'mountModule("approvalcenter"', "sirk-settings-frame"].forEach(function (value) {
        need(portal, value, "Portal adapter missing: " + value, errors);
    });

    var management = read("public/portal-management.js");
    ["sirk-management-shell", 'core.api("myscripts"', 'core.post("myscripts"', "openDefinitionEditor", "openCredentialsEditor", "toggleFavorite"].forEach(function (value) {
        need(management, value, "Native management renderer missing: " + value, errors);
    });

    var adminView = read("views/MyCompany.handlebars");
    ['data-tab="plugins"', 'data-tab="server"', "asset=admin-plugin-updates.js", "asset=admin-marketplace.js"].forEach(function (value) {
        need(adminView, value, "Administration view integration missing: " + value, errors);
    });

    if (fs.existsSync(path.join(root, ".gitmodules"))) errors.push(".gitmodules is not allowed.");
    if (errors.length) throw new Error(errors.join("\n"));
}

function validateSettingsWriter() {
    var atomicJson = require(path.join(root, "core", "atomic-json.js"));
    var directory = fs.mkdtempSync(path.join(os.tmpdir(), "mycompany-settings-"));
    var filePath = path.join(directory, "settings.json");
    return atomicJson.write(fs, path, filePath, { version: 1, enabled: true }).then(function () {
        return atomicJson.write(fs, path, filePath, { version: 2, enabled: false });
    }).then(function () {
        var value = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (value.version !== 2 || value.enabled !== false) throw new Error("Settings writer returned invalid data.");
    }).finally(function () {
        fs.rmSync(directory, { recursive: true, force: true });
    });
}

Promise.resolve()
    .then(validateSyntax)
    .then(validateArchitecture)
    .then(validateSettingsWriter)
    .then(function () {
        console.log("JavaScript syntax validation: OK");
        console.log("Native Portal management architecture: OK");
        console.log("Settings writer validation: OK");
    })
    .catch(function (error) {
        console.error(error && error.stack || error);
        process.exit(1);
    });
