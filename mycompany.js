"use strict";

var fs = require("fs");
var path = require("path");
var createMyCompany = require("./plugin.js").mycompany;

module.exports.mycompany = function (parent) {
    var debugEvents = [];
    var maxDebugEvents = 250;

    function text(value) {
        if (value instanceof Error) return value.stack || value.message || String(value);
        if (typeof value === "string") return value;
        try { return JSON.stringify(value); } catch (error) { return String(value); }
    }

    function addDebug(level, source, values) {
        var message = Array.prototype.map.call(values || [], text).join(" ");
        debugEvents.push({
            time: new Date().toISOString(),
            level: String(level || "info"),
            source: String(source || "mycompany"),
            message: message.slice(0, 12000)
        });
        if (debugEvents.length > maxDebugEvents) debugEvents.splice(0, debugEvents.length - maxDebugEvents);
    }

    function captureConsole(source, callback) {
        var originalLog = console.log;
        var originalWarn = console.warn;
        var originalError = console.error;

        console.log = function () {
            var message = Array.prototype.map.call(arguments, text).join(" ");
            if (/mycompany|myscripts|mycommands|approvalcenter|moverequest|plugin/i.test(message)) addDebug("info", source, arguments);
            return originalLog.apply(console, arguments);
        };
        console.warn = function () {
            addDebug("warning", source, arguments);
            return originalWarn.apply(console, arguments);
        };
        console.error = function () {
            addDebug("error", source, arguments);
            return originalError.apply(console, arguments);
        };

        try { return callback(); }
        catch (error) {
            addDebug("error", source, [error]);
            throw error;
        } finally {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        }
    }

    var obj = captureConsole("load", function () { return createMyCompany(parent); });

    // Embedded aliases are backend discovery aliases only. MyCompany exports
    // their browser startup hooks in a controlled order.
    ["myscripts", "mycommands", "approvalcenter", "moverequest"].forEach(function (shortName) {
        if (parent && parent.exports) parent.exports[shortName] = [];
        if (parent && parent.plugins && parent.plugins[shortName]) parent.plugins[shortName].exports = [];
    });

    var originalServerStartup = obj.server_startup;
    obj.server_startup = function () {
        return captureConsole("server_startup", function () {
            return typeof originalServerStartup === "function" ? originalServerStartup.apply(obj, arguments) : undefined;
        });
    };

    function readJson(filePath, fallback) {
        try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
        catch (error) { return fallback; }
    }

    function siteAdminAllowed(user) {
        return !!(user && ((Number(user.siteadmin) & 0xFFFFFFFF) !== 0));
    }

    function moduleDiagnostics() {
        var pluginRoot = path.join(parent.pluginPath, "mycompany");
        var manifest = readJson(path.join(pluginRoot, "embedded-manifest.json"), []);
        return manifest.map(function (item) {
            var instance = parent && parent.plugins && parent.plugins[item.shortName];
            var entryPath = path.join(pluginRoot, "embedded", item.shortName, item.entry);
            return {
                key: item.key,
                name: item.pageText || item.shortName,
                shortName: item.shortName,
                entry: entryPath,
                entryExists: fs.existsSync(entryPath),
                loaded: !!instance,
                serverStarted: !!(instance && instance.__myCompanyStarted),
                backendHooks: instance ? Object.keys(instance).filter(function (key) { return typeof instance[key] === "function"; }).sort() : [],
                declaredBrowserHooks: instance && Array.isArray(instance.exports) ? instance.exports.slice() : []
            };
        });
    }

    function readRelevantLogLines() {
        var dataPath = parent && parent.parent && parent.parent.datapath;
        if (!dataPath || !fs.existsSync(dataPath)) return [];

        var candidates = [];
        try {
            fs.readdirSync(dataPath).forEach(function (name) {
                if (/^(mesherrors|meshcentral.*(?:error|log)|.*\.log|.*errors.*\.txt)$/i.test(name)) candidates.push(path.join(dataPath, name));
            });
        } catch (error) {
            addDebug("warning", "debug-log-scan", [error]);
        }

        var matcher = /mycompany|myscripts|mycommands|approvalcenter|moverequest|embedded module|error loading plugin/i;
        var output = [];
        candidates.slice(0, 20).forEach(function (filePath) {
            try {
                var stat = fs.statSync(filePath);
                if (!stat.isFile()) return;
                var length = Math.min(stat.size, 512 * 1024);
                var buffer = Buffer.alloc(length);
                var descriptor = fs.openSync(filePath, "r");
                fs.readSync(descriptor, buffer, 0, length, Math.max(0, stat.size - length));
                fs.closeSync(descriptor);
                buffer.toString("utf8").split(/\r?\n/).forEach(function (line) {
                    if (matcher.test(line)) output.push(path.basename(filePath) + ": " + line.slice(0, 4000));
                });
            } catch (error) {
                addDebug("warning", "debug-log-read", [filePath, error]);
            }
        });
        return output.slice(-150);
    }

    function debugSnapshot() {
        var pluginRoot = path.join(parent.pluginPath, "mycompany");
        var config = readJson(path.join(pluginRoot, "config.json"), {});
        var meshServer = parent && parent.parent;
        return {
            generatedAt: new Date().toISOString(),
            plugin: {
                name: config.name || "My Company",
                version: config.version || "unknown",
                root: pluginRoot,
                hasAdminPanel: config.hasAdminPanel === true
            },
            runtime: {
                node: process.version,
                platform: process.platform,
                arch: process.arch,
                meshCentralVersion: meshServer && (meshServer.currentVer || meshServer.currentVersion || meshServer.version) || "unknown"
            },
            modules: moduleDiagnostics(),
            events: debugEvents.slice(),
            relevantServerLogs: readRelevantLogLines()
        };
    }

    function send(res, status, contentType, body) {
        res.statusCode = status;
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.end(body);
    }

    function safeJsonForHtml(value) {
        return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
    }

    function renderAdminPage(snapshot) {
        var data = safeJsonForHtml(snapshot);
        return "<!doctype html>" +
            "<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
            "<title>My Company</title><style>" +
            ":root{color-scheme:dark}body{font-family:Arial,Helvetica,sans-serif;background:#1d1f20;color:#e7e7e7;margin:0;padding:18px}" +
            "h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:22px 0 10px}.muted{opacity:.72}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}" +
            "button{border:1px solid #70757a;border-radius:4px;background:#5f6b77;color:white;padding:8px 13px;cursor:pointer}button.primary{background:#3168d8;border-color:#3168d8}" +
            ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}.card{border:1px solid #505458;border-radius:6px;padding:12px;background:#242728}" +
            ".ok{color:#71d58a}.bad{color:#ff7b7b}.pill{display:inline-block;border-radius:999px;padding:2px 8px;font-size:12px;background:#3a3e40;margin-left:6px}" +
            "pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#111;border:1px solid #444;border-radius:6px;padding:12px;max-height:520px;overflow:auto}" +
            "#debugPanel{display:none}.line{margin-top:5px;font-size:13px}</style></head><body>" +
            "<h1>My Company</h1><div class='muted'>Panel administracyjny i diagnostyka osadzonych modułów</div>" +
            "<div class='toolbar'><button class='primary' onclick='openMyCompany()'>Otwórz My Company</button><button onclick='location.reload()'>Odśwież</button><button onclick='toggleDebug()'>Debug</button><button onclick='clearDebug()'>Wyczyść debug</button></div>" +
            "<div id='moduleGrid' class='grid'></div>" +
            "<section id='debugPanel'><h2>Debug</h2><div id='browserSummary' class='card'></div><h2>Dane serwera</h2><pre id='debugText'></pre></section>" +
            "<script>" +
            "var snapshot=" + data + ";" +
            "function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'})[c]})}" +
            "function renderModules(){var host=document.getElementById('moduleGrid');host.innerHTML='';snapshot.modules.forEach(function(m){var ok=m.loaded&&m.entryExists;var card=document.createElement('div');card.className='card';card.innerHTML='<strong>'+esc(m.name)+'</strong><span class=\"pill '+(ok?'ok':'bad')+'\">'+(ok?'Loaded':'Error')+'</span><div class=\"line\">Backend: '+(m.loaded?'loaded':'unavailable')+'</div><div class=\"line\">Entry file: '+(m.entryExists?'found':'missing')+'</div><div class=\"line\">Server startup: '+(m.serverStarted?'completed':'not confirmed')+'</div>';host.appendChild(card)})}" +
            "function browserState(){var w=parent||window;var local=[];try{local=JSON.parse(w.localStorage.getItem('mycompany-debug-errors')||'[]')}catch(e){}return{MyCompanyAssetUrl:typeof w.MyCompanyAssetUrl,MyCompany:typeof w.MyCompany,MyScriptsOpen:typeof(w.MyScripts&&w.MyScripts.open),MyCommandsOpen:typeof(w.MyCommands&&w.MyCommands.openStandalone),ApprovalCenterOpen:typeof(w.ApprovalCenter&&w.ApprovalCenter.open),MoveRequestInitialize:typeof(w.MoveRequest&&w.MoveRequest.initialize),capturedBrowserErrors:local}}" +
            "function toggleDebug(){var p=document.getElementById('debugPanel');var show=p.style.display!=='block';p.style.display=show?'block':'none';if(show){var b=browserState();document.getElementById('browserSummary').innerHTML='<strong>Stan przeglądarki</strong><pre>'+esc(JSON.stringify(b,null,2))+'</pre>';document.getElementById('debugText').textContent=JSON.stringify(snapshot,null,2)}}" +
            "function openMyCompany(){try{if(parent&&typeof parent.go==='function')parent.go(1);setTimeout(function(){if(parent.MyCompany&&typeof parent.MyCompany.showModule==='function')parent.MyCompany.showModule('scripts')},100)}catch(e){alert(e.message||e)}}" +
            "function clearDebug(){var u=new URL(window.location.href);u.searchParams.set('asset','clear-debug');fetch(u.href,{cache:'no-store'}).then(function(){try{parent.localStorage.removeItem('mycompany-debug-errors')}catch(e){}location.reload()})}" +
            "renderModules();</script></body></html>";
    }

    var originalAdminReq = obj.handleAdminReq;
    obj.handleAdminReq = function (req, res, user) {
        var moduleName = String(req && req.query && req.query.module || "");
        if (moduleName) {
            try { return originalAdminReq.apply(obj, arguments); }
            catch (error) {
                addDebug("error", "admin:" + moduleName, [error]);
                throw error;
            }
        }

        if (!siteAdminAllowed(user)) {
            send(res, 403, "text/plain; charset=utf-8", "Permission denied.");
            return;
        }

        var asset = String(req && req.query && req.query.asset || "");
        if (asset === "debug") {
            send(res, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true, debug: debugSnapshot() }, null, 2));
            return;
        }
        if (asset === "clear-debug") {
            debugEvents.length = 0;
            send(res, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true }));
            return;
        }

        send(res, 200, "text/html; charset=utf-8", renderAdminPage(debugSnapshot()));
    };

    // Preserve the main serialized startup and wrap it with client-side UI
    // cleanup plus browser error collection.
    obj.myCompanyMainStartup = obj.onWebUIStartupEnd;
    if (obj.exports.indexOf("myCompanyMainStartup") < 0) obj.exports.push("myCompanyMainStartup");

    obj.onWebUIStartupEnd = function () {
        if (typeof window === "undefined" || typeof document === "undefined") return;

        var api = window.pluginHandler && window.pluginHandler.mycompany;
        if (api && typeof api.myCompanyMainStartup === "function") api.myCompanyMainStartup();

        function storeBrowserError(kind, value) {
            try {
                var list = JSON.parse(window.localStorage.getItem("mycompany-debug-errors") || "[]");
                var message = String(value && (value.stack || value.message) || value || "Unknown browser error");
                if (!/mycompany|myscripts|mycommands|approvalcenter|moverequest|embedded/i.test(message)) return;
                list.push({ time: new Date().toISOString(), kind: kind, message: message.slice(0, 12000) });
                if (list.length > 100) list.splice(0, list.length - 100);
                window.localStorage.setItem("mycompany-debug-errors", JSON.stringify(list));
            } catch (error) { }
        }

        if (!window.__myCompanyDebugCaptureInstalled) {
            window.__myCompanyDebugCaptureInstalled = true;
            window.addEventListener("error", function (event) { storeBrowserError("error", event.error || event.message); });
            window.addEventListener("unhandledrejection", function (event) { storeBrowserError("unhandledrejection", event.reason); });
        }

        function openScripts(event) {
            if (event) {
                if (event.preventDefault) event.preventDefault();
                if (event.stopPropagation) event.stopPropagation();
            }
            if (window.MyCompany && typeof window.MyCompany.showModule === "function") return window.MyCompany.showModule("scripts");
            return false;
        }

        function removeSettingsControls() {
            var selector = '[data-mycompany-module="settings"],[data-mycompany-persistent-module="settings"]';
            Array.prototype.forEach.call(document.querySelectorAll(selector), function (element) {
                if (element && element.parentNode) element.parentNode.removeChild(element);
            });
            if (window.MyCompany) {
                window.MyCompany.open = openScripts;
                window.MyCompany.renderSettings = openScripts;
            }
            ["MainMenuMyCompany", "LeftMenuMyCompany"].forEach(function (id) {
                var item = document.getElementById(id);
                if (!item) return;
                item.onclick = openScripts;
                item.onmouseup = openScripts;
            });
        }

        [0, 100, 500, 1500, 3000].forEach(function (delay) { window.setTimeout(removeSettingsControls, delay); });
        if (!window.__myCompanySettingsObserver) {
            window.__myCompanySettingsObserver = new MutationObserver(function () {
                window.clearTimeout(window.__myCompanySettingsObserverTimer);
                window.__myCompanySettingsObserverTimer = window.setTimeout(removeSettingsControls, 20);
            });
            window.__myCompanySettingsObserver.observe(document.documentElement, { childList: true, subtree: true });
        }
    };

    return obj;
};
