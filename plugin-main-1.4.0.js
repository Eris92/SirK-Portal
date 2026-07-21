"use strict";

var base = require("./plugin-main.js");
var runtimeFactory = require("./core/runtime-portal.js");
var adminFactory = require("./MyCompanyAdmin.js");

module.exports.createPlugin = function (parent, shortName) {
    var plugin = base.createPlugin(parent, shortName);
    plugin.runtime = runtimeFactory.createRuntime({
        parent: parent,
        pluginRoot: __dirname,
        source: plugin
    });
    plugin.admin = adminFactory.admin(plugin);
    return plugin;
};
