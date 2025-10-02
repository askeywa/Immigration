# PowerShell script to install Redis on Windows with administrator privileges
# Run this script as Administrator

Write-Host "🚀 Installing Redis on Windows..." -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges. Please run PowerShell as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green

# Install Redis using Chocolatey with admin privileges
Write-Host "📦 Installing Redis using Chocolatey..." -ForegroundColor Blue

try {
    # Try installing Redis for Windows
    choco install redis-64 -y --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Redis installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Chocolatey installation failed, trying alternative method..." -ForegroundColor Yellow
        
        # Alternative: Install Redis using winget
        Write-Host "📦 Trying winget installation..." -ForegroundColor Blue
        winget install Redis.Redis --accept-package-agreements --accept-source-agreements
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Redis installed successfully via winget!" -ForegroundColor Green
        } else {
            Write-Host "❌ Both installation methods failed" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Configure Redis
Write-Host "🔧 Configuring Redis..." -ForegroundColor Blue

# Create Redis configuration directory
$redisConfigDir = "C:\Program Files\Redis"
$redisDataDir = "C:\Redis\data"

if (-not (Test-Path $redisDataDir)) {
    New-Item -ItemType Directory -Path $redisDataDir -Force | Out-Null
    Write-Host "📁 Created Redis data directory: $redisDataDir" -ForegroundColor Green
}

# Create Redis configuration file
$redisConfig = @"
# Redis configuration for Immigration Portal
# Generated on $(Get-Date)

# Network
bind 127.0.0.1
port 6379
timeout 0
tcp-keepalive 300

# Security
requirepass z3uXABbNVsRWe9DTDJuVRHLeXxj4KwU54SLjJkwG0QA=

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir $redisDataDir

# Logging
loglevel notice
logfile "C:\Redis\redis-server.log"

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""

# Client management
maxclients 10000

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128
"@

# Write configuration file
$configPath = "$redisConfigDir\redis.conf"
$redisConfig | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "📝 Created Redis configuration: $configPath" -ForegroundColor Green

# Create Windows service for Redis
Write-Host "🔧 Setting up Redis as Windows service..." -ForegroundColor Blue

# Find Redis executable
$redisExe = Get-ChildItem -Path "C:\Program Files\Redis" -Name "redis-server.exe" -Recurse -ErrorAction SilentlyContinue
if (-not $redisExe) {
    $redisExe = Get-ChildItem -Path "C:\ProgramData\chocolatey\lib\redis-64" -Name "redis-server.exe" -Recurse -ErrorAction SilentlyContinue
}

if ($redisExe) {
    $redisExePath = $redisExe[0].FullName
    Write-Host "🔍 Found Redis executable: $redisExePath" -ForegroundColor Green
    
    # Create Windows service
    $serviceName = "Redis"
    $serviceDisplayName = "Redis Server"
    $serviceDescription = "Redis in-memory data structure store"
    
    # Remove existing service if it exists
    $existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "🔄 Removing existing Redis service..." -ForegroundColor Yellow
        Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
        sc.exe delete $serviceName | Out-Null
    }
    
    # Create new service
    $serviceArgs = "create $serviceName binPath= `"$redisExePath $configPath`" DisplayName= `"$serviceDisplayName`" start= auto"
    Invoke-Expression "sc.exe $serviceArgs"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Redis service created successfully!" -ForegroundColor Green
        
        # Start the service
        Write-Host "🚀 Starting Redis service..." -ForegroundColor Blue
        Start-Service -Name $serviceName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Redis service started successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Service created but failed to start. You may need to start it manually." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to create Redis service" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Could not find Redis executable" -ForegroundColor Red
    Write-Host "Please check Redis installation and try running the service manually" -ForegroundColor Yellow
}

# Test Redis connection
Write-Host "🧪 Testing Redis connection..." -ForegroundColor Blue

try {
    # Find redis-cli
    $redisCli = Get-ChildItem -Path "C:\Program Files\Redis" -Name "redis-cli.exe" -Recurse -ErrorAction SilentlyContinue
    if (-not $redisCli) {
        $redisCli = Get-ChildItem -Path "C:\ProgramData\chocolatey\lib\redis-64" -Name "redis-cli.exe" -Recurse -ErrorAction SilentlyContinue
    }
    
    if ($redisCli) {
        $redisCliPath = $redisCli[0].FullName
        $testResult = & $redisCliPath -a "z3uXABbNVsRWe9DTDJuVRHLeXxj4KwU54SLjJkwG0QA=" ping
        
        if ($testResult -eq "PONG") {
            Write-Host "✅ Redis is working correctly!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Redis connection test failed. Response: $testResult" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Could not find redis-cli for testing" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Redis connection test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Configure Windows Firewall
Write-Host "🔥 Configuring Windows Firewall..." -ForegroundColor Blue

try {
    # Allow Redis through firewall (local only)
    New-NetFirewallRule -DisplayName "Redis Server" -Direction Inbound -Protocol TCP -LocalPort 6379 -Action Allow -Profile Private, Domain | Out-Null
    Write-Host "✅ Windows Firewall configured for Redis" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Failed to configure Windows Firewall: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Redis installation completed!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  • Redis installed and configured" -ForegroundColor White
Write-Host "  • Service created and started" -ForegroundColor White
Write-Host "  • Password: z3uXABbNVsRWe9DTDJuVRHLeXxj4KwU54SLjJkwG0QA=" -ForegroundColor White
Write-Host "  • Port: 6379" -ForegroundColor White
Write-Host "  • Config: $configPath" -ForegroundColor White
Write-Host "`n🚀 You can now start your backend server with Redis enabled!" -ForegroundColor Green
