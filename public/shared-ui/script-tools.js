(function () {
    "use strict";

    function text(value) {
        return String(value == null ? "" : value);
    }

    function json(value) {
        try {
            return JSON.stringify(value, null, 2);
        } catch (error) {
            return text(value);
        }
    }

    function copyText(value) {
        value = text(value);
        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function"
        ) {
            return navigator.clipboard.writeText(value);
        }

        return new Promise(function (resolve, reject) {
            var field = document.createElement("textarea");
            field.value = value;
            field.style.position = "fixed";
            field.style.opacity = "0";
            document.body.appendChild(field);
            field.focus();
            field.select();
            try {
                if (!document.execCommand("copy")) {
                    throw new Error("Copy failed.");
                }
                resolve();
            } catch (error) {
                reject(error);
            } finally {
                field.remove();
            }
        });
    }

    window.SharedScriptTools = {
        create: function (options) {
            options = options || {};
            var storageKey = options.storageKey || "mycompany.scripts.favorites";
            var deepLinkParameter = options.deepLinkParameter || "script";
            var state = {
                favorites: [],
                favoritesOnly: false,
                editMode: false,
                deepLinkApplied: false
            };

            try {
                var stored = JSON.parse(
                    window.localStorage.getItem(storageKey) || "[]"
                );
                state.favorites = Array.isArray(stored)
                    ? stored.map(String)
                    : [];
            } catch (error) {}

            function save() {
                try {
                    window.localStorage.setItem(
                        storageKey,
                        JSON.stringify(state.favorites)
                    );
                } catch (error) {}
            }

            function isFavorite(path) {
                return state.favorites.indexOf(text(path)) >= 0;
            }

            function toggleFavorite(path) {
                path = text(path);
                if (!path) return false;
                var index = state.favorites.indexOf(path);
                if (index >= 0) state.favorites.splice(index, 1);
                else state.favorites.push(path);
                save();
                return isFavorite(path);
            }

            function selectedLink(path) {
                var url = new URL(window.location.href);
                url.searchParams.set(deepLinkParameter, text(path));
                return url.href;
            }

            return {
                state: state,

                filterScript: function (script) {
                    return !state.favoritesOnly || isFavorite(script.path);
                },

                applyDeepLink: function (tree, treeState) {
                    if (state.deepLinkApplied || !tree) return;
                    state.deepLinkApplied = true;
                    try {
                        var path = new URL(window.location.href)
                            .searchParams.get(deepLinkParameter);
                        if (!path || !window.SharedDirectoryTree.find(tree, path)) {
                            return;
                        }
                        treeState.selectedScript = path;
                    } catch (error) {}
                },

                syncToolbar: function (toolbar, mode, selectedScript) {
                    if (!toolbar) return;
                    var scriptsMode = mode !== "results";
                    toolbar.setActive(
                        "favorites",
                        state.favoritesOnly && scriptsMode
                    );
                    toolbar.setActive(
                        "manage",
                        state.editMode && scriptsMode
                    );
                    toolbar.setEnabled("favorites", scriptsMode);
                    toolbar.setEnabled("manage", scriptsMode);
                    toolbar.setEnabled(
                        "link",
                        scriptsMode && !!selectedScript
                    );
                },

                toggleFavorites: function (toolbar, onChange) {
                    state.favoritesOnly = !state.favoritesOnly;
                    if (toolbar) {
                        toolbar.setActive("favorites", state.favoritesOnly);
                    }
                    if (typeof onChange === "function") onChange();
                },

                toggleEdit: function (toolbar, onChange) {
                    state.editMode = !state.editMode;
                    if (toolbar) {
                        toolbar.setActive("manage", state.editMode);
                    }
                    if (typeof onChange === "function") onChange();
                },

                copySelectedLink: function (toolbar, path) {
                    if (!path) return Promise.resolve(false);
                    return copyText(selectedLink(path)).then(function () {
                        if (toolbar) toolbar.setActive("link", true);
                        window.setTimeout(function () {
                            if (toolbar) toolbar.setActive("link", false);
                        }, 900);
                        return true;
                    });
                },

                addEditActions: function (shell, card, script, onChange) {
                    if (!state.editMode) return;

                    var actions = document.createElement("div");
                    actions.className = "mc-script-manage-actions";

                    var favorite = shell.element(
                        "button",
                        "btn btn-secondary btn-sm",
                        isFavorite(script.path)
                            ? "★ Remove favorite"
                            : "☆ Add favorite"
                    );
                    favorite.type = "button";
                    favorite.onclick = function () {
                        var selected = toggleFavorite(script.path);
                        favorite.textContent = selected
                            ? "★ Remove favorite"
                            : "☆ Add favorite";
                        if (
                            state.favoritesOnly &&
                            !selected &&
                            typeof onChange === "function"
                        ) {
                            onChange();
                        }
                    };
                    actions.appendChild(favorite);

                    var copyPath = shell.element(
                        "button",
                        "btn btn-secondary btn-sm",
                        "Copy path"
                    );
                    copyPath.type = "button";
                    copyPath.onclick = function () {
                        copyText(script.path).then(function () {
                            copyPath.textContent = "Copied";
                            window.setTimeout(function () {
                                if (copyPath.isConnected) {
                                    copyPath.textContent = "Copy path";
                                }
                            }, 900);
                        });
                    };
                    actions.appendChild(copyPath);
                    card.appendChild(actions);

                    card.appendChild(shell.element(
                        "pre",
                        "mc-script-metadata",
                        json({
                            path: script.path,
                            shell: script.shell,
                            approvalLevels: script.approvalLevels || [],
                            runAsUser: script.runAsUser,
                            variables: script.variables || [],
                            secretVariables: script.secretVariables || []
                        })
                    ));
                }
            };
        }
    };
}());
