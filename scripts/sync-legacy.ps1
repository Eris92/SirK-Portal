[CmdletBinding()]
param(
    [switch]$UpdateRemote
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is required.'
}

git submodule sync --recursive
if ($LASTEXITCODE -ne 0) { throw 'git submodule sync failed.' }

git submodule update --init --recursive
if ($LASTEXITCODE -ne 0) { throw 'git submodule update failed.' }

if ($UpdateRemote) {
    git submodule update --remote --merge
    if ($LASTEXITCODE -ne 0) { throw 'git submodule remote update failed.' }
}

git submodule status --recursive
