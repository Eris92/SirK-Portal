"use strict";

var factories = {
    scripts: require("./scripts"),
    commands: require("./commands"),
    approvals: require("./approvals"),
    move: require("./move")
};

exports.createAll = function (runtime) {
    return Object.keys(factories).filter(function (name) {
        return runtime.moduleEnabled(name);
    }).map(function (name) {
        return factories[name].create(runtime);
    });
};
