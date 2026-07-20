"use strict";

exports.create = function (runtime) {
    return {
        name: "commands",
        initialize: function () {
            runtime.audit("mycompanymoduleloaded", "Commands module loaded.");
        }
    };
};
