"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var css = fs.readFileSync(path.join(__dirname, "..", "public", "portal", "vendor", "portal-ui-contract.css"), "utf8");

assert(css.indexOf(".sirk-standalone-content.sirk-unified-content > .sirk-portal-view-host") >= 0, "final stylesheet must style the shared Portal view host");
assert(css.indexOf("border-radius: 10px !important") >= 0, "final Portal view radius is missing");
assert(css.indexOf("overflow: hidden !important") >= 0, "Portal view host must clip inner backgrounds");
assert(css.indexOf("clip-path: inset(0 round 10px)") >= 0, "final clipping fallback is missing");
assert(css.indexOf(".sirk-portal-view-host > .sirk-standalone-view-scroll") >= 0, "module shell normalization is missing");
assert(css.indexOf(".sirk-portal-view-host > .sirk-approval-shell") >= 0, "Approval shell normalization is missing");
assert(css.indexOf("border: 0 !important") >= 0 && css.indexOf("border-radius: 0 !important") >= 0, "inner shells must not draw a second outer frame");
assert(css.indexOf(".sirk-portal-view-management{\n    border:0") < 0, "legacy Management-only surface override must not return");

console.log("portal-global-surface.test.js: OK");
