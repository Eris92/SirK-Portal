"use strict";

var shared = require("./shared.js");

module.exports.createPluginAdminService = function (options) {
    var pluginHandler = options.pluginHandler;
    var fs = options.fs;
    var path = options.path;
    var protectedShortName = String(options.protectedShortName || "MyCompany").toLowerCase();

    function requireAdmin(user) {
        if (!shared.isSiteAdmin(user)) throw new Error("Permission denied.");
    }

    function database() {
        return pluginHandler && pluginHandler.parent && pluginHandler.parent.db;
    }

    function clean(record) {
        return {
            id: String(record && record._id || ""),
            name: shared.cleanText(record && record.name || record && record.shortName || "Plugin", 200),
            shortName: shared.cleanText(record && record.shortName || "", 100),
            version: shared.cleanText(record && record.version || "", 50),
            description: shared.cleanText(record && record.description || "", 500),
            status: Number(record && record.status) === 1 ? 1 : 0,
            protected: String(record && record.shortName || "").toLowerCase() === protectedShortName
        };
    }

    function list(user) {
        requireAdmin(user);
        return new Promise(function (resolve, reject) {
            var db = database();
            if (!db || typeof db.getPlugins !== "function") return reject(new Error("MeshCentral plugin database is unavailable."));
            db.getPlugins(function (error, records) {
                if (error) return reject(new Error("Could not read the MeshCentral plugin list."));
                resolve((Array.isArray(records) ? records : []).map(clean).sort(function (a, b) {
                    return a.name.localeCompare(b.name, "pl", { sensitivity: "base" });
                }));
            });
        });
    }

    function record(id) {
        return new Promise(function (resolve, reject) {
            var db = database();
            if (!db || typeof db.getPlugin !== "function") return reject(new Error("MeshCentral plugin database is unavailable."));
            db.getPlugin(id, function (error, records) {
                if (error || !Array.isArray(records) || records.length !== 1) return reject(new Error("Plugin was not found."));
                resolve(records[0]);
            });
        });
    }

    function callbackCall(method, args) {
        return new Promise(function (resolve, reject) {
            if (!pluginHandler || typeof pluginHandler[method] !== "function") return reject(new Error("MeshCentral does not support this plugin operation."));
            pluginHandler[method].apply(pluginHandler, args.concat(function (error) {
                if (error) return reject(new Error(typeof error === "string" ? error : (error.message || "Plugin operation failed.")));
                resolve();
            }));
        });
    }

    function backupBeforeRemoval(plugin) {
        var source = path.resolve(pluginHandler.pluginPath, String(plugin.shortName || ""));
        var pluginRoot = path.resolve(pluginHandler.pluginPath);
        if (source.toLowerCase().indexOf((pluginRoot + path.sep).toLowerCase()) !== 0 || !fs.existsSync(source)) return null;
        var stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 17);
        var backupRoot = path.join(path.dirname(pluginRoot), "plugin-backups");
        var target = path.join(backupRoot, String(plugin.shortName).replace(/[^a-z0-9._-]/gi, "_") + "-removed-" + stamp);
        fs.mkdirSync(backupRoot, { recursive: true });
        fs.cpSync(source, target, { recursive: true, errorOnExist: true });
        return target;
    }

    function operate(user, action, payload) {
        requireAdmin(user);
        action = String(action || "").toLowerCase();
        payload = payload || {};

        if (action === "add") {
            var configUrl = String(payload.configUrl || "").trim();
            if (configUrl.length > 2048) return Promise.reject(new Error("Plugin URL is too long."));
            try {
                var parsed = new URL(configUrl);
                if (parsed.protocol !== "https:") throw new Error("Only HTTPS plugin configuration URLs are allowed.");
                if (parsed.username || parsed.password) throw new Error("Plugin URL must not contain credentials.");
            } catch (error) {
                return Promise.reject(new Error(error.message || "Invalid plugin configuration URL."));
            }
            if (!pluginHandler || typeof pluginHandler.getPluginConfig !== "function" || typeof pluginHandler.addPlugin !== "function") {
                return Promise.reject(new Error("MeshCentral plugin installation is unavailable."));
            }
            return pluginHandler.getPluginConfig(configUrl).then(function (config) {
                if (!config || typeof config !== "object") throw new Error("Plugin configuration is invalid.");
                config.configUrl = configUrl;
                return pluginHandler.addPlugin(config);
            }).then(function () { return { changed: true, restartRequired: false }; });
        }

        var id = String(payload.id || "");
        if (!id || id.length > 250 || !/^[a-z0-9_./:-]+$/i.test(id)) return Promise.reject(new Error("Invalid plugin identifier."));
        return record(id).then(function (plugin) {
            if (String(plugin.shortName || "").toLowerCase() === protectedShortName) {
                throw new Error("MyCompany cannot disable or remove itself from its own administration panel.");
            }
            if (action === "enable") {
                return callbackCall("installPlugin", [id, false, null]).then(function () {
                    return { changed: true, restartRequired: false };
                });
            }
            if (action === "disable") {
                return callbackCall("disablePlugin", [id]).then(function () {
                    return { changed: true, restartRequired: false };
                });
            }
            if (action === "remove") {
                var backupPath = backupBeforeRemoval(plugin);
                return callbackCall("removePlugin", [id]).then(function () {
                    return { changed: true, restartRequired: false, backupPath: backupPath };
                });
            }
            throw new Error("Unknown plugin operation.");
        });
    }

    return { list: list, operate: operate };
};
