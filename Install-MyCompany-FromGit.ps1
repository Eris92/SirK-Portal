#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [string]$Repository = 'https://github.com/Eris92/MeshCentral-MyCompany.git',
    [string]$Branch = 'main',
    [string]$PortalRepository = 'https://github.com/Eris92/SirK-Portal.git',
    [string]$PortalBranch = 'main',
    [string]$MeshRoot = 'C:\Program Files\Open Source\MeshCentral',
    [string]$ServiceName = 'MeshCentral',
    [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
$DataRoot = Join-Path $MeshRoot 'meshcentral-data'
$PluginsRoot = Join-Path $DataRoot 'plugins'
$Target = Join-Path $PluginsRoot 'MyCompany'
$RuntimeData = Join-Path $DataRoot 'mycompany-data'
$StageRoot = Join-Path $env:TEMP ('MyCompany-Git-' + [guid]::NewGuid().ToString('N'))
$Stage = Join-Path $StageRoot 'MyCompany'
$PortalStage = Join-Path $StageRoot 'SirK-Portal'
$BackupRoot = Join-Path $DataRoot 'plugin-backups'
$Backup = Join-Path $BackupRoot ('MyCompany-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$Git = (Get-Command git.exe -ErrorAction Stop).Source
$Node = (Get-Command node.exe -ErrorAction Stop).Source
$Npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$Icacls = (Get-Command icacls.exe -ErrorAction Stop).Source
$Takeown = (Get-Command takeown.exe -ErrorAction Stop).Source

$PortalFiles = @(
    'sirk-portal.css',
    'sirk-preflight-0.3.13.js',
    'sirk-portal.js',
    'sirk-remote-modules-0.3.13.js',
    'sirk-portal-patch-0.2.8.js',
    'sirk-ui-icons-0.3.4.js',
    'sirk-layout-0.3.1.js',
    'sirk-management-workspace-0.3.6.js',
    'sirk-ui-runtime-0.3.15.js',
    'sirk-device-layout-0.3.13.js',
    'sirk-controls-0.3.17.js'
)

function Invoke-Checked {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory = ''
    )

    $start = @{
        FilePath = $FilePath
        ArgumentList = $Arguments
        Wait = $true
        PassThru = $true
        NoNewWindow = $true
    }

    if ($WorkingDirectory) {
        $start.WorkingDirectory = $WorkingDirectory
    }

    $process = Start-Process @start
    if ($process.ExitCode -ne 0) {
        throw ('Command failed ({0}): {1} {2}' -f $process.ExitCode, $FilePath, ($Arguments -join ' '))
    }
}

function Repair-RuntimeDataPermissions {
    param(
        [string]$Path,
        [string]$Service
    )

    New-Item $Path -ItemType Directory -Force | Out-Null

    Get-ChildItem $Path -Force -Recurse -ErrorAction SilentlyContinue |
        ForEach-Object {
            try {
                $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
            }
            catch {}
        }

    $grants = @(
        '*S-1-5-18:(OI)(CI)F',
        '*S-1-5-32-544:(OI)(CI)F'
    )

    $serviceInfo = Get-CimInstance Win32_Service -Filter ("Name='{0}'" -f $Service) -ErrorAction SilentlyContinue
    $serviceAccount = [string]$serviceInfo.StartName

    if (
        $serviceAccount -and
        $serviceAccount -notin @('LocalSystem', 'NT AUTHORITY\SYSTEM')
    ) {
        $grants += ('{0}:(OI)(CI)M' -f $serviceAccount)
    }

    $arguments = @($Path, '/inheritance:e', '/T', '/C', '/Q')
    foreach ($grant in $grants) {
        $arguments += @('/grant:r', $grant)
    }

    & $Icacls @arguments | Out-Null

    if ($LASTEXITCODE -ne 0) {
        & $Takeown /F $Path /R /D Y | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw ('Unable to take ownership of: {0}' -f $Path)
        }

        & $Icacls @arguments | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw ('Unable to repair permissions on: {0}' -f $Path)
        }
    }

    Get-ChildItem $Path -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -match '\.(tmp|bak)$' -or
            $_.Name -match '^settings\.json\..*\.tmp$'
        } |
        Remove-Item -Force -ErrorAction SilentlyContinue
}

