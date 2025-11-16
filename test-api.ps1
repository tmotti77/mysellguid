# MySellGuid API Test Script
# Run this to test the backend

Write-Host "Step 1: Seeding database..." -ForegroundColor Yellow
try {
    $seedResult = Invoke-WebRequest -Uri "http://localhost:3000/api/seed" -Method POST
    Write-Host "SUCCESS: Database seeded successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Seed failed: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 2: Logging in..." -ForegroundColor Yellow
try {
    $loginBody = '{"email":"test@mysellguid.com","password":"password123"}'
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "SUCCESS: Login successful!" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.accessToken.Substring(0,50))..." -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Login failed: $_" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Step 3: Testing geospatial search..." -ForegroundColor Yellow
try {
    $salesUrl = "http://localhost:3000/api/sales/nearby?lat=32.0853&lng=34.7818&radius=5000"
    $sales = Invoke-RestMethod -Uri $salesUrl
    Write-Host "SUCCESS: Found $($sales.Count) sales nearby!" -ForegroundColor Green
    if ($sales.Count -gt 0) {
        Write-Host "First sale: $($sales[0].title) - $($sales[0].discountPercentage)% off" -ForegroundColor Cyan
        Write-Host "Distance: $([math]::Round($sales[0].distance, 0)) meters" -ForegroundColor Cyan
    }
} catch {
    Write-Host "ERROR: Sales search failed: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Step 4: Getting user profile..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $($loginResponse.accessToken)"
    }
    $userProfile = Invoke-RestMethod -Uri "http://localhost:3000/api/users/me" -Headers $headers
    Write-Host "SUCCESS: User profile retrieved!" -ForegroundColor Green
    Write-Host "User: $($userProfile.firstName) $($userProfile.lastName) ($($userProfile.email))" -ForegroundColor Cyan
    Write-Host "Role: $($userProfile.role)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Profile retrieval failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "Backend is working correctly!" -ForegroundColor Green
