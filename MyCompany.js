"use strict";

// Legacy compatibility entrypoint for installations created before the
// SIRK-Portal rename. New installations must load SIRK-Portal.js.
var canonical = require("./SIRK-Portal.js");

module.exports.MyCompany = function (parent) {
    return canonical.create(parent, "MyCompany");
};

module.exports.mycompany = function (parent) {
    return canonical.create(parent, "mycompany");
};
