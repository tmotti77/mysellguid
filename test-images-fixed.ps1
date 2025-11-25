# Test that images are properly formatted
$sales = Invoke-RestMethod -Uri 'http://localhost:3000/api/sales/nearby?lat=32.1544678&lng=34.9167442&radius=5000' -Method GET

Write-Host "Total sales found: $($sales.Count)" -ForegroundColor Cyan
Write-Host "`nFirst sale:" -ForegroundColor Yellow
Write-Host "  Title: $($sales[0].title)"
Write-Host "  Images type: $($sales[0].images.GetType().Name)"
Write-Host "  Images count: $($sales[0].images.Count)"
Write-Host "  First image: $($sales[0].images[0])"

if ($sales[0].images[0] -like "{*") {
    Write-Host "`n❌ IMAGES STILL BROKEN - Has JSON braces" -ForegroundColor Red
} else {
    Write-Host "`n✅ IMAGES FIXED - Plain URLs!" -ForegroundColor Green
}
