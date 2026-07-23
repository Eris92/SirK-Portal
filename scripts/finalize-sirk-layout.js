"use strict";

var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..");
var selfPath = "scripts/finalize-sirk-layout.js";
var workflowPath = ".github/workflows/finalize-layout.yml";

function absolute(relative) { return path.join(root, relative); }
function ensureDirectory(relative) { fs.mkdirSync(path.dirname(absolute(relative)), { recursive: true }); }
function move(source, target) {
    if (!fs.existsSync(absolute(source))) return;
    ensureDirectory(target);
    if (fs.existsSync(absolute(target))) fs.rmSync(absolute(target), { force: true });
    fs.renameSync(absolute(source), absolute(target));
}
function remove(relative) {
    if (fs.existsSync(absolute(relative))) fs.rmSync(absolute(relative), { recursive: true, force: true });
}
function read(relative) { return fs.readFileSync(absolute(relative), "utf8").replace(/^\uFEFF/, ""); }
function write(relative, value) { ensureDirectory(relative); fs.writeFileSync(absolute(relative), value, "utf8"); }
function replace(relative, from, to) {
    if (!fs.existsSync(absolute(relative))) return;
    var source = read(relative);
    var next = source.split(from).join(to);
    if (next !== source) write(relative, next);
}
function walk(relative) {
    if (!fs.existsSync(absolute(relative))) return [];
    return fs.readdirSync(absolute(relative), { withFileTypes: true }).reduce(function (result, entry) {
        var child = path.posix.join(relative, entry.name);
        return result.concat(entry.isDirectory() ? walk(child) : [child]);
    }, []);
}

move("core/atomic-json.js", "server/core/atomic-json.js");
move("core/script-library.js", "server/core/script-library.js");
remove("core");

move("public/sirk-login.js", "public/portal/standalone/scripts/native-login.js");
move("public/sirk-login.css", "public/portal/standalone/styles/native-login.css");
move("public/portal-link-visibility.js", "public/portal/standalone/scripts/view-mode.js");
[
    "public/portal-approval-layout-fix.css",
    "public/portal-approval-style.css",
    "public/portal-collapse-fix.css",
    "Sync-SirKPortal-Vendor.ps1"
].forEach(remove);

var textExtensions = /\.(?:js|json|html|handlebars|css|yml|yaml|ps1)$/i;
var textFiles = [
    "SIRK-Portal.js", "plugin-main.js", "plugin-main-standalone.js", "admin.js",
    "config.json", "package.json", "marketplace.json"
].concat(
    walk(".github"), walk("public"), walk("server"), walk("scripts"), walk("test"),
    walk("web"), walk("views"), walk("tools"), walk("seed")
).filter(function (relative, index, all) {
    return all.indexOf(relative) === index && textExtensions.test(relative) &&
        relative !== selfPath && relative !== workflowPath;
});

var replacements = [
    [/mycompany-data/g, "sirk-platform-data"],
    [/meshcentral-mycompany/gi, "sirk-portal"],
    [/mycompany\.sirkportal\./g, "sirkPortal."],
    [/mycompanyPortal/g, "sirkPortal"],
    [/mycompany-/g, "sirk-platform-"],
    [/mycompany_/g, "sirk_platform_"],
    [/__MYCOMPANY_/g, "__SIRK_PLATFORM_"],
    [/__myCompany/g, "__sirkPlatform"],
    [/MYCOMPANY/g, "SIRK_PLATFORM"],
    [/MyCompany/g, "SirkPlatform"],
    [/myCompany/g, "sirkPlatform"],
    [/mycompany/g, "sirkPlatform"]
];

textFiles.forEach(function (relative) {
    var source = read(relative);
    var next = source;
    replacements.forEach(function (item) { next = next.replace(item[0], item[1]); });
    if (next !== source) write(relative, next);
});

replace("test/script-localization.test.js", "../core/script-library.js", "../server/core/script-library.js");
replace("public/portal/standalone/index.html", "portal-link-visibility.js", "portal-view-mode.js");
replace("public/portal/standalone/scripts/login.js", "/sirk-login.css", "/sirk-native-login.css");
replace("public/portal/standalone/scripts/login.js", "/sirk-login.js", "/sirk-native-login.js");
replace("public/portal/standalone/scripts/login.js", "sirkPlatformPortalReturnHash", "sirkPortal.returnHash");
replace("public/portal/standalone/scripts/view-mode.js", "sirkPlatform.sirkportal.focusMode", "sirkPortal.focusMode");
replace("public/portal/standalone/scripts/view-mode.js",
    'new MutationObserver(function () { mountViewModeButton(); }).observe(document.documentElement, { childList: true, subtree: true });',
    'var observerRoot = document.getElementById("sirkStandaloneRoot");\n    if (observerRoot) new MutationObserver(function () { mountViewModeButton(); }).observe(observerRoot, { childList: true, subtree: true });');

var standaloneBootstrap = read("plugin-main-standalone.js");
var assetAnchor = '    "portal-login.js": "standalone/scripts/login.js",\n';
var assetMappings = assetAnchor +
    '    "portal-view-mode.js": "standalone/scripts/view-mode.js",\n' +
    '    "sirk-native-login.js": "standalone/scripts/native-login.js",\n' +
    '    "sirk-native-login.css": "standalone/styles/native-login.css",\n';
if (standaloneBootstrap.indexOf('"portal-view-mode.js"') < 0) {
    standaloneBootstrap = standaloneBootstrap.replace(assetAnchor, assetMappings);
    write("plugin-main-standalone.js", standaloneBootstrap);
}

