"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..");

[
    "mycompany.js",
    "plugin.js",
    "core/index.js",
    "modules/scripts/index.js",
    "modules/commands/index.js",
    "modules/approvals/index.js",
    "modules/move/index.js",
    "settings/defaults.json",
    "docs/ARCHITECTURE.md",
    "docs/MIGRATION.md"
].forEach(function (name) {
    assert.ok(fs.existsSync(path.join(root, name)), "Missing required file: " + name);
});

var defaults = JSON.parse(fs.readFileSync(path.join(root, "settings/defaults.json"), "utf8"));
assert.strictEqual(defaults.modules.approvals.allowNoApproval, false, "No-approval must be disabled by default.");
console.log("MeshCentral-MyCompany structure OK");
