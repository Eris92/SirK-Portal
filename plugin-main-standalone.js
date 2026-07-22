"use strict";

var fs = require("fs");
var path = require("path");
var baseFactory = require("./plugin-main.js");

var VERSION = require("./config.json").version;

function normalizeBase(value) {
    value = String(value || "/");
    if (value.charAt(0) !== "/") value = "/" + value;
    if (value.charAt(value.length - 1) !== "/") value += "/";
    return value.replace(/\/+/g, "/");
}

function send(res, status, type, body) {
    if (typeof res.status === "function") res.status(status);
    else res.statusCode = status;
    if (typeof res.set === "function") {
        res.set("Content-Type", type);
        res.set("Cache-Control", "no-store");
        res.set("X-Content-Type-Options", "nosniff");
    } else if (typeof res.setHeader === "function") {
        res.setHeader("Content-Type", type);
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
    }
    if (typeof res.send === "function") res.send(body);
    else res.end(body);
}

function redirect(res, target) {
    if (typeof res.redirect === "function") res.redirect(302, target);
    else {
        res.statusCode = 302;
        res.setHeader("Location", target);
        res.end();
    }
}

function sendApiJson(res, status, value) {
    send(res, status, "application/json; charset=utf-8", JSON.stringify(value));
}

function apiFailure(res, error) {
    var message = String(error && error.message || error || "Request failed.");
    var status = /invalid api token|authentication|required|owner no longer exists/i.test(message) ? 401
        : /scope|permission|cannot use/i.test(message) ? 403
            : /not found|unavailable/i.test(message) ? 404
                : /already|changed|idempotency/i.test(message) ? 409 : 400;
    sendApiJson(res, status, { ok: false, error: { code: "request_failed", message: message } });
}

