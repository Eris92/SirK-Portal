"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var safe = fs.readFileSync(path.join(root, "server/modules/portal/safe.js"), "utf8");
var css = fs.readFileSync(path.join(root, "web/admin/admin-ui-enhancements.css"), "utf8");

assert.ok(safe.indexOf("withoutCurrentPortalPlugin") >= 0, "Portal settings wrapper must exclude the current plugin from legacy conflict detection.");
assert.ok(safe.indexOf("value.standaloneConflict = false") >= 0, "Portal client config must not report a conflict with itself.");
assert.ok(css.indexOf("grid-template-columns:max-content minmax(0,1fr)") >= 0, "Admin save bar must reserve a stable column for the save button.");
assert.ok(css.indexOf("overflow-wrap:anywhere") >= 0, "Long save errors must wrap without crushing the button.");

console.log("Admin Portal save conflict: OK");
