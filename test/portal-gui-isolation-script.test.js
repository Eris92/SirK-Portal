"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var file = path.join(root, "tools", "Invoke-PortalGuiIsolation.ps1");
var source = fs.readFileSync(file, "utf8");

[
    "[CmdletBinding(SupportsShouldProcess = $true",
    "[ValidateSet('Old', 'New')]",
    "[ValidateSet('Audit', 'Remove', 'Restore')]",
    "[ValidateSet('Exclusive', 'Full')]",
    "function Test-LocalAssetToken",
    "function Get-SafePluginPath",
    "function Get-OldGraph",
    "function Get-NewGraph",
    "function New-Backup",
    "function Restore-Backup",
    "Compress-Archive",
    "Get-FileHash",
    "legacy-class-usage.csv",
    "asset-references-before.csv",
    "asset-references-after.csv",
    "$PSCmdlet.ShouldProcess",
    "BackupDirectory",
    "BackupZip"
].forEach(function (value) {
    assert(source.indexOf(value) >= 0, "Missing portal GUI isolation contract: " + value);
});

assert(
    source.indexOf("if ($Action -eq 'Restore')") < source.indexOf("if ($Action -ne 'Restore')"),
    "Restore must run before validating Portal documents that may have been removed."
);
assert(
    source.indexOf("New-Backup -Root") < source.indexOf("Remove-Item -LiteralPath (Get-SafePluginPath"),
    "Backup must be created before selected GUI files are removed."
);
assert(
    source.indexOf("$removed = New-Object 'System.Collections.Generic.List[string]'") >= 0,
    "Removed files must use a dynamic collection."
);
assert(
    source.indexOf("^[a-z][a-z0-9+.-]*:") >= 0,
    "URL schemes must be rejected before path resolution."
);
assert(
    source.indexOf("^[a-zA-Z]:[\\\\/]") >= 0,
    "Absolute Windows paths must be rejected as asset tokens."
);
assert(
    source.indexOf("Test-LocalAssetToken -Token $Token") < source.indexOf("Get-SafePluginPath -Root $Root -RelativePath $candidate"),
    "Asset tokens must be validated before GetFullPath is reached."
);
assert(
    source.indexOf("Restart-Service") < 0 && source.indexOf("Stop-Service") < 0,
    "The isolation script must never restart or stop MeshCentral."
);
assert(
    source.indexOf("git clean") < 0 && source.indexOf("Remove-Item -LiteralPath $root -Recurse") < 0,
    "The isolation script must not perform broad repository deletion."
);

console.log("Portal GUI isolation PowerShell contract: OK");
