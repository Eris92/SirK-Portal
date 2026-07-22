<#
.SYNOPSIS
Verifies the MyCompany version contract across metadata and bootstrap files.

.EXAMPLE
.\Test-MyCompanyVersion.ps1 -ProjectPath 'C:\src\MeshCentral-MyCompany'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$ProjectPath,

    [ValidateSet('Json', 'Object')]
    [string]$OutputFormat = 'Json'
)

$ErrorActionPreference = 'Stop'

function Write-OperationResult {
    param([object]$Result, [string]$Format)
    if ($Format -eq 'Json') {
        $Result | ConvertTo-Json -Depth 8 -Compress
    }
    else {
        $Result
    }
}

try {
    if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Test-MyCompanyVersion'; ProjectPath = $ProjectPath
            Message = 'ProjectPath does not exist or is not a directory.'; ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }

    $root = (Resolve-Path -LiteralPath $ProjectPath).Path
    $required = @(
        'package.json', 'config.json', 'version-history.json',
        'plugin-main.js', 'README.md', 'changelog.md'
    )
    $missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_) -PathType Leaf) })
    if ($missing.Count -gt 0) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Test-MyCompanyVersion'; ProjectPath = $root
            MissingFiles = $missing; Message = 'One or more version sources are missing.'; ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }

    $package = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
    $config = Get-Content -LiteralPath (Join-Path $root 'config.json') -Raw | ConvertFrom-Json
    $history = @(Get-Content -LiteralPath (Join-Path $root 'version-history.json') -Raw | ConvertFrom-Json)
    $pluginMain = Get-Content -LiteralPath (Join-Path $root 'plugin-main.js') -Raw
    $readmeFirst = Get-Content -LiteralPath (Join-Path $root 'README.md') -TotalCount 1
    $changelog = Get-Content -LiteralPath (Join-Path $root 'changelog.md')

    $browserVersionMatch = [regex]::Match($pluginMain, 'var\s+browserVersion\s*=\s*"([^"]+)"')
    $changelogVersion = $null
    foreach ($line in $changelog) {
        $match = [regex]::Match([string]$line, '^##\s+([0-9]+\.[0-9]+\.[0-9]+)\s*$')
        if ($match.Success) {
            $changelogVersion = $match.Groups[1].Value
            break
        }
    }
    $readmeVersionMatch = [regex]::Match([string]$readmeFirst, '^#\s+MyCompany\s+([0-9]+\.[0-9]+\.[0-9]+)\s*$')

    $versions = [ordered]@{
        Package = [string]$package.version
        Config = [string]$config.version
        VersionHistory = if ($history.Count -gt 0) { [string]$history[0].version } else { $null }
        BrowserBootstrap = if ($browserVersionMatch.Success) { $browserVersionMatch.Groups[1].Value } else { $null }
        Readme = if ($readmeVersionMatch.Success) { $readmeVersionMatch.Groups[1].Value } else { $null }
        Changelog = $changelogVersion
    }
    $expected = [string]$package.version
    $mismatches = @(
        foreach ($entry in $versions.GetEnumerator()) {
            if ([string]::IsNullOrWhiteSpace([string]$entry.Value) -or [string]$entry.Value -cne $expected) {
                [pscustomobject]@{ Source = $entry.Key; Value = $entry.Value; Expected = $expected }
            }
        }
    )

    $success = -not [string]::IsNullOrWhiteSpace($expected) -and $mismatches.Count -eq 0
    $exitCode = if ($success) { 0 } else { 5 }
    $result = [pscustomobject]@{
        Success = $success
        Changed = $false
        Skipped = $false
        SkipReason = $null
        Operation = 'Test-MyCompanyVersion'
        ProjectPath = $root
        ExpectedVersion = $expected
        Versions = [pscustomobject]$versions
        Mismatches = $mismatches
        Message = if ($success) { 'MyCompany version metadata is consistent.' } else { 'MyCompany version metadata is inconsistent.' }
        ExitCode = $exitCode
    }
    Write-OperationResult $result $OutputFormat
    exit $exitCode
}
catch {
    $result = [pscustomobject]@{
        Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
        Operation = 'Test-MyCompanyVersion'; ProjectPath = $ProjectPath
        Message = $_.Exception.Message; ExitCode = 1
    }
    Write-OperationResult $result $OutputFormat
    exit 1
}
