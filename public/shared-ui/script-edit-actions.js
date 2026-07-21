(function () {
    "use strict";

    if (!window.SharedScriptTools || window.__myCompanyFixedEditActions) return;
    window.__myCompanyFixedEditActions = true;

    var originalCreate = window.SharedScriptTools.create;

    window.SharedScriptTools.create = function (options) {
        var tools = originalCreate.call(window.SharedScriptTools, options);
        var originalSyncToolbar = tools.syncToolbar;
        var originalToggleEdit = tools.toggleEdit;

        function hasCredentials(script) {
            return !!(script && (
                (Array.isArray(script.secretVariables) && script.secretVariables.length) ||
                (Array.isArray(script.secretDefinitions) && script.secretDefinitions.length)
            ));
        }

        tools.syncToolbar = function (toolbar, mode, selectedScript, config) {
            originalSyncToolbar.call(tools, toolbar, mode, selectedScript, config);
            if (!toolbar) return;
            if (typeof toolbar.setVisible === "function") toolbar.setVisible("link", false);
            if (typeof toolbar.setEnabled === "function") toolbar.setEnabled("link", false);
            if (typeof toolbar.setActive === "function") toolbar.setActive("link", false);
        };

        tools.toggleLink = function () {
            return Promise.resolve(false);
        };

        tools.toggleEdit = function (toolbar, onChange) {
            tools.state.linkPickMode = false;
            return originalToggleEdit.call(tools, toolbar, onChange);
        };

        tools.scriptActions = function (script, config) {
            config = config || {};
            var actions = [];

            if (tools.state.editMode) {
                var credentialsAvailable = hasCredentials(script) && config.canEdit === true;

                actions.push({
                    key: "credentials",
                    icon: "🔑",
                    disabled: !credentialsAvailable,
                    className: credentialsAvailable
                        ? "mc-tree-credential-action"
                        : "mc-tree-credential-action mc-tree-action-disabled",
                    title: credentialsAvailable
                        ? "Configure script credentials"
                        : "This script has no SaveSecret variables",
                    onClick: function () {
                        if (credentialsAvailable && typeof config.onCredentials === "function") {
                            config.onCredentials(script);
                        }
                    }
                });

                actions.push({
                    key: "favorite",
                    icon: "★",
                    active: tools.isFavorite(script.path),
                    className: "mc-tree-favorite-action",
                    title: tools.isFavorite(script.path)
                        ? "Remove from favorites"
                        : "Add to favorites",
                    onClick: function () {
                        var index = tools.state.favorites.indexOf(String(script.path || ""));
                        if (index >= 0) tools.state.favorites.splice(index, 1);
                        else tools.state.favorites.push(String(script.path || ""));
                        if (typeof config.onFavoriteChanged === "function") {
                            config.onFavoriteChanged(script);
                        }
                    }
                });

                actions.push({
                    key: "link",
                    icon: "🔗",
                    title: "Copy bookmarkable link for this script",
                    onClick: function () {
                        tools.copyScriptLink(null, script, function () {
                            if (typeof config.onLinkCopied === "function") {
                                config.onLinkCopied(script);
                            }
                        });
                    }
                });

                actions.push({
                    key: "edit",
                    icon: "✎",
                    title: "Edit script definition and approval levels",
                    onClick: function () {
                        if (config.canEdit === true && typeof config.onEdit === "function") {
                            config.onEdit(script);
                        }
                    }
                });
            }

            if (tools.state.multiPickMode && config.enableMulti === true) {
                actions.push({
                    key: "multi",
                    icon: "⟳",
                    title: "Run this script on selected devices",
                    onClick: function () {
                        if (typeof config.onMulti === "function") config.onMulti(script);
                    }
                });
            }

            return actions;
        };

        return tools;
    };
}());