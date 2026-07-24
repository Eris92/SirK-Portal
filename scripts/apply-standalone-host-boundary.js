"use strict";

var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..");
function file(name) { return path.join(root, name); }
function read(name) { return fs.readFileSync(file(name), "utf8"); }
function write(name, value) { fs.mkdirSync(path.dirname(file(name)), { recursive: true }); fs.writeFileSync(file(name), value, "utf8"); }
function replace(name, from, to) { var value = read(name); if (value.indexOf(from) < 0) throw new Error("Missing marker in " + name + ": " + from); write(name, value.replace(from, to)); }

write("server/contracts/host-context.js", `"use strict";

function required(value, name) {
    if (!value) throw new Error("HostContext requires " + name + ".");
    return value;
}

function normalizeUser(user) {
    user = user || {};
    return {
        id: String(user.id || user._id || ""),
        displayName: String(user.displayName || user.realname || user.name || user._id || "unknown"),
        tenantId: String(user.tenantId || user.domain || ""),
        roles: Array.isArray(user.roles) ? user.roles.map(String) : [],
        groups: Array.isArray(user.groups) ? user.groups.map(String) : [],
        isAdmin: user.isAdmin === true || user.siteadmin === true || Number(user.siteadmin) === 0xFFFFFFFF || (Number(user.siteadmin) | 0) === -1,
        raw: user.raw || user
    };
}

function createHostContext(options) {
    options = options || {};
    var context = {
        kind: String(options.kind || "standalone"),
        dataRoot: required(options.dataRoot, "dataRoot"),
        fs: required(options.fs || require("fs"), "fs"),
        path: required(options.path || require("path"), "path"),
        logger: options.logger || console,
        auth: required(options.auth, "auth provider"),
        devices: required(options.devices, "device provider"),
        sessions: required(options.sessions, "session provider"),
        events: options.events || { publish: function () { return false; } },
        capabilities: Object.assign({ devices: true, desktop: false, terminal: false, files: false, nativeUi: false, extensions: true }, options.capabilities || {}),
        legacyParent: options.legacyParent || null
    };
    context.normalizeUser = normalizeUser;
    context.currentUser = function (req) { return Promise.resolve(context.auth.currentUser(req)).then(normalizeUser); };
    return context;
}

module.exports = { createHostContext: createHostContext, normalizeUser: normalizeUser };
`);

write("server/core/module-registry.js", `"use strict";

var fs = require("fs");
var path = require("path");

var BUILTIN = [
    { key: "approvalcenter", name: "Approvals", modulePath: "../modules/approval-center/index.js" },
    { key: "moverequests", name: "Move Requests", modulePath: "../modules/move-requests/index.js" },
    { key: "mycommands", name: "Commands", modulePath: "../modules/commands/index.js" },
    { key: "myjira", name: "Jira Integration", modulePath: "../modules/jira/index.js" },
    { key: "defendertools", name: "Security", modulePath: "../modules/security/index.js" },
    { key: "myscripts", name: "Automation", modulePath: "../modules/automation/index.js" }
];

function safeKey(value) { return /^[a-z][a-z0-9_-]{1,63}$/i.test(String(value || "")) ? String(value) : ""; }

function discoverExtensions(dataRoot) {
    var directory = path.join(dataRoot, "extensions");
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).filter(function (entry) { return entry.isDirectory(); }).map(function (entry) {
        var root = path.join(directory, entry.name);
        var manifestPath = path.join(root, "sirk-module.json");
        if (!fs.existsSync(manifestPath)) return null;
        var manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        var key = safeKey(manifest.key || entry.name);
        if (!key) throw new Error("Invalid extension key in " + manifestPath);
        var entryFile = path.resolve(root, String(manifest.serverEntry || "index.js"));
        if (entryFile.indexOf(root + path.sep) !== 0) throw new Error("Extension entry escapes its directory: " + key);
        return { key: key, name: String(manifest.name || key), modulePath: entryFile, external: true, manifest: manifest };
    }).filter(Boolean);
}

function descriptors(dataRoot) { return BUILTIN.concat(discoverExtensions(dataRoot)); }

module.exports = { builtins: BUILTIN, discoverExtensions: discoverExtensions, descriptors: descriptors };
`);

