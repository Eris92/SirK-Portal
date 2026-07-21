# Approval flow test v3 | Harmless script confirming that execution starts only after approval.
# VariableRequired: $Message, Message
# VariableSwitch: $IncludeEnvironment=false, Include execution context
# Approval_3: true
#SaveSecret $test

$result = [ordered]@{
    Message = [string]$Message
    ApprovedExecution = $true
    ExecutedAt = (Get-Date).ToString('o')
}

if ([System.Convert]::ToBoolean($IncludeEnvironment)) {
    $result.RequestId = [string]$env:MYSCRIPTS_REQUEST_ID
    $result.Requester = [string]$env:MYSCRIPTS_REQUESTER
    $result.ComputerName = [string]$env:COMPUTERNAME
}

$result | ConvertTo-Json -Compress
