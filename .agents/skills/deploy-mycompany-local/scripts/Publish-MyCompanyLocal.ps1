<#
.SYNOPSIS
Tests, backs up and atomically deploys a local MyCompany working tree.

.DESCRIPTION
Copies the source without .git, .codex-local or node_modules. The script never
restarts MeshCentral and never modifies meshcentral-data\mycompany-data.

.EXAMPLE
.\Publish-MyCompanyLocal.ps1 -SourcePath 'C:\src\MeshCentral-MyCompany' -MeshRoot 'C:\Program Files\Open Source\MeshCentral' -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$SourcePath,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$MeshRoot,

    [switch]$SkipTests,

    [ValidateSet('Json', 'Object')]
    [string]$OutputFormat = 'Json'
)

$ErrorActionPreference = 'Stop'
$excludedTopLevelNames = @('.git', '.codex-local', 'node_modules')
$resolvedSource = $SourcePath
$resolvedMeshRoot = $MeshRoot
$targetPath = $null
$backupPath = $null
$stagePath = $null
$failedArtifact = $null
$changed = $false
$rollbackPerformed = $false
$failurePhase = 'Validation'
$validationOutput = @()

function Write-OperationResult {
    param([object]$Result, [string]$Format)
    if ($Format -eq 'Json') {
        $Result | ConvertTo-Json -Depth 10 -Compress
    }
    else {
        $Result
    }
}

function Get-DeployFiles {
    param([string]$Root, [string[]]$ExcludedNames)
    $prefix = $Root.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    @(
        Get-ChildItem -LiteralPath $Root -File -Recurse -Force | Where-Object {
            $relative = $_.FullName.Substring($prefix.Length)
            $firstSegment = ($relative -split '[\\/]')[0]
            $ExcludedNames -notcontains $firstSegment
        }
    )
}

function Test-DeployTree {
    param([string]$SourceRoot, [string]$DestinationRoot, [string[]]$ExcludedNames)
    $sourcePrefix = $SourceRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    $sourceFiles = @(Get-DeployFiles -Root $SourceRoot -ExcludedNames $ExcludedNames)
    $mismatches = [System.Collections.Generic.List[string]]::new()

    foreach ($sourceFile in $sourceFiles) {
        $relative = $sourceFile.FullName.Substring($sourcePrefix.Length)
        $destinationFile = Join-Path $DestinationRoot $relative
        if (-not (Test-Path -LiteralPath $destinationFile -PathType Leaf)) {
            $mismatches.Add("Missing: $relative")
            continue
        }
        $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourceFile.FullName).Hash
        $destinationHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $destinationFile).Hash
        if ($sourceHash -cne $destinationHash) {
            $mismatches.Add("Hash mismatch: $relative")
        }
    }

    $destinationFiles = @(Get-ChildItem -LiteralPath $DestinationRoot -File -Recurse -Force)
    if ($destinationFiles.Count -ne $sourceFiles.Count) {
        $mismatches.Add("File count mismatch: source=$($sourceFiles.Count), destination=$($destinationFiles.Count)")
    }

    [pscustomobject]@{
        Success = $mismatches.Count -eq 0
        FileCount = $sourceFiles.Count
        Mismatches = @($mismatches)
    }
}