function bearerToken(req) {
    var match = String(req && req.headers && req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
    return match && match[1] || "";
}

function idempotencyKey(req, body) {
    return String(req && req.headers && req.headers["idempotency-key"] || body && body.idempotencyKey || "").trim().slice(0, 128);
}

function contentType(file) {
    if (/\.css$/i.test(file)) return "text/css; charset=utf-8";
    if (/\.js$/i.test(file)) return "text/javascript; charset=utf-8";
    if (/\.svg$/i.test(file)) return "image/svg+xml; charset=utf-8";
    if (/\.png$/i.test(file)) return "image/png";
    if (/\.jpe?g$/i.test(file)) return "image/jpeg";
    if (/\.json$/i.test(file)) return "application/json; charset=utf-8";
    if (/\.html?$/i.test(file)) return "text/html; charset=utf-8";
    return "application/octet-stream";
}

function safePublicPath(asset) {
    try {
        asset = decodeURIComponent(String(asset || "")).replace(/\\/g, "/");
    } catch (error) {
        return null;
    }
    if (!asset || asset.indexOf("..") >= 0 || asset.charAt(0) === "/") return null;
    var publicRoot = path.resolve(__dirname, "public");
    var target = path.resolve(publicRoot, asset);
    if (target !== publicRoot && target.indexOf(publicRoot + path.sep) !== 0) return null;
    return target;
}

module.exports.createPlugin = function (parent, shortName) {
    var plugin = baseFactory.createPlugin(parent, shortName);

    function approvalService() {
        return plugin.runtime && plugin.runtime.context && plugin.runtime.context.approval;
    }

    function handleApprovalApi(req, res) {
        var service = approvalService();
        if (!service) {
            sendApiJson(res, 503, { ok: false, error: { code: "service_unavailable", message: "Approval Center is unavailable." } });
            return;
        }
        var method = String(req && req.method || "GET").toUpperCase();
        var route = String(req && (req.path || req.url) || "/").split("?")[0].replace(/\/+$/, "") || "/";
        if (method === "GET" && route === "/health") {
            sendApiJson(res, 200, { ok: true, data: { service: "mycompany-approval", apiVersion: "v1", pluginVersion: VERSION } });
            return;
        }
        var tokenText = bearerToken(req);
        var resourceMatch = route.match(/^\/providers\/([a-z0-9_-]+)\/resources$/i);
        var requestMatch = route.match(/^\/requests\/([a-z0-9_-]+)$/i);
        var decisionMatch = route.match(/^\/requests\/([a-z0-9_-]+)\/decision$/i);
        try {
            if (method === "GET" && route === "/providers") {
                var providersContext = service.externalContext(tokenText, "providers:read");
                var providers = service.listProviders().filter(function (provider) {
                    return !(providersContext.token.providers || []).length || providersContext.token.providers.indexOf(provider.type) >= 0;
                });
                sendApiJson(res, 200, { ok: true, data: { providers: providers } });
                return;
            }
            if (method === "GET" && resourceMatch) {
                var resourceContext = service.externalContext(tokenText, "providers:read", resourceMatch[1]);
                Promise.resolve(service.getProviderResources(resourceMatch[1], resourceContext.user, req.query || {})).then(function (resources) {
                    sendApiJson(res, 200, { ok: true, data: resources });
                }).catch(function (error) { apiFailure(res, error); });
                return;
            }
            if (method === "GET" && route === "/requests") {
                var listContext = service.externalContext(tokenText, "requests:read", req.query && req.query.type);
                var query = Object.assign({}, req.query || {}, { allowedTypes: listContext.token.providers || [] });
                Promise.resolve(service.list(listContext.user, query)).then(function (result) {
                    sendApiJson(res, 200, { ok: true, data: result });
                }).catch(function (error) { apiFailure(res, error); });
                return;
            }
            if (method === "GET" && requestMatch) {
                var readContext = service.externalContext(tokenText, "requests:read");
                var request = service.getRequest(readContext.user, requestMatch[1]);
                if ((readContext.token.providers || []).length && readContext.token.providers.indexOf(request.type) < 0) throw new Error("API token cannot use this provider.");
                sendApiJson(res, 200, { ok: true, data: { request: request } });
                return;
            }
            if (method === "POST" && route === "/requests") {
                var body = req && req.body && typeof req.body === "object" ? req.body : {};
                var key = idempotencyKey(req, body);
                if (!key) throw new Error("Idempotency-Key is required.");
                Promise.resolve(service.submitExternal(tokenText, String(body.type || "").toLowerCase(), body.payload || {}, body.requesterNote || "", key)).then(function (request) {
                    sendApiJson(res, 202, { ok: true, data: { request: request } });
                }).catch(function (error) { apiFailure(res, error); });
                return;
            }
            if (method === "POST" && decisionMatch) {
                var decisionBody = req && req.body && typeof req.body === "object" ? req.body : {};
                var decisionKey = idempotencyKey(req, decisionBody);
                if (!decisionKey) throw new Error("Idempotency-Key is required.");
                var decision = decisionBody.decision != null
                    ? String(decisionBody.decision).toLowerCase()
                    : decisionBody.approved === true ? "approve" : decisionBody.approved === false ? "reject" : "";
                Promise.resolve(service.decideExternal(tokenText, decisionMatch[1], decision, decisionBody.note || "", decisionKey)).then(function (request) {
                    sendApiJson(res, 200, { ok: true, data: { request: request } });
                }).catch(function (error) { apiFailure(res, error); });
                return;
            }
        } catch (error) {
            apiFailure(res, error);
            return;
        }
        sendApiJson(res, 404, { ok: false, error: { code: "endpoint_not_found", message: "API endpoint not found." } });
    }

    function portalEnabled() {
        try {
            var state = plugin.runtime && typeof plugin.runtime.bootstrap === "function" ? plugin.runtime.bootstrap(null) : null;
            return !!(state && state.modules && state.modules.portal && state.modules.portal.enabled && state.modules.portal.ready !== false);
        } catch (error) {
            return false;
        }
    }

    function portalSettings() {
        try {
            var settings = plugin.runtime && plugin.runtime.context && plugin.runtime.context.settings;
            var current = settings && typeof settings.read === "function" ? settings.read() : {};
            return current && current.modules && current.modules.portal || {};
        } catch (error) {
            return {};
        }
    }

    function portalHtml(base) {
        var template = fs.readFileSync(path.join(__dirname, "public", "portal-standalone.html"), "utf8");
        var assetBase = base + "sirkportal/assets";
        var apiBase = base + "pluginadmin.ashx";
        var nativeUrl = base + "meshcentral/";
        var logoutUrl = base + "logout";
        var userImageUrl = base + "userimage.ashx";
        var defaultUserImageUrl = base + "images/user-256.png";
        return template
            .replace(/__API_BASE_JSON__/g, JSON.stringify(apiBase))
            .replace(/__ASSET_BASE_JSON__/g, JSON.stringify(assetBase))
            .replace(/__NATIVE_URL_JSON__/g, JSON.stringify(nativeUrl))
            .replace(/__LOGOUT_URL_JSON__/g, JSON.stringify(logoutUrl))
            .replace(/__USER_IMAGE_URL_JSON__/g, JSON.stringify(userImageUrl))
            .replace(/__DEFAULT_USER_IMAGE_URL_JSON__/g, JSON.stringify(defaultUserImageUrl))
            .replace(/__VERSION_JSON__/g, JSON.stringify(VERSION))
            .replace(/__ASSET_BASE__/g, assetBase)
            .replace(/__NATIVE_URL__/g, nativeUrl)
            .replace(/__VERSION__/g, VERSION);
    }

    function portalLoginHtml(base) {
        var template = fs.readFileSync(path.join(__dirname, "public", "portal-login.html"), "utf8");
        var assetBase = base + "sirkportal/assets";
        var portalUrl = base + "sirkportal/";
        var nativeLoginUrl = base + "?sirkAuth=1";
        var nativeUrl = base + "?sirkNative=1";
        return template
            .replace(/__ASSET_BASE_JSON__/g, JSON.stringify(assetBase))
            .replace(/__PORTAL_URL_JSON__/g, JSON.stringify(portalUrl))
            .replace(/__NATIVE_URL_JSON__/g, JSON.stringify(nativeUrl))
            .replace(/__NATIVE_LOGIN_URL__/g, nativeLoginUrl)
            .replace(/__FORCE_PORTAL_JSON__/g, JSON.stringify(portalSettings().forcePortalInterface === true))
            .replace(/__VERSION_JSON__/g, JSON.stringify(VERSION))
            .replace(/__ASSET_BASE__/g, assetBase)
            .replace(/__VERSION__/g, VERSION);
    }

    function installForcedNavigation(webserver, base) {
        var app = webserver.app;
        var rootPath = base === "/" ? "/" : base.replace(/\/$/, "");
        var rootPathSlash = rootPath === "/" ? "/" : rootPath + "/";
        var middleware = function (req, res, next) {
            var method = String(req && req.method || "GET").toUpperCase();
            if (method !== "GET" && method !== "HEAD") { next(); return; }
            var requestPath = String(req && (req.path || req.url) || "/").split("?")[0];
            if (requestPath !== rootPath && requestPath !== rootPathSlash) { next(); return; }
            var requestUrl;
            try { requestUrl = new URL(String(req.originalUrl || req.url || requestPath), "http://mycompany.local"); }
            catch (error) { next(); return; }
            if (requestUrl.searchParams.get("sirkAuth") === "1") { next(); return; }
            var settings = portalSettings();
            if (settings.forcePortalInterface === true) {
                redirect(res, base + "sirkportal/");
                return;
            }
            if (requestUrl.searchParams.get("sirkNative") === "1") { next(); return; }
            if (settings.forceNewLogin === true) {
                redirect(res, base + "sirkportal/login");
                return;
            }
            next();
        };

        app.use(middleware);
        var router = app._router || app.router;
        var stack = router && router.stack;
        if (!Array.isArray(stack)) return;
        var index = stack.findIndex(function (layer) { return layer && layer.handle === middleware; });
        if (index > 0) stack.unshift(stack.splice(index, 1)[0]);
    }

    function registerDomain(webserver, domain) {
        var base = normalizeBase(domain && domain.url || "/");
        var portalPath = base + "sirkportal";
        var portalPathSlash = portalPath + "/";
        var portalLoginPath = portalPath + "/login";
        var nativePath = base + "meshcentral";
        var nativePathSlash = nativePath + "/";

        function servePortal(req, res) {
            if (!portalEnabled()) {
                send(res, 503, "text/html; charset=utf-8", "<!doctype html><meta charset=\"utf-8\"><title>SirK Portal disabled</title><p>SirK Portal is disabled in MyCompany settings.</p><p><a href=\"" + nativePathSlash + "\">Open MeshCentral</a></p>");
                return;
            }
            send(res, 200, "text/html; charset=utf-8", portalHtml(base));
        }

        webserver.app.get(portalPath, servePortal);
        webserver.app.get(portalPathSlash, servePortal);
        webserver.app.get(portalLoginPath, function (req, res) {
            send(res, 200, "text/html; charset=utf-8", portalLoginHtml(base));
        });

        webserver.app.get(base + "sirkportal/assets/*", function (req, res) {
            var asset = req.params && req.params[0] || "";
            var target = safePublicPath(asset);
            if (!target) {
                send(res, 400, "text/plain; charset=utf-8", "Invalid asset path");
                return;
            }
            fs.readFile(target, function (error, data) {
                if (error) send(res, 404, "text/plain; charset=utf-8", "Not found");
                else send(res, 200, contentType(target), data);
            });
        });

        function openNative(req, res) {
            if (portalSettings().forcePortalInterface === true) redirect(res, portalPathSlash);
            else redirect(res, base + "?sirkNative=1");
        }
        webserver.app.get(nativePath, openNative);
        webserver.app.get(nativePathSlash, openNative);
        installForcedNavigation(webserver, base);

        var apiPrefixes = [base + "mycompany/api/v1/approval", base + "approvalcenter/api/v1"];
        var jsonParser = webserver.bodyParser && webserver.bodyParser.json({ limit: "256kb", strict: true });
        apiPrefixes.forEach(function (prefix) {
            webserver.app.use(prefix, function (req, res) {
                var dispatch = function () { handleApprovalApi(req, res); };
                if (String(req.method || "GET").toUpperCase() !== "POST" || !jsonParser) {
                    dispatch();
                    return;
                }
                jsonParser(req, res, function (error) {
                    if (error) sendApiJson(res, 400, { ok: false, error: { code: "invalid_json", message: "The request body must contain valid JSON." } });
                    else dispatch();
                });
            });
        });
    }

    plugin.hook_setupHttpHandlers = function (webserver, meshServer) {
        if (!webserver || !webserver.app || webserver.__myCompanyStandaloneRoutes) return;
        webserver.__myCompanyStandaloneRoutes = true;
        var domains = meshServer && meshServer.config && meshServer.config.domains || { "": { url: "/" } };
        Object.keys(domains).forEach(function (key) {
            var domain = domains[key] || {};
            if (domain.dns != null || domain.share != null) return;
            registerDomain(webserver, domain);
        });
    };

    return plugin;
};
