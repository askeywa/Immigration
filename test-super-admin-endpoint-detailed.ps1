# Test super admin tenants endpoint with detailed logging

Write-Host "===== Testing Super Admin Tenants Endpoint =====" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n[Step 1] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "superadmin@immigrationapp.com"
    password = "ImmigrationDB2024"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    $token = $loginResponse.data.token
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Call super admin tenants endpoint
Write-Host "`n[Step 2] Calling /api/super-admin/tenants..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/super-admin/tenants" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ API call successful" -ForegroundColor Green
    Write-Host "`n[Response]:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success -and $response.data -and $response.data.tenants) {
        $tenantCount = $response.data.tenants.Count
        Write-Host "`n📊 Found $tenantCount tenants" -ForegroundColor $(if ($tenantCount -gt 0) { "Green" } else { "Red" })
        
        if ($tenantCount -gt 0) {
            Write-Host "`n[First Tenant]:" -ForegroundColor Cyan
            $response.data.tenants[0] | ConvertTo-Json -Depth 5
        }
    } else {
        Write-Host "`n❌ No tenants found or unexpected response structure" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ API call failed: $_" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Red
}
