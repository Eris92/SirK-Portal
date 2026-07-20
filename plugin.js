"use strict";

var core = require("./core");
var modules = require("./modules");

module.exports.mycompany = function (parent) {
    var obj = {};
    var service = core.createRuntime(parent, obj);
    var loadedModules = modules.createAll(service);

    obj.parent = parent;
    obj.meshServer = parent && parent.parent;
    obj.exports = ["onWebUIStartupEnd", "goPageStart", "goPageEnd"];

    obj.server_startup = function () {
        return service.initialize().then(function () {
            return Promise.all(loadedModules.map(function (item) {
                return typeof item.initialize === "function" ? item.initialize() : null;
            }));
        });
    };

    obj.onWebUIStartupEnd = function () {
        // UI bootstrap zostanie przeniesiony z legacy/myscripts w pierwszym etapie migracji.
    };

    obj.goPageStart = function () { };
    obj.goPageEnd = function () { };

    return obj;
};
