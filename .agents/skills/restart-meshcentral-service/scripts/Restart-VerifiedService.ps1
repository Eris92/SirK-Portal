<#
.SYNOPSIS
Restarts a named Windows service and verifies that it reaches Running.

.EXAMPLE
.\Restart-VerifiedService.ps1 -ServiceName 'MeshCentral' -TimeoutSeconds 120 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$ServiceName,

    [ValidateRange(5, 600)]
    [int]$TimeoutSeconds = 120,

    [ValidateRange(0, 120)]
    [int]$StartupDelaySeconds = 0,

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
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($null -eq $service) {
        $result = [pscustomobject]@{
            Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
            Operation = 'Restart-VerifiedService'; ServiceName = $ServiceName
            Message = 'The Windows service does not exist.'; ExitCode = 3
        }
        Write-OperationResult $result $OutputFormat
        exit 3
    }

    $beforeStatus = $service.Status.ToString()
    if (-not $PSCmdlet.ShouldProcess($ServiceName, 'Restart and verify Windows service')) {
        $result = [pscustomobject]@{
            Success = $false
            Changed = $false
            Skipped = $true
            SkipReason = if ($WhatIfPreference) { 'WhatIf' } else { 'Declined' }
            Operation = 'Restart-VerifiedService'
            ServiceName = $ServiceName
            BeforeStatus = $beforeStatus
            AfterStatus = $beforeStatus
            Message = 'Service restart was not executed.'
            ExitCode = 10
        }
        Write-OperationResult $result $OutputFormat
        exit 10
    }

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Restart-Service -Name $ServiceName -Force -ErrorAction Stop
    if ($StartupDelaySeconds -gt 0) {
        Start-Sleep -Seconds $StartupDelaySeconds
    }

    do {
        $service.Refresh()
        if ($service.Status -eq [System.ServiceProcess.ServiceControllerStatus]::Running) {
            break
        }
        Start-Sleep -Milliseconds 500
    } while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds)
    $stopwatch.Stop()
    $service.Refresh()

    $verified = $service.Status -eq [System.ServiceProcess.ServiceControllerStatus]::Running
    $exitCode = if ($verified) { 0 } else { 5 }
    $result = [pscustomobject]@{
        Success = $verified
        Changed = $true
        Skipped = $false
        SkipReason = $null
        Operation = 'Restart-VerifiedService'
        ServiceName = $ServiceName
        DisplayName = $service.DisplayName
        BeforeStatus = $beforeStatus
        AfterStatus = $service.Status.ToString()
        ElapsedSeconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
        Message = if ($verified) { 'Service restarted and verified successfully.' } else { 'Service restart did not reach Running before timeout.' }
        ExitCode = $exitCode
    }
    Write-OperationResult $result $OutputFormat
    exit $exitCode
}
catch {
    $result = [pscustomobject]@{
        Success = $false; Changed = $false; Skipped = $false; SkipReason = $null
        Operation = 'Restart-VerifiedService'; ServiceName = $ServiceName
        Message = $_.Exception.Message; ExitCode = 4
    }
    Write-OperationResult $result $OutputFormat
    exit 4
}
