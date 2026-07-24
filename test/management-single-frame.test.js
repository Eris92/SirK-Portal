"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var css = fs.readFileSync(path.join(__dirname, "..", "public", "portal", "vendor", "portal-ui-contract.css"), "utf8");

assert.ok(css.indexOf(".sirk-portal-view-management") >= 0, "Management view must own a single-surface override.");
assert.ok(css.indexOf("border:0!important") >= 0, "The redundant outer Management frame must be removed.");
assert.ok(css.indexOf(".sirk-management-shell") >= 0, "The inner Management shell must receive the shared surface styling.");
assert.ok(css.indexOf("border-radius:10px!important") >= 0, "The inner Management shell must inherit the removed surface radius.");

console.log("Management single-frame contract: OK");
