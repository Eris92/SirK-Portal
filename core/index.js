"use strict";

function safeConfig(parent) {
    var path = parent.path;
    var fs = parent.fs;
    var file = path.join(parent.pluginPath, "mycompany", "config.json");
    try { return JSON.parse(fs.readFileSync(file, "utf8")); }
    catch (error) { return { modules: {} }; }
}

exports.createRuntime = function (parent, source) {
    var config = safeConfig(parent);
    return {
        parent: parent,
        source: source,
        config: config,
        moduleEnabled: function (name) {
            var value = config.modules && config.modules[name];
            return !value || value.enabled !== false;
        },
        initialize: function () { return Promise.resolve(); },
        audit: function (action, message) {
            if (parent && parent.parent && typeof parent.parent.DispatchEvent === "function") {
                parent.parent.DispatchEvent(["*", "server-users"], source, {
                    etype: "user",
                    action: String(action || "mycompany"),
                    msg: String(message || "")
                });
            }
        }
    };
};
