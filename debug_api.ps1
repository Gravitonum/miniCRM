$base = "https://minicrm.apps.gravibase.ru"
$project = "minicrm"
$user = "user1"

Write-Host "--- Step 1: Login ---"
$loginUrl = "$base/auth/projects/$project/token"
$loginBody = @{
    login      = $user
    password   = "12345678"
    grant_type = "password"
}
try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/x-www-form-urlencoded"
    $token = $loginResponse.access_token
    Write-Host "Login Successful. Token obtained."
}
catch {
    Write-Host "Login Failed: $_"
    return
}

$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`n--- Diagnostic Probes (Path Variations) ---"

$probes = @(
    @{ Name = "Security API Profile"; Url = "$base/security/api/projects/$project/users/$user/profile" },
    @{ Name = "Security API User List"; Url = "$base/security/api/projects/$project/users" },
    @{ Name = "Security No-Project Profile"; Url = "$base/security/users/$user/profile" },
    @{ Name = "Auth Project Detail"; Url = "$base/auth/projects/$project" },
    @{ Name = "IAM User Profile (Alt Name)"; Url = "$base/iam/projects/$project/users/$user/profile" }
)

foreach ($p in $probes) {
    Write-Host "`nTesting: $($p.Name)"
    Write-Host "URL: $($p.Url)"
    try {
        $resp = Invoke-WebRequest -Uri $p.Url -Method Get -Headers $headers -ErrorAction SilentlyContinue
        Write-Host "Status: $($resp.StatusCode) $($resp.StatusDescription)"
        if ($resp.Content.Length -gt 0) {
            # Try to show some content
            Write-Host "Content Length: $($resp.Content.Length)"
        }
    }
    catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)"
    }
}
