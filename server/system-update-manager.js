"use strict";

var fs = require("fs");
var path = require("path");
var https = require("https");
var crypto = require("crypto");
var childProcess = require("child_process");

var CHANNELS = Object.freeze({ stable: "main", beta: "beta", dev: "develop" });

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function safeName(value) {
    return String(value || "").replace(/[^a-z0-9._-]/gi, "_");
}

function request(url) {
    return new Promise(function (resolve, reject) {
        https.get(url, { headers: { "User-Agent": "SIRK-Portal-Updater", Accept: "application/json" } }, function (res) {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                request(res.headers.location).then(resolve, reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error("Remote server returned HTTP " + res.statusCode + "."));
                return;
            }
            var chunks = [];
            res.on("data", function (chunk) { chunks.push(chunk); });
            res.on("end", function () { resolve(Buffer.concat(chunks)); });
        }).on("error", reject);
    });
}

function create(options) {
    options = options || {};
    var appRoot = path.resolve(options.appRoot || path.join(__dirname, ".."));
    var dataRoot = path.resolve(options.dataRoot || path.join(appRoot, "sirk-platform-data"));
    var updateRoot = path.join(dataRoot, "updates");
    var backupRoot = path.join(updateRoot, "backups");
    var workRoot = path.join(updateRoot, "work");
    var stateFile = path.join(updateRoot, "state.json");

    function loadState() {
        try { return Object.assign({ channel: "dev", history: [], pending: null }, readJson(stateFile)); }
        catch (error) { return { channel: "dev", history: [], pending: null }; }
    }

    function saveState(value) {
        fs.mkdirSync(updateRoot, { recursive: true });
        fs.writeFileSync(stateFile, JSON.stringify(value, null, 2));
    }

    function branch(channel) {
        channel = String(channel || loadState().channel || "dev").toLowerCase();
        if (!CHANNELS[channel]) throw new Error("Unknown update channel.");
        return CHANNELS[channel];
    }

    function current() {
        var packageJson = readJson(path.join(appRoot, "package.json"));
        var state = loadState();
        return { version: packageJson.version, channel: state.channel, branch: branch(state.channel), pending: state.pending || null };
    }

    function health(target) {
        target = path.resolve(target || appRoot);
        var checks = [];
        function check(name, callback) {
            try { callback(); checks.push({ name: name, ok: true }); }
            catch (error) { checks.push({ name: name, ok: false, error: String(error.message || error) }); }
        }
        check("package", function () { if (!readJson(path.join(target, "package.json")).version) throw new Error("version missing"); });
        check("config", function () { if (readJson(path.join(target, "config.json")).shortName !== "SIRKPortal") throw new Error("identity mismatch"); });
        check("entrypoint", function () { if (!fs.existsSync(path.join(target, "SIRKPortal.js"))) throw new Error("entrypoint missing"); });
        check("standalone", function () { if (!fs.existsSync(path.join(target, "server", "standalone.js"))) throw new Error("standalone server missing"); });
        check("update-helper", function () { if (!fs.existsSync(path.join(target, "server", "update-helper.js"))) throw new Error("update helper missing"); });
        return { ok: checks.every(function (item) { return item.ok; }), checks: checks };
    }

    function listBackups() {
        fs.mkdirSync(backupRoot, { recursive: true });
        return fs.readdirSync(backupRoot, { withFileTypes: true }).filter(function (entry) {
            return entry.isDirectory();
        }).map(function (entry) {
            var manifest = {};
            try { manifest = readJson(path.join(backupRoot, entry.name, "manifest.json")); } catch (error) {}
            return Object.assign({ id: entry.name }, manifest);
        }).sort(function (left, right) {
            return String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
        });
    }

    function createBackup(reason) {
        var installed = current();
        var id = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 17) + "-" + safeName(installed.version) + "-" + safeName(reason || "manual");
        var directory = path.join(backupRoot, id);
        var payload = path.join(directory, "app");
        fs.mkdirSync(directory, { recursive: true });
        fs.cpSync(appRoot, payload, {
            recursive: true,
            errorOnExist: true,
            filter: function (source) { return path.resolve(source).indexOf(path.resolve(updateRoot)) !== 0; }
        });
        var manifest = { id: id, version: installed.version, channel: installed.channel, branch: installed.branch, reason: reason || "manual", createdAt: new Date().toISOString() };
        fs.writeFileSync(path.join(directory, "manifest.json"), JSON.stringify(manifest, null, 2));
        return manifest;
    }

    function check(channel) {
        var selectedBranch = branch(channel);
        var base = "https://raw.githubusercontent.com/Eris92/SIRK-Portal/" + selectedBranch + "/";
        return Promise.all([request(base + "package.json"), request(base + "config.json")]).then(function (values) {
            var packageJson = JSON.parse(values[0].toString("utf8"));
            var config = JSON.parse(values[1].toString("utf8"));
            if (config.shortName !== "SIRKPortal") throw new Error("Remote package identity mismatch.");
            var installed = current();
            return {
                channel: Object.keys(CHANNELS).find(function (key) { return CHANNELS[key] === selectedBranch; }),
                branch: selectedBranch,
                currentVersion: installed.version,
                availableVersion: packageJson.version,
                downloadUrl: "https://codeload.github.com/Eris92/SIRK-Portal/zip/refs/heads/" + selectedBranch,
                updateAvailable: String(packageJson.version) !== String(installed.version)
            };
        });
    }

    function extract(zipFile, destination) {
        fs.mkdirSync(destination, { recursive: true });
        if (process.platform === "win32") {
            childProcess.execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Expand-Archive -LiteralPath '" + zipFile.replace(/'/g, "''") + "' -DestinationPath '" + destination.replace(/'/g, "''") + "' -Force"], { stdio: "pipe" });
        } else {
            childProcess.execFileSync("unzip", ["-q", zipFile, "-d", destination], { stdio: "pipe" });
        }
    }

    function scheduleSwap(staged, token, history, channel) {
        var operationRoot = path.join(workRoot, token, "operation");
        var helperCopy = path.join(operationRoot, "update-helper.js");
        var manifestFile = path.join(operationRoot, "pending.json");
        fs.mkdirSync(operationRoot, { recursive: true });
        fs.copyFileSync(path.join(appRoot, "server", "update-helper.js"), helperCopy);
        var manifest = {
            token: token,
            parentPid: process.pid,
            target: appRoot,
            staged: staged,
            stateFile: stateFile,
            history: history
        };
        fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
        var state = loadState();
        state.pending = {
            token: token,
            type: history.type,
            targetVersion: history.to || history.version || "",
            backupId: history.backupId || "",
            createdAt: new Date().toISOString()
        };
        if (channel) state.channel = channel;
        saveState(state);
        var child = childProcess.spawn(process.execPath, [helperCopy, manifestFile], {
            cwd: path.dirname(appRoot),
            detached: true,
            stdio: "ignore",
            windowsHide: true
        });
        child.unref();
        return state.pending;
    }

    function install(channel) {
        if (loadState().pending) return Promise.reject(new Error("Another update or restore operation is already pending."));
        return check(channel).then(function (remote) {
            var backup = createBackup("before-update");
            var token = Date.now() + "-" + crypto.randomBytes(4).toString("hex");
            var work = path.join(workRoot, token);
            var zipFile = path.join(work, "source.zip");
            var extracted = path.join(work, "extract");
            fs.mkdirSync(work, { recursive: true });
            return request(remote.downloadUrl).then(function (archive) {
                fs.writeFileSync(zipFile, archive);
                extract(zipFile, extracted);
                var directories = fs.readdirSync(extracted);
                if (directories.length !== 1) throw new Error("Unexpected update archive layout.");
                var staged = path.join(extracted, directories[0]);
                var stagedHealth = health(staged);
                if (!stagedHealth.ok) throw new Error("Downloaded update failed health checks.");
                var history = { type: "update", at: new Date().toISOString(), from: backup.version, to: remote.availableVersion, backupId: backup.id, channel: remote.channel };
                var pending = scheduleSwap(staged, token, history, remote.channel);
                return { changed: false, staged: true, restartRequired: true, version: remote.availableVersion, backupId: backup.id, pending: pending, health: stagedHealth };
            });
        });
    }

    function restore(backupId) {
        if (loadState().pending) throw new Error("Another update or restore operation is already pending.");
        backupId = String(backupId || "");
        if (!/^[a-z0-9._-]+$/i.test(backupId)) throw new Error("Invalid backup identifier.");
        var source = path.join(backupRoot, backupId, "app");
        if (!fs.existsSync(source)) throw new Error("Backup was not found.");
        var backupManifest = readJson(path.join(backupRoot, backupId, "manifest.json"));
        var safety = createBackup("before-restore");
        var token = Date.now() + "-restore-" + crypto.randomBytes(4).toString("hex");
        var staged = path.join(workRoot, token, "restore");
        fs.mkdirSync(path.dirname(staged), { recursive: true });
        fs.cpSync(source, staged, { recursive: true, errorOnExist: true });
        var stagedHealth = health(staged);
        if (!stagedHealth.ok) { fs.rmSync(staged, { recursive: true, force: true }); throw new Error("Backup failed health checks."); }
        var history = { type: "restore", at: new Date().toISOString(), version: backupManifest.version, backupId: backupId, safetyBackupId: safety.id, channel: backupManifest.channel || loadState().channel };
        var pending = scheduleSwap(staged, token, history, history.channel);
        return { changed: false, staged: true, restartRequired: true, backupId: backupId, safetyBackupId: safety.id, pending: pending, health: stagedHealth };
    }

    function setChannel(channel) {
        if (loadState().pending) throw new Error("The update channel cannot be changed while an operation is pending.");
        var selectedBranch = branch(channel);
        var state = loadState();
        state.channel = Object.keys(CHANNELS).find(function (key) { return CHANNELS[key] === selectedBranch; });
        saveState(state);
        return current();
    }

    return { channels: CHANNELS, current: current, state: loadState, setChannel: setChannel, check: check, backup: createBackup, backups: listBackups, install: install, restore: restore, health: health };
}

module.exports = { create: create, channels: CHANNELS };
