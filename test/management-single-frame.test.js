"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var css = fs.readFileSync(path.join(__dirname, "..", "public", "portal", "vendor", "portal-ui-contract.css"), "utf8");

assert.ok(css.indexOf(".sirk-standalone-content.sirk-unified-content > .sirk-portal-view-host") >= 0, "All module views must use the shared outer surface.");
assert.ok(css.indexOf(".sirk-portal-view-host > .") >= 0, "Management must be normalized inside the shared host.");
assert.ok(css.indexOf(".sirk-portal-view-host > . > .sirk-standalone-view-scroll") >= 0, "Management shell must not draw a second outer frame.");
assert.ok(css.indexOf("border-radius: 10px !important") >= 0, "The shared outer surface must own the 10px radius.");
assert.ok(css.indexOf("clip-path: inset(0 round 10px)") >= 0, "The shared surface must visibly clip inner Management content.");
assert.ok(css.indexOf("Management owns one visual surface") < 0, "The obsolete Management-only override must not return.");

console.log("Management single-frame contract: OK");
