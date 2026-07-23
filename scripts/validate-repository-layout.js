"use strict";

var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..");
var errors = [];
var allowedRootPowerShell = new Set([
    "Install-SIRK-Portal-FromGit.ps1",
    "Install-SIRK-Portal-FromGit_RUN.ps1"
]);

function absolute(relative) { return path.join(root, relative); }
function exists(relative) { return fs.existsSync(absolute(relative)); }
function read(relative) { return fs.readFileSync(absolute(relative), "utf8"); }
function files(relative) {
    if (!exists(relative)) return [];
    return fs.readdirSync(absolute(relative), { withFileTypes: true }).reduce(function (result, entry) {
        var child = path.posix.join(relative.replace(/\\/g, "/"), entry.name);
        return result.concat(entry.isDirectory() ? files(child) : [child]);
    }, []);
}

[
    "tools/install", "scripts", "test", "docs", "public", "public/shared",
    "web/admin", "server/modules", "core", "modules", "assets/icons"
].forEach(function (relative) {
    if (!exists(relative)) errors.push("Missing repository directory: " + relative);
});

[
    "SIRK-Portal.js",
    "admin.js",
    "server/modules/approval-center/index.js",
    "docs/REPOSITORY-LAYOUT.md",
    "assets/icons/sirk-ui.svg",
    "public/shared/icon-registry.js",
    "web/admin/admin.css",
    "web/admin/admin.js"
].forEach(function (relative) {
    if (!exists(relative)) errors.push("Missing canonical layout file: " + relative);
});

var config = JSON.parse(read("config.json"));
var packageJson = JSON.parse(read("package.json"));
if (config.name !== "SIRK Management Platform") errors.push("Plugin display name must be SIRK Management Platform.");
if (config.shortName !== "SIRK-Portal") errors.push("Plugin shortName must be SIRK-Portal.");
if (packageJson.name !== "sirk-portal") errors.push("Package name must be sirk-portal.");

var canonicalEntry = read("SIRK-Portal.js");
if (canonicalEntry.indexOf('module.exports["SIRK-Portal"]') < 0) errors.push("Canonical entrypoint must export SIRK-Portal.");
if (exists("MyCompany.js")) {
    var legacyEntry = read("MyCompany.js");
    if (legacyEntry.length > 900 || legacyEntry.indexOf('require("./SIRK-Portal.js")') < 0) {
        errors.push("MyCompany.js must remain a small legacy compatibility shim only.");
    }
}

var pluginMain = read("plugin-main.js");
if (pluginMain.indexOf('browserPin = "MyCompany"') >= 0) errors.push("Browser asset pin must not be hardcoded to MyCompany.");
if (pluginMain.indexOf("SIRK Management Platform") < 0 || pluginMain.indexOf("SirkPlatformRuntime") < 0) {
    errors.push("Plugin runtime must use canonical SIRK Platform naming.");
}
var adminView = read("views/MyCompany.handlebars");
if (adminView.indexOf("SIRK Management Platform") < 0 || adminView.indexOf("SirkPlatformAdminData") < 0) {
    errors.push("Administration view must expose SIRK Management Platform branding.");
}

fs.readdirSync(root, { withFileTypes: true }).forEach(function (entry) {
    if (!entry.isFile() || !/\.ps1$/i.test(entry.name)) return;
    if (!allowedRootPowerShell.has(entry.name)) errors.push("PowerShell implementation must not live in repository root: " + entry.name);
});

if (exists("web")) {
    fs.readdirSync(absolute("web"), { withFileTypes: true }).forEach(function (entry) {
        if (entry.isFile() && /\.(?:js|css)$/i.test(entry.name)) errors.push("Admin frontend file must live in web/admin: web/" + entry.name);
    });
}

var architecture = read("docs/REPOSITORY-LAYOUT.md");
[
    "server/modules/approval-center/index.js",
    "public/modules/approvalcenter.js",
    "public/portal/",
    "public/native/",
    "public/shared/",
    "web/admin/"
].forEach(function (value) {
    if (architecture.indexOf(value) < 0) errors.push("Repository layout documentation is incomplete: " + value);
});

var backendApproval = "server/modules/approval-center/index.js";
var legacyApproval = "modules/ApprovalCenter/index.js";
var rendererApproval = "public/modules/approvalcenter.js";
if (read(backendApproval).indexOf("module.exports.createModule") < 0) errors.push("Canonical Approvals backend module is invalid.");
if (!exists(legacyApproval) || read(legacyApproval).indexOf("server/modules/approval-center") < 0 || read(legacyApproval).length > 500) {
    errors.push("Historical ApprovalCenter path must remain a small compatibility shim only.");
}
if (!exists(rendererApproval) || read(rendererApproval).indexOf("window.MyCompanyModules.approvalcenter") < 0) {
    errors.push("Canonical Approvals browser renderer is missing or invalid.");
}
if (exists("public/approvalcenter.js")) errors.push("Duplicate Approvals renderer must not exist: public/approvalcenter.js");

var registrations = Object.create(null);
files("public").filter(function (file) { return /\.js$/i.test(file); }).forEach(function (file) {
    var source = read(file);
    var pattern = /window\.MyCompanyModules\.([a-z0-9_-]+)\s*=/gi;
    var match;
    while ((match = pattern.exec(source))) {
        var key = match[1].toLowerCase();
        registrations[key] = registrations[key] || [];
        registrations[key].push(file);
    }
});
Object.keys(registrations).forEach(function (key) {
    var unique = Array.from(new Set(registrations[key]));
    if (unique.length > 1) errors.push("Duplicate browser renderer for module " + key + ": " + unique.join(", "));
});

var adminSource = read("admin.js");
if (adminSource.indexOf('"approvalcenter.js": ["public/modules/approvalcenter.js"') < 0) {
    errors.push("Asset router must point approvalcenter.js to the canonical public/modules renderer.");
}
if (adminSource.indexOf('"icons/sirk-ui.svg": ["assets/icons/sirk-ui.svg"') < 0) errors.push("Central icon sprite is not exposed by the asset router.");
if (adminSource.indexOf('"shared/icon-registry.js": ["public/shared/icon-registry.js"') < 0) errors.push("Shared icon registry is not exposed by the asset router.");
if (adminSource.indexOf('"admin.css": ["web/admin/admin.css"') < 0 || /\["web\/admin(?:-[^"\]]+)?\.(?:js|css)"/.test(adminSource)) {
    errors.push("Admin asset router must use only web/admin/* paths.");
}
if (!exists("MyCompanyAdmin.js") || read("MyCompanyAdmin.js").indexOf('require("./admin.js")') < 0 || read("MyCompanyAdmin.js").length > 500) {
    errors.push("MyCompanyAdmin.js must remain a small compatibility shim only.");
}

var navSource = read("public/portal-standalone-nav.js");
if (navSource.indexOf("shared/icon-registry.js") < 0 || navSource.indexOf("window.SirkIcons.svg") < 0) {
    errors.push("Standalone Portal navigation must use the shared icon registry.");
}

if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
}
console.log("Repository layout validation: OK");
console.log("SIRK Platform naming validation: OK");
console.log("Canonical server module validation: OK");
console.log("Canonical frontend renderer validation: OK");
console.log("Central icon registry validation: OK");
console.log("Canonical admin directory validation: OK");
