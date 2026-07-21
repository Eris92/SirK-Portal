# Approval and secret test | verifies Approval_2 and SaveSecretRequired
# Approval_2: true
# SaveSecretRequired: $ApiToken, API token

Write-Output ("Approval_2 and SaveSecretRequired test. TokenConfigured=" + (-not [string]::IsNullOrWhiteSpace($ApiToken)))
