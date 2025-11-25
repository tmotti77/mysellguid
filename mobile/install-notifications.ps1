# MySellGuid - Install Push Notification Packages

Write-Host "Installing Expo Push Notification packages..." -ForegroundColor Cyan

cd mobile

Write-Host "`nInstalling required packages:" -ForegroundColor Yellow
Write-Host "  - expo-notifications" -ForegroundColor Gray
Write-Host "  - expo-device" -ForegroundColor Gray
Write-Host "  - expo-constants (already installed)" -ForegroundColor Gray

npm install expo-notifications expo-device --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Packages installed successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Run 'npx expo start' to start the dev server" -ForegroundColor White
    Write-Host "  2. Use Expo Go on a physical device (notifications don't work on simulators)" -ForegroundColor White
    Write-Host "  3. Grant notification permissions when prompted" -ForegroundColor White
    Write-Host "  4. Check ProfileScreen for 'Send Test Notification' button" -ForegroundColor White
    Write-Host "`nFor more information, see EXPO_PUSH_NOTIFICATIONS_SETUP.md" -ForegroundColor Cyan
} else {
    Write-Host "`n[ERROR] Package installation failed!" -ForegroundColor Red
    Write-Host "Try running: npm install --legacy-peer-deps" -ForegroundColor Yellow
}
