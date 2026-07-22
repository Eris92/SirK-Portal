"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var root = path.resolve(__dirname, "..");

var required = [
    "MyCompany.js", "plugin-main.js", "plugin-main-1.4.0.js", "MyCompanyAdmin.js",
    "config.json", "package.json",
    "core/runtime.js", "core/runtime-portal.js", "core/approval-service.js", "core/session-persistence.js",
    "core/plugin-admin-service.js", "core/server-admin-service.js",
    "core/atomic-json.js", "core/settings-store.js", "core/script-library.js", "core/folder-access.js",
    "core/script-confirmation-library.js", "core/script-admin-service.js",
    "core/server-script-executor.js",
    "modules/ApprovalCenter/index.js", "modules/MoveRequests/index.js",
    "modules/MyCommands/index.js", "modules/MyScripts/index.js",
    "modules/MyJira/index.js", "modules/DefenderTools/index.js", "modules/Portal/index.js",
    "public/approvalcenter.js", "public/myscripts.js", "public/mycommands.js",
    "public/portal.js", "public/portal-management.js", "public/portal.css",
    "public/runtime.js", "public/module-shell.js", "public/core.js",
    "public/shared-ui/results.js", "public/shared-ui/script-tools.js",
    "public/shared-ui/confirm-execution-form.js", "public/shared-ui/result-layout.js",
    "web/admin.js", "web/admin-layout.js", "web/admin.css", "web/admin-portal.js", "views/MyCompany.handlebars",
    "seed/MyScripts", "seed/MyCommands"
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

    var entrypoints = fs.readdirSync(root).filter(function (name) {
        return name.toLowerCase() === "mycompany.js";
    });
    if (entrypoints.length !== 1 || entrypoints[0] !== "MyCompany.js") {
        errors.push("Exactly one case-insensitive MyCompany.js entrypoint is required.");
    }
    if (fs.existsSync(path.join(root, ".gitmodules"))) errors.push(".gitmodules is not allowed.");

    var runtimePortal = read("core/runtime-portal.js");
    ["PORTAL_DEFAULTS", "PORTAL_VIEW_DEFAULTS", "enabled: false", "personalized: false", "forceNewLogin: false", "forcePortalInterface: false", "runtime.modules.portal", "portalFactory.createModule"].forEach(function (value) {
        need(runtimePortal, value, "Portal runtime integration missing: " + value, errors);
    });

    var portalModule = read("modules/Portal/index.js");
    ["validateBundledAssets", "vendorReady", "showLauncher: value.showLauncher === true", "forceNewLogin", "forcePortalInterface", "updateViews", "VIEW_KEYS"].forEach(function (value) {
        need(portalModule, value, "Portal server module missing: " + value, errors);
    });
    ["sessionPersistence.configure", "keepSessionsAfterRestart", "serviceRestartRequired", "sessionKeyManaged"].forEach(function (value) {
        need(portalModule, value, "Portal session persistence integration missing: " + value, errors);
    });
    var sessionManager = read("core/session-persistence.js");
    ["crypto.randomBytes(64)", "SessionKey", "config-backups", "managedExternally", "sessionKeyHash"].forEach(function (value) {
        need(sessionManager, value, "Secure session persistence manager missing: " + value, errors);
    });
    ["raw.githubusercontent.com", "ensureVendorAssets", "setEarlyOverlay", "copyEarlyAssets", "portalCustomEntry"].forEach(function (value) {
        reject(portalModule, value, "Portal server must not mutate MeshCentral UI or download runtime assets: " + value, errors);
    });

    var portal = read("public/portal.js");
    [
        'data-sirk-view", "management"',
        'automation: "Automatyzacja"',
        'management: "Zarządzanie"',
        "MyCompanyPortalManagement.mount",
        'core.assetUrl("", "portal-management.js")',
        'mountModule("approvalcenter"',
        "sirk-settings-frame"
    ].forEach(function (value) {
        need(portal, value, "Portal adapter missing: " + value, errors);
    });
    reject(portal, "sirk-management-workspace-0.3.6.js", "Legacy management workspace must not be loaded.", errors);
    reject(portal, 'mountModule("myscripts"', "MyScripts must not be mounted as .mc-shared-page in Portal management.", errors);
    reject(portal, 'automation: "management"', "Automation and Management must remain separate Portal views.", errors);

    var management = read("public/portal-management.js");
    [
        "sirk-management-shell", "sirk-management-toolbar", "sirk-management-workspace",
        'core.api("myscripts"', 'core.post("myscripts"',
        'post("request"', 'api("results"', 'api("script"',
        "openDefinitionEditor", "openCredentialsEditor", "toggleFavorite",
        "confirmedExecution", "SharedResultsView.mountTable", "SharedResultsView.mountResult"
    ].forEach(function (value) {
        need(management, value, "Native management renderer missing: " + value, errors);
    });
    reject(management, "MyCompanyModules.myscripts.mount", "Native management renderer must not mount MyScripts UI.", errors);
    reject(management, "mc-shared-page", "Native management renderer must not create .mc-shared-page.", errors);

    var portalCss = read("public/portal.css");
    [
        ".sirk-management-shell", ".sirk-management-tool", ".sirk-management-workspace",
        ".sirk-management-item", ".sirk-script-action", ".sirk-form-row",
        ".mc-results-table", ".mc-results-debug"
    ].forEach(function (value) {
        need(portalCss, value, "Portal native theme missing: " + value, errors);
    });

    var adminServer = read("MyCompanyAdmin.js");
    ["portal.js", "portal-management.js", "portal.css", "shared-ui/results.js", "shared-ui/script-tools.js"].forEach(function (value) {
        need(adminServer, '"' + value + '"', "Admin asset server missing: " + value, errors);
    });
    var browserBootstrap = read("plugin-main.js");
    ["mycompany-shared-tree", "mycompany-shared-catalog", "mycompany-shared-results", "mycompany-shared-script-tools"].forEach(function (value) {
        need(browserBootstrap, value, "Native Commands dependency missing from browser bootstrap: " + value, errors);
    });
    if (browserBootstrap.indexOf("mycompany-shared-tree") > browserBootstrap.indexOf("mycompany-shared-catalog")) {
        errors.push("Native Commands catalog must load after the shared tree.");
    }
    var toolbarConfig = read("public/shared-ui/toolbar-config.js");
    ["function svg(path)", "expandIcon: svg(", "favorites: { title", "manage: { title", "refresh: { title", "search: { title"].forEach(function (value) {
        need(toolbarConfig, value, "Shared toolbar SVG icon contract missing: " + value, errors);
    });
    ["◀", "★", "✎", "↻", "⌕"].forEach(function (value) {
        reject(toolbarConfig, 'icon: "' + value + '"', "Shared toolbar must not render legacy text glyph: " + value, errors);
    });
    var toolbarRenderer = read("public/shared-ui/toolbar.js");
    var toolbarApi = read("public/shared-ui/toolbar-api.js");
    need(toolbarRenderer, 'value.firstChild.innerHTML = icon', "Shared toolbar must render trusted SVG icons.", errors);
    need(toolbarApi, 'icon.innerHTML = text', "Shared toolbar API must update directional SVG icons.", errors);
    var moduleShell = read("public/module-shell.js");
    ["syncCollapseControl(page)", "collapsed ? control.expandIcon : control.icon", "page.layout.toggleCollapsed(); syncCollapseControl(page)"].forEach(function (value) {
        need(moduleShell, value, "Shared toolbar collapse direction contract missing: " + value, errors);
    });

    var portalModule = read("modules/Portal/index.js");
    ["folderAccess.canAccess", "groupIds:", "visibleViews(user)", "viewAllowed(user, key)", "canAccessView: viewAllowed"].forEach(function (value) {
        need(portalModule, value, "Portal menu authorization contract missing: " + value, errors);
    });
    var portalSafe = read("modules/Portal/index-safe.js");
    ["module.canAccessView", 'module.canAccessView(user, "devices")', "originalClientConfig.call(module, user)"].forEach(function (value) {
        need(portalSafe, value, "Portal device authorization wrapper missing: " + value, errors);
    });
    var runtimePortal = read("core/runtime-portal.js");
    need(runtimePortal, "module.clientConfig(user)", "Runtime bootstrap must build Portal navigation for the current user.", errors);
    ["plugin-admin-service.js", "server-admin-service.js", 'action === "plugin-state"', 'action === "plugin-operation"', 'action === "server-state"', 'action === "server-restart"'].forEach(function (value) {
        need(adminServer, value, "Administrative operations integration missing: " + value, errors);
    });
    var pluginAdmin = read("core/plugin-admin-service.js");
    ["shared.isSiteAdmin", "protectedShortName", "backupBeforeRemoval", "Only HTTPS", "disablePlugin", "removePlugin", "installPlugin"].forEach(function (value) {
        need(pluginAdmin, value, "Secure plugin administration missing: " + value, errors);
    });
    var serverAdmin = read("core/server-admin-service.js");
    ["shared.isSiteAdmin", "Get-CimInstance Win32_Service", "Service does not belong", "Restart-Service", "-EncodedCommand"].forEach(function (value) {
        need(serverAdmin, value, "Secure server administration missing: " + value, errors);
    });

    var standaloneServer = read("plugin-main-standalone.js");
    ["mycompany/api/v1/approval", "approvalcenter/api/v1", "Idempotency-Key", "decideExternal", "getProviderResources"].forEach(function (value) {
        need(standaloneServer, value, "Approval API route contract missing: " + value, errors);
    });

    var myScriptsServer = read("modules/MyScripts/index.js");
    ["confirmedExecution", "Execution confirmation is required", 'asset === "definition"', 'asset === "script-secrets"'].forEach(function (value) {
        need(myScriptsServer, value, "MyScripts backend missing: " + value, errors);
    });

    var myScripts = read("public/myscripts.js");
    ["confirmExecution", "confirmedExecution", "SharedResultsView.mountTable", "openDefinitionEditor", "openCredentialsEditor"].forEach(function (value) {
        need(myScripts, value, "Native MyScripts UI regression: " + value, errors);
    });

    var adminPortal = read("web/admin-portal.js");
    ["Enable SirK Portal", "mc-admin-actions mc-admin-settings-savebar", "Save settings", "defaultView", "showLauncher", "Wymuszaj nowy ekran logowania", "Wymuszaj nowy interfejs", "Włącz personalizację", "Pokaż zakładkę", "views: views"].forEach(function (value) {
        need(adminPortal, value, "Portal admin integration missing: " + value, errors);
    });

    var adminUi = read("web/admin.js");
    ['{ key: "folderpermissions", title: "Uprawnienia folderów" }', "folderPermissionsSettings", "data.folderPermissions", "Folder włączony", "Grupy z dostępem"].forEach(function (value) {
        need(adminUi, value, "Folder permissions administration missing: " + value, errors);
    });
    var folderAccess = read("core/folder-access.js");
    ["function canAccess", "rule.enabled === false", "shared.isSiteAdmin(user)", "shared.isUserInAnyGroup", "function requirePath"].forEach(function (value) {
        need(folderAccess, value, "Folder access enforcement missing: " + value, errors);
    });
    [
        '{ key: "portal", title: "SirK Portal" }',
        '{ key: "approvalcenter", title: "Approval Center" }',
        '{ key: "moverequests", title: "Move Request" }',
        '{ key: "mycommands", title: "My Commands" }',
        '{ key: "myscripts", title: "My Scripts" }',
        '{ key: "myjira", title: "My Jira" }',
        '{ key: "defendertools", title: "Defender XDR" }',
        'settingsSection === "approvalcenter") approvalSettings(panel)',
        'settingsSection === "myscripts") myScriptsSettings(panel)',
        'settingsSection === "defendertools") defenderSettings(panel)',
        '{ key: "config", title: "Config" }',
        '{ key: "logs", title: "Logi" }',
        '{ key: "errors", title: "Błędy" }',
        "Tylko do odczytu: ogólny stan wszystkich modułów MyCompany.",
        '"Module: " + (module.enabled ? "Enabled" : "Disabled")',
        "mc-admin-actions mc-admin-settings-savebar",
        "Provider visibility and approver groups. Required levels are selected separately in each script definition.",
        "data.diagnostics"
    ].forEach(function (value) {
        need(adminUi, value, "Three-column administration contract missing: " + value, errors);
    });
    ['active === "plugins"', 'active === "server"', 'postAdminAction("plugin-operation"', 'postAdminAction("server-restart"', "mc-admin-table", "window.confirm"].forEach(function (value) {
        need(adminUi, value, "Plugin/server administration UI missing: " + value, errors);
    });
    var adminView = read("views/MyCompany.handlebars");
    ['data-tab="plugins"', 'data-tab="server"'].forEach(function (value) {
        need(adminView, value, "First-column administration entry missing: " + value, errors);
    });
    reject(adminUi, '"Module enabled"', "Overview must not expose module enable controls.", errors);
    reject(adminUi, "renderSaveBar(content)", "Overview must not expose a save action.", errors);

    var adminLayout = read("web/admin-layout.js");
    ["mc-admin-middle", "has-middle", "mc-admin-debug-nav", "mc-admin-section-nav"].forEach(function (value) {
        need(adminLayout, value, "Administration column layout missing: " + value, errors);
    });
    ["mc-admin-management-shell", "mc-admin-management-toolbar", "mycompany.admin.managementCollapsed", "mc-admin-management-item-icon"].forEach(function (value) {
        need(adminLayout, value, "Management-style administration shell missing: " + value, errors);
    });
var adminCss = read("web/admin.css");
    need(adminCss, "grid-template-columns: minmax(165px, 205px) minmax(255px, 305px) minmax(520px, 1fr)", "Administration must expose the My Scripts three-column proportions.", errors);
    [".mc-admin-management-shell", "grid-template-columns:184px 236px minmax(0,1fr)", ".mc-admin-management-toolbar", ".mc-admin-management-shell.is-collapsed", "grid-template-columns:56px 236px minmax(0,1fr)"].forEach(function (value) {
        need(adminCss, value, "Management-style administration CSS missing: " + value, errors);
    });
    ['#sirkPortalRoot #mycompany-admin>h2', '#sirkPortalRoot #mycompany-admin>.mc-admin-subtitle', '#sirkPortalRoot #mycompany-admin>.mc-admin-management-shell{border:0;border-radius:0}'].forEach(function (value) {
        need(adminCss, value, "Embedded Settings must not duplicate its title or outer frame: " + value, errors);
    });
    [".mc-admin-settings-savebar", "position: sticky", "display: flex"].forEach(function (value) {
        need(adminCss, value, "Unified settings save bar missing: " + value, errors);
    });
    ["table-layout: fixed", "overflow-wrap: anywhere", ".mc-admin-table th:nth-child(5) { width: 145px; }", "overflow-x: hidden"].forEach(function (value) {
        need(adminCss, value, "Responsive plugin table contract missing: " + value, errors);
    });
    ["mc-admin-plugin-table", "mc-admin-plugin-name", "mc-admin-plugin-description"].forEach(function (value) {
        need(adminUi, value, "Plugin table semantic column missing: " + value, errors);
    });
    [".mc-admin-plugin-table th:nth-child(1) { width: 190px; }", ".mc-admin-plugin-name strong", "white-space: nowrap", ".mc-admin-plugin-description", "white-space: normal"].forEach(function (value) {
        need(adminCss, value, "Plugin name/description wrapping contract missing: " + value, errors);
    });

    var adminEnhancements = read("web/admin-ui-enhancements.js");
    reject(adminEnhancements, "addMissingProviders(panel);", "Enhancements must not add provider-specific save forms.", errors);
    reject(adminEnhancements, "addSaveProxy(cards", "Settings cards must not receive inline save proxies.", errors);

    var approvalUi = read("public/approvalcenter.js");
    ["mc-approval-icon-", "iconKey: provider.type", "iconKey: status.key", 'iconKey: "overview"'].forEach(function (value) {
        need(approvalUi, value, "Native Approval Center icon contract missing: " + value, errors);
    });
    var nativeApprovalCss = read("public/native-approval.css");
    [".mc-approval-icon-moverequests", ".mc-approval-icon-mycommands", ".mc-approval-icon-myscripts", ".mc-approval-icon-approved", ".mc-approval-icon-pending", ".mc-approval-icon-rejected"].forEach(function (value) {
        need(nativeApprovalCss, value, "Native Approval Center icon styling missing: " + value, errors);
    });

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