write("server/adapters/standalone/index.js", `"use strict";

var fs = require("fs");
var path = require("path");
var hostContract = require("../../contracts/host-context.js");

function userFromEnvironment() {
    return {
        id: process.env.SIRK_USER_ID || "local/admin",
        displayName: process.env.SIRK_USER_NAME || "Local Administrator",
        tenantId: process.env.SIRK_TENANT_ID || "local",
        roles: ["admin"], groups: [], isAdmin: true
    };
}

module.exports.createHost = function (options) {
    options = options || {};
    var dataRoot = path.resolve(options.dataRoot || process.env.SIRK_DATA_ROOT || path.join(process.cwd(), "sirk-platform-data"));
    fs.mkdirSync(path.join(dataRoot, "extensions"), { recursive: true });
    var devices = options.devices || {
        list: function () { return Promise.resolve({ meshes: [], nodes: [] }); },
        resolve: function () { return Promise.reject(new Error("No device connector is configured.")); },
        runCommand: function () { return Promise.reject(new Error("No agent transport is configured.")); }
    };
    var sessions = options.sessions || {
        capabilities: { desktop: false, terminal: false, files: false },
        create: function () { return Promise.reject(new Error("No remote-session connector is configured.")); }
    };
    return hostContract.createHostContext({
        kind: "standalone", dataRoot: dataRoot, fs: fs, path: path,
        auth: options.auth || { currentUser: function () { return userFromEnvironment(); } },
        devices: devices, sessions: sessions,
        capabilities: Object.assign({ devices: true, desktop: false, terminal: false, files: false, nativeUi: false, extensions: true }, options.capabilities || {}),
        logger: options.logger || console
    });
};
`);

write("server/adapters/meshcentral/index.js", `"use strict";

var path = require("path");
var hostContract = require("../../contracts/host-context.js");
var deviceFactory = require("../../core/device-service.js");
var shared = require("../../core/shared.js");

module.exports.createHost = function (options) {
    options = options || {};
    var parent = options.parent;
    var meshServer = parent && parent.parent;
    var fs = parent && parent.fs || require("fs");
    var nativePath = parent && parent.path || path;
    var dataBase = meshServer && meshServer.datapath ? meshServer.datapath : nativePath.dirname(parent && parent.pluginPath || options.pluginRoot);
    var source = options.source;
    var legacyDevices = deviceFactory.createDeviceService({ parent: parent, source: source });
    return hostContract.createHostContext({
        kind: "meshcentral", dataRoot: nativePath.join(dataBase, "sirk-platform-data"), fs: fs, path: nativePath,
        legacyParent: parent,
        auth: { currentUser: function (req) { return req && (req.sirkUser || req.user) || null; } },
        devices: {
            list: function (user) { return legacyDevices.visibleNodes(user && user.raw || user); },
            resolve: function (user, nodeId, settings) { return legacyDevices.resolveNode(user && user.raw || user, nodeId, settings); },
            runCommand: function (context, command, responseId, sessionId) { return legacyDevices.sendRunCommands(context, command, responseId, sessionId); },
            legacy: legacyDevices
        },
        sessions: {
            capabilities: { desktop: true, terminal: true, files: true },
            create: function (kind, nodeId) { return Promise.resolve({ kind: kind, nodeId: nodeId, mode: "meshcentral-native" }); }
        },
        events: { publish: function (targets, event) { return shared.dispatch(parent, source, targets, event); } },
        capabilities: { devices: true, desktop: true, terminal: true, files: true, nativeUi: true, extensions: true },
        logger: console
    });
};
`);

