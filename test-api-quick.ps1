# MySellGuid API Test Script
Write-Host "========== TESTING MYSELLGUID PRODUCTION API ==========" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1. Health Check:" -ForegroundColor Yellow
try {
    $health = (Invoke-WebRequest -Uri "https://mysellguid-api.onrender.com/api/health" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Database: $($health.database)"
} catch {
    Write-Host "   FAILED: $_" -ForegroundColor Red
}

# 2. Login
Write-Host "`n2. Login Test:" -ForegroundColor Yellow
try {
    $loginBody = '{"email":"test@mysellguid.com","password":"password123"}'
    $login = (Invoke-WebRequest -Uri "https://mysellguid-api.onrender.com/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing).Content | ConvertFrom-Json
    $token = $login.accessToken
    Write-Host "   Login: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $_" -ForegroundColor Red
}

# 3. Protected Endpoint
Write-Host "`n3. Protected Endpoint (/users/me):" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $token" }
    $user = (Invoke-WebRequest -Uri "https://mysellguid-api.onrender.com/api/users/me" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "   User: $($user.email)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $_" -ForegroundColor Red
}

# 4. Nearby Sales
Write-Host "`n4. Nearby Sales (Ramat Gan, 5km):" -ForegroundColor Yellow
try {
    $sales = (Invoke-WebRequest -Uri "https://mysellguid-api.onrender.com/api/sales/nearby?lat=32.1544678&lng=34.9167442&radius=5000" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "   Found: $($sales.Count) sales" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $_" -ForegroundColor Red
}

# 5. Nearby Stores
Write-Host "`n5. Nearby Stores:" -ForegroundColor Yellow
try {
    $stores = (Invoke-WebRequest -Uri "https://mysellguid-api.onrender.com/api/stores/nearby?lat=32.1544678&lng=34.9167442&radius=5000" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "   Found: $($stores.Count) stores" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $_" -ForegroundColor Red
}

# 6. Bookmarks (authenticated)
Write-Host "`n6. Bookmarks Endpoint:" -ForegroundColor Yellow
try {
    $bookmarks = (Invoke-WebRequest -Uri "https://mysellguid-api.onrender.com/api/bookmarks?lat=32.1544678&lng=34.9167442" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "   Bookmarks: $($bookmarks.Count)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED or empty" -ForegroundColor Yellow
}

Write-Host "`n========== TEST COMPLETE ==========" -ForegroundColor Cyan
