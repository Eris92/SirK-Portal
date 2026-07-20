"use strict";

var fs = require("fs");
var path = require("path");

module.exports.admin = function (parent) {
    var obj = {};
    var pluginRoot = path.join(parent.parent.pluginPath, "mycompany");
    var settingsPath = path.join(pluginRoot, "data", "settings.json");
    var defaultSettings = {
        tabs: {
            scripts: true,
            commands: true,
            approvals: true,
            move: true
        }
    };

    obj.parent = parent;

    function isFullAdministrator(user) {
        if (!user || user.siteadmin == null) return false;
        var rights = Number(user.siteadmin);
        return rights === 0xFFFFFFFF || (rights | 0) === -1;
    }

    function booleanValue(value, fallback) {
        if (value === true || value === 1 || value === "1") return true;
        if (value === false || value === 0 || value === "0") return false;
        if (/^(true|on|yes)$/i.test(String(value || ""))) return true;
        if (/^(false|off|no)$/i.test(String(value || ""))) return false;
        return fallback;
    }

    function normalizeSettings(value) {
        value = value && typeof value === "object" && !Array.isArray(value) ? value : {};
        var tabs = value.tabs && typeof value.tabs === "object" && !Array.isArray(value.tabs) ? value.tabs : {};

        return {
            tabs: {
                scripts: booleanValue(tabs.scripts, true),
                commands: booleanValue(tabs.commands, true),
                approvals: booleanValue(tabs.approvals, true),
                move: booleanValue(tabs.move, true)
            }
        };
    }

    function readSettings() {
        try {
            return normalizeSettings(JSON.parse(fs.readFileSync(settingsPath, "utf8")));
        } catch (error) {
            return normalizeSettings(defaultSettings);
        }
    }

    function writeSettings(settings) {
        settings = normalizeSettings(settings);
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });

        var temporaryPath = settingsPath + "." + process.pid + ".tmp";
        fs.writeFileSync(temporaryPath, JSON.stringify(settings, null, 2), "utf8");

        try {
            fs.renameSync(temporaryPath, settingsPath);
        } catch (error) {
            fs.copyFileSync(temporaryPath, settingsPath);
            fs.unlinkSync(temporaryPath);
        }

        return settings;
    }

    function sendJson(res, statusCode, value) {
        res.statusCode = statusCode;
        res.set("Content-Type", "application/json; charset=utf-8");
        res.set("Cache-Control", "no-store");
        res.set("X-Content-Type-Options", "nosniff");
        res.send(JSON.stringify(value));
    }

    function readConfig() {
        try {
            return JSON.parse(fs.readFileSync(path.join(pluginRoot, "config.json"), "utf8"));
        } catch (error) {
            return {};
        }
    }

    function diagnostics() {
        var config = readConfig();
        return {
            generatedAt: new Date().toISOString(),
            plugin: {
                name: config.name || "My Company",
                version: config.version || "unknown",
                root: pluginRoot,
                hasAdminPanel: config.hasAdminPanel === true
            },
            runtime: {
                node: process.version,
                platform: process.platform,
                arch: process.arch
            },
            modules: typeof parent.getEmbeddedDiagnostics === "function" ? parent.getEmbeddedDiagnostics() : []
        };
    }

    function safeJson(value) {
        return JSON.stringify(value)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026");
    }

    obj.req = function (req, res, user) {
        var asset = String(req && req.query && req.query.asset || "");

        if (asset === "ui-config") {
            sendJson(res, 200, {
                ok: true,
                settings: readSettings()
            });
            return;
        }

        if (!isFullAdministrator(user)) {
            res.sendStatus(403);
            return;
        }

        if (asset === "debug") {
            sendJson(res, 200, {
                ok: true,
                diagnostics: diagnostics()
            });
            return;
        }

        res.set("Cache-Control", "no-store");
        res.set("X-Content-Type-Options", "nosniff");

        try {
            res.render("admin", {
                title: "My Company",
                pluginShortName: "mycompany",
                adminDataJson: safeJson({
                    settings: readSettings(),
                    diagnostics: diagnostics()
                })
            });
        } catch (error) {
            console.error("mycompany: admin render error", error);
            res.sendStatus(500);
        }
    };

    obj.post = function (req, res, user) {
        if (!isFullAdministrator(user)) {
            res.sendStatus(403);
            return;
        }

        var asset = String(req && req.query && req.query.asset || "");
        if (asset !== "save-settings") {
            res.sendStatus(405);
            return;
        }

        try {
            var rawTabs = req && req.body && req.body.tabs;
            var tabs = typeof rawTabs === "string" ? JSON.parse(rawTabs) : rawTabs;
            var settings = writeSettings({ tabs: tabs });
            sendJson(res, 200, {
                ok: true,
                settings: settings
            });
        } catch (error) {
            sendJson(res, 400, {
                ok: false,
                error: String(error && error.message || error)
            });
        }
    };

    return obj;
};
