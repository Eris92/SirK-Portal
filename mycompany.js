"use strict";

var fs = require("fs");
var path = require("path");
var createMyCompany = require("./plugin.js").mycompany;

module.exports.mycompany = function (parent) {
    // Remove the obsolete admin-panel UI configuration created by 0.5.8.
    // This is cleanup only; MyCompany no longer modifies MeshCentral's
    // plugin-management page or other plugin tabs.
    try {
        var settingsFile = path.join(parent.pluginPath, "mycompany", "data", "settings.json");
        if (fs.existsSync(settingsFile)) fs.unlinkSync(settingsFile);
        var settingsDirectory = path.dirname(settingsFile);
        if (fs.existsSync(settingsDirectory) && fs.readdirSync(settingsDirectory).length === 0) fs.rmdirSync(settingsDirectory);
    } catch (error) {
        console.log("MyCompany legacy settings cleanup warning:", error.message);
    }

    var obj = createMyCompany(parent);

    // Embedded modules are registered in parent.plugins only so backend modules
    // can discover each other. Their browser hooks are exported by MyCompany
    // under embedded*Startup names and must not run twice.
    ["myscripts", "mycommands", "approvalcenter", "moverequest"].forEach(function (shortName) {
        if (parent && parent.exports) parent.exports[shortName] = [];
        if (parent && parent.plugins && parent.plugins[shortName]) parent.plugins[shortName].exports = [];
    });

    return obj;
};
