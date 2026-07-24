"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..", "public");
var offenders = [];

function walk(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(function (entry) {
        var file = path.join(directory, entry.name);
        if (entry.isDirectory()) { walk(file); return; }
        if (!/\.(js|css|html)$/i.test(entry.name)) return;
        var source = fs.readFileSync(file, "utf8");
        source.split(/\r?\n/).forEach(function (line, index) {
            if (/\bmc-[a-z0-9-]+/i.test(line)) offenders.push(path.relative(root, file) + ":" + (index + 1) + " contains mc-* class");
            if (/(?:class(?:Name)?\s*=|classList\.(?:add|remove|toggle|contains)|\.[a-z0-9_-]*management[a-z0-9_-]*)/i.test(line) && /management/i.test(line)) {
                offenders.push(path.relative(root, file) + ":" + (index + 1) + " contains menu-specific management class");
            }
        });
    });
}

walk(root);
assert.deepStrictEqual(offenders, [], "Forbidden Portal classes:\n" + offenders.join("\n"));

var page = fs.readFileSync(path.join(root, "shared", "ui", "page.js"), "utf8");
var layout = fs.readFileSync(path.join(root, "shared", "ui", "layout.js"), "utf8");
assert.ok(page.indexOf('host.className = "sirk-standalone-view-scroll"') >= 0, "Every shared page must use sirk-standalone-view-scroll.");
["sirk-column-primary", "sirk-column-secondary", "sirk-column-details"].forEach(function (name) {
    assert.ok(layout.indexOf(name) >= 0, "Missing canonical layout class: " + name);
});
console.log("Portal class contract: OK");
