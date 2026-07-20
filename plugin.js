"use strict";

var fs = require("fs");
var path = require("path");

module.exports.mycompany = function (parent) {
    var obj = {};
    var pluginRoot = path.join(parent.pluginPath, "mycompany");
    var embeddedRoot = path.join(pluginRoot, "embedded");
    var manifestPath = path.join(pluginRoot, "embedded-manifest.json");
    var manifest = [];
    var embedded = {};

    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (error) {
        console.log("MyCompany embedded manifest is missing:", error.message);
    }

    function createParentProxy() {
        var proxy = Object.create(parent);
        Object.keys(parent || {}).forEach(function (key) {
            proxy[key] = parent[key];
        });
        proxy.pluginPath = embeddedRoot;
        return proxy;
    }

    function embeddedInstance(key) {
        return embedded[key] && embedded[key].instance;
    }

    function loadEmbedded() {
        var proxy = createParentProxy();

        manifest.forEach(function (item) {
            try {
                var entryPath = path.join(embeddedRoot, item.shortName, item.entry);
                var entryModule = require(entryPath);
                var factory = entryModule && entryModule[item.exportName];
                if (typeof factory !== "function") throw new Error("Plugin factory was not exported.");

                var instance = factory(proxy);
                embedded[item.key] = {
                    meta: item,
                    entryPath: entryPath,
                    instance: instance
                };

                if (parent && parent.plugins) parent.plugins[item.shortName] = instance;
                if (parent && parent.exports) parent.exports[item.shortName] = [];

                console.log("MyCompany loaded embedded module:", item.key, "as", item.shortName);
            } catch (error) {
                embedded[item.key] = {
                    meta: item,
                    error: error
                };
                console.log("MyCompany failed to load embedded module " + item.key + ":", error.stack || error);
            }
        });
    }

    loadEmbedded();

    obj.parent = parent;
    obj.meshServer = parent && parent.parent;
    obj.exports = [
        "onWebUIStartupEnd",
        "goPageStart",
        "goPageEnd",
        "onDeviceRefreshEnd",
        "commandResult"
    ];

    [
        ["scripts", "embeddedScriptsStartup"],
        ["commands", "embeddedCommandsStartup"],
        ["approvals", "embeddedApprovalsStartup"],
        ["move", "embeddedMoveStartup"]
    ].forEach(function (pair) {
        var instance = embeddedInstance(pair[0]);
        if (instance && typeof instance.onWebUIStartupEnd === "function") {
            obj[pair[1]] = instance.onWebUIStartupEnd;
            obj.exports.push(pair[1]);
        }
    });

    obj.getEmbeddedDiagnostics = function () {
        return manifest.map(function (item) {
            var record = embedded[item.key] || {};
            var instance = record.instance;
            var entryPath = record.entryPath || path.join(embeddedRoot, item.shortName, item.entry);

            return {
                key: item.key,
                label: item.pageText || item.shortName || item.key,
                shortName: item.shortName,
                entry: entryPath,
                entryExists: fs.existsSync(entryPath),
                loaded: !!instance,
                serverStarted: !!(instance && instance.__myCompanyStarted),
                error: record.error ? String(record.error.stack || record.error.message || record.error) : "",
                hooks: instance ? Object.keys(instance).filter(function (key) {
                    return typeof instance[key] === "function";
                }).sort() : []
            };
        });
    };

    obj.server_startup = function () {
        ["approvals", "move", "commands", "scripts"].forEach(function (key) {
            var instance = embeddedInstance(key);
            if (!instance || instance.__myCompanyStarted) return;

            instance.__myCompanyStarted = true;
            if (typeof instance.server_startup === "function") {
                try {
                    instance.server_startup();
                } catch (error) {
                    console.log("MyCompany module startup failed " + key + ":", error.stack || error);
                }
            }
        });
    };

    obj.handleAdminReq = function (req, res, user) {
        var key = String(req && req.query && req.query.module || "");
        var instance = embeddedInstance(key);

        if (!instance || typeof instance.handleAdminReq !== "function") {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: false, error: "Embedded module is unavailable: " + key }));
            return;
        }

        return instance.handleAdminReq(req, res, user);
    };

    obj.handleAdminPostReq = function (req, res, user) {
        var key = String(req && req.query && req.query.module || "");
        var instance = embeddedInstance(key);

        if (!instance || typeof instance.handleAdminPostReq !== "function") {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: false, error: "Embedded module POST endpoint is unavailable: " + key }));
            return;
        }

        return instance.handleAdminPostReq(req, res, user);
    };

    var commandsInstance = embeddedInstance("commands");
    if (commandsInstance) {
        if (typeof commandsInstance.hook_processAgentData === "function") {
            obj.hook_processAgentData = function () {
                return commandsInstance.hook_processAgentData.apply(commandsInstance, arguments);
            };
        }
        if (typeof commandsInstance.serveraction === "function") {
            obj.serveraction = function () {
                return commandsInstance.serveraction.apply(commandsInstance, arguments);
            };
        }
    }

    var approvalsInstance = embeddedInstance("approvals");
    if (approvalsInstance) {
        if (typeof approvalsInstance.hook_setupHttpHandlers === "function") {
            obj.hook_setupHttpHandlers = function () {
                return approvalsInstance.hook_setupHttpHandlers.apply(approvalsInstance, arguments);
            };
        }
        if (typeof approvalsInstance.handleExternalApi === "function") {
            obj.handleExternalApi = function () {
                return approvalsInstance.handleExternalApi.apply(approvalsInstance, arguments);
            };
        }
    }

    obj.onWebUIStartupEnd = function () {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        if (window.MyCompany && window.MyCompany.initialized) return;

        var app = window.MyCompany = window.MyCompany || {};
        app.initialized = true;
        app.activeModule = "scripts";
        app.inMyCompany = false;
        app.openingEmbedded = false;
        app.uiSettings = {
            tabs: {
                scripts: true,
                commands: true,
                approvals: true,
                move: true
            }
        };
        app.modules = {
            scripts: { label: "Scripts" },
            commands: { label: "Commands" },
            approvals: { label: "Approvals" },
            move: { label: "Move Requests" }
        };

        window.MyCompanyAssetUrl = function (moduleName, assetName) {
            var endpoint = new URL("pluginadmin.ashx", window.location.href);
            endpoint.searchParams.set("pin", "mycompany");
            if (moduleName) endpoint.searchParams.set("module", moduleName);
            if (assetName) endpoint.searchParams.set("asset", assetName);
            endpoint.searchParams.set("v", "0.7.0");
            return endpoint.href;
        };

        function removeDisallowedMenuEntries() {
            [
                "MainMenuMyCompany",
                "LeftMenuMyCompany",
                "MainMenuMyCommands",
                "LeftMenuMyCommands"
            ].forEach(function (id) {
                var element = document.getElementById(id);
                if (element && element.parentNode) element.parentNode.removeChild(element);
            });
        }

        function loadScript(id, source, readyCheck) {
            if (typeof readyCheck === "function" && readyCheck()) return Promise.resolve();

            var existing = document.getElementById(id);
            if (existing && existing.getAttribute("data-mycompany-loaded") === "1") return Promise.resolve();
            if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

            return new Promise(function (resolve, reject) {
                var script = document.createElement("script");
                script.id = id;
                script.src = source;
                script.async = false;
                script.onload = function () {
                    script.setAttribute("data-mycompany-loaded", "1");
                    resolve();
                };
                script.onerror = function () {
                    if (script.parentNode) script.parentNode.removeChild(script);
                    reject(new Error("Could not load " + source));
                };
                (document.head || document.documentElement).appendChild(script);
            });
        }

        function loadStyle(id, source) {
            if (document.getElementById(id)) return;
            var link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            link.href = source;
            (document.head || document.documentElement).appendChild(link);
        }

        app.bootstrapApprovalCenter = function () {
            var approval = window.ApprovalCenter = window.ApprovalCenter || {};
            if (typeof approval.open === "function" && typeof approval.initialize === "function") {
                return Promise.resolve(approval.initialize()).then(function () {
                    return approval;
                });
            }
            if (app.approvalBootstrapPromise) return app.approvalBootstrapPromise;

            loadStyle(
                "mycompany-approvalcenter-style-070",
                window.MyCompanyAssetUrl("approvals", "plugin.css")
            );

            app.approvalBootstrapPromise = loadScript(
                "mycompany-approvalcenter-core-070",
                window.MyCompanyAssetUrl("approvals", "core.js"),
                function () { return !!window.MeshPluginCore; }
            ).then(function () {
                return loadScript(
                    "mycompany-approvalcenter-main-070",
                    window.MyCompanyAssetUrl("approvals", "main.js"),
                    function () {
                        return !!(window.ApprovalCenter && typeof window.ApprovalCenter.open === "function");
                    }
                );
            }).then(function () {
                return loadScript(
                    "mycompany-approvalcenter-noapproval-070",
                    window.MyCompanyAssetUrl("approvals", "noapproval.js"),
                    function () {
                        return !!(window.ApprovalCenter && window.ApprovalCenter.__noApprovalPatchInstalled);
                    }
                );
            }).then(function () {
                var current = window.ApprovalCenter;
                if (!current || typeof current.initialize !== "function" || typeof current.open !== "function") {
                    throw new Error("Approval Center UI API is missing.");
                }
                return Promise.resolve(current.initialize()).then(function () {
                    return current;
                });
            }).catch(function (error) {
                app.approvalBootstrapPromise = null;
                throw error;
            });

            approval.bootstrapPromise = app.approvalBootstrapPromise;
            return app.approvalBootstrapPromise;
        };

        app.invokeEmbeddedStartups = function () {
            var api = window.pluginHandler && window.pluginHandler.mycompany;
            if (!api) return;

            [
                ["scripts", "embeddedScriptsStartup"],
                ["commands", "embeddedCommandsStartup"],
                ["move", "embeddedMoveStartup"]
            ].forEach(function (pair) {
                if (typeof api[pair[1]] !== "function") return;
                try {
                    api[pair[1]]();
                } catch (error) {
                    if (window.console) console.error("MyCompany module bootstrap failed: " + pair[0], error);
                }
            });

            app.bootstrapApprovalCenter().catch(function (error) {
                if (window.console) console.error("MyCompany Approval Center bootstrap failed", error);
            });
        };

        app.ensureNavigation = function () {
            var titleHost = document.getElementById("p1title");
            if (!titleHost) return null;

            var navigation = document.getElementById("MyCompanyNavigation");
            if (!navigation) {
                navigation = document.createElement("div");
                navigation.id = "MyCompanyNavigation";
                navigation.style.display = "none";
                navigation.style.flexWrap = "wrap";
                navigation.style.gap = "8px";
                navigation.style.width = "100%";
                navigation.style.boxSizing = "border-box";
                navigation.style.marginTop = "8px";
                navigation.style.padding = "0 0 4px 0";
            }

            if (navigation.parentNode !== titleHost) titleHost.appendChild(navigation);
            navigation.innerHTML = "";

            ["scripts", "commands", "approvals", "move"].forEach(function (key) {
                if (app.uiSettings.tabs[key] === false) return;

                var button = document.createElement("button");
                button.type = "button";
                button.className = key === app.activeModule ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm";
                button.textContent = app.modules[key].label;
                button.setAttribute("data-mycompany-module", key);
                button.onclick = function (event) {
                    if (event) {
                        if (event.preventDefault) event.preventDefault();
                        if (event.stopPropagation) event.stopPropagation();
                    }
                    return app.showModule(key);
                };
                navigation.appendChild(button);
            });

            return navigation;
        };

        app.showNavigation = function (key) {
            app.activeModule = key || app.activeModule || "scripts";
            var navigation = app.ensureNavigation();
            if (!navigation) return;
            navigation.style.display = "flex";
        };

        app.hideNavigation = function () {
            var navigation = document.getElementById("MyCompanyNavigation");
            if (navigation) navigation.style.display = "none";
        };

        app.wrapModuleOpeners = function () {
            function wrap(target, methodName, resolveKey) {
                if (!target || typeof target[methodName] !== "function") return;
                if (target[methodName].__myCompanyWrapped === true) return;

                var original = target[methodName];
                var wrapped = function () {
                    var key = typeof resolveKey === "function" ? resolveKey() : resolveKey;
                    app.inMyCompany = true;
                    app.openingEmbedded = true;
                    app.activeModule = key;
                    var result = original.apply(target, arguments);
                    window.setTimeout(function () {
                        app.openingEmbedded = false;
                        removeDisallowedMenuEntries();
                        app.showNavigation(key);
                    }, 100);
                    return result;
                };
                wrapped.__myCompanyWrapped = true;
                wrapped.__myCompanyOriginal = original;
                target[methodName] = wrapped;
            }

            wrap(window.MyScripts, "open", "scripts");
            wrap(window.MyCommands, "openStandalone", "commands");
            wrap(window.ApprovalCenter, "open", function () {
                return app.activeModule === "move" ? "move" : "approvals";
            });
        };

        app.showModule = function (key) {
            if (!app.modules[key] || app.uiSettings.tabs[key] === false) return false;

            app.activeModule = key;
            app.inMyCompany = true;
            app.openingEmbedded = true;
            app.wrapModuleOpeners();

            if (key === "scripts") {
                if (window.MyScripts && typeof window.MyScripts.open === "function") {
                    return window.MyScripts.open();
                }
                app.invokeEmbeddedStartups();
                app.openingEmbedded = false;
                return false;
            }

            if (key === "commands") {
                if (window.MyCommands && typeof window.MyCommands.openStandalone === "function") {
                    return window.MyCommands.openStandalone();
                }
                app.invokeEmbeddedStartups();
                app.openingEmbedded = false;
                return false;
            }

            if (key === "approvals" || key === "move") {
                app.bootstrapApprovalCenter().then(function (approval) {
                    app.wrapModuleOpeners();
                    approval.open();
                    if (key === "move" && typeof approval.activateTab === "function") {
                        window.setTimeout(function () {
                            approval.activateTab("moverequest");
                            app.showNavigation("move");
                        }, 50);
                    }
                    app.openingEmbedded = false;
                    app.showNavigation(key);
                }).catch(function (error) {
                    app.openingEmbedded = false;
                    if (window.console) console.error("MyCompany could not open " + key, error);
                });
                return false;
            }

            app.openingEmbedded = false;
            return false;
        };

        app.loadUiSettings = function () {
            var endpoint = new URL("pluginadmin.ashx", window.location.href);
            endpoint.searchParams.set("pin", "mycompany");
            endpoint.searchParams.set("asset", "ui-config");
            endpoint.searchParams.set("v", "0.7.0");

            return fetch(endpoint.href, {
                credentials: "same-origin",
                cache: "no-store"
            }).then(function (response) {
                return response.json();
            }).then(function (value) {
                var tabs = value && value.settings && value.settings.tabs;
                if (tabs && typeof tabs === "object") {
                    ["scripts", "commands", "approvals", "move"].forEach(function (key) {
                        app.uiSettings.tabs[key] = tabs[key] !== false;
                    });
                }
                app.ensureNavigation();
                if (app.inMyCompany) app.showNavigation(app.activeModule);
            }).catch(function (error) {
                if (window.console) console.error("MyCompany UI settings load failed", error);
            });
        };

        [0, 100, 500, 1500, 3000].forEach(function (delay) {
            window.setTimeout(function () {
                removeDisallowedMenuEntries();
                app.invokeEmbeddedStartups();
                app.wrapModuleOpeners();
                app.ensureNavigation();
            }, delay);
        });

        app.loadUiSettings();
    };

    obj.goPageStart = function (view) {
        if (typeof window === "undefined") return;

        var app = window.MyCompany;
        if (app && !app.openingEmbedded) {
            app.inMyCompany = false;
            app.hideNavigation();
        }

        if (window.MyScripts && typeof window.MyScripts.onNativePageStart === "function") {
            window.MyScripts.onNativePageStart(view);
        }
        if (window.MyCommands && typeof window.MyCommands.onNativePageStart === "function") {
            window.MyCommands.onNativePageStart(view);
        }
        if (window.ApprovalCenter && typeof window.ApprovalCenter.onNativePageStart === "function") {
            window.ApprovalCenter.onNativePageStart(view);
        }
    };

    obj.goPageEnd = function (view) {
        if (typeof window === "undefined") return;

        if (window.MyScripts && typeof window.MyScripts.onNativePageEnd === "function") {
            window.MyScripts.onNativePageEnd(view);
        }
        if (window.MyCommands && typeof window.MyCommands.onNativePageEnd === "function") {
            window.MyCommands.onNativePageEnd(view);
        }
        if (window.ApprovalCenter && typeof window.ApprovalCenter.onNativePageEnd === "function") {
            window.ApprovalCenter.onNativePageEnd(view);
        }

        if (window.MyCompany) {
            window.MyCompany.wrapModuleOpeners();
            if (window.MyCompany.inMyCompany) {
                window.MyCompany.showNavigation(window.MyCompany.activeModule);
            }
        }
    };

    obj.onDeviceRefreshEnd = function (nodeId) {
        if (typeof window === "undefined") return;

        if (window.MyCommands) {
            window.MyCommands.pendingNodeId = nodeId;
            if (typeof window.MyCommands.onDeviceRefreshEnd === "function") {
                window.MyCommands.onDeviceRefreshEnd(nodeId);
            }
        }

        if (window.MoveRequest) {
            if (typeof window.MoveRequest.setHostNodeId === "function") {
                window.MoveRequest.setHostNodeId(nodeId);
            }
            if (typeof window.MoveRequest.scheduleHostButton === "function") {
                window.MoveRequest.scheduleHostButton();
            }
        }
    };

    obj.commandResult = function (server, message) {
        if (typeof window !== "undefined" && window.MyCommands && typeof window.MyCommands.commandResult === "function") {
            window.MyCommands.commandResult(message);
        }
    };

    return obj;
};
