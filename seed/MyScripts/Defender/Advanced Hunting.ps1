# Advanced Hunting | Open Microsoft Defender XDR Advanced Hunting.
$result = [ordered]@{
    meshPortal = $true
    title = 'Advanced Hunting'
    description = 'Run KQL queries in Microsoft Defender XDR.'
    url = 'https://security.microsoft.com/hunting'
    buttonLabel = 'Open Advanced Hunting'
}
$result | ConvertTo-Json -Compress
