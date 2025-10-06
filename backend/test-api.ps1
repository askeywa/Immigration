$headers = @{
    'Content-Type' = 'application/json'
    'X-Original-Host' = 'honeynwild.com'
    'X-Tenant-Domain' = 'honeynwild.com'
}

$body = @{
    email = 'admin@honeynwild.com'
    password = 'Admin@123!'
    tenantDomain = 'honeynwild.com'
} | ConvertTo-Json

Write-Host "🔍 Testing API directly..."
Write-Host "Request URL: https://ibuyscrap.ca/api/v1/tenant/auth/login"
Write-Host "Request Body: $body"

try {
    $response = Invoke-RestMethod -Uri "https://ibuyscrap.ca/api/v1/tenant/auth/login" -Method POST -Headers $headers -Body $body
    
    Write-Host "📡 API Response:"
    Write-Host "  Success: $($response.success)"
    Write-Host "  Message: $($response.message)"
    
    if ($response.success -and $response.data) {
        Write-Host "  User: $($response.data.user.email)"
        Write-Host "  Tenant: $($response.data.tenant.name)"
        Write-Host "  Frontend URL: $($response.data.frontendUrl)"
        
        if ($response.data.frontendUrl) {
            if ($response.data.frontendUrl -like "*ibuyscrap.ca*") {
                Write-Host "✅ Frontend URL is correct!"
            } else {
                Write-Host "❌ Frontend URL is wrong!"
                Write-Host "Expected: https://ibuyscrap.ca/tenant/dashboard"
                Write-Host "Got: $($response.data.frontendUrl)"
            }
        }
    } else {
        Write-Host "❌ API call failed: $($response | ConvertTo-Json -Depth 3)"
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
}
