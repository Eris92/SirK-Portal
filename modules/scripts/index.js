"use strict";

var fs = require("fs");
var path = require("path");

exports.create = function (runtime) {
    var moduleRoot = __dirname;
    var filesRoot = path.join(moduleRoot, "Files");
    var legacyRoot = path.resolve(moduleRoot, "..", "..", "legacy", "myscripts");
    var sourceRoot = fs.existsSync(path.join(filesRoot, "package.json")) ? filesRoot : legacyRoot;

    return {
        name: "scripts",
        sourceRoot: sourceRoot,
        filesRoot: filesRoot,
        initialize: function () {
            if (!fs.existsSync(sourceRoot)) {
                runtime.audit("mycompanymodulewarning", "My Scripts source files are not bundled yet. Module remains disabled until Files are synchronized.");
                return;
            }
            runtime.audit("mycompanymoduleloaded", "Scripts module loaded from " + sourceRoot + ".");
        }
    };
};
