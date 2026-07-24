"use strict";

var fs = require("fs");
var path = require("path");
var updateManagerFactory = require("./system-update-manager.js");
var updateRouterFactory = require("./http/update-router.js");

function normalizeBase(value) {
    value = String(value || "/");
    if (value.charAt(0) !== "/") value = "/" + value;
    if (value.charAt(value.length - 1) !== "/") value += "/";
    return value.replace(/\/+/g, "/");
}

function sendAsset(res, file, type) {
    fs.readFile(file, function (error, data) {
        if (error) {
            res.statusCode = 404;
            res.end("Not found");
            return;
        }
        res.setHeader("Content-Type", type);
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.end(data);
    });
}

function dataRootForPlugin(pluginRoot) {
    return path.resolve(pluginRoot, "..", "..", "sirk-platform-data");
}

module.exports.attach = function (plugin, meshParent) {
    var original = plugin.hook_setupHttpHandlers;
    var pluginRoot = path.resolve(__dirname, "..");
    var manager = updateManagerFactory.create({
        appRoot: pluginRoot,
        dataRoot: dataRootForPlugin(pluginRoot)
    });
    var updateApi = updateRouterFactory.createHandler(manager);

    plugin.hook_setupHttpHandlers = function (webserver, meshServer) {
        if (webserver && webserver.app && !webserver.__sirkUpdateRoutes) {
            webserver.__sirkUpdateRoutes = true;
            var domains = meshServer && meshServer.config && meshServer.config.domains || { "": { url: "/" } };
            Object.keys(domains).forEach(function (key) {
                var domain = domains[key] || {};
                if (domain.dns != null || domain.share != null) return;
                var base = normalizeBase(domain.url || "/");
                var jsPath = path.join(pluginRoot, "public", "portal", "system-updates.js");
                var cssPath = path.join(pluginRoot, "public", "portal", "system-updates.css");
                webserver.app.get(base + "sirkportal/assets/system-updates.js", function (req, res) {
                    sendAsset(res, jsPath, "text/javascript; charset=utf-8");
                });
                webserver.app.get(base + "sirkportal/assets/system-updates.css", function (req, res) {
                    sendAsset(res, cssPath, "text/css; charset=utf-8");
                });
                webserver.app.use(base + "sirk/api/v1/updates", function (req, res) {
                    var url = new URL(req.originalUrl || req.url, "http://sirk.local");
                    var prefix = base + "sirk/api/v1/updates";
                    url.pathname = "/api/system/updates" + url.pathname.slice(prefix.length);
                    updateApi(req, res, url);
                });
            });
        }
        return original.call(plugin, webserver, meshServer || meshParent);
    };
    return plugin;
};
