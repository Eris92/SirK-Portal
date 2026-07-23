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
    "function Get-OldGraph",
    "function Get-NewGraph",
    "function New-PortalBackup",
    "function Restore-PortalBackup",
    "Compress-Archive",
    "Get-FileHash",
    "legacy-class-usage.csv",
    "asset-references-before.csv",
    "asset-references-after.csv",
    "if ($Action -eq 'Restore')",
    "if ($Action -eq 'Remove')",
    "$PSCmdlet.ShouldProcess",
    "BackupDirectory",
    "BackupZip"
].forEach(function (value) {
    assert(source.indexOf(value) >= 0, "Missing portal GUI isolation contract: " + value);
});

assert(
    source.indexOf("if ($Action -eq 'Restore')") < source.indexOf("$portalDocuments = @('public/portal-standalone.html'"),
    "Restore must run before validating Portal documents that may have been removed."
);
assert(
    source.indexOf("New-PortalBackup") < source.indexOf("Remove-Item -LiteralPath (Join-PluginPath"),
    "Backup must be created before selected GUI files are removed."
);
assert(
    source.indexOf("$removed = New-Object 'System.Collections.Generic.List[string]'") >= 0,
    "Removed files must use a dynamic collection."
);
assert(
    source.indexOf("./tools/Invoke-PortalGuiIsolation.ps1") >= 0,
    "Examples must use a path that is not corrupted by a tab escape."
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
