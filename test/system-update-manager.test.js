"use strict";

var assert = require("assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var managerFactory = require("../server/system-update-manager.js");

var root = fs.mkdtempSync(path.join(os.tmpdir(), "sirk-update-manager-"));
fs.mkdirSync(path.join(root, "server"), { recursive: true });
fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ version: "1.0.0" }));
fs.writeFileSync(path.join(root, "config.json"), JSON.stringify({ shortName: "SIRKPortal", version: "1.0.0" }));
fs.writeFileSync(path.join(root, "SIRKPortal.js"), "module.exports = {};\n");
fs.writeFileSync(path.join(root, "server", "standalone.js"), "module.exports = {};\n");

var manager = managerFactory.create({ appRoot: root, dataRoot: path.join(root, "data") });
assert.deepStrictEqual(manager.channels, { stable: "main", beta: "beta", dev: "develop" });
assert.strictEqual(manager.current().channel, "dev");
assert.strictEqual(manager.current().branch, "develop");
assert.strictEqual(manager.setChannel("stable").branch, "main");
assert.strictEqual(manager.setChannel("beta").branch, "beta");
assert.strictEqual(manager.setChannel("dev").branch, "develop");
assert.strictEqual(manager.health().ok, true);
var backup = manager.backup("manual");
assert.ok(backup.id);
assert.strictEqual(backup.version, "1.0.0");
assert.strictEqual(manager.backups().length, 1);
assert.ok(fs.existsSync(path.join(root, "data", "updates", "backups", backup.id, "manifest.json")));

console.log("system-update-manager.test.js: OK");
