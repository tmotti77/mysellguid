# Simple Image Upload Test
$baseUrl = "http://localhost:3000/api"

Write-Host "=== Image Upload Test ===" -ForegroundColor Cyan

# Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = '{"email":"test@mysellguid.com","password":"password123"}'
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.access_token
Write-Host "   Success! Token obtained" -ForegroundColor Green

# Create test image
Write-Host "`n2. Creating test image..." -ForegroundColor Yellow
$pngBytes = [byte[]]@(0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x06,0x00,0x00,0x00,0x1F,0x15,0xC4,0x89,0x00,0x00,0x00,0x0A,0x49,0x44,0x41,0x54,0x78,0x9C,0x63,0x00,0x01,0x00,0x00,0x05,0x00,0x01,0x0D,0x0A,0x2D,0xB4,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82)
[System.IO.File]::WriteAllBytes("test.png", $pngBytes)
Write-Host "   Success! test.png created" -ForegroundColor Green

# Upload single image
Write-Host "`n3. Uploading single image..." -ForegroundColor Yellow
$headers = @{"Authorization" = "Bearer $token"}
$form = @{file = Get-Item -Path "test.png"}
$result = Invoke-RestMethod -Uri "$baseUrl/upload/image" -Method Post -Headers $headers -Form $form
Write-Host "   Success! Uploaded: $($result.filename)" -ForegroundColor Green
Write-Host "   URL: $($result.url)" -ForegroundColor Gray

# Test file access
Write-Host "`n4. Testing file access..." -ForegroundColor Yellow
$fileResponse = Invoke-WebRequest -Uri "$baseUrl/uploads/$($result.filename)" -Method Get
Write-Host "   Success! File accessible (Status: $($fileResponse.StatusCode))" -ForegroundColor Green

# Cleanup
Remove-Item "test.png" -ErrorAction SilentlyContinue
Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
