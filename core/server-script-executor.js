"use strict";

var childProcess = require("child_process");
var shared = require("./shared.js");

function text(value, limit) {
    return shared.cleanText(value == null ? "" : value, limit || 4000);
}

function bool(value) {
    return value === true || /^(1|true|yes|tak|on)$/i.test(String(value || ""));
}

function uniqueLevels(value) {
    return (Array.isArray(value) ? value : []).map(Number).filter(function (level, index, list) {
        return level >= 1 && level <= 3 && list.indexOf(level) === index;
    }).sort();
}

module.exports.createServerScriptExecutor = function (options) {
    options = options || {};
    var context = options.context;
    var library = options.library;
    var admin = options.admin;
    var queue = Promise.resolve();

    function timeoutMs() {
        var current = context.settings.read();
        var moduleSettings = current.modules && current.modules.myscripts || {};
        return Math.max(30, Math.min(3600, Number(moduleSettings.runTimeoutSeconds) || 600)) * 1000;
    }

    function validateValues(script, supplied) {
        supplied = supplied && typeof supplied === "object" && !Array.isArray(supplied) ? supplied : {};
        var values = {};

        (script.variables || []).forEach(function (variable) {
            var value = Object.prototype.hasOwnProperty.call(supplied, variable.name)
                ? supplied[variable.name]
                : variable.defaultValue;
            value = text(value, 4000);
            if (variable.control === "switch") value = bool(value) ? "true" : "false";
            if (variable.control === "select") {
                var allowed = (variable.options || []).map(function (item) { return String(item.value); });
                if (allowed.length && allowed.indexOf(String(value)) < 0) {
                    throw new Error("Invalid value for " + (variable.label || variable.name) + ".");
                }
            }
            if (variable.required && !String(value).trim()) {
                throw new Error((variable.label || variable.name) + " is required.");
            }
            values[variable.name] = value;
        });

        var secrets = admin.secretValues(script.path);
        Object.keys(secrets || {}).forEach(function (name) {
            values[name] = String(secrets[name] == null ? "" : secrets[name]);
        });
        return values;
    }

    function powershellPath() {
        var configured = String(process.env.MYCOMPANY_POWERSHELL || "").trim();
        if (configured) return configured;
        if (process.platform !== "win32") return "pwsh";

        var programFiles = process.env.ProgramFiles || "C:\\Program Files";
        var pwsh = context.nativePath.join(programFiles, "PowerShell", "7", "pwsh.exe");
        try {
            if (context.fs.existsSync(pwsh)) return pwsh;
        } catch (error) {}

        return process.env.SystemRoot
            ? context.nativePath.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
            : "powershell.exe";
    }

    function psQuote(value) {
        return String(value == null ? "" : value).replace(/'/g, "''");
    }

    function cmdQuote(value) {
        return String(value == null ? "" : value)
            .replace(/[\r\n]/g, " ")
            .replace(/%/g, "%%")
            .replace(/\^/g, "^^")
            .replace(/!/g, "^^!")
            .replace(/"/g, "^\"");
    }

    function buildPlan(script, values) {
        var target = context.nativePath.resolve(context.pluginRoot, "seed", "MyScripts", String(script.path || "").replace(/\//g, context.nativePath.sep));
        var root = context.nativePath.resolve(context.pluginRoot, "seed", "MyScripts");
        var prefix = root.endsWith(context.nativePath.sep) ? root : root + context.nativePath.sep;
        if (target.toLowerCase().indexOf(prefix.toLowerCase()) !== 0) throw new Error("Invalid script path.");

        var names = Object.keys(values || {}).filter(function (name) {
            return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
        });

        if (script.shell === "powershell") {
            var preamble = names.map(function (name) {
                return "$" + name + "='" + psQuote(values[name]) + "'";
            }).join(";");
            var wrapper = "$ProgressPreference='SilentlyContinue';" +
                "try{$e=New-Object System.Text.UTF8Encoding($false);[Console]::OutputEncoding=$e;$OutputEncoding=$e}catch{};" +
                preamble + "; & '" + psQuote(target) + "' *>&1 | ForEach-Object { if($_ -ne $null){$_.ToString()} }";
            return {
                file: powershellPath(),
                args: ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", Buffer.from(wrapper, "utf16le").toString("base64")],
                cwd: context.nativePath.dirname(target)
            };
        }

        var lines = names.map(function (name) {
            return "set \"" + name + "=" + cmdQuote(values[name]) + "\"";
        });
        lines.push("call \"" + target.replace(/"/g, "\"\"") + "\"");
        return {
            file: process.env.ComSpec || "cmd.exe",
            args: ["/d", "/s", "/c", "@echo off\r\n@chcp 65001 >nul\r\n" + lines.join("\r\n")],
            cwd: context.nativePath.dirname(target)
        };
    }

    function parseData(raw) {
        var value = String(raw || "").trim();
        if (!value) return null;
        try { return JSON.parse(value); } catch (error) {}
        var lines = value.split(/\r?\n/);
        for (var index = 0; index < lines.length; index++) {
            var candidate = lines.slice(index).join("\n").trim();
            if (!candidate) continue;
            try { return JSON.parse(candidate); } catch (error) {}
        }
        return null;
    }

    function run(script, payload, request) {
        if (payload.scriptHash && String(payload.scriptHash) !== String(script.hash)) {
            return Promise.reject(new Error("The script changed after submission and was not executed."));
        }

        var values;
        try { values = validateValues(script, payload.variableValues); }
        catch (error) { return Promise.reject(error); }

        var plan;
        try { plan = buildPlan(script, values); }
        catch (error) { return Promise.reject(error); }

        var environment = Object.assign({}, process.env, admin.systemEnvironment(script.path), {
            MYSCRIPTS_REQUEST_ID: request && request.id || "",
            MYSCRIPTS_REQUESTER: request && request.requester && request.requester.name || "",
            MYSCRIPTS_PLUGIN_ROOT: context.pluginRoot,
            MYSCRIPTS_SCRIPTS_ROOT: context.nativePath.join(context.pluginRoot, "seed", "MyScripts"),
            DIRECTORYTOOLS_PLUGIN_ROOT: context.pluginRoot
        });

        return new Promise(function (resolve, reject) {
            childProcess.execFile(plan.file, plan.args, {
                cwd: plan.cwd,
                env: environment,
                windowsHide: true,
                encoding: "utf8",
                timeout: timeoutMs(),
                maxBuffer: 8 * 1024 * 1024
            }, function (error, stdout, stderr) {
                var raw = text(String(stdout || "") + (stderr ? "\n" + stderr : ""), 1000000).trim();
                if (error) {
                    var failure = new Error(raw || error.message || "Script failed.");
                    failure.code = error.code;
                    reject(failure);
                    return;
                }
                var parsed = parseData(raw);
                resolve({
                    message: raw || "Script completed without output.",
                    output: raw,
                    rawOutput: raw,
                    data: parsed,
                    exitCode: 0,
                    scriptPath: script.path,
                    label: script.label || script.name || "Script"
                });
            });
        });
    }

    function execute(payload, request) {
        payload = payload && typeof payload === "object" ? payload : {};
        var task = function () {
            var script = library.getScript(String(payload.scriptPath || ""), true);
            if (!script) throw new Error("Script not found.");
            return run(script, payload, request || {});
        };
        var operation = queue.catch(function () {}).then(task);
        queue = operation.catch(function () {});
        return operation;
    }

    return {
        execute: execute,
        normalizeLevels: uniqueLevels,
        validateValues: validateValues
    };
};
