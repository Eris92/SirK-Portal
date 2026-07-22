"use strict";

var originalFactory = require("./index.js");

function portalSettings(context) {
    var current = context.settings.read();
    return current && current.modules && current.modules.portal || {};
}

module.exports.createModule = function (context) {
    var module = originalFactory.createModule(context);
    var originalInitialize = module.initialize;
    var originalApiGet = module.apiGet;
    var originalApiPost = module.apiPost;
    var originalClientConfig = module.clientConfig;

    module.initialize = function () {
        return Promise.resolve(originalInitialize.call(module));
    };

    module.apiGet = function (asset, req, user) {
        if (asset === "devices") {
            if (!user) return Promise.reject(new Error("Permission denied."));
            if (typeof module.canAccessView === "function" && !module.canAccessView(user, "devices")) return Promise.reject(new Error("Portal view access denied."));
            return Promise.resolve(context.device.visibleNodes(user)).then(function (value) {
                return { ok: true, nodes: value && value.nodes || [], meshes: value && value.meshes || [] };
            });
        }
        return Promise.resolve(originalApiGet.call(module, asset, req, user)).then(function (value) {
            if (value && value.vendor) value.vendor.earlyOverlay = false;
            return value;
        });
    };

    module.apiPost = function (asset, req, user) {
        var body = req && req.body || {};
        return Promise.resolve(originalApiPost.call(module, asset, req, user)).then(function (value) {
            return context.settings.update(function (current) {
                current.modules.portal = current.modules.portal || {};
                if (typeof body.showNativeLink === "boolean") current.modules.portal.showNativeLink = body.showNativeLink;
                delete current.modules.portal.loginPanel;
                return current;
            }).then(function () {
                var settings = portalSettings(context);
                if (value && typeof value === "object") value.module = settings;
                return value;
            });
        });
    };

    module.clientConfig = function (user) {
        var value = originalClientConfig.call(module, user);
        var settings = portalSettings(context);
        value.showLauncher = settings.showLauncher === true;
        value.showNativeLink = settings.showNativeLink !== false;
        value.forceNewLogin = settings.forceNewLogin === true;
        value.forcePortalInterface = settings.forcePortalInterface === true;
        value.keepSessionsAfterRestart = settings.keepSessionsAfterRestart === true;
        value.earlyOverlay = false;
        value.loginIntegration = false;
        return value;
    };

    return module;
};
