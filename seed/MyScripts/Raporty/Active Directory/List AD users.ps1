# List AD users | Retrieves up to 100 Active Directory users and returns structured JSON suitable for a web table.
# Approval: false
# VariableSelectRequired: $Limit=100,20=20 users|50=50 users|100=100 users
# Variable: $Search, Optional name or login filter

Import-Module ActiveDirectory -ErrorAction Stop

$safeLimit = [Math]::Min(100, [Math]::Max(1, [int]$Limit))
$searchText = [string]$Search
$filter = '*'
if (-not [string]::IsNullOrWhiteSpace($searchText)) {
    $escaped = $searchText.Replace("'", "''")
    $filter = "Name -like '*$escaped*' -or SamAccountName -like '*$escaped*' -or UserPrincipalName -like '*$escaped*'"
}

$rows = Get-ADUser -Filter $filter -Properties DisplayName, Mail, Enabled |
    Sort-Object DisplayName, SamAccountName |
    Select-Object -First $safeLimit |
    ForEach-Object {
        [ordered]@{
            DisplayName = [string]$_.DisplayName
            Login = [string]$_.SamAccountName
            UserPrincipalName = [string]$_.UserPrincipalName
            Email = [string]$_.Mail
            Enabled = [bool]$_.Enabled
        }
    }

[ordered]@{
    meshTable = $true
    title = 'Active Directory users'
    columns = @('DisplayName', 'Login', 'UserPrincipalName', 'Email', 'Enabled')
    rows = @($rows)
} | ConvertTo-Json -Depth 4 -Compress
