"use strict";

var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..");
var errors = [];

var required = [
    "MyCompany.js", "plugin-main.js", "plugin-main-standalone.js", "plugin-main-1.4.0.js", "MyCompanyAdmin.js",
    "config.json", "package.json", "core/runtime.js", "core/runtime-portal.js", "core/device-service.js", "core/session-persistence.js",
    "modules/Portal/index-safe.js", "modules/MyScripts/index.js", "modules/ApprovalCenter/index.js",
    "public/portal-standalone.html", "public/portal-standalone.css", "public/portal-standalone-devices.css", "public/portal-standalone.js", "public/portal-module-shell.css",
    "public/portal-login.html", "public/portal-login.css", "public/portal-login.js",
    "public/portal-device-workspace.js", "public/portal-device-workspace.css", "public/portal-link-visibility.js",
    "public/sirk-login.js", "public/sirk-login.css", "public/standalone-core.js", "public/portal-management.js",
    "public/portal-folder-collapse.js", "public/portal-subfolder-icons.js", "public/native-portal-launcher.js",
    "public/approvalcenter.js", "public/shared-ui/script-tools.js", "public/shared-ui/results.js"
];

function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function need(source, value, message) { if (source.indexOf(value) < 0) errors.push(message); }

required.forEach(function (file) { if (!fs.existsSync(path.join(root, file))) errors.push("Missing: " + file); });
required.filter(function (file) { return /\.js$/i.test(file) && fs.existsSync(path.join(root, file)); }).forEach(function (file) {
    try { new Function(read(file)); }
    catch (error) { errors.push("Syntax error in " + file + ": " + error.message); }
});

var config = JSON.parse(read("config.json").replace(/^\uFEFF/, ""));
var pkg = JSON.parse(read("package.json").replace(/^\uFEFF/, ""));
if (config.version !== pkg.version) errors.push("config.json and package.json versions must match.");

var wrapper = read("plugin-main-standalone.js");
["hook_setupHttpHandlers", 'base + "sirkportal"', 'base + "meshcentral"', 'base + "pluginadmin.ashx"', 'base + "logout"', 'base + "userimage.ashx"', "portal-standalone.html"].forEach(function (value) {
    need(wrapper, value, "Standalone route contract missing: " + value);
});
["portalLoginHtml", "portal-login.html", "installForcedNavigation", "forcePortalInterface", "forceNewLogin", "sirkAuth"].forEach(function (value) {
    need(wrapper, value, "Forced Portal routing contract missing: " + value);
});
var portalHtmlBody = wrapper.slice(wrapper.indexOf("function portalHtml(base)"), wrapper.indexOf("function portalLoginHtml(base)"));
['.replace(/__LOGOUT_URL_JSON__/g', '.replace(/__USER_IMAGE_URL_JSON__/g', '.replace(/__DEFAULT_USER_IMAGE_URL_JSON__/g'].forEach(function (value) {
    need(portalHtmlBody, value, "Standalone Portal must replace the user-menu URL placeholder: " + value);
});
need(wrapper, "webserver.app.get(portalPath, servePortal)", "Slashless Portal route must be served directly.");
need(wrapper, "webserver.app.get(portalPathSlash, servePortal)", "Slash Portal route must be served directly.");
if (wrapper.indexOf("plugin.exports.push(\"hook_setupHttpHandlers\")") >= 0) errors.push("Backend HTTP hooks must not be exported to the browser.");

var html = read("public/portal-standalone.html");
['id="sirkPortalRoot"', 'id="sirkStandaloneRoot"', "standalone-core.js", "portal-standalone.js", "portal-device-workspace.js", "portal-link-visibility.js"].forEach(function (value) {
    need(html, value, "Standalone document missing: " + value);
});
need(html, 'data-view="management"', "Standalone navigation must include Management.");
need(html, 'data-view="security"', "Standalone navigation must include Security.");
need(html, '<b>Bezpieczeństwo</b>', "Polish initial navigation must label Security as Bezpieczeństwo.");
need(html, 'data-action="language"', "Standalone navigation must include the language control.");
need(html, 'class="sirk-standalone-native"', "Standalone navigation must include native MeshCentral link.");
need(html, 'localStorage.getItem("mycompany.sirkportal.standaloneCollapsed")', "Collapsed sidebar state must be applied before the sidebar markup is rendered.");
need(html, 'document.getElementById("sirkStandaloneRoot").classList.add("is-collapsed")', "Collapsed sidebar must avoid an expanded first paint.");
['id="sirkUserMenu"', 'id="sirkUserName"', 'id="sirkUserImage"', 'data-action="logout"', "__LOGOUT_URL_JSON__", "__USER_IMAGE_URL_JSON__"].forEach(function (value) {
    need(html, value, "Standalone user tile missing: " + value);
});

