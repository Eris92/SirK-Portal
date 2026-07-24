"use strict";

var fs = require("fs");
var path = require("path");
var implementation = require("./plugin-main-standalone.js");
var routeCompat = require("./server/core/express-route-compat.js");
var updateBridge = require("./server/core/plugin-update-bridge.js");

function repairGeneratedPortalAssets() {
    var repairs = [
        {
            file: path.join(__dirname, "public", "portal", "management.js"),
            broken: "(script.requiresApproval ? ' sirk-script-approval-icon' : '')\">'",
            fixed: "(script.requiresApproval ? ' sirk-script-approval-icon' : '') + '\">'"
        },
        {
            file: path.join(__dirname, "public", "portal", "standalone", "scripts", "app.js"),
            broken: "itemStatus '\">'",
            fixed: "itemStatus + '\">'"
        },
        {
            file: path.join(__dirname, "public", "shared", "icon-registry.js"),
            broken: "safeClass\" viewBox",
            fixed: "safeClass + '\" viewBox"
        }
    ];
    repairs.forEach(function (repair) {
        try {
            var source = fs.readFileSync(repair.file, "utf8");
            if (source.indexOf(repair.broken) >= 0) {
                fs.writeFileSync(repair.file, source.split(repair.broken).join(repair.fixed), "utf8");
            }
        } catch (error) {
            // Asset validation reports the real error later; startup must remain available.
        }
    });
}

module.exports.SIRKPortal = function (parent) {
    repairGeneratedPortalAssets();
    var plugin = implementation.createPlugin(parent, "SIRKPortal");
    var setupHttpHandlers = plugin.hook_setupHttpHandlers;

    plugin.hook_setupHttpHandlers = function (webserver, meshServer) {
        updateBridge.install(plugin, parent, webserver, meshServer);
        return routeCompat.withExactPortalRedirect(webserver && webserver.app, function () {
            return setupHttpHandlers.call(plugin, webserver, meshServer);
        });
    };

    return plugin;
};
