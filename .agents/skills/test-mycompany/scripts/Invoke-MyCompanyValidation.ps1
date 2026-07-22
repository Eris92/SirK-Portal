<#
.SYNOPSIS
Runs the existing MyCompany validation suite.

.EXAMPLE
.\Invoke-MyCompanyValidation.ps1 -ProjectPath 'C:\src\MeshCentral-MyCompany'
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
            Success = $false
            Changed = $false
            Skipped = $false
            SkipReason = $null
            Operation = 'Test-MyCompany'
            ProjectPath = $ProjectPath
            Message = 'ProjectPath does not exist or is not a directory.'
            ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }

    $resolvedProject = (Resolve-Path -LiteralPath $ProjectPath).Path
    $packagePath = Join-Path $resolvedProject 'package.json'
    if (-not (Test-Path -LiteralPath $packagePath -PathType Leaf)) {
        $result = [pscustomobject]@{
            Success = $false
            Changed = $false
            Skipped = $false
            SkipReason = $null
            Operation = 'Test-MyCompany'
            ProjectPath = $resolvedProject
            Message = 'package.json was not found.'
            ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }

    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($null -eq $npm) {
        $result = [pscustomobject]@{
            Success = $false
            Changed = $false
            Skipped = $false
            SkipReason = $null
            Operation = 'Test-MyCompany'
            ProjectPath = $resolvedProject
            Message = 'npm.cmd was not found.'
            ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }

    Push-Location -LiteralPath $resolvedProject
    try {
        $output = @(& $npm.Source test 2>&1 | ForEach-Object { $_.ToString() })
        $processExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    $success = $processExitCode -eq 0
    $exitCode = if ($success) { 0 } else { 4 }
    $result = [pscustomobject]@{
        Success = $success
        Changed = $false
        Skipped = $false
        SkipReason = $null
        Operation = 'Test-MyCompany'
        ProjectPath = $resolvedProject
        Command = 'npm test'
        ProcessExitCode = $processExitCode
        Output = $output
        Message = if ($success) { 'MyCompany validation passed.' } else { 'MyCompany validation failed.' }
        ExitCode = $exitCode
    }
    Write-OperationResult $result $OutputFormat
    exit $exitCode
}
catch {
    $result = [pscustomobject]@{
        Success = $false
        Changed = $false
        Skipped = $false
        SkipReason = $null
        Operation = 'Test-MyCompany'
        ProjectPath = $ProjectPath
        Message = $_.Exception.Message
        ExitCode = 1
    }
    Write-OperationResult $result $OutputFormat
    exit 1
}