function Add-SirKPortalVendor {
    param(
        [string]$Source,
        [string]$Destination
    )

    $PortalConfigPath = Join-Path $Source 'config.json'
    if (-not (Test-Path $PortalConfigPath -PathType Leaf)) {
        throw 'SirK Portal repository does not contain config.json.'
    }

    $PortalConfig = Get-Content $PortalConfigPath -Raw | ConvertFrom-Json
    if ([string]$PortalConfig.shortName -cne 'SirKPortal') {
        throw ('Invalid SirK Portal shortName: {0}' -f $PortalConfig.shortName)
    }
    if ([version]$PortalConfig.version -lt [version]'0.3.17') {
        throw ('SirK Portal 0.3.17 or newer is required. Found: {0}' -f $PortalConfig.version)
    }

    New-Item $Destination -ItemType Directory -Force | Out-Null
    foreach ($FileName in $PortalFiles) {
        $SourcePath = Join-Path $Source $FileName
        if (-not (Test-Path $SourcePath -PathType Leaf)) {
            throw ('SirK Portal vendor file is missing: {0}' -f $FileName)
        }
        Copy-Item $SourcePath (Join-Path $Destination $FileName) -Force
    }

    $Commit = (& $Git -C $Source rev-parse HEAD).Trim()
    [ordered]@{
        version = [string]$PortalConfig.version
        commit = $Commit
        repository = $PortalRepository
        branch = $PortalBranch
        files = $PortalFiles
    } | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $Destination 'vendor-manifest.json') -Encoding UTF8

    return [string]$PortalConfig.version
}

try {
    New-Item $StageRoot -ItemType Directory -Force | Out-Null

    Invoke-Checked $Git @(
        'clone',
        '--depth', '1',
        '--single-branch',
        '--branch', $Branch,
        $Repository,
        $Stage
    )

    Invoke-Checked $Git @(
        'clone',
        '--depth', '1',
        '--single-branch',
        '--branch', $PortalBranch,
        $PortalRepository,
        $PortalStage
    )

    $ConfigPath = Join-Path $Stage 'config.json'
    $Entry = Join-Path $Stage 'MyCompany.js'

    if (-not (Test-Path $ConfigPath -PathType Leaf)) {
        throw 'Repository does not contain config.json.'
    }
    if (-not (Test-Path $Entry -PathType Leaf)) {
        throw 'Repository does not contain MyCompany.js.'
    }

    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    if ([string]$config.shortName -cne 'MyCompany') {
        throw ('Invalid shortName: {0}' -f $config.shortName)
    }

    $entrypoints = @(
        Get-ChildItem $Stage -File |
            Where-Object {
                $_.Name.ToLowerInvariant() -eq 'mycompany.js'
            }
    )

    if (
        $entrypoints.Count -ne 1 -or
        $entrypoints[0].Name -cne 'MyCompany.js'
    ) {
        throw 'Entrypoint collision detected.'
    }

    $VendorDestination = Join-Path $Stage 'public\vendor\sirk-portal'
    $PortalVersion = Add-SirKPortalVendor -Source $PortalStage -Destination $VendorDestination

    Invoke-Checked $Node @('--check', $Entry)
    Invoke-Checked $Node @('--check', (Join-Path $Stage 'public\portal.js'))

    if (-not $SkipTests) {
        Invoke-Checked $Npm @('test') $Stage
    }

    $service = Get-Service $ServiceName -ErrorAction Stop
    if ($service.Status -ne 'Stopped') {
        Stop-Service $ServiceName -Force -ErrorAction Stop
    }

    Repair-RuntimeDataPermissions -Path $RuntimeData -Service $ServiceName

    New-Item $PluginsRoot -ItemType Directory -Force | Out-Null
    New-Item $BackupRoot -ItemType Directory -Force | Out-Null

    if (Test-Path $Target) {
        Copy-Item $Target $Backup -Recurse -Force
    }

    Remove-Item $Target -Recurse -Force -ErrorAction SilentlyContinue
    Move-Item $Stage $Target

    Start-Service $ServiceName -ErrorAction Stop
    Start-Sleep -Seconds 6

    if ((Get-Service $ServiceName).Status -ne 'Running') {
        throw 'MeshCentral service did not start.'
    }

    Write-Host ('Installed MyCompany {0} from {1}@{2}' -f $config.version, $Repository, $Branch) -ForegroundColor Green
    Write-Host ('Vendored SirK Portal {0} from {1}@{2}' -f $PortalVersion, $PortalRepository, $PortalBranch) -ForegroundColor Green
    Write-Host ('Path: {0}' -f $Target)
    Write-Host ('Runtime data ACL repaired: {0}' -f $RuntimeData)
    Write-Host 'The target is an exact MyCompany checkout with a pinned SirK Portal vendor snapshot.'
}
catch {
    try {
        if ((Get-Service $ServiceName -ErrorAction SilentlyContinue).Status -ne 'Running') {
            Start-Service $ServiceName -ErrorAction SilentlyContinue
        }
    }
    catch {}

    throw
}
finally {
    Remove-Item $StageRoot -Recurse -Force -ErrorAction SilentlyContinue
}
