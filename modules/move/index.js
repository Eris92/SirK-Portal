"use strict";

exports.create = function (runtime) {
    return {
        name: "move",
        initialize: function () {
            runtime.audit("mycompanymoduleloaded", "Move module loaded.");
        }
    };
};
