"use strict";

var fs = require("fs");
var path = require("path");
var VERSION = require("./config.json").version;

function isSiteAdmin(user) {
    if (!user) return false;
    var value = user.siteadmin;
    var text = String(value).trim().toLowerCase();
    return value === true || value === 0xFFFFFFFF || (Number(value) | 0) === -1 ||
        text === "true" || text === "4294967295" || text === "-1" || text === "0xffffffff";
}

function errorText(error) {
    return String(
        error &&
        (error.stack || error.message) ||
        error ||
        "Unknown MyCompany bootstrap error."
    );
}

function dataRoot(parent) {
    var meshServer = parent && parent.parent;
    var base = meshServer && meshServer.datapath
        ? meshServer.datapath
        : path.dirname(
            parent && parent.pluginPath || __dirname
        );

    return path.join(base, "mycompany-data");
}

function writeBootstrapLog(parent, stage, error) {
    try {
        var root = dataRoot(parent);
        fs.mkdirSync(root, { recursive: true });
        fs.appendFileSync(
            path.join(root, "bootstrap.log"),
            [
                new Date().toISOString(),
                String(stage || ""),
                error ? errorText(error) : ""
            ].join(" | ") + "\r\n",
            "utf8"
        );
    } catch (ignored) {}
}

function setResponse(res, status, type, body) {
    if (typeof res.status === "function") {
        res.status(status);
    } else {
        res.statusCode = status;
    }

    if (typeof res.set === "function") {
        res.set("Content-Type", type);
        res.set("Cache-Control", "no-store");
    } else if (typeof res.setHeader === "function") {
        res.setHeader("Content-Type", type);
        res.setHeader("Cache-Control", "no-store");
    }

    if (typeof res.send === "function") {
        res.send(body);
    } else if (typeof res.end === "function") {
        res.end(body);
    }
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function fallbackPlugin(parent, shortName, error) {
    var message = errorText(error);
    var obj = {
        parent: parent,
        shortName: shortName,
        exports: [],
        loadError: message
    };

    writeBootstrapLog(parent, "fallback-created", error);

    obj.handleAdminReq = function (req, res, user) {
        if (!isSiteAdmin(user)) {
            setResponse(res, 403, "text/plain; charset=utf-8", "Forbidden");
            return;
        }
        var body = [
            "<!doctype html>",
            "<html><head><meta charset=\"utf-8\">",
            "<title>MyCompany diagnostic</title>",
            "<style>",
            "body{font-family:Consolas,monospace;padding:20px}",
            "pre{white-space:pre-wrap;border:1px solid #999;padding:12px}",
            "</style></head><body>",
            "<h2>MyCompany failed to initialize</h2>",
            "<div>Version: ",
            escapeHtml(VERSION),
            "</div>",
            "<div>Loaded shortName: ",
            escapeHtml(shortName),
            "</div>",
            "<pre>",
            "Detailed diagnostics were written to the local MyCompany bootstrap log.",
            "</pre>",
            "</body></html>"
        ].join("");

        setResponse(
            res,
            500,
            "text/html; charset=utf-8",
            body
        );
    };

    obj.handleAdminPostReq = function (req, res, user) {
        if (!isSiteAdmin(user)) {
            setResponse(res, 403, "application/json; charset=utf-8", JSON.stringify({ ok: false, error: "Forbidden" }));
            return;
        }
        setResponse(
            res,
            503,
            "application/json; charset=utf-8",
            JSON.stringify({
                ok: false,
                error: "MyCompany failed to initialize. See the local bootstrap log."
            })
        );
    };

    obj.server_startup = function () {
        writeBootstrapLog(
            parent,
            "fallback-server-startup",
            error
        );
    };

    return obj;
}

function registerAdminAlias(parent, plugin, shortName) {
    if (
        !parent ||
        !parent.plugins ||
        !parent.exports
    ) {
        return;
    }

    var alias = shortName === "MyCompany"
        ? "mycompany"
        : "MyCompany";

    if (parent.plugins[alias]) return;

    parent.plugins[alias] = {
        exports: [],
        handleAdminReq: function (req, res, user) {
            var active = parent.plugins[shortName];
            if (!active || typeof active.handleAdminReq !== "function") return;
            return active.handleAdminReq(req, res, user);
        },
        handleAdminPostReq: function (req, res, user) {
            var active = parent.plugins[shortName];
            if (!active || typeof active.handleAdminPostReq !== "function") return;
            return active.handleAdminPostReq(req, res, user);
        }
    };
    parent.exports[alias] = [];
}

function create(parent, shortName) {
    writeBootstrapLog(parent, "factory-enter:" + shortName);

    var plugin;

    try {
        var implementation = require("./plugin-main-standalone.js");

        if (
            !implementation ||
            typeof implementation.createPlugin !== "function"
        ) {
            throw new Error(
                "plugin-main-standalone.js does not export createPlugin()."
            );
        }

        plugin = implementation.createPlugin(
            parent,
            shortName
        );

        if (
            !plugin ||
            typeof plugin.handleAdminReq !== "function"
        ) {
            throw new Error(
                "Plugin factory returned an invalid instance."
            );
        }

        writeBootstrapLog(
            parent,
            "plugin-ready:" + shortName
        );
    } catch (error) {
        writeBootstrapLog(
            parent,
            "plugin-failed:" + shortName,
            error
        );
        plugin = fallbackPlugin(
            parent,
            shortName,
            error
        );
    }

    registerAdminAlias(
        parent,
        plugin,
        shortName
    );

    return plugin;
}

module.exports.MyCompany = function (parent) {
    return create(parent, "MyCompany");
};

module.exports.mycompany = function (parent) {
    return create(parent, "mycompany");
};
