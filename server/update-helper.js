"use strict";

var fs = require("fs");
var path = require("path");

function sleep(milliseconds) {
    var end = Date.now() + milliseconds;
    while (Date.now() < end) {}
}

function processExists(pid) {
    if (!pid) return false;
    try { process.kill(pid, 0); return true; }
    catch (error) { return error && error.code === "EPERM"; }
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function appendHistory(stateFile, operation) {
    var state;
    try { state = readJson(stateFile); }
    catch (error) { state = { channel: "dev", history: [] }; }
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history.unshift(operation);
    if (operation.channel) state.channel = operation.channel;
    state.pending = null;
    writeJson(stateFile, state);
}

function swap(target, staged, token) {
    var previous = target + ".previous-" + token;
    var attempts = 0;
    while (attempts < 120) {
        attempts += 1;
        try {
            if (fs.existsSync(previous)) fs.rmSync(previous, { recursive: true, force: true });
            fs.renameSync(target, previous);
            fs.renameSync(staged, target);
            fs.rmSync(previous, { recursive: true, force: true });
            return;
        } catch (error) {
            try {
                if (!fs.existsSync(target) && fs.existsSync(previous)) fs.renameSync(previous, target);
            } catch (ignored) {}
            if (attempts >= 120) throw error;
            sleep(1000);
        }
    }
}

function main() {
    var manifestFile = process.argv[2];
    if (!manifestFile) throw new Error("Pending update manifest is required.");
    var manifest = readJson(manifestFile);
    var parentPid = Number(manifest.parentPid) || 0;
    var deadline = Date.now() + 30 * 60 * 1000;
    while (processExists(parentPid) && Date.now() < deadline) sleep(1000);
    if (processExists(parentPid)) throw new Error("The running SIRK host did not stop within 30 minutes.");
    swap(path.resolve(manifest.target), path.resolve(manifest.staged), String(manifest.token));
    appendHistory(path.resolve(manifest.stateFile), manifest.history);
    try { fs.rmSync(path.dirname(manifestFile), { recursive: true, force: true }); } catch (ignored) {}
}

try { main(); }
catch (error) {
    try {
        var failureFile = process.argv[2] ? path.join(path.dirname(process.argv[2]), "failure.txt") : path.join(process.cwd(), "sirk-update-failure.txt");
        fs.writeFileSync(failureFile, String(error && error.stack || error));
    } catch (ignored) {}
    process.exitCode = 1;
}
