# Test Image Upload Endpoints
# This script tests the image upload functionality

$baseUrl = "http://localhost:3000/api"

Write-Host "`n=== MySellGuid Image Upload Test ===" -ForegroundColor Cyan
Write-Host "Testing upload endpoints...`n" -ForegroundColor Cyan

# Step 1: Login to get JWT token
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@mysellguid.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create a test image file
Write-Host "`nStep 2: Creating test image..." -ForegroundColor Yellow
$testImagePath = "test-image.png"

# Create a simple 1x1 PNG (smallest valid PNG)
$pngBytes = [byte[]]@(
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
)
[System.IO.File]::WriteAllBytes($testImagePath, $pngBytes)
Write-Host "✓ Test image created: $testImagePath" -ForegroundColor Green

# Step 3: Test single image upload
Write-Host "`nStep 3: Testing single image upload..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    $form = @{
        file = Get-Item -Path $testImagePath
    }

    $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/upload/image" -Method Post -Headers $headers -Form $form

    Write-Host "✓ Single image upload successful" -ForegroundColor Green
    Write-Host "  Filename: $($uploadResponse.filename)" -ForegroundColor Gray
    Write-Host "  Original: $($uploadResponse.originalName)" -ForegroundColor Gray
    Write-Host "  Size: $($uploadResponse.size) bytes" -ForegroundColor Gray
    Write-Host "  URL: $($uploadResponse.url)" -ForegroundColor Gray

    $uploadedFilename = $uploadResponse.filename
} catch {
    Write-Host "✗ Single upload failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test multiple image upload
Write-Host "`nStep 4: Testing multiple image upload..." -ForegroundColor Yellow
try {
    # Create second test image
    $testImagePath2 = "test-image-2.png"
    [System.IO.File]::WriteAllBytes($testImagePath2, $pngBytes)

    $form = @{
        files = @(
            Get-Item -Path $testImagePath
            Get-Item -Path $testImagePath2
        )
    }

    $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/upload/images" -Method Post -Headers $headers -Form $form

    Write-Host "✓ Multiple image upload successful" -ForegroundColor Green
    Write-Host "  Count: $($uploadResponse.count)" -ForegroundColor Gray
    foreach ($file in $uploadResponse.files) {
        Write-Host "  - $($file.filename) ($($file.size) bytes)" -ForegroundColor Gray
        Write-Host "    URL: $($file.url)" -ForegroundColor Gray
    }

    # Cleanup second test image
    Remove-Item $testImagePath2 -ErrorAction SilentlyContinue
} catch {
    Write-Host "✗ Multiple upload failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Test accessing uploaded file
Write-Host "`nStep 5: Testing file access..." -ForegroundColor Yellow
if ($uploadedFilename) {
    try {
        $fileUrl = "$baseUrl/uploads/$uploadedFilename"
        $response = Invoke-WebRequest -Uri $fileUrl -Method Get

        if ($response.StatusCode -eq 200) {
            Write-Host "✓ File accessible at $fileUrl" -ForegroundColor Green
            Write-Host "  Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Gray
            Write-Host "  Content-Length: $($response.Headers.'Content-Length') bytes" -ForegroundColor Gray
        }
    } catch {
        Write-Host "✗ File access failed: $_" -ForegroundColor Red
    }
}

# Cleanup
Write-Host "`nCleaning up test files..." -ForegroundColor Yellow
Remove-Item $testImagePath -ErrorAction SilentlyContinue
Write-Host "✓ Cleanup complete" -ForegroundColor Green

Write-Host "`n=== Upload Test Complete ===" -ForegroundColor Cyan