write("server/http/api-router.js", `"use strict";

function json(res, status, value) {
    var body = JSON.stringify(value);
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(body);
}

function createApiHandler(runtime, host) {
    return function (req, res) {
        var url = new URL(req.url, "http://sirk.local");
        var match = url.pathname.match(/^\\/api\\/modules\\/([^/]+)\\/([^/]+)$/);
        Promise.resolve(host.currentUser(req)).then(function (user) {
            if (url.pathname === "/api/bootstrap" && req.method === "GET") {
                var value = runtime.bootstrap(user.raw || user);
                value.host = { kind: host.kind, capabilities: host.capabilities };
                json(res, 200, value); return;
            }
            if (!match) { json(res, 404, { ok: false, error: "Endpoint not found." }); return; }
            var moduleName = decodeURIComponent(match[1]);
            var asset = decodeURIComponent(match[2]);
            var fakeReq = { method: req.method, query: Object.fromEntries(url.searchParams.entries()), headers: req.headers, body: {} };
            runtime.request(req.method, moduleName, asset, fakeReq, {
                statusCode: 200,
                setHeader: function (name, value) { res.setHeader(name, value); },
                end: function (body) { res.statusCode = this.statusCode; res.end(body); },
                send: function (body) { res.statusCode = this.statusCode; res.end(body); },
                set: function (name, value) { res.setHeader(name, value); },
                status: function (code) { this.statusCode = code; return this; }
            }, user.raw || user);
        }).catch(function (error) { json(res, 401, { ok: false, error: String(error && error.message || error) }); });
    };
}

module.exports = { createApiHandler: createApiHandler };
`);

write("server/standalone.js", `"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");
var standaloneAdapter = require("./adapters/standalone/index.js");
var runtimeFactory = require("./core/runtime-portal.js");
var apiRouter = require("./http/api-router.js");

function contentType(name) {
    if (/\\.css$/i.test(name)) return "text/css; charset=utf-8";
    if (/\\.js$/i.test(name)) return "text/javascript; charset=utf-8";
    if (/\\.json$/i.test(name)) return "application/json; charset=utf-8";
    if (/\\.svg$/i.test(name)) return "image/svg+xml";
    if (/\\.png$/i.test(name)) return "image/png";
    return "application/octet-stream";
}

function start(options) {
    options = options || {};
    var root = path.resolve(__dirname, "..");
    var host = standaloneAdapter.createHost(options);
    var runtime = runtimeFactory.createRuntime({ host: host, pluginRoot: root, source: { shortName: "SIRKPortalStandalone" } });
    var api = apiRouter.createApiHandler(runtime, host);
    return Promise.resolve(runtime.initialize()).then(function () {
        var server = http.createServer(function (req, res) {
            var url = new URL(req.url, "http://sirk.local");
            if (url.pathname.indexOf("/api/") === 0) { api(req, res); return; }
            if (url.pathname === "/" || url.pathname === "/sirkportal/") {
                var html = fs.readFileSync(path.join(root, "public/portal/standalone/index.html"), "utf8")
                    .replace(/__API_BASE_JSON__/g, JSON.stringify("/api"))
                    .replace(/__ASSET_BASE_JSON__/g, JSON.stringify("/assets"))
                    .replace(/__NATIVE_URL_JSON__/g, JSON.stringify(""))
                    .replace(/__LOGOUT_URL_JSON__/g, JSON.stringify("/auth/logout"))
                    .replace(/__USER_IMAGE_URL_JSON__/g, JSON.stringify("/api/user/image"))
                    .replace(/__DEFAULT_USER_IMAGE_URL_JSON__/g, JSON.stringify("/assets/images/user-256.png"))
                    .replace(/__VERSION_JSON__/g, JSON.stringify(require("../config.json").version))
                    .replace(/__ASSET_BASE__/g, "/assets").replace(/__NATIVE_URL__/g, "").replace(/__VERSION__/g, require("../config.json").version);
                res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(html); return;
            }
            if (url.pathname.indexOf("/assets/") === 0) {
                var relative = decodeURIComponent(url.pathname.slice(8));
                if (relative.indexOf("..") >= 0) { res.statusCode = 400; res.end("Bad path"); return; }
                var candidates = [path.join(root, "public/portal", relative), path.join(root, "public/shared", relative), path.join(root, "public", relative), path.join(root, "assets", relative)];
                var target = candidates.find(function (candidate) { return fs.existsSync(candidate) && fs.statSync(candidate).isFile(); });
                if (!target) { res.statusCode = 404; res.end("Not found"); return; }
                res.setHeader("Content-Type", contentType(target)); fs.createReadStream(target).pipe(res); return;
            }
            res.statusCode = 404; res.end("Not found");
        });
        var port = Number(options.port || process.env.PORT || 8080);
        return new Promise(function (resolve) { server.listen(port, options.host || process.env.HOST || "127.0.0.1", function () { resolve(server); }); });
    });
}

if (require.main === module) start().then(function (server) { console.log("SIRK Portal standalone listening on", server.address()); }).catch(function (error) { console.error(error); process.exitCode = 1; });
module.exports = { start: start };
`);

