"use strict";

var crypto = require("crypto");

function wait(milliseconds) {
    return new Promise(function (resolve) {
        setTimeout(resolve, milliseconds);
    });
}

function isRetryable(error) {
    return !!error && [
        "EACCES",
        "EBUSY",
        "EEXIST",
        "ENOTEMPTY",
        "EPERM"
    ].indexOf(String(error.code || "")) >= 0;
}

function retry(operation, attempts) {
    attempts = Math.max(1, Number(attempts) || 1);

    function run(index) {
        return Promise.resolve().then(operation).catch(function (error) {
            if (!isRetryable(error) || index >= attempts - 1) throw error;
            return wait(50 * (index + 1)).then(function () {
                return run(index + 1);
            });
        });
    }

    return run(0);
}

function ignoreMissing(promise) {
    return promise.catch(function (error) {
        if (!error || error.code !== "ENOENT") throw error;
    });
}

module.exports.write = function (fs, path, filePath, value) {
    var suffix = process.pid + "." + crypto.randomBytes(6).toString("hex");
    var temporary = filePath + "." + suffix + ".tmp";
    var backup = filePath + "." + suffix + ".bak";
    var text = JSON.stringify(value, null, 2);
    var backupCreated = false;

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    return fs.promises.writeFile(temporary, text, {
        encoding: "utf8",
        mode: 0o600
    }).then(function () {
        if (!fs.existsSync(filePath)) {
            return retry(function () {
                return fs.promises.rename(temporary, filePath);
            }, 8);
        }

        return fs.promises.chmod(filePath, 0o666).catch(function () {})
            .then(function () {
                return ignoreMissing(fs.promises.unlink(backup));
            })
            .then(function () {
                return retry(function () {
                    return fs.promises.rename(filePath, backup);
                }, 8);
            })
            .then(function () {
                backupCreated = true;
                return retry(function () {
                    return fs.promises.rename(temporary, filePath);
                }, 8);
            })
            .then(function () {
                backupCreated = false;
                return ignoreMissing(fs.promises.unlink(backup));
            })
            .catch(function (replaceError) {
                var restore = Promise.resolve();

                if (backupCreated && !fs.existsSync(filePath)) {
                    restore = retry(function () {
                        return fs.promises.rename(backup, filePath);
                    }, 8).then(function () {
                        backupCreated = false;
                    }).catch(function (restoreError) {
                        replaceError.restoreError = restoreError;
                    });
                }

                return restore.then(function () {
                    return retry(function () {
                        return fs.promises.writeFile(filePath, text, "utf8");
                    }, 8);
                });
            });
    }).finally(function () {
        var cleanup = [ignoreMissing(fs.promises.unlink(temporary))];
        if (backupCreated) cleanup.push(ignoreMissing(fs.promises.unlink(backup)));
        return Promise.all(cleanup);
    });
};