function Invoke-NpmValidation {
    param([string]$WorkingDirectory)
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($null -eq $npm) {
        return [pscustomobject]@{ Available = $false; ExitCode = 3; Output = @('npm.cmd was not found.') }
    }
    Push-Location -LiteralPath $WorkingDirectory
    try {
        $output = @(& $npm.Source test 2>&1 | ForEach-Object { $_.ToString() })
        $processExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    [pscustomobject]@{ Available = $true; ExitCode = $processExitCode; Output = $output }
}

try {
    if (-not (Test-Path -LiteralPath $SourcePath -PathType Container)) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Publish-MyCompanyLocal'; SourcePath = $SourcePath; MeshRoot = $MeshRoot
            Message = 'SourcePath does not exist or is not a directory.'; ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }
    if (-not (Test-Path -LiteralPath $MeshRoot -PathType Container)) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Publish-MyCompanyLocal'; SourcePath = $SourcePath; MeshRoot = $MeshRoot
            Message = 'MeshRoot does not exist or is not a directory.'; ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }

    $resolvedSource = (Resolve-Path -LiteralPath $SourcePath).Path
    $resolvedMeshRoot = (Resolve-Path -LiteralPath $MeshRoot).Path
    $dataRoot = Join-Path $resolvedMeshRoot 'meshcentral-data'
    $pluginsRoot = Join-Path $dataRoot 'plugins'
    $runtimeData = Join-Path $dataRoot 'mycompany-data'
    if (-not (Test-Path -LiteralPath $dataRoot -PathType Container) -or
        -not (Test-Path -LiteralPath $pluginsRoot -PathType Container)) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Publish-MyCompanyLocal'; SourcePath = $resolvedSource; MeshRoot = $resolvedMeshRoot
            Message = 'meshcentral-data or its plugins directory does not exist.'; ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }
    $pluginsRoot = (Resolve-Path -LiteralPath $pluginsRoot).Path
    $targetPath = Join-Path $pluginsRoot 'MyCompany'
    if ($resolvedSource.TrimEnd('\', '/') -ieq $targetPath.TrimEnd('\', '/')) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Publish-MyCompanyLocal'; SourcePath = $resolvedSource; TargetPath = $targetPath
            Message = 'SourcePath and deployment target must be different.'; ExitCode = 2
        }
        Write-OperationResult $result $OutputFormat
        exit 2
    }

    $configPath = Join-Path $resolvedSource 'config.json'
    $packagePath = Join-Path $resolvedSource 'package.json'
    $entryPath = Join-Path $resolvedSource 'MyCompany.js'
    foreach ($requiredPath in @($configPath, $packagePath, $entryPath)) {
        if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
            $result = [pscustomobject]@{
                Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
                Operation = 'Publish-MyCompanyLocal'; SourcePath = $resolvedSource
                Message = "Required source file is missing: $requiredPath"; ExitCode = 3
            }
            Write-OperationResult $result $OutputFormat
            exit 3
        }
    }
    $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    $package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
    if ([string]$config.shortName -cne 'MyCompany' -or
        [string]::IsNullOrWhiteSpace([string]$config.version) -or
        [string]$config.version -cne [string]$package.version) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Publish-MyCompanyLocal'; SourcePath = $resolvedSource
            Message = 'MyCompany manifest or version validation failed.'; ExitCode = 2
        }
        Write-OperationResult $result $OutputFormat
        exit 2
    }

    if (-not $SkipTests) {
        $validation = Invoke-NpmValidation -WorkingDirectory $resolvedSource
        $validationOutput = @($validation.Output)
        if (-not $validation.Available) {
            $result = [pscustomobject]@{
                Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
                Operation = 'Publish-MyCompanyLocal'; SourcePath = $resolvedSource
                ValidationOutput = $validationOutput; Message = 'npm.cmd was not found.'; ExitCode = 3
            }
            Write-OperationResult $result $OutputFormat
            exit 3
        }
        if ($validation.ExitCode -ne 0) {
            $result = [pscustomobject]@{
                Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
                Operation = 'Publish-MyCompanyLocal'; SourcePath = $resolvedSource
                ValidationOutput = $validationOutput; Message = 'npm test failed; deployment was not started.'; ExitCode = 4
            }
            Write-OperationResult $result $OutputFormat
            exit 4
        }
    }

    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
    $stagePath = Join-Path $pluginsRoot "MyCompany.__deploy-$timestamp-$suffix"
    $backupRoot = Join-Path $dataRoot 'plugin-backups'
    $backupPath = Join-Path $backupRoot "MyCompany-$timestamp-$suffix"
    if ((Test-Path -LiteralPath $stagePath) -or (Test-Path -LiteralPath $backupPath)) {
        throw 'Generated stage or backup path already exists.'
    }

    if (-not $PSCmdlet.ShouldProcess($targetPath, "Back up and deploy MyCompany $($config.version)")) {
        $result = [pscustomobject]@{
            Success = $false
            Changed = $false
            Skipped = $true
            SkipReason = if ($WhatIfPreference) { 'WhatIf' } else { 'Declined' }
            Operation = 'Publish-MyCompanyLocal'
            SourcePath = $resolvedSource
            MeshRoot = $resolvedMeshRoot
            TargetPath = $targetPath
            PlannedBackupPath = $backupPath
            RuntimeDataPath = $runtimeData
            Version = [string]$config.version
            TestsSkipped = [bool]$SkipTests
            ValidationOutput = $validationOutput
            Message = 'Deployment was not executed.'
            ExitCode = 10
        }
        Write-OperationResult $result $OutputFormat
        exit 10
    }

    $failurePhase = 'Staging'
    New-Item -ItemType Directory -Path $stagePath | Out-Null
    Get-ChildItem -LiteralPath $resolvedSource -Force |
        Where-Object { $excludedTopLevelNames -notcontains $_.Name } |
        Copy-Item -Destination $stagePath -Recurse -Force

    $stageVerification = Test-DeployTree -SourceRoot $resolvedSource -DestinationRoot $stagePath -ExcludedNames $excludedTopLevelNames
    if (-not $stageVerification.Success) {
        throw ('Staging verification failed: ' + ($stageVerification.Mismatches -join '; '))
    }

    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
    if (Test-Path -LiteralPath $targetPath) {
        $failurePhase = 'Backup'
        Move-Item -LiteralPath $targetPath -Destination $backupPath
    }
    else {
        $backupPath = $null
    }

    $failurePhase = 'Activation'
    Move-Item -LiteralPath $stagePath -Destination $targetPath
    $changed = $true

    $failurePhase = 'FinalVerification'
    $finalVerification = Test-DeployTree -SourceRoot $resolvedSource -DestinationRoot $targetPath -ExcludedNames $excludedTopLevelNames
    if (-not $finalVerification.Success) {
        throw ('Final deployment verification failed: ' + ($finalVerification.Mismatches -join '; '))
    }
    $installedConfig = Get-Content -LiteralPath (Join-Path $targetPath 'config.json') -Raw | ConvertFrom-Json
    if ([string]$installedConfig.version -cne [string]$config.version) {
        throw 'Installed version differs from source version.'
    }

    $result = [pscustomobject]@{
        Success = $true
        Changed = $true
        Skipped = $false
        SkipReason = $null
        Operation = 'Publish-MyCompanyLocal'
        SourcePath = $resolvedSource
        MeshRoot = $resolvedMeshRoot
        TargetPath = $targetPath
        BackupPath = $backupPath
        RuntimeDataPath = $runtimeData
        Version = [string]$installedConfig.version
        FilesVerified = $finalVerification.FileCount
        TestsSkipped = [bool]$SkipTests
        ValidationOutput = $validationOutput
        ServiceRestarted = $false
        Message = 'MyCompany deployed and verified successfully.'
        ExitCode = 0
    }
    Write-OperationResult $result $OutputFormat
    exit 0
}
catch {
    $originalError = $_.Exception.Message
    try {
        if ($changed -and $null -ne $targetPath -and (Test-Path -LiteralPath $targetPath)) {
            $failedArtifact = "$targetPath.failed-" + [guid]::NewGuid().ToString('N').Substring(0, 8)
            Move-Item -LiteralPath $targetPath -Destination $failedArtifact -ErrorAction Stop
        }
        elseif ($null -ne $stagePath -and (Test-Path -LiteralPath $stagePath)) {
            $failedArtifact = "$stagePath.failed"
            Move-Item -LiteralPath $stagePath -Destination $failedArtifact -ErrorAction Stop
        }
        if ($null -ne $backupPath -and (Test-Path -LiteralPath $backupPath) -and
            $null -ne $targetPath -and -not (Test-Path -LiteralPath $targetPath)) {
            Move-Item -LiteralPath $backupPath -Destination $targetPath -ErrorAction Stop
            $rollbackPerformed = $true
        }
    }
    catch {
        $originalError = "$originalError Rollback error: $($_.Exception.Message)"
    }

    $exitCode = if ($failurePhase -eq 'FinalVerification') { 5 } else { 4 }
    $result = [pscustomobject]@{
        Success = $false
        Changed = $changed
        Skipped = $false
        SkipReason = $null
        Operation = 'Publish-MyCompanyLocal'
        SourcePath = $resolvedSource
        MeshRoot = $resolvedMeshRoot
        TargetPath = $targetPath
        BackupPath = $backupPath
        FailedArtifact = $failedArtifact
        FailurePhase = $failurePhase
        RollbackPerformed = $rollbackPerformed
        ValidationOutput = $validationOutput
        ServiceRestarted = $false
        Message = $originalError
        ExitCode = $exitCode
    }
    Write-OperationResult $result $OutputFormat
    exit $exitCode
}