replace("plugin-main.js", 'var createAdmin = require("./admin.js").admin;\nvar VERSION = require("./config.json").version;', 'var createAdmin = require("./admin.js").admin;\nvar VERSION = require("./config.json").version;\nvar meshHostFactory = require("./server/adapters/meshcentral/index.js");');
replace("plugin-main.js", '        obj.runtime = require("./server/core/runtime-portal.js").createRuntime({\n            parent: parent,\n            pluginRoot: __dirname,\n            source: obj\n        });', '        obj.host = meshHostFactory.createHost({ parent: parent, pluginRoot: __dirname, source: obj });\n        obj.runtime = require("./server/core/runtime-portal.js").createRuntime({\n            host: obj.host,\n            parent: parent,\n            pluginRoot: __dirname,\n            source: obj\n        });');

replace("server/core/runtime.js", 'var folderAccess = require("./folder-access.js");', 'var folderAccess = require("./folder-access.js");\nvar moduleRegistry = require("./module-registry.js");');
replace("server/core/runtime.js", '    var parent = options.parent;\n    var pluginRoot = options.pluginRoot;\n    var fs = parent.fs || require("fs");\n    var nativePath = parent.path || require("path");\n    var meshServer = parent.parent;\n    var dataBase = meshServer && meshServer.datapath\n        ? meshServer.datapath\n        : nativePath.dirname(parent.pluginPath || pluginRoot);\n    var dataRoot = nativePath.join(dataBase, "sirk-platform-data");', '    var host = options.host || null;\n    var parent = options.parent || host && host.legacyParent || {};\n    var pluginRoot = options.pluginRoot;\n    var fs = host && host.fs || parent.fs || require("fs");\n    var nativePath = host && host.path || parent.path || require("path");\n    var dataRoot = host && host.dataRoot || nativePath.join(nativePath.dirname(parent.pluginPath || pluginRoot), "sirk-platform-data");');
replace("server/core/runtime.js", '    context.device = deviceFactory.createDeviceService({ parent: parent, source: options.source });', '    context.host = host;\n    context.capabilities = host && host.capabilities || {};\n    context.device = host && host.devices || deviceFactory.createDeviceService({ parent: parent, source: options.source });');
replace("server/core/runtime.js", '    MODULES.forEach(function (descriptor) {', '    moduleRegistry.descriptors(dataRoot).forEach(function (descriptor) {');
replace("server/core/runtime.js", '            var factory = require(descriptor.path);', '            var factory = require(descriptor.modulePath || descriptor.path);');

replace("server/core/runtime-portal.js", '        return {\n            ok: true,\n            version: VERSION,', '        return {\n            ok: true,\n            version: VERSION,\n            host: { kind: context.host && context.host.kind || "meshcentral", capabilities: context.capabilities || {} },');

replace("public/portal/standalone/scripts/core.js", '        var endpoint = new URL(String(window.__SIRK_PLATFORM_API_BASE__ || "pluginadmin.ashx"), window.location.href);\n        endpoint.searchParams.set("pin", "SIRKPortal");\n        if (moduleName) endpoint.searchParams.set("module", moduleName);\n        if (assetName) endpoint.searchParams.set("asset", assetName);', '        var base = String(window.__SIRK_PLATFORM_API_BASE__ || "/api");\n        var pluginMode = /pluginadmin\\.ashx(?:$|\\?)/i.test(base);\n        var endpoint;\n        if (pluginMode) {\n            endpoint = new URL(base, window.location.href);\n            endpoint.searchParams.set("pin", String(window.__SIRK_PLATFORM_PLUGIN_PIN__ || "SIRKPortal"));\n            if (moduleName) endpoint.searchParams.set("module", moduleName);\n            if (assetName) endpoint.searchParams.set("asset", assetName);\n        } else {\n            base = base.replace(/\\/$/, "");\n            if (!moduleName && assetName === "bootstrap") endpoint = new URL(base + "/bootstrap", window.location.href);\n            else endpoint = new URL(base + "/modules/" + encodeURIComponent(moduleName || "_runtime") + "/" + encodeURIComponent(assetName || "index"), window.location.href);\n        }');

