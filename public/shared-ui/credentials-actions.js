(function () {
    "use strict";

    if (!window.SharedScriptTools || window.__myCompanyCredentialsActions) return;
    window.__myCompanyCredentialsActions = true;

    var originalCreate = window.SharedScriptTools.create;
    window.SharedScriptTools.create = function (options) {
        var tools = originalCreate.call(window.SharedScriptTools, options);
        var originalActions = tools.scriptActions;

        tools.scriptActions = function (script, config) {
            config = config || {};
            var actions = originalActions.call(tools, script, config) || [];
            var hasCredentials = !!(
                script && (
                    (Array.isArray(script.secretVariables) && script.secretVariables.length) ||
                    (Array.isArray(script.secretDefinitions) && script.secretDefinitions.length)
                )
            );

            if (hasCredentials && config.canEdit === true) {
                var duplicate = actions.some(function (action) {
                    return action && action.key === "credentials";
                });
                if (!duplicate) {
                    actions.unshift({
                        key: "credentials",
                        icon: "🔑",
                        className: "mc-tree-credentials-action",
                        title: "Edit script credentials",
                        onClick: function () {
                            if (typeof config.onCredentials === "function") {
                                config.onCredentials(script);
                            } else if (typeof config.onEdit === "function") {
                                config.onEdit(script);
                            }
                        }
                    });
                }
            }
            return actions;
        };

        return tools;
    };
}());