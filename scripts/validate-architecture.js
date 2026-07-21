"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var root = path.resolve(__dirname, "..");
var required = [
    "MyCompany.js", "plugin-main.js", "MyCompanyAdmin.js", "config.json",
    "core/runtime.js", "core/approval-service.js", "core/atomic-json.js",
    "core/settings-store.js", "core/script-library.js", "core/script-admin-service.js",
    "core/server-script-executor.js",
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
    var packageConfig = JSON.parse(read("package.json").replace(/^\uFEFF/, ""));
    if (config.shortName !== "MyCompany") errors.push("config.shortName must be MyCompany.");
    if (config.version !== packageConfig.version) errors.push("config.json and package.json versions must match.");
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
    var executor = read("core/server-script-executor.js");
    ["createServerScriptExecutor", "execFile", "scriptHash", "variableValues", "rawOutput", "systemEnvironment"].forEach(function (value) {
        need(executor, value, "Shared server script executor missing: " + value, errors);
    });

    ["MyScripts", "MyCommands"].forEach(function (name) {
        var source = read("modules/" + name + "/index.js");
        need(source, 'context.pluginRoot, "seed", "' + name + '"', name + " must read its seed directory directly.", errors);
        need(source, "allowWrite: true", name + " must allow controlled Site Admin definition editing.", errors);
        need(source, 'asset === "definition"', name + " must expose definition endpoints.", errors);
        need(source, 'asset === "script-secrets"', name + " must expose encrypted credential endpoints.", errors);
        need(source, "script-admin-service", name + " must use the shared script administration service.", errors);
    });

    var myScriptsModule = read("modules/MyScripts/index.js");
    ["server-script-executor", "executor.execute", "scriptHash", "variableValues", 'context.approval.submit("myscripts"'].forEach(function (value) {
        need(myScriptsModule, value, "MyScripts execution missing: " + value, errors);
    });
    if (myScriptsModule.indexOf("Script does not require approval.") >= 0) errors.push("MyScripts must not return a synthetic direct result.");

    var commandsModule = read("modules/MyCommands/index.js");
    [
        "approvalResults", 'asset === "multi-execute"', "maxMultiHostNodes", "multiHostConcurrency",
        "publicCatalog", "commandId", 'asset === "output"', "Open PowerShell", "Open CMD",
        "Registry Editor", "Local Security Policy", "Windows Firewall", "MMC", "Services",
        "Device Manager", "Event Viewer", "Task Manager", "Printer Management",
        "Certificates (computer)", "Certificates (user)", "Indexing Options", "Disk Cleanup",
        "Flush DNS", "Check DNS", "Check port", "Open ports", "Filter by port"
    ].forEach(function (value) {
        need(commandsModule, value, "MyCommands missing: " + value, errors);
    });

    var tree = read("public/shared-ui/tree.js");
    ["iconData", "mc-tree-folder-body", "scriptActions", "mc-tree-script-actions", "options.node && options.node.icon"].forEach(function (value) {
        need(tree, value, "Shared tree missing: " + value, errors);
    });
    need(tree, "if (!graphic)", "Folder arrow must be hidden when an icon exists.", errors);

    var tools = read("public/shared-ui/script-tools.js");
    ["favoritesOnly", "linkPickMode", "editMode", "multiPickMode", "openDefinitionEditor", "openCredentialsEditor", "openMultiExecution", "selectedDevices", "mc-tree-credential-action"].forEach(function (value) {
        need(tools, value, "Shared script tools missing: " + value, errors);
    });

    var results = read("public/shared-ui/results.js");
    ["parseStructured", "Filter results", "View", "Debug / raw output", "Copy", "meshTable", "parseLine", "mountResult", "Filter result rows", "parseJsonSuffix"].forEach(function (value) {
        need(results, value, "Shared result viewer missing: " + value, errors);
    });

    var layout = read("public/shared-ui/layout.js");
    ["storageKey", "isCollapsed", "setCollapsed", "toggleCollapsed"].forEach(function (value) {
        need(layout, value, "Shared collapse layout missing: " + value, errors);
    });

    var toolbarConfig = read("public/shared-ui/toolbar-config.js");
    match(toolbarConfig, /myscripts:\s*\{[^}]*collapse:\s*true/, "Collapse must be enabled in MyScripts.", errors);
    match(toolbarConfig, /mycommands:\s*\{[^}]*collapse:\s*true/, "Collapse must remain in MyCommands.", errors);
    match(toolbarConfig, /approvalcenter:\s*\{[^}]*collapse:\s*true[^}]*link:\s*false/, "Approval Center must keep Collapse and disable Link.", errors);
    need(toolbarConfig, "order: 70", "Search must remain the last left toolbar action.", errors);

    ["myscripts", "mycommands"].forEach(function (name) {
        var source = read("public/" + name + ".js");
        ["SharedCatalogView.mount", "SharedResultsView.mountStatus", "SharedResultsView.mountTable", "SharedScriptTools.create", "scriptActions", "openDefinitionEditor", "openCredentialsEditor"].forEach(function (value) {
            need(source, value, name + " UI missing: " + value, errors);
        });
        match(source, /q\s*:\s*(?:shell|s)\.state\.search/, name + " must pass the shared search value to results.", errors);
        match(source, /tabs\s*:\s*\[\s*\]/, name + " must not render duplicate tabs.", errors);
        match(source, /clear\s*:\s*false/, name + " must not render duplicate Clear.", errors);
    });

    var myScripts = read("public/myscripts.js");
    ["variableValues", "SharedResultsView.mountResult"].forEach(function (value) {
        need(myScripts, value, "MyScripts UI missing: " + value, errors);
    });
    match(myScripts, /collapse\s*:\s*true/, "MyScripts must expose Collapse.", errors);
    match(myScripts, /multi\s*:\s*false/, "MyScripts must hide multi-device execution.", errors);

    var myCommands = read("public/mycommands.js");
    [
        "openMultiExecution", 'post("multi-execute"', "resultsPosition: \"end\"",
        'name: "Scripts"', '"@menu/" + category.key', "commandId", 'tabs: []'
    ].forEach(function (value) {
        need(myCommands, value, "MyCommands UI missing: " + value, errors);
    });
    match(myCommands, /order\s*:\s*60/, "MyCommands multi action order is invalid.", errors);
    match(myCommands, /collapse\s*:\s*\{/, "MyCommands must expose Collapse.", errors);

    var sharedCatalog = read("public/shared-ui/catalog.js");
    need(sharedCatalog, 'resultsPosition !== "end"', "Shared catalog must support putting Results at the end of the left menu.", errors);

    var approval = read("public/approvalcenter.js");
    ["Filter requests", "SharedResultsView.mountTable", "mc-approval-nav-icon"].forEach(function (value) {
        need(approval, value, "Approval Center UI missing: " + value, errors);
    });
    match(approval, /link\s*:\s*false/, "Approval Center Link must remain disabled.", errors);
    match(approval, /showView\s*:\s*true/, "Approval Center must expose View.", errors);
    match(approval, /actions\s*:\s*function/, "Approval Center actions are missing.", errors);

    var browserCore = read("public/core.js");
    need(browserCore, 'body.set("payload"', "Browser POST requests must use the parsed JSON payload envelope.", errors);

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
