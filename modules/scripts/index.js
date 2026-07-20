"use strict";

exports.create = function (runtime) {
    return {
        name: "scripts",
        initialize: function () {
            runtime.audit("mycompanymoduleloaded", "Scripts module loaded.");
        }
    };
};
