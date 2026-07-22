<#
.SYNOPSIS
Reads a bounded tail of a local log file without modifying it.

.EXAMPLE
.\Get-LogTail.ps1 -Path 'C:\MeshCentral\meshcentral-data\mesherrors.txt' -Lines 200 -ErrorOnly
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$Path,

    [ValidateRange(1, 5000)]
    [int]$Lines = 200,

    [ValidateSet('utf8', 'unicode', 'ascii', 'default', 'oem', 'bigendianunicode', 'utf7', 'utf32')]
    [string]$Encoding = 'utf8',

    [string]$Match,

    [switch]$ErrorOnly,

    [switch]$Follow,

    [ValidateRange(1, 300)]
    [int]$FollowSeconds = 10,

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
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Get-LogTail'; Path = $Path
            Message = 'The log file does not exist.'; ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }

    $resolvedPath = (Resolve-Path -LiteralPath $Path).Path
    $matchRegex = $null
    if (-not [string]::IsNullOrWhiteSpace($Match)) {
        try {
            $matchRegex = [regex]::new($Match, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        }
        catch {
            $result = [pscustomobject]@{
                Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
                Operation = 'Get-LogTail'; Path = $resolvedPath
                Message = 'Match is not a valid regular expression.'; ExitCode = 2
            }
            Write-OperationResult $result $OutputFormat
            exit 2
        }
    }

    if ($Follow) {
        $job = Start-Job -ScriptBlock {
            param($LogPath, $TailLines, $LogEncoding)
            Get-Content -LiteralPath $LogPath -Tail $TailLines -Wait -Encoding $LogEncoding
        } -ArgumentList $resolvedPath, $Lines, $Encoding
        try {
            Wait-Job -Job $job -Timeout $FollowSeconds | Out-Null
            if ($job.State -eq 'Running') {
                Stop-Job -Job $job
            }
            $rawLines = @(Receive-Job -Job $job | ForEach-Object { [string]$_ })
        }
        finally {
            Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
        }
    }
    else {
        $rawLines = @(Get-Content -LiteralPath $resolvedPath -Tail $Lines -Encoding $Encoding | ForEach-Object { [string]$_ })
    }

    $filtered = @($rawLines)
    if ($null -ne $matchRegex) {
        $filtered = @($filtered | Where-Object { $matchRegex.IsMatch([string]$_) })
    }
    if ($ErrorOnly) {
        $errorRegex = [regex]::new('error|exception|fatal|failed|failure|stack', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        $filtered = @($filtered | Where-Object { $errorRegex.IsMatch([string]$_) })
    }

    $file = Get-Item -LiteralPath $resolvedPath
    $result = [pscustomobject]@{
        Success = $true
        Changed = $false
        Skipped = $false
        SkipReason = $null
        Operation = 'Get-LogTail'
        ResolvedPath = $resolvedPath
        LinesRequested = $Lines
        LinesRead = $rawLines.Count
        LinesReturned = $filtered.Count
        Follow = [bool]$Follow
        FollowSeconds = if ($Follow) { $FollowSeconds } else { 0 }
        Match = $Match
        ErrorOnly = [bool]$ErrorOnly
        Length = $file.Length
        LastWriteTimeUtc = $file.LastWriteTimeUtc.ToString('o')
        Content = $filtered
        Message = 'Log tail read successfully.'
        ExitCode = 0
    }
    Write-OperationResult $result $OutputFormat
    exit 0
}
catch {
    $result = [pscustomobject]@{
        Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
        Operation = 'Get-LogTail'; Path = $Path
        Message = $_.Exception.Message; ExitCode = 1
    }
    Write-OperationResult $result $OutputFormat
    exit 1
}
