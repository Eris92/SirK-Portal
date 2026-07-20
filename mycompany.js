"use strict";

var createMyCompany = require("./plugin.js").mycompany;
var createAdmin = require("./admin.js").admin;

module.exports.mycompany = function (parent) {
    var obj = createMyCompany(parent);
    var admin = createAdmin(obj);
    var embeddedGet = obj.handleAdminReq;
    var embeddedPost = obj.handleAdminPostReq;

    // Embedded modules are available to the backend for discovery, but their
    // browser startup hooks are exported only through MyCompany.
    ["myscripts", "mycommands", "approvalcenter", "moverequest"].forEach(function (shortName) {
        if (parent && parent.exports) parent.exports[shortName] = [];
        if (parent && parent.plugins && parent.plugins[shortName]) {
            parent.plugins[shortName].exports = [];
        }
    });

    obj.handleAdminReq = function (req, res, user) {
        var moduleName = String(req && req.query && req.query.module || "");
        if (moduleName) return embeddedGet.apply(obj, arguments);
        return admin.req(req, res, user);
    };

    obj.handleAdminPostReq = function (req, res, user) {
        var moduleName = String(req && req.query && req.query.module || "");
        if (moduleName) return embeddedPost.apply(obj, arguments);
        return admin.post(req, res, user);
    };

    return obj;
};
