# Test if password is excluded from /users/me endpoint

Write-Host "Testing password exclusion..." -ForegroundColor Yellow

# Login
$loginBody = @{
    email = "test@mysellguid.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.accessToken

Write-Host "[OK] Login successful" -ForegroundColor Green

# Get user profile
$headers = @{
    "Authorization" = "Bearer $token"
}

$userResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/users/me" `
    -Method GET `
    -Headers $headers

$userData = $userResponse.Content | ConvertFrom-Json

# Check if password field exists
$hasPassword = $null -ne $userData.password

if ($hasPassword) {
    Write-Host "[FAIL] Password field is present in response!" -ForegroundColor Red
    Write-Host "  Password value: $($userData.password)" -ForegroundColor Red
} else {
    Write-Host "[PASS] Password field is NOT in response!" -ForegroundColor Green
}

Write-Host "`nUser data fields:" -ForegroundColor Cyan
$userData.PSObject.Properties.Name | ForEach-Object {
    Write-Host "  - $_" -ForegroundColor Gray
}