replace("plugin-main-standalone.js", '            "__API_BASE_JSON__": JSON.stringify(base + "pluginadmin.ashx"),', '            "__API_BASE_JSON__": JSON.stringify(base + "pluginadmin.ashx"),\n            "__PLUGIN_PIN_JSON__": JSON.stringify("SIRKPortal"),');
replace("public/portal/standalone/index.html", 'window.__SIRK_PLATFORM_API_BASE__ = __API_BASE_JSON__;', 'window.__SIRK_PLATFORM_API_BASE__ = __API_BASE_JSON__;\n        window.__SIRK_PLATFORM_PLUGIN_PIN__ = typeof __PLUGIN_PIN_JSON__ === "undefined" ? "" : __PLUGIN_PIN_JSON__;');

var pkg = JSON.parse(read("package.json"));
pkg.version = "1.6.0";
pkg.scripts.start = "node server/standalone.js";
pkg.scripts["test:standalone"] = "node test/standalone-host-boundary.test.js";
if (pkg.scripts.test.indexOf("standalone-host-boundary.test.js") < 0) pkg.scripts.test = pkg.scripts.test.replace("node test/security.test.js", "node test/standalone-host-boundary.test.js && node test/security.test.js");
write("package.json", JSON.stringify(pkg, null, 2) + "\n");
var config = JSON.parse(read("config.json")); config.version = "1.6.0"; write("config.json", JSON.stringify(config, null, 2) + "\n");
write("README.md", read("README.md").replace(/^# SIRK Management Platform [^\r\n]+/m, "# SIRK Management Platform 1.6.0"));
var changelog = read("changelog.md"); if (changelog.indexOf("## 1.6.0") < 0) changelog = "## 1.6.0\n\n- Introduced a host-neutral runtime contract and isolated MeshCentral behind an adapter.\n- Added a standalone Node.js server and REST API mode without `pluginadmin.ashx` or plugin pins.\n- Added standalone authentication, device and remote-session provider contracts.\n- Added an application-owned extension registry under `sirk-platform-data/extensions`.\n- Exposed host capabilities for Desktop, Terminal, Files and native UI selection.\n\n" + changelog; write("changelog.md", changelog);
var history = JSON.parse(read("version-history.json")); var item = { version: "1.6.0", date: "2026-07-24", changes: ["Add host-neutral runtime and adapters", "Add standalone HTTP server and REST API", "Add application extension registry", "Expose remote-session capabilities"] }; if (Array.isArray(history)) history.unshift(item); else history.versions.unshift(item); write("version-history.json", JSON.stringify(history, null, 2) + "\n");

write("test/standalone-host-boundary.test.js", `"use strict";
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var contract = require("../server/contracts/host-context.js");
var standalone = require("../server/adapters/standalone/index.js");
var host = standalone.createHost({ dataRoot: path.join(root, ".tmp-standalone-test") });
assert.strictEqual(host.kind, "standalone");
assert.strictEqual(host.capabilities.nativeUi, false);
assert.strictEqual(typeof host.devices.list, "function");
assert.strictEqual(typeof host.sessions.create, "function");
assert.strictEqual(typeof require("../server/standalone.js").start, "function");
var core = fs.readFileSync(path.join(root, "public/portal/standalone/scripts/core.js"), "utf8");
assert.ok(core.indexOf("/modules/") >= 0, "Portal core must support REST module URLs.");
assert.ok(core.indexOf("__SIRK_PLATFORM_PLUGIN_PIN__") >= 0, "Plugin pin must be optional configuration, not a fixed dependency.");
var runtime = fs.readFileSync(path.join(root, "server/core/runtime.js"), "utf8");
assert.ok(runtime.indexOf("options.host") >= 0, "Runtime must accept HostContext.");
assert.ok(fs.existsSync(path.join(root, "server/core/module-registry.js")), "Application extension registry must exist.");
fs.rmSync(path.join(root, ".tmp-standalone-test"), { recursive: true, force: true });
console.log("Standalone host boundary: OK");
`);

console.log("Applied standalone host boundary 1.6.0");
