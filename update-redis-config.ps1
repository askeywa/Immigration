# Redis Configuration Update Script
# This script updates all .env files with Redis configuration

Write-Host "🔧 Updating Redis configuration in all .env files..." -ForegroundColor Blue

# Redis configuration values
$REDIS_ENABLED = "true"
$REDIS_URL = "redis://localhost:6379"
$REDIS_PASSWORD = "z3uXABbNVsRWe9DTDJuVRHLeVxj4KwU54SLjJkwG0QA="

# Backend .env file
$backendEnvPath = "C:\Main_Data\AI\immigration-appV1\backend\.env"
Write-Host "📝 Updating backend .env file..." -ForegroundColor Yellow

if (Test-Path $backendEnvPath) {
    # Read the current content
    $content = Get-Content $backendEnvPath
    
    # Update REDIS_ENABLED
    $content = $content -replace "REDIS_ENABLED=.*", "REDIS_ENABLED=$REDIS_ENABLED"
    
    # Add REDIS_URL if not exists
    if ($content -notmatch "REDIS_URL=") {
        $content += "REDIS_URL=$REDIS_URL"
    } else {
        $content = $content -replace "REDIS_URL=.*", "REDIS_URL=$REDIS_URL"
    }
    
    # Add REDIS_PASSWORD if not exists
    if ($content -notmatch "REDIS_PASSWORD=") {
        $content += "REDIS_PASSWORD=$REDIS_PASSWORD"
    } else {
        $content = $content -replace "REDIS_PASSWORD=.*", "REDIS_PASSWORD=$REDIS_PASSWORD"
    }
    
    # Write back to file
    $content | Set-Content $backendEnvPath
    Write-Host "✅ Backend .env updated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Backend .env file not found!" -ForegroundColor Red
}

# Root .env file
$rootEnvPath = "C:\Main_Data\AI\immigration-appV1\.env"
Write-Host "📝 Updating root .env file..." -ForegroundColor Yellow

if (Test-Path $rootEnvPath) {
    # Read the current content
    $content = Get-Content $rootEnvPath
    
    # Update REDIS_ENABLED
    $content = $content -replace "REDIS_ENABLED=.*", "REDIS_ENABLED=$REDIS_ENABLED"
    
    # Add REDIS_URL if not exists
    if ($content -notmatch "REDIS_URL=") {
        $content += "REDIS_URL=$REDIS_URL"
    } else {
        $content = $content -replace "REDIS_URL=.*", "REDIS_URL=$REDIS_URL"
    }
    
    # Add REDIS_PASSWORD if not exists
    if ($content -notmatch "REDIS_PASSWORD=") {
        $content += "REDIS_PASSWORD=$REDIS_PASSWORD"
    } else {
        $content = $content -replace "REDIS_PASSWORD=.*", "REDIS_PASSWORD=$REDIS_PASSWORD"
    }
    
    # Write back to file
    $content | Set-Content $rootEnvPath
    Write-Host "✅ Root .env updated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Root .env file not found!" -ForegroundColor Red
}

# Update environment templates
Write-Host "📝 Updating environment templates..." -ForegroundColor Yellow

# Update env.development.template
$devTemplatePath = "C:\Main_Data\AI\immigration-appV1\env.development.template"
if (Test-Path $devTemplatePath) {
    $content = Get-Content $devTemplatePath
    $content = $content -replace "REDIS_ENABLED=.*", "REDIS_ENABLED=$REDIS_ENABLED"
    $content = $content -replace "REDIS_URL=.*", "REDIS_URL=$REDIS_URL"
    $content = $content -replace "REDIS_PASSWORD=.*", "REDIS_PASSWORD=$REDIS_PASSWORD"
    $content | Set-Content $devTemplatePath
    Write-Host "✅ Development template updated!" -ForegroundColor Green
}

# Update env.production.template
$prodTemplatePath = "C:\Main_Data\AI\immigration-appV1\env.production.template"
if (Test-Path $prodTemplatePath) {
    $content = Get-Content $prodTemplatePath
    $content = $content -replace "REDIS_ENABLED=.*", "REDIS_ENABLED=$REDIS_ENABLED"
    $content = $content -replace "REDIS_URL=.*", "REDIS_URL=$REDIS_URL"
    $content = $content -replace "REDIS_PASSWORD=.*", "REDIS_PASSWORD=$REDIS_PASSWORD"
    $content | Set-Content $prodTemplatePath
    Write-Host "✅ Production template updated!" -ForegroundColor Green
}

Write-Host "🎉 Redis configuration updated in all files!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of changes:" -ForegroundColor Cyan
Write-Host "  • REDIS_ENABLED=true" -ForegroundColor White
Write-Host "  • REDIS_URL=redis://localhost:6379" -ForegroundColor White
Write-Host "  • REDIS_PASSWORD=z3uXABbNVsRWe9DTDJuVRHLeVxj4KwU54SLjJkwG0QA=" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Next step: Add these to GitHub Secrets!" -ForegroundColor Yellow
