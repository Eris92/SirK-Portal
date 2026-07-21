"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var root = path.resolve(__dirname, "..");
var required = [
    "MyCompany.js", "plugin-main.js", "MyCompanyAdmin.js", "config.json",
    "core/runtime.js", "core/approval-service.js", "core/atomic-json.js",
    "core/settings-store.js", "core/script-library.js", "core/script-admin-service.js",
    "modules/ApprovalCenter/index.js", "modules/MoveRequests/index.js",
    "modules/MyCommands/index.js", "modules/MyScripts/index.js",
    "modules/MyJira/index.js", "modules/DefenderTools/index.js",
    "public/approvalcenter.js", "public/myscripts.js", "public/mycommands.js",
    "public/shared-ui/toolbar.js", "public/shared-ui/toolbar-api.js",
    "public/shared-ui/toolbar-config.js", "public/shared-ui/tabs.js",
    "public/shared-ui/layout.js", "public/shared-ui/settings.js",
    "public/shared-ui/status-nav.js", "public/shared-ui/tree.js",
    "public/shared-ui/catalog.js", "public/shared-ui/results.js",
    "public/shared-ui/script-tools.js", "public/shared-ui/page.js",
    "seed/MyScripts", "seed/MyCommands"
];

function read(relative) { return fs.readFileSync(path.join(root, relative), "utf8"); }
function need(source, value, message, errors) { if (source.indexOf(value) < 0) errors.push(message); }
function match(source, expression, message, errors) { if (!expression.test(source)) errors.push(message); }

