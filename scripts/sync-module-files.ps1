[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Mappings = @(
    @{ Name = 'My Scripts'; Source = Join-Path $RepoRoot 'legacy\myscripts'; Destination = Join-Path $RepoRoot 'modules\scripts\Files' },
    @{ Name = 'My Commands'; Source = Join-Path $RepoRoot 'legacy\commands'; Destination = Join-Path $RepoRoot 'modules\commands\Files' }
)

& git -C $RepoRoot submodule update --init --recursive
if ($LASTEXITCODE -ne 0) {
    throw 'git submodule update failed.'
}

foreach ($Mapping in $Mappings) {
    if (-not (Test-Path -LiteralPath $Mapping.Source)) {
        throw "Source repository is missing: $($Mapping.Source)"
    }

    if (Test-Path -LiteralPath $Mapping.Destination) {
        if (-not $Force) {
            Write-Host "Refreshing $($Mapping.Name): $($Mapping.Destination)"
        }
        Remove-Item -LiteralPath $Mapping.Destination -Recurse -Force
    }

    New-Item -ItemType Directory -Path $Mapping.Destination -Force | Out-Null

    $RoboArgs = @(
        $Mapping.Source,
        $Mapping.Destination,
        '/MIR',
        '/XD', '.git', 'node_modules', 'data', 'logs',
        '/XF', '*.log',
        '/R:2',
        '/W:1',
        '/NFL',
        '/NDL',
        '/NJH',
        '/NJS',
        '/NP'
    )

    & robocopy @RoboArgs | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "robocopy failed for $($Mapping.Name) with exit code $LASTEXITCODE."
    }

    $Marker = @{
        source = $Mapping.Source
        synchronizedAt = (Get-Date).ToUniversalTime().ToString('o')
        generated = $true
    } | ConvertTo-Json

    Set-Content -LiteralPath (Join-Path $Mapping.Destination '.mycompany-source.json') -Value $Marker -Encoding UTF8
    Write-Host "Synchronized $($Mapping.Name) -> $($Mapping.Destination)" -ForegroundColor Green
}

Write-Host 'Module files are ready for local tests.' -ForegroundColor Cyan
