"use strict";

var fs = require("fs");
var path = require("path");
var https = require("https");
var shared = require("../../core/shared.js");

var VENDOR_VERSION = "0.3.17";
var VENDOR_REF = "e894c444c9d7e2e1218642018bf9c14dfb99c957";
var VENDOR_FILES = [
    "sirk-portal.css",
    "sirk-preflight-0.3.13.js",
    "sirk-portal.js",
    "sirk-remote-modules-0.3.13.js",
    "sirk-portal-patch-0.2.8.js",
    "sirk-ui-icons-0.3.4.js",
    "sirk-layout-0.3.1.js",
    "sirk-management-workspace-0.3.6.js",
    "sirk-ui-runtime-0.3.15.js",
    "sirk-device-layout-0.3.13.js",
    "sirk-controls-0.3.17.js"
];

module.exports.createModule = function (context) {
    var vendorState = {
        version: VENDOR_VERSION,
        ref: VENDOR_REF,
        ready: false,
        directory: "",
        missing: [],
        error: ""
    };

    function settings() {
        return context.settings.read().modules.portal || {};
    }

    function allowed(user) {
        return !!user;
    }

    function requireAdmin(user) {
        if (!shared.isSiteAdmin(user)) throw new Error("Permission denied.");
    }

    function standalonePortalActive() {
        var plugins = context.parent && context.parent.plugins || {};
        return Object.keys(plugins).some(function (key) {
            var normalized = String(key || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
            return normalized === "sirkportal";
        });
    }

    function vendorDirectory() {
        return path.join(context.pluginRoot, "public", "vendor", "sirk-portal");
    }

    function validVendorFile(filePath) {
        try {
            return fs.statSync(filePath).isFile() && fs.statSync(filePath).size > 32;
        } catch (error) {
            return false;
        }
    }

    function download(url, targetPath, redirects) {
        redirects = Number(redirects || 0);
        return new Promise(function (resolve, reject) {
            var request = https.get(url, {
                headers: {
                    "User-Agent": "MeshCentral-MyCompany/1.4.1",
                    "Accept": "application/octet-stream"
                }
            }, function (response) {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    response.resume();
                    if (redirects >= 5) {
                        reject(new Error("Too many redirects while downloading " + url));
                        return;
                    }
                    download(response.headers.location, targetPath, redirects + 1).then(resolve, reject);
                    return;
                }
                if (response.statusCode !== 200) {
                    response.resume();
                    reject(new Error("HTTP " + response.statusCode + " while downloading " + url));
                    return;
                }

                var temporaryPath = targetPath + ".tmp-" + process.pid + "-" + Date.now();
                var stream = fs.createWriteStream(temporaryPath, { flags: "wx" });
                var completed = false;

                function fail(error) {
                    if (completed) return;
                    completed = true;
                    try { stream.destroy(); } catch (ignored) {}
                    try { fs.unlinkSync(temporaryPath); } catch (ignored) {}
                    reject(error);
                }

                response.on("error", fail);
                stream.on("error", fail);
                stream.on("finish", function () {
                    if (completed) return;
                    completed = true;
                    stream.close(function () {
                        try {
                            if (!validVendorFile(temporaryPath)) throw new Error("Downloaded vendor asset is empty: " + path.basename(targetPath));
                            try { fs.unlinkSync(targetPath); } catch (ignored) {}
                            fs.renameSync(temporaryPath, targetPath);
                            resolve();
                        } catch (error) {
                            try { fs.unlinkSync(temporaryPath); } catch (ignored) {}
                            reject(error);
                        }
                    });
                });
                response.pipe(stream);
            });
            request.setTimeout(30000, function () {
                request.destroy(new Error("Timeout while downloading " + url));
            });
            request.on("error", reject);
        });
    }

    function ensureVendorAssets() {
        var directory = vendorDirectory();
        vendorState.directory = directory;
        fs.mkdirSync(directory, { recursive: true });

        var missing = VENDOR_FILES.filter(function (name) {
            return !validVendorFile(path.join(directory, name));
        });
        vendorState.missing = missing.slice();

        var chain = Promise.resolve();
        missing.forEach(function (name) {
            chain = chain.then(function () {
                var url = "https://raw.githubusercontent.com/Eris92/SirK-Portal/" + VENDOR_REF + "/" + encodeURIComponent(name);
                return download(url, path.join(directory, name));
            });
        });

        return chain.then(function () {
            var unresolved = VENDOR_FILES.filter(function (name) {
                return !validVendorFile(path.join(directory, name));
            });
            if (unresolved.length) throw new Error("Missing SirK Portal vendor assets: " + unresolved.join(", "));
            vendorState.ready = true;
            vendorState.missing = [];
            vendorState.error = "";
            return vendorState;
        }).catch(function (error) {
            vendorState.ready = false;
            vendorState.error = String(error && error.message || error);
            throw new Error("Unable to provision embedded SirK Portal " + VENDOR_VERSION + ": " + vendorState.error);
        });
    }

    return {
        key: "portal",
        clientConfig: function () {
            var value = settings();
            return {
                key: "portal",
                name: "SirK Portal",
                menuTitle: "SirK Portal",
                script: "portal.js",
                style: "portal.css",
                showInMenu: false,
                defaultView: String(value.defaultView || "overview"),
                showLauncher: value.showLauncher !== false,
                standaloneConflict: standalonePortalActive(),
                vendorVersion: VENDOR_VERSION,
                vendorReady: vendorState.ready
            };
        },
        getAccess: function (user) {
            return {
                allowed: allowed(user),
                siteAdmin: shared.isSiteAdmin(user)
            };
        },
        initialize: function () {
            return ensureVendorAssets();
        },
        apiGet: function (asset, req, user) {
            if (!allowed(user)) throw new Error("Permission denied.");
            if (asset === "status" || asset === "settings") {
                return {
                    ok: true,
                    module: settings(),
                    siteAdmin: shared.isSiteAdmin(user),
                    standaloneConflict: standalonePortalActive(),
                    vendor: vendorState
                };
            }
            throw new Error("Unknown Portal action.");
        },
        apiPost: function (asset, req, user) {
            requireAdmin(user);
            var value = req && req.body || {};
            if (asset !== "settings") throw new Error("Unknown Portal action.");
            if (value.enabled === true && standalonePortalActive()) {
                throw new Error("Disable or uninstall the standalone SirKPortal plugin before enabling the embedded MyCompany Portal.");
            }
            return context.settings.update(function (current) {
                current.modules.portal = current.modules.portal || {};
                if (typeof value.enabled === "boolean") current.modules.portal.enabled = value.enabled;
                current.modules.portal.defaultView = ["overview", "devices", "management", "approvals", "settings"].indexOf(String(value.defaultView || "")) >= 0
                    ? String(value.defaultView)
                    : "overview";
                current.modules.portal.showLauncher = value.showLauncher !== false;
                return current;
            }).then(function () {
                return { ok: true, module: settings(), reloadRequired: true, vendor: vendorState };
            });
        }
    };
};
