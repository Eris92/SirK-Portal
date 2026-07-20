"use strict";

exports.create = function (runtime) {
    return {
        name: "approvals",
        canAutoApprove: function () {
            return runtime.config.modules && runtime.config.modules.approvals && runtime.config.modules.approvals.allowNoApproval === true;
        },
        initialize: function () {
            runtime.audit("mycompanymoduleloaded", "Approvals module loaded.");
        }
    };
};