function validateArchitecture() {
    var errors = [];
    required.forEach(function (relative) { if (!fs.existsSync(path.join(root, relative))) errors.push("Missing: " + relative); });

    var config = JSON.parse(read("config.json").replace(/^\uFEFF/, ""));
    if (config.shortName !== "MyCompany") errors.push("config.shortName must be MyCompany.");
    if (config.version !== "1.3.1") errors.push("config.version must be 1.3.1.");
    var entrypoints = fs.readdirSync(root).filter(function (name) { return name.toLowerCase() === "mycompany.js"; });
    if (entrypoints.length !== 1 || entrypoints[0] !== "MyCompany.js") errors.push("Exactly one case-insensitive MyCompany.js entrypoint is required.");
    if (fs.existsSync(path.join(root, ".gitmodules"))) errors.push(".gitmodules is not allowed.");
    if (fs.existsSync(path.join(root, "legacy"))) errors.push("legacy source directory is not allowed.");

    var runtime = read("core/runtime.js");
    need(runtime, '"seed", "MyScripts"', "Runtime must resolve MyScripts from seed/MyScripts.", errors);
    need(runtime, '"seed", "MyCommands"', "Runtime must resolve MyCommands from seed/MyCommands.", errors);

    var library = read("core/script-library.js");
    ["allowWrite", "saveSource", "getDefinition", "saveDefinition", "approvalLevels", "secretDefinitions", "multiHost"].forEach(function (value) {
        need(library, value, "Script library missing: " + value, errors);
    });
    var admin = read("core/script-admin-service.js");
    ["getDefinition", "saveDefinition", "getSecretState", "saveSecrets", "context.secrets"].forEach(function (value) {
        need(admin, value, "Shared script administration missing: " + value, errors);
    });

    ["MyScripts", "MyCommands"].forEach(function (name) {
        var source = read("modules/" + name + "/index.js");
        need(source, 'context.pluginRoot, "seed", "' + name + '"', name + " must read its seed directory directly.", errors);
        need(source, "allowWrite: true", name + " must allow controlled Site Admin definition editing.", errors);
        need(source, 'asset === "definition"', name + " must expose definition endpoints.", errors);
        need(source, 'asset === "script-secrets"', name + " must expose encrypted credential endpoints.", errors);
        need(source, "script-admin-service", name + " must use the shared script administration service.", errors);
    });

    var commandsModule = read("modules/MyCommands/index.js");
    ["approvalResults", 'asset === "multi-execute"', "maxMultiHostNodes", "multiHostConcurrency"].forEach(function (value) {
        need(commandsModule, value, "MyCommands missing: " + value, errors);
    });

    var tree = read("public/shared-ui/tree.js");
    ["iconData", "mc-tree-folder-body", "scriptActions", "mc-tree-script-actions"].forEach(function (value) {
        need(tree, value, "Shared tree missing: " + value, errors);
    });
    need(tree, "if (!graphic)", "Folder arrow must be hidden when an icon exists.", errors);

    var tools = read("public/shared-ui/script-tools.js");
    ["favoritesOnly", "linkPickMode", "editMode", "multiPickMode", "openDefinitionEditor", "openCredentialsEditor", "openMultiExecution", "selectedDevices", "mc-tree-credential-action"].forEach(function (value) {
        need(tools, value, "Shared script tools missing: " + value, errors);
    });

    var results = read("public/shared-ui/results.js");
    ["parseStructured", "Filter results", "View", "Debug / raw output", "Copy", "meshTable", "parseLine"].forEach(function (value) {
        need(results, value, "Shared result viewer missing: " + value, errors);
    });

    var layout = read("public/shared-ui/layout.js");
    ["storageKey", "isCollapsed", "setCollapsed", "toggleCollapsed"].forEach(function (value) {
        need(layout, value, "Shared collapse layout missing: " + value, errors);
    });

    var toolbarConfig = read("public/shared-ui/toolbar-config.js");
    match(toolbarConfig, /myscripts:\s*\{[^}]*collapse:\s*false/, "Collapse must be hidden in MyScripts.", errors);
    match(toolbarConfig, /mycommands:\s*\{[^}]*collapse:\s*true/, "Collapse must remain in MyCommands.", errors);
    match(toolbarConfig, /approvalcenter:\s*\{[^}]*collapse:\s*true[^}]*link:\s*false/, "Approval Center must keep Collapse and disable Link.", errors);
    need(toolbarConfig, "order: 70", "Search must remain the last left toolbar action.", errors);

    ["myscripts", "mycommands"].forEach(function (name) {
        var source = read("public/" + name + ".js");
        ["SharedCatalogView.mount", "SharedResultsView.mountStatus", "SharedResultsView.mountTable", "SharedScriptTools.create", "scriptActions", "openDefinitionEditor", "openCredentialsEditor", "q:s.state.search", "tabs:[]"].forEach(function (value) {
            need(source, value, name + " UI missing: " + value, errors);
        });
        need(source, "clear:false", name + " must not render duplicate Clear.", errors);
    });
    var myScripts = read("public/myscripts.js");
    need(myScripts, "collapse:false", "Collapse must be hidden in MyScripts.", errors);
    need(myScripts, "multi:false", "Multi-device action must be hidden in MyScripts.", errors);
    var myCommands = read("public/mycommands.js");
    ["openMultiExecution", 'post("multi-execute"', "order:60", "collapse:{"].forEach(function (value) {
        need(myCommands, value, "MyCommands UI missing: " + value, errors);
    });

    var approval = read("public/approvalcenter.js");
    ["Filter requests", "SharedResultsView.mountTable", "link:false", "mc-approval-nav-icon", "showView:true", "actions:function"].forEach(function (value) {
        need(approval, value, "Approval Center UI missing: " + value, errors);
    });

    var css = read("public/shared-ui/toolbar.css") + read("public/shared-ui/shared-ui.css");
    ["mc-script-form-row", "mc-multi-device-list", "mc-approval-nav-label", "mc-results-viewer", "grid-template-columns"].forEach(function (value) {
        need(css, value, "Shared UI styles missing: " + value, errors);
    });

    if (errors.length) {
        errors.forEach(function (error) { console.error(error); });
        throw new Error("Architecture validation failed.");
    }
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
        var leftovers = fs.readdirSync(directory).filter(function (name) { return /\.(tmp|bak)$/.test(name); });
        if (leftovers.length) throw new Error("Settings writer left temporary files: " + leftovers.join(", "));
    }).finally(function () { fs.rmSync(directory, { recursive: true, force: true }); });
}

Promise.resolve().then(validateArchitecture).then(validateSettingsWriter).then(function () {
    console.log("Architecture validation: OK");
    console.log("Settings writer validation: OK");
}).catch(function (error) { console.error(error && error.stack || error); process.exit(1); });
