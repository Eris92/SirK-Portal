"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..");

function read(file) {
    return fs.readFileSync(path.join(root, file), "utf8");
}

var nav = read("public/portal/standalone/scripts/navigation.js");
var deviceCss = read("public/native/device-tabs.css");
var contractCss = read("public/vendor/sirk-portal/portal-ui-contract.css");
var contractJs = read("public/vendor/sirk-portal/portal-ui-contract.js");
var moduleShell = read("public/shared/module-shell.js");
var sharedPage = read("public/shared/ui/page.js");
var management = read("public/modules/automation/index.js");
var adminLayout = read("web/admin/admin-layout.js");
var standalone = read("public/portal/standalone/index.html");

[
    "public/modules/commands/index.js",
    "public/modules/approvals/index.js",
    "public/modules/jira/index.js",
    "public/modules/security/index.js"
].forEach(function (file) {
    assert(
        read(file).indexOf("window.SirkPlatformModuleShell.create") >= 0,
        file + " must mount through SirkPlatformModuleShell"
    );
});

[
    "sirk-standalone-view-scroll",
    "sirk-toolbar-host",
    "sirk-layout-host",
    "sirk-layout",
    "sirk-column sirk-column-primary",
    "sirk-column sirk-column-secondary",
    "sirk-column sirk-column-details"
].forEach(function (className) {
    assert(
        sharedPage.indexOf(className) >= 0 || moduleShell.indexOf(className) >= 0,
        "Shared Portal shell is missing " + className
    );
});

[
    "--mc-ui-primary-width: 184px",
    "--mc-ui-secondary-width: 236px",
    "--mc-ui-secondary-edit-width: 440px",
    "--mc-ui-collapsed-width: 56px",
    ".sirk-nav-item",
    ".sirk-nav-icon",
    ".mc-portal-nav-label",
    ".sirk-card",
    ".sirk-button",
    ".mc-portal-table-wrap",
    ".mc-portal-table"
].forEach(function (value) {
    assert(contractCss.indexOf(value) >= 0, "Canonical Portal CSS is missing: " + value);
});

[
    "decorateNavigation",
    "decorateTables",
    "decorateActions",
    "decorateToolbar",
    "decorateShell",
    "decoratePortalViews",
    "installViewStyle",
    "decorateSettingsFrame",
    "observer.observe(root, { childList: true, subtree: true })",
    "ensureFrameStyle"
].forEach(function (value) {
    assert(contractJs.indexOf(value) >= 0, "Canonical Portal runtime is missing: " + value);
});

[
    "sirk-standalone-view-scroll",
    "mc-portal-view-scroll",
    "mc-portal-view-toolbar",
    "sirk-button-secondary",
    "mc-portal-status",
    "mc-portal-list",
    "mc-portal-list-row",
    "mc-portal-badge"
].forEach(function (value) {
    assert(contractJs.indexOf(value) >= 0, "Shared view contract is missing: " + value);
});

[
    ".sirk-standalone-view-scroll",
    ".sirk-device-toolbar",
    ".sirk-standalone-card,.sirk-device-group,.sirk-device-hero,.sirk-device-detail-item,.sirk-device-native-card",
    ".sirk-device-input,.sirk-device-select",
    ".sirk-device-refresh,.sirk-device-back",
    ".sirk-device-status",
    ".sirk-device-summary span",
    ".sirk-device-list",
    ".sirk-device-row"
].forEach(function (value) {
    assert(contractJs.indexOf(value) >= 0, "Overview or Devices is not connected to the shared UI contract: " + value);
});

assert(
    contractJs.indexOf("observer.observe(document.documentElement") < 0,
    "Canonical UI observer must stay scoped to #sirkPortalRoot"
);
assert(
    contractJs.indexOf('adminRoot.id = "sirkPortalRoot"') >= 0,
    "Embedded Settings must receive an isolated Portal style root"
);

[
    "vendor/sirk-portal/portal-ui-contract.css",
    "vendor/sirk-portal/portal-ui-contract.js"
].forEach(function (value) {
    assert(nav.indexOf(value) >= 0, "Portal must load the canonical contract: " + value);
});

[
    "preserveActiveDeviceWorkspace",
    "restoreActiveDeviceWorkspace",
    "moveChildren",
    "flattenManagementHost",
    "installLayoutStyle",
    "15000",
    'content.style.visibility = "hidden"'
].forEach(function (value) {
    assert(nav.indexOf(value) < 0, "Legacy Portal layout mutation must not return: " + value);
});

[
    "is-collapsed",
    "is-management-edit-mode",
    "sirk-layout",
    "sirk-column sirk-column-primary",
    "color-mix"
].forEach(function (value) {
    assert(deviceCss.indexOf(value) < 0, "Device tabs CSS must not style another module: " + value);
});

assert(
    management.indexOf('window.SirkPlatformModuleShell.create') >= 0,
    "Management must expose the canonical module shell"
);
assert(
    management.indexOf('preset: "myscripts"') >= 0,
    "Automation must use the canonical shared shell preset"
);
assert(
    adminLayout.indexOf("sirk-standalone-view-scroll") >= 0 &&
    adminLayout.indexOf("sirk-layout") >= 0 &&
    adminLayout.indexOf("sirk-column sirk-column-primary") >= 0 &&
    adminLayout.indexOf("sirk-column sirk-column-secondary") >= 0 &&
    adminLayout.indexOf("sirk-column sirk-column-details") >= 0,
    "Settings administration must use the same canonical shell and columns"
);
assert(
    adminLayout.indexOf('layout.classList.toggle("is-collapsed"') >= 0,
    "Settings collapse must resize the real shared layout"
);
assert(
    standalone.indexOf("portal-module-shell.css?v=__VERSION__") >= 0,
    "Standalone Portal must load its scoped module shell stylesheet"
);

console.log("Canonical SIRK Portal UI contract: OK");
