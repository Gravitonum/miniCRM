$ErrorActionPreference = "Continue" # Don't stop on 404 to try other endpoints

$ProjectCode = "minicrm"
$Username = "user1"
$Password = "12345678"
$BaseUrl = "https://minicrm.apps.gravibase.ru"

Write-Host ">>> Starting Diagnostic Authentication Test" -ForegroundColor Cyan

# 1. Login
$TokenUrl = "$BaseUrl/auth/projects/$ProjectCode/token"
Write-Host ">>> Logging in at: $TokenUrl"
$LoginBody = @{ login = $Username; password = $Password }

try {
    $TokenResponse = Invoke-RestMethod -Method Post -Uri $TokenUrl -ContentType "application/x-www-form-urlencoded" -Body $LoginBody
    $AccessToken = $TokenResponse.access_token
    Write-Host ">>> Login SUCCESS. Token obtained." -ForegroundColor Green
}
catch {
    Write-Host "!!! Login FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$Headers = @{ Authorization = "Bearer $AccessToken" }

# 2. Probe Endpoints
$Endpoints = @(
    @{ Name = "Security Profile"; Url = "$BaseUrl/security/projects/$ProjectCode/users/$Username/profile" },
    @{ Name = "Security User Detail"; Url = "$BaseUrl/security/projects/$ProjectCode/users/$Username" },
    @{ Name = "Auth Me"; Url = "$BaseUrl/auth/me" },
    @{ Name = "Auth User Profile"; Url = "$BaseUrl/auth/projects/$ProjectCode/users/$Username/profile" },
    @{ Name = "Project Users List"; Url = "$BaseUrl/security/projects/$ProjectCode/users" }
)

Write-Host "`n>>> Probing Endpoints..." -ForegroundColor Yellow

foreach ($EP in $Endpoints) {
    Write-Host "--- Testing: $($EP.Name) ---"
    try {
        $Response = Invoke-WebRequest -Method Get -Uri $EP.Url -Headers $Headers -ErrorAction SilentlyContinue
        Write-Host "Status: $($Response.StatusCode) OK" -ForegroundColor Green
        if ($Response.Content.Length -gt 0) {
            $data = $Response.Content | ConvertFrom-Json
            Write-Host "Data: $(($data | ConvertTo-Json -Compress).Substring(0, [Math]::Min(100, $data.ToString().Length)))"
        }
    }
    catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        # If it's a 404, we just move on
    }
}

Write-Host "`n>>> Diagnostic Complete." -ForegroundColor Cyan