write("scripts/validate-standalone.js", `"use strict";

var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..");
var errors = [];

function absolute(relative) { return path.join(root, relative); }
function exists(relative) { return fs.existsSync(absolute(relative)); }
function read(relative) { return fs.readFileSync(absolute(relative), "utf8").replace(/^\\uFEFF/, ""); }
function need(source, value, message) { if (source.indexOf(value) < 0) errors.push(message); }
function reject(source, pattern, message) { if (pattern.test(source)) errors.push(message); }

[
    "public/portal/standalone/index.html",
    "public/portal/standalone/login.html",
    "public/portal/standalone/scripts/core.js",
    "public/portal/standalone/scripts/app.js",
    "public/portal/standalone/scripts/navigation.js",
    "public/portal/standalone/scripts/device-workspace.js",
    "public/portal/standalone/scripts/terminal-connect.js",
    "public/portal/standalone/scripts/login.js",
    "public/portal/standalone/scripts/native-login.js",
    "public/portal/standalone/scripts/view-mode.js",
    "public/portal/standalone/styles/base.css",
    "public/portal/standalone/styles/login.css",
    "public/portal/standalone/styles/native-login.css",
    "public/native/device-tabs.js",
    "plugin-main-standalone.js"
].forEach(function (relative) {
    if (!exists(relative)) errors.push("Missing standalone asset: " + relative);
});

var bootstrap = read("plugin-main-standalone.js");
[
    'path.join(__dirname, "public", "portal")',
    '"portal-standalone.js": "standalone/scripts/app.js"',
    '"portal-device-tabs.js": "../native/device-tabs.js"',
    '"portal-view-mode.js": "standalone/scripts/view-mode.js"',
    '"sirk-native-login.js": "standalone/scripts/native-login.js"',
    '"sirk-native-login.css": "standalone/styles/native-login.css"',
    "sirk/api/v1/approvals"
].forEach(function (value) { need(bootstrap, value, "Standalone bootstrap missing: " + value); });
reject(bootstrap, /MyCompany|MYCOMPANY|myCompany|mycompany|public\\\/shared-ui/, "Standalone bootstrap contains removed legacy naming or paths.");

var html = read("public/portal/standalone/index.html");
[
    'id="sirkPortalRoot"',
    'id="sirkStandaloneRoot"',
    "standalone-core.js",
    "portal-standalone.js",
    "portal-device-workspace.js",
    "portal-device-tabs.js",
    "portal-view-mode.js",
    "portal-standalone-nav.js",
    "__SIRK_PLATFORM_ASSET_BASE__",
    "__SIRK_PLATFORM_PORTAL_VERSION__"
].forEach(function (value) { need(html, value, "Standalone HTML missing: " + value); });
reject(html, /MyCompany|MYCOMPANY|myCompany|mycompany|portal-link-visibility\.js/, "Standalone HTML contains removed legacy naming or asset references.");

var login = read("public/portal/standalone/scripts/login.js");
[
    "__SIRK_PLATFORM_LOGIN_ASSET_BASE__",
    "__SIRK_PLATFORM_PORTAL_VERSION__",
    "sirk-native-login.css",
    "sirk-native-login.js",
    "sirkPortal.returnHash"
].forEach(function (value) { need(login, value, "Login bridge missing: " + value); });
reject(login, /MyCompany|MYCOMPANY|myCompany|mycompany|sirk-login\.(?:js|css)/, "Login bridge contains removed legacy naming or flat assets.");

var nativeLogin = read("public/portal/standalone/scripts/native-login.js");
need(nativeLogin, "__SIRK_PLATFORM_PORTAL_BRANDING__", "Native login renderer must use SIRK Platform branding.");
need(nativeLogin, "sirk-login-active", "Native login renderer must expose the active state.");
reject(nativeLogin, /MyCompany|MYCOMPANY|myCompany|mycompany/, "Native login renderer contains removed legacy naming.");

var viewMode = read("public/portal/standalone/scripts/view-mode.js");
need(viewMode, "SirkPlatformRuntime", "View mode must use SirkPlatformRuntime.");
need(viewMode, "sirkPortal.focusMode", "View mode must use the canonical preference key.");
need(viewMode, 'document.getElementById("sirkStandaloneRoot")', "View mode observer must be scoped to the Portal root.");
reject(viewMode, /MyCompany|MYCOMPANY|myCompany|mycompany|observe\(document\.documentElement/, "View mode contains removed legacy naming or a global observer.");

["core.js", "app.js", "navigation.js", "device-workspace.js", "terminal-connect.js"].forEach(function (name) {
    var source = read("public/portal/standalone/scripts/" + name);
    reject(source, /MyCompany|MYCOMPANY|myCompany|mycompany/, "Standalone script contains removed legacy naming: " + name);
});

if (errors.length) {
    console.error(errors.join("\\n"));
    process.exit(1);
}
console.log("Standalone SIRK Portal validation: OK");
console.log("Canonical login and view-mode validation: OK");
`);

write(".github/workflows/validate.yml", `name: Validate SIRK-Portal

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Validate project
        run: npm test
      - name: Check JavaScript syntax
        shell: bash
        run: |
          find . -type f -name '*.js' -not -path './node_modules/*' -print0 |
            xargs -0 -n1 node --check
`);

var residual = [];
textFiles.concat([
    "public/portal/standalone/scripts/native-login.js",
    "public/portal/standalone/scripts/view-mode.js",
    "server/core/atomic-json.js",
    "server/core/script-library.js"
]).filter(function (relative, index, all) {
    return all.indexOf(relative) === index && fs.existsSync(absolute(relative));
}).forEach(function (relative) {
    if (/MyCompany|MYCOMPANY|myCompany|mycompany/.test(read(relative))) residual.push(relative);
});
if (residual.length) throw new Error("Legacy naming remains in runtime/test files: " + residual.join(", "));

remove(selfPath);
remove(workflowPath);
console.log("SIRK repository cleanup prepared.");
