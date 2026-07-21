# Email Explorer | Open Microsoft Defender Email Explorer.
$result = [ordered]@{
    meshPortal = $true
    title = 'Email Explorer'
    description = 'Investigate email messages in Microsoft Defender.'
    url = 'https://security.microsoft.com/threatexplorer'
    buttonLabel = 'Open Email Explorer'
}
$result | ConvertTo-Json -Compress
