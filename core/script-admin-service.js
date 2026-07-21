"use strict";

var shared = require("./shared.js");

function keyFor(value) {
    return String(value || "")
        .replace(/\\/g, "/")
        .toLowerCase();
}

module.exports.createScriptAdminService = function (options) {
    options = options || {};
    var context = options.context;
    var library = options.library;
    var namespace = String(options.namespace || "scripts");

    function requireAdmin(user) {
        if (!shared.isSiteAdmin(user)) {
            throw new Error("Permission denied.");
        }
    }

    function script(relativePath) {
        var value = library.getScript(relativePath, false);
        if (!value) throw new Error("Script not found.");
        return value;
    }

    function readStore() {
        var value = context.secrets.get(namespace);
        return value && typeof value === "object" ? value : {};
    }

    function getSecretState(user, relativePath) {
        requireAdmin(user);
        var value = script(relativePath);
        var store = readStore();
        var configured = store[keyFor(value.path)] || {};
        return {
            path: value.path,
            variables: (value.secretVariables || []).map(function (variable) {
                return {
                    name: variable.name,
                    label: variable.label,
                    required: variable.required === true,
                    configured: !!String(configured[variable.name] || "")
                };
            })
        };
    }

    function saveSecrets(user, relativePath, values, clearNames) {
        requireAdmin(user);
        var value = script(relativePath);
        var allowed = Object.create(null);
        (value.secretVariables || []).forEach(function (variable) {
            allowed[variable.name] = true;
        });

        values = values && typeof values === "object" ? values : {};
        clearNames = Array.isArray(clearNames) ? clearNames.map(String) : [];
        var store = readStore();
        var key = keyFor(value.path);
        var current = store[key] && typeof store[key] === "object"
            ? shared.copy(store[key])
            : {};

        Object.keys(values).forEach(function (name) {
            if (!allowed[name]) return;
            var secret = shared.cleanText(values[name], 8000);
            if (secret) current[name] = secret;
        });
        clearNames.forEach(function (name) {
            if (allowed[name]) delete current[name];
        });

        if (Object.keys(current).length) store[key] = current;
        else delete store[key];
        context.secrets.set(namespace, store);
        return getSecretState(user, value.path);
    }

    function secretValues(relativePath) {
        var value = script(relativePath);
        var store = readStore();
        var current = store[keyFor(value.path)] || {};
        var result = {};
        (value.secretVariables || []).forEach(function (variable) {
            var secret = String(current[variable.name] || "");
            if (variable.required && !secret) {
                throw new Error(
                    "Configure credential " + variable.label +
                    " for this script first."
                );
            }
            result[variable.name] = secret;
        });
        return result;
    }

    return {
        getDefinition: function (user, relativePath) {
            requireAdmin(user);
            var definition = library.getDefinition(relativePath);
            if (!definition) throw new Error("Script not found.");
            return definition;
        },
        saveDefinition: function (user, relativePath, definition) {
            requireAdmin(user);
            return library.saveDefinition(relativePath, definition);
        },
        getSecretState: getSecretState,
        saveSecrets: saveSecrets,
        secretValues: secretValues
    };
};
