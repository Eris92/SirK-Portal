#PL Test procesu akceptacji | Bezpieczny skrypt testujący wykonanie z parametrami.
#EN Approval flow test | Harmless script testing execution with parameters.
# VariableRequiredPL: $Message, Wiadomość | Tekst zwracany przez skrypt
# VariableRequiredEN: $Message, Message | Text returned by the script
# VariableSwitchPL: $IncludeEnvironment=false, Dołącz środowisko | Dołącza kontekst wykonania
# VariableSwitchEN: $IncludeEnvironment=false, Include environment | Includes execution context

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