var app = read("public/portal-standalone.js");
need(app, 'security: "Bezpieczeństwo"', "Polish runtime navigation must translate Security as Bezpieczeństwo.");
['core.api("", "bootstrap")', 'core.api("portal", "devices")', 'var STORAGE_LANGUAGE = "sirkPortal.language"', 'name === "language"', "MyCompanyPortalManagement.mount", 'initializeModule("approvalcenter")', "viewEnabled", "sirk-unified-content", 'view !== "devices"', "THEME_ICONS", "syncThemeButton", 'data-theme-icon'].forEach(function (value) {
    need(app, value, "Standalone app contract missing: " + value);
});
if (app.indexOf('initializeModule("myscripts")') >= 0) errors.push("Standalone Portal must not initialize the legacy MyScripts UI.");
var treeDependency = app.indexOf('["sirk-shared-tree", "shared-ui/tree.js"]');
var catalogDependency = app.indexOf('["sirk-shared-catalog", "shared-ui/catalog.js"]');
var commandsDependency = app.indexOf('["sirk-commands-module", "mycommands.js"]');
if (treeDependency < 0 || catalogDependency < treeDependency || commandsDependency < catalogDependency) {
    errors.push("Commands catalog dependencies must load in tree -> catalog -> module order.");
}
["applyUserProfile", "bootstrap.user", "__MYCOMPANY_LOGOUT_URL__", "__MYCOMPANY_USER_IMAGE_URL__", 'name === "user-menu"', 'name === "logout"'].forEach(function (value) {
    need(app, value, "Standalone user menu behavior missing: " + value);
});
var deviceWorkspace = read("public/portal-device-workspace.js");
['["general", "desktop", "terminal", "commands", "files"', 'function renderCommandsTab(host, node)', 'module.mountDeviceCommands', 'id="sirkQuickCommandsToggle"', 'core.api("mycommands", "scripts")', 'core.post("mycommands", "execute", payload)', 'response.request && response.request.status === "pending"'].forEach(function (value) {
    need(deviceWorkspace, value, "Device Commands integration missing: " + value);
});
need(deviceWorkspace, 'var DEVICE_ICON = \'<svg class="sirk-device-computer-svg"', "Device workspace must render the shared computer SVG.");
['Desktop is not connected. Choose a method and click Connect.', 'frame.classList.add("is-session-visible")', 'frame.classList.remove("is-session-visible")', 'showBridgeOverlay(t("ready"), false)'].forEach(function (value) {
    need(deviceWorkspace, value, "Disconnected native desktop protection missing: " + value);
});
need(app, 'var DEVICE_ICON = \'<svg class="sirk-device-computer-svg"', "Device list and details must render the shared computer SVG.");
if (deviceWorkspace.indexOf("▣") >= 0 || app.indexOf("▣") >= 0) errors.push("Legacy missing-glyph device icon must not remain in Portal renderers.");
var deviceWorkspaceStyle = read("public/portal-device-workspace.css");
need(deviceWorkspaceStyle, 'visibility: hidden;', "Native MeshCentral frame must remain hidden before a device session is prepared.");
need(deviceWorkspaceStyle, '.sirk-native-bridge-frame.is-session-visible', "Prepared native sessions must have an explicit visibility state.");
['.sirk-device-commands-host', '.sirk-quick-commands-toggle', '.sirk-quick-commands-panel', '.sirk-quick-command-browser', '.sirk-quick-command-submit'].forEach(function (value) {
    need(deviceWorkspaceStyle, value, "Device Commands style missing: " + value);
});
var myCommands = read("public/mycommands.js");
need(myCommands, "module.mountDeviceCommands", "My Commands must expose its shared device-workspace mount.");
['mc-portal-placeholder-shell', 'mc-portal-placeholder-content'].forEach(function (value) {
    need(app, value, "Placeholder views must use the shared Portal shell: " + value);
});
var approvalCenter = read("public/approvalcenter.js");
need(approvalCenter, "mc-module-approvalcenter", "Approval Center semantic style hook is missing.");
["sirk-management-shell", "sirk-management-workspace", "sirk-management-column", "sirk-management-toolbar"].forEach(function (value) {
    if (approvalCenter.indexOf(value) >= 0) errors.push("Approval Center must not mix legacy layout classes with SharedPage: " + value);
});
var folderCollapse = read("public/portal-folder-collapse.js");
need(folderCollapse, ".sirk-folder-heading.is-active", "Second-column folders must expose first-column-style active selection.");
if (folderCollapse.indexOf("sirk-folder-chevron") >= 0) errors.push("Second-column folders must not render a chevron icon.");
['var activeShell = null', 'currentRoot !== activeRoot', 'expanded = {}', 'expanded[key] === true', 'data-management-open-path', 'openPath.indexOf(folderPath + "/") === 0'].forEach(function (value) {
    need(folderCollapse, value, "Second-column default-collapse contract missing: " + value);
});
if (folderCollapse.indexOf("expandedFolders.v2") >= 0 || folderCollapse.indexOf("localStorage.setItem(STORAGE_KEY") >= 0) {
    errors.push("Second-column folder expansion must reset on entry and primary-root changes.");
}
var portalManagement = read("public/portal-management.js");
if (/toolButton\(["']link["'],\s*["']Copy link["']/.test(portalManagement)) {
    errors.push("Management top toolbar must not include Copy link.");
}
need(portalManagement, "tools.toggleFavorites(null, renderAll)", "Management favorites filter must use the persistent shared toggle.");
need(portalManagement, "tools.toggleFavorite(scriptPath)", "Management per-script favorite action is missing.");
['approval: svg(', "script.requiresApproval ? icons.approval : icons.script", "sirk-script-approval-icon"].forEach(function (value) {
    need(portalManagement, value, "Approval-required script icon contract missing: " + value);
});
need(portalManagement, 'transform="rotate(-12 12 12)"', "Approval hourglass must use the tilted visual variant.");
['function containsVisibleScript(node)', 'visibleRoots = roots().filter', '!tools.state.favoritesOnly || containsVisibleScript(root)', '(node.children || []).filter(containsVisibleScript)'].forEach(function (value) {
    need(portalManagement, value, "Favorites path-filter contract missing: " + value);
});
need(portalManagement, 'classList.toggle("is-management-edit-mode", state.editMode)', "Management must expose edit mode to the shared layout.");
['expand: svg(', 'state.collapsed ? icons.expand : icons.collapse', 'state.collapsed ? t("expand") : t("collapse")', 'collapse.setAttribute("aria-label", collapse.title)'].forEach(function (value) {
    need(portalManagement, value, "Directional Management collapse control missing: " + value);
});
['primaryCollapsed.v1', 'collapsed: loadCollapsedState()', 'function saveCollapsedState()', 'saveCollapsedState();'].forEach(function (value) {
    need(portalManagement, value, "Persistent Management collapse state missing: " + value);
});
need(portalManagement, "Brak ulubionych skryptów.", "Favorites filter must expose a clear empty state.");
need(portalManagement, 'heading.setAttribute("data-folder-path"', "Management folder paths are required for safe deep-link expansion.");
['function consumeDeepLink()', 'url.searchParams.get("myscript")', 'url.searchParams.delete("myscript")', 'openScript(linkedPath, true)'].forEach(function (value) {
    need(portalManagement, value, "Management executable deep-link contract missing: " + value);
});
need(portalManagement, 'script.confirmExecution === true && !window.confirm', "Deep-linked execution must retain the client confirmation gate.");
var scriptTools = read("public/shared-ui/script-tools.js");
need(scriptTools, "toggleFavorite: toggleFavorite", "Shared script tools must expose the favorite toggle.");

var portalRuntime = read("core/runtime-portal.js");
["shared.userName(user)", "hasImage", "accountImageRnd"].forEach(function (value) {
    need(portalRuntime, value, "Portal current-user profile missing: " + value);
});

var safePortal = read("modules/Portal/index-safe.js");
["showNativeLink", "showLauncher", "forceNewLogin", "forcePortalInterface", "keepSessionsAfterRestart"].forEach(function (value) {
    need(safePortal, value, "Independent Portal setting missing: " + value);
});
["applyLoginIntegration", "mycompany-sirk-login.js", "mycompany-sirk-login.css", "customFiles", "customfiles", "removeLegacyIntegrations"].forEach(function (value) {
    if (safePortal.indexOf(value) >= 0) errors.push("Portal must not integrate with the native login UI: " + value);
});
need(safePortal, "delete current.modules.portal.loginPanel", "Legacy login integration setting must be removed.");
var adminPortal = read("web/admin-portal.js");
["Show MeshCentral link in SirK Portal", "Show SirK Portal launcher in native Mesh", "Wymuszaj nowy ekran logowania", "Wymuszaj nowy interfejs", "Utrzymuj sesje po restarcie MeshCentral", "keepSessionsAfterRestart", "Włącz personalizację", "Pokaż zakładkę", "views: views"].forEach(function (value) {
    need(adminPortal, value, "Portal admin switch missing: " + value);
});
if (adminPortal.indexOf("Nie uruchamiaj równolegle starej wtyczki SirKPortal") >= 0) errors.push("Obsolete standalone plugin warning must be removed.");
var visibility = read("public/portal-link-visibility.js");
need(visibility, "showNativeLink", "Standalone Mesh link visibility is not wired.");
var portalServer = read("modules/Portal/index.js");
need(portalServer, "validateBundledAssets", "Portal must validate its bundled assets.");
["VIEW_KEYS", "updateViews", "personalized", "cleanAccent", "enabledCount"].forEach(function (value) {
    need(portalServer, value, "Portal view customization contract missing: " + value);
});
["raw.githubusercontent.com", "ensureVendorAssets", "setEarlyOverlay", "copyEarlyAssets", "portalCustomEntry"].forEach(function (value) {
    if (portalServer.indexOf(value) >= 0) errors.push("Portal server must be standalone and network-free: " + value);
});

var portalBackend = read("modules/Portal/index-safe.js");
need(portalBackend, 'asset === "devices"', "Portal devices API is missing.");
need(portalBackend, "context.device.visibleNodes(user)", "Portal devices API must use the device service.");
var deviceService = read("core/device-service.js");
need(deviceService, "visibleNodes", "Visible device inventory service is missing.");

var portalStyle = read("public/portal-standalone.css");
["sirk-unified-content", "--sirk-view-accent", ".sirk-standalone-nav button[hidden]", ".sirk-user-tile", ".sirk-user-dropdown", ".sirk-user-menu.is-open .sirk-user-dropdown", "#sirkPortalRoot .sirk-standalone-content.sirk-unified-content > .mycompany-management-host"].forEach(function (value) {
    need(portalStyle, value, "Unified Portal style missing: " + value);
});
need(portalStyle, "color: #fff", "Standalone user tile must keep readable text in its hover/open state.");
need(portalStyle, '.sirk-theme-moon path', "Dark-theme control must use the filled moon icon style.");
need(portalStyle, '.is-collapsed .sirk-standalone-controls [data-action="sidebar"] svg', "Collapsed main menu must reverse the sidebar arrow.");
need(portalStyle, "transform: rotate(180deg)", "Collapsed main-menu arrow must point right.");
need(app, 'class="sirk-theme-moon"', "Theme control must render the recognizable moon icon.");
if (/\.sirk-user-menu:(?:hover|focus-within)\s+\.sirk-user-dropdown/.test(portalStyle)) {
    errors.push("Standalone user dropdown must open only from the click-controlled is-open state.");
}
var managementStyle = read("public/portal.css");
["--portal-primary-width:184px", "--portal-primary-width:56px", "--portal-secondary-width:236px", ".is-management-edit-mode .sirk-management-shell{--portal-secondary-width:440px}", ".sirk-management-column:first-child>.sirk-management-list{padding:0}", ".sirk-management-column:nth-child(2)>.sirk-management-list{padding:0}"].forEach(function (value) {
    need(managementStyle, value, "Compact Management column contract missing: " + value);
});
need(managementStyle, ".sirk-script-row.is-active>.sirk-script-open{background:rgba(96,165,250,.16);box-shadow:inset 3px 0 0", "Selected Management scripts must use the shared active-row indicator.");
['[data-script-action="favorite"].is-active', 'fill:currentColor', 'color:#fbbf24'].forEach(function (value) {
    need(managementStyle, value, "Visible active-favorite style missing: " + value);
});
need(managementStyle, '[data-script-action="credentials"].is-active{border-color:rgba(217,154,0,.55)', "Configured credentials must use the visible active-action style.");
need(managementStyle, ".sirk-management-item-icon.sirk-script-approval-icon{color:#d18b00}", "Approval-required script icon color is missing.");
['.sirk-result-status-pending .sirk-result-status-icon', '.sirk-result-status-approved .sirk-result-status-icon', '.sirk-result-status-executing .sirk-result-status-icon', '.sirk-result-status-failed .sirk-result-status-icon'].forEach(function (value) {
    need(managementStyle, value, "Localized result-status icon style missing: " + value);
});
['label: "all"', 'label: "pending"', 'label: "approved"', 'label: "executingStatus"', 'label: "completed"', 'label: "failed"', 'label: "rejected"', 'title: t("scriptResults")'].forEach(function (value) {
    need(portalManagement, value, "Localized result-status menu contract missing: " + value);
});
var moduleShellStyle = read("public/portal-module-shell.css");
[".mc-portal-placeholder-shell", ".mc-portal-placeholder-content", "--portal-primary-width: 184px", "--portal-secondary-width: 236px", ".mc-portal-module-layout:has(.mc-tree-script-actions:not(:empty))", "grid-template-columns: 56px var(--portal-secondary-width)"].forEach(function (value) {
    need(moduleShellStyle, value, "Shared placeholder style missing: " + value);
});
['function prepareModuleHost(view)', 'prepareModuleHost("management")', 'prepareModuleHost("approvals")', 'prepareModuleHost("settings")', 'sirk-settings-module-shell', 'sirk-settings-module-workspace'].forEach(function (value) {
    need(app, value, "Unified Portal mount contract missing: " + value);
});
['.sirk-portal-view-management > .mycompany-management-host', '.mycompany-management-host > .sirk-management-shell', 'border-radius: 0'].forEach(function (value) {
    need(portalStyle, value, "Management shared outer-frame contract missing: " + value);
});
var deviceWorkspaceStyle = read("public/portal-device-workspace.css");
need(deviceWorkspaceStyle, ".sirk-device-commands-host > .mc-shared-page", "Device Commands shared shell is missing.");
need(deviceWorkspaceStyle, "flex-direction: column", "Device Commands must use the same vertical shell flow as Management.");

var standaloneCore = read("public/standalone-core.js");
need(standaloneCore, "__MYCOMPANY_API_BASE__", "Standalone core must use the injected API base.");
need(standaloneCore, 'credentials = "same-origin"', "Standalone API requests must use the MeshCentral session.");
["response.status === 401", "redirectToLogin", "login?return=portal", "AuthenticationError", "mycompanyPortalReturnHash"].forEach(function (value) {
    need(standaloneCore, value, "Standalone authentication recovery missing: " + value);
});

var portalLogin = read("public/portal-login.js");
["sirk-login.css", "sirk-login.js", "finishLogin", "contentDocument", 'searchParams.get("return") === "portal"', "mycompanyPortalReturnHash", "sirk-login-active", "form.sirk-native-login-form", "function reveal()"].forEach(function (value) {
    need(portalLogin, value, "Forced login screen contract missing: " + value);
});
var forcedLogin = read("public/sirk-login.js");
var forcedLoginStyle = read("public/sirk-login.css");
['class="sirk-password-reset"', 'https://passwordreset.microsoftonline.com/', 'rel="noopener noreferrer"', 'reset: "Resetuj hasło"'].forEach(function (value) {
    need(forcedLogin, value, "Microsoft password-reset link contract missing: " + value);
});
['var STORAGE_LANGUAGE = "sirkPortal.language"', 'data-login-language="1"', 'function applyLanguage(form)', 'localStorage.setItem(STORAGE_LANGUAGE', 'data-login-text="reset"'].forEach(function (value) {
    need(forcedLogin, value, "Persistent login-language contract missing: " + value);
});
['function applyErrorLanguage(form)', 'loginError: "Sign-in failed. Check your username and password."', 'data-login-error', 'role", "alert"'].forEach(function (value) {
    need(forcedLogin, value, "Localized login-error contract missing: " + value);
});
['input[type=button]', ':active', 'transform:translateY(2px)', ':focus-visible', '.sirk-password-reset'].forEach(function (value) {
    need(forcedLoginStyle, value, "Interactive login-button style missing: " + value);
});
['.sirk-login-language', 'background:#eef2ff', '.sirk-password-reset:before', 'width:100%!important'].forEach(function (value) {
    need(forcedLoginStyle, value, "Visible reset/language control style missing: " + value);
});
['#sirkLoginShell .sirk-password-reset', 'background:#4f46e5!important', 'color:#fff!important', '[data-login-error="credentials"]'].forEach(function (value) {
    need(forcedLoginStyle, value, "High-contrast reset/error style missing: " + value);
});

var runtime = read("public/runtime.js");
need(runtime, "native-portal-launcher.js", "Native MeshCentral must load the SirK Portal launcher.");
need(runtime, "config.showLauncher", "Native launcher must honor its independent setting.");
need(runtime, "config.showLauncher === true", "Native launcher must be opt-in.");
var launcher = read("public/native-portal-launcher.js");
need(launcher, '"left:8px"', "Native SirK Portal launcher must be positioned 8px from the left.");
need(launcher, '"bottom:8px"', "Native SirK Portal launcher must be positioned 8px from the bottom.");

if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
}

console.log("Standalone SirK Portal architecture: OK");
console.log("Independent navigation controls: OK");
console.log("Native MeshCentral UI isolation: OK");
