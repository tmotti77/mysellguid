# MySellGuid System Verification Script
# Run this to check if everything is working

Write-Host "🔍 MySellGuid System Verification" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check Docker Containers
Write-Host "✅ Test 1: Docker Containers" -ForegroundColor Yellow
try {
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String -Pattern "mysellguid"
    if ($containers) {
        Write-Host "✓ Docker containers running:" -ForegroundColor Green
        docker ps --filter "name=mysellguid" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    } else {
        Write-Host "✗ No MySellGuid containers running!" -ForegroundColor Red
        Write-Host "  Run: docker-compose up -d" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Docker not available or not running!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check if backend is responding
Write-Host "✅ Test 2: Backend API" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is running on http://localhost:3000/api" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend is NOT running!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Start backend with: cd backend && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 3: Check Swagger Documentation
Write-Host "✅ Test 3: Swagger API Docs" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/docs" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Swagger docs available at http://localhost:3000/api/docs" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Swagger docs not accessible" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Test Authentication
Write-Host "✅ Test 4: Authentication" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "test@mysellguid.com"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction Stop

    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.accessToken) {
        Write-Host "✓ Authentication working!" -ForegroundColor Green
        Write-Host "  User: $($loginData.user.email)" -ForegroundColor Gray
        $token = $loginData.accessToken
    } else {
        Write-Host "⚠ Login succeeded but no token received" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Authentication failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure database is seeded: POST http://localhost:3000/api/seed" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Test Protected Endpoint
if ($token) {
    Write-Host "✅ Test 5: Protected Endpoint (/users/me)" -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $userResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/users/me" `
            -Method GET `
            -Headers $headers `
            -TimeoutSec 10 `
            -ErrorAction Stop

        $userData = $userResponse.Content | ConvertFrom-Json
        Write-Host "✓ Protected endpoint working!" -ForegroundColor Green
        Write-Host "  User: $($userData.firstName) $($userData.lastName)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Protected endpoint failed!" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⊘ Test 5: Skipped (no auth token)" -ForegroundColor Gray
}

Write-Host ""

# Test 6: Test Geospatial Search
Write-Host "✅ Test 6: Geospatial Search (Core Feature)" -ForegroundColor Yellow
try {
    $geoResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/sales/nearby?lat=32.1544678&lng=34.9167442&radius=5000" `
        -Method GET `
        -TimeoutSec 10 `
        -ErrorAction Stop

    $salesData = $geoResponse.Content | ConvertFrom-Json
    
    if ($salesData) {
        Write-Host "✓ Geospatial search working!" -ForegroundColor Green
        Write-Host "  Found $($salesData.Count) sales within 5km" -ForegroundColor Gray
        
        if ($salesData.Count -gt 0) {
            Write-Host "  First sale: $($salesData[0].title) - $($salesData[0].distance)m away" -ForegroundColor Gray
            Write-Host "  Store: $($salesData[0].store.name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠ No sales found (database might be empty)" -ForegroundColor Yellow
        Write-Host "  Seed database: POST http://localhost:3000/api/seed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Geospatial search failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 7: Check Database Seeding
Write-Host "✅ Test 7: Database Seeding" -ForegroundColor Yellow
try {
    $seedResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/seed" `
        -Method POST `
        -TimeoutSec 15 `
        -ErrorAction Stop

    $seedData = $seedResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ Database seeded successfully!" -ForegroundColor Green
    Write-Host "  Users: $($seedData.users)" -ForegroundColor Gray
    Write-Host "  Stores: $($seedData.stores)" -ForegroundColor Gray
    Write-Host "  Sales: $($seedData.sales)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "✓ Database already seeded (users exist)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Seeding failed (might be already seeded)" -ForegroundColor Yellow
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 8: Check Stores
Write-Host "✅ Test 8: Store Listings" -ForegroundColor Yellow
try {
    $storesResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/stores" `
        -Method GET `
        -TimeoutSec 10 `
        -ErrorAction Stop

    $storesData = $storesResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ Store listings working!" -ForegroundColor Green
    Write-Host "  Total stores: $($storesData.Count)" -ForegroundColor Gray
    
    if ($storesData.Count -gt 0) {
        Write-Host "  Sample stores:" -ForegroundColor Gray
        $storesData | Select-Object -First 3 | ForEach-Object {
            Write-Host "    - $($_.name) ($($_.category))" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ Store listings failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📊 VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open Swagger docs: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "  2. Start mobile app: cd mobile && npx expo start" -ForegroundColor White
Write-Host "  3. Test on device with Expo Go" -ForegroundColor White
Write-Host ""
Write-Host "Mobile app API URL should be: http://YOUR_PC_IP:3000/api" -ForegroundColor Yellow
Write-Host "Your PC IP: $(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like '192.168.*'} | Select-Object -First 1 -ExpandProperty IPAddress)" -ForegroundColor White
Write-Host ""
