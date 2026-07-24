"use strict";

var assert = require("assert");
var path = require("path");

var root = path.resolve(__dirname, "..");
var adminEntrypoint = require(path.join(root, "SIRK-PortalAdmin.js"));
var adminImplementation = require(path.join(root, "admin.js"));

assert.strictEqual(
    adminEntrypoint.admin,
    adminImplementation.admin,
    "SIRK-PortalAdmin.js must delegate MeshCentral admin requests to admin.js"
);
assert.strictEqual(typeof adminEntrypoint.admin, "function", "Admin entrypoint must export admin(plugin)");

console.log("SIRK Portal admin entrypoint: OK");
