"use strict";

var fs = require("fs");
var path = require("path");

exports.create = function (runtime) {
    var moduleRoot = __dirname;
    var filesRoot = path.join(moduleRoot, "Files");
    var legacyRoot = path.resolve(moduleRoot, "..", "..", "legacy", "commands");
    var sourceRoot = fs.existsSync(path.join(filesRoot, "package.json")) ? filesRoot : legacyRoot;

    return {
        name: "commands",
        sourceRoot: sourceRoot,
        filesRoot: filesRoot,
        initialize: function () {
            if (!fs.existsSync(sourceRoot)) {
                throw new Error("My Commands source files are missing. Run npm run sync:files.");
            }
            runtime.audit("mycompanymoduleloaded", "Commands module loaded from " + sourceRoot + ".");
        }
    };
};
