# Approval flow test v1 | Harmless script confirming that execution starts only after approval.
# VariableRequired: $Message, Message
# VariableSwitch: $IncludeEnvironment=false, Include execution context
# Approval_1: true
# Approval_2: true
# Approval_3: true

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
