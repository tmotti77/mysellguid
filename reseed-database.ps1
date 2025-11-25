# Reseed Database - Fresh Data with Current Dates
Write-Host "`n=== Reseeding MySellGuid Database ===" -ForegroundColor Cyan
Write-Host "This will give you fresh sales with current dates and working images`n" -ForegroundColor Yellow

$baseUrl = "http://localhost:3000/api"

Write-Host "[1/2] Calling seed endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/seed" -Method POST -UseBasicParsing
    Write-Host "✅ Database reseeded successfully!" -ForegroundColor Green
    Write-Host "`nNew Data Created:" -ForegroundColor Cyan
    Write-Host "  - Users: 2" -ForegroundColor Gray
    Write-Host "  - Stores: 5" -ForegroundColor Gray
    Write-Host "  - Sales: 10 (with fresh dates)" -ForegroundColor Gray
    Write-Host "  - All sales start: TODAY" -ForegroundColor Gray
    Write-Host "  - All sales end: 7-30 days from now" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to reseed: $_" -ForegroundColor Red
    exit
}

Write-Host "`n[2/2] Verifying new data..." -ForegroundColor Yellow
try {
    $sales = Invoke-RestMethod -Uri "$baseUrl/sales/nearby?lat=32.1544678&lng=34.9167442&radius=5000" -Method GET
    Write-Host "✅ Found $($sales.count) active sales near your location!" -ForegroundColor Green

    Write-Host "`nSample Sales:" -ForegroundColor Cyan
    $sales[0..2] | ForEach-Object {
        Write-Host "  - $($_.title) ($($_.discountPercentage)% OFF)" -ForegroundColor Gray
        Write-Host "    Store: $($_.store.name)" -ForegroundColor DarkGray
        Write-Host "    Distance: $([math]::Round($_.distance))m" -ForegroundColor DarkGray
        Write-Host "    Has image: $(if($_.images -and $_.images.Count -gt 0){'✅ Yes'}else{'❌ No'})" -ForegroundColor DarkGray
        Write-Host ""
    }
} catch {
    Write-Host "⚠️  Could not verify: $_" -ForegroundColor Yellow
}

Write-Host "`n✅ Database reseeded!" -ForegroundColor Green
Write-Host "Now reload your mobile app to see fresh data`n" -ForegroundColor Cyan
