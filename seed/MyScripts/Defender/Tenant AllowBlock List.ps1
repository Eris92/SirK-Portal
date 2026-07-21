# Tenant Allow/Block List | Open the Microsoft Defender Tenant Allow/Block List.
$result = [ordered]@{
    meshPortal = $true
    title = 'Tenant Allow/Block List'
    description = 'Manage trusted and blocked domains, URLs and senders.'
    url = 'https://security.microsoft.com/tenantAllowBlockList'
    buttonLabel = 'Open Tenant Allow/Block List'
}
$result | ConvertTo-Json -Compress
