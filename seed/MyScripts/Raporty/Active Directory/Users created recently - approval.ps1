# AD users created recently - approval | Returns a table of Active Directory users created within the selected number of days after approval.
# Approval_1: true
# VariableSelectRequired: $DaysBack=30,Days back|7=Last 7 days|30=Last 30 days|90=Last 90 days|180=Last 180 days

$ErrorActionPreference = 'Stop'
$days = [Math]::Max(1, [int]$DaysBack)
$cutoff = (Get-Date).AddDays(-$days)
$adFilterDate = $cutoff.ToUniversalTime().ToString('yyyyMMddHHmmss.0Z')

Import-Module ActiveDirectory -ErrorAction Stop
$rows = @(Get-ADUser -Filter "whenCreated -ge '$adFilterDate'" -Properties DisplayName, UserPrincipalName, Mail, Enabled, whenCreated |
    Sort-Object whenCreated -Descending |
    ForEach-Object {
        [ordered]@{
            DisplayName = [string]$_.DisplayName
            Login = [string]$_.SamAccountName
            UserPrincipalName = [string]$_.UserPrincipalName
            Email = [string]$_.Mail
            Enabled = [bool]$_.Enabled
            Created = ([datetime]$_.whenCreated).ToString('yyyy-MM-dd HH:mm:ss')
        }
    })

[ordered]@{
    meshTable = $true
    title = "AD users created within the last $days days"
    columns = @('DisplayName', 'Login', 'UserPrincipalName', 'Email', 'Enabled', 'Created')
    rows = @($rows)
} | ConvertTo-Json -Depth 4 -Compress
