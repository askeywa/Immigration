@echo off
echo 🚀 Installing Redis on Windows with Administrator privileges...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running with Administrator privileges
) else (
    echo ❌ This script requires Administrator privileges.
    echo Please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo.
echo 📦 Installing Redis using Chocolatey...
choco install redis-64 -y --force

if %errorLevel% == 0 (
    echo ✅ Redis installed successfully!
) else (
    echo ⚠️  Chocolatey installation failed, trying winget...
    winget install Redis.Redis --accept-package-agreements --accept-source-agreements
    
    if %errorLevel% == 0 (
        echo ✅ Redis installed successfully via winget!
    ) else (
        echo ❌ Both installation methods failed
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Configuring Redis...

REM Create Redis data directory
if not exist "C:\Redis\data" mkdir "C:\Redis\data"

REM Create Redis configuration
echo # Redis configuration for Immigration Portal > "C:\Program Files\Redis\redis.conf"
echo # Generated on %date% %time% >> "C:\Program Files\Redis\redis.conf"
echo. >> "C:\Program Files\Redis\redis.conf"
echo # Network >> "C:\Program Files\Redis\redis.conf"
echo bind 127.0.0.1 >> "C:\Program Files\Redis\redis.conf"
echo port 6379 >> "C:\Program Files\Redis\redis.conf"
echo timeout 0 >> "C:\Program Files\Redis\redis.conf"
echo tcp-keepalive 300 >> "C:\Program Files\Redis\redis.conf"
echo. >> "C:\Program Files\Redis\redis.conf"
echo # Security >> "C:\Program Files\Redis\redis.conf"
echo requirepass z3uXABbNVsRWe9DTDJuVRHLeXxj4KwU54SLjJkwG0QA= >> "C:\Program Files\Redis\redis.conf"
echo. >> "C:\Program Files\Redis\redis.conf"
echo # Memory management >> "C:\Program Files\Redis\redis.conf"
echo maxmemory 512mb >> "C:\Program Files\Redis\redis.conf"
echo maxmemory-policy allkeys-lru >> "C:\Program Files\Redis\redis.conf"
echo. >> "C:\Program Files\Redis\redis.conf"
echo # Persistence >> "C:\Program Files\Redis\redis.conf"
echo save 900 1 >> "C:\Program Files\Redis\redis.conf"
echo save 300 10 >> "C:\Program Files\Redis\redis.conf"
echo save 60 10000 >> "C:\Program Files\Redis\redis.conf"
echo stop-writes-on-bgsave-error yes >> "C:\Program Files\Redis\redis.conf"
echo rdbcompression yes >> "C:\Program Files\Redis\redis.conf"
echo rdbchecksum yes >> "C:\Program Files\Redis\redis.conf"
echo dbfilename dump.rdb >> "C:\Program Files\Redis\redis.conf"
echo dir C:\Redis\data >> "C:\Program Files\Redis\redis.conf"
echo. >> "C:\Program Files\Redis\redis.conf"
echo # Logging >> "C:\Program Files\Redis\redis.conf"
echo loglevel notice >> "C:\Program Files\Redis\redis.conf"
echo logfile "C:\Redis\redis-server.log" >> "C:\Program Files\Redis\redis.conf"

echo ✅ Redis configuration created

echo.
echo 🔧 Setting up Redis as Windows service...

REM Find Redis executable
set REDIS_EXE=
for /r "C:\Program Files\Redis" %%i in (redis-server.exe) do set REDIS_EXE=%%i
if "%REDIS_EXE%"=="" (
    for /r "C:\ProgramData\chocolatey\lib\redis-64" %%i in (redis-server.exe) do set REDIS_EXE=%%i
)

if not "%REDIS_EXE%"=="" (
    echo 🔍 Found Redis executable: %REDIS_EXE%
    
    REM Remove existing service if it exists
    sc query Redis >nul 2>&1
    if %errorLevel% == 0 (
        echo 🔄 Removing existing Redis service...
        sc stop Redis >nul 2>&1
        sc delete Redis >nul 2>&1
    )
    
    REM Create new service
    sc create Redis binPath= "\"%REDIS_EXE%\" \"C:\Program Files\Redis\redis.conf\"" DisplayName= "Redis Server" start= auto
    
    if %errorLevel% == 0 (
        echo ✅ Redis service created successfully!
        
        REM Start the service
        echo 🚀 Starting Redis service...
        sc start Redis
        
        if %errorLevel% == 0 (
            echo ✅ Redis service started successfully!
        ) else (
            echo ⚠️  Service created but failed to start. You may need to start it manually.
        )
    ) else (
        echo ❌ Failed to create Redis service
    )
) else (
    echo ❌ Could not find Redis executable
    echo Please check Redis installation and try running the service manually
)

echo.
echo 🧪 Testing Redis connection...

REM Find redis-cli
set REDIS_CLI=
for /r "C:\Program Files\Redis" %%i in (redis-cli.exe) do set REDIS_CLI=%%i
if "%REDIS_CLI%"=="" (
    for /r "C:\ProgramData\chocolatey\lib\redis-64" %%i in (redis-cli.exe) do set REDIS_CLI=%%i
)

if not "%REDIS_CLI%"=="" (
    "%REDIS_CLI%" -a "z3uXABbNVsRWe9DTDJuVRHLeXxj4KwU54SLjJkwG0QA=" ping > temp_redis_test.txt
    set /p TEST_RESULT=<temp_redis_test.txt
    del temp_redis_test.txt
    
    if "%TEST_RESULT%"=="PONG" (
        echo ✅ Redis is working correctly!
    ) else (
        echo ⚠️  Redis connection test failed. Response: %TEST_RESULT%
    )
) else (
    echo ⚠️  Could not find redis-cli for testing
)

echo.
echo 🔥 Configuring Windows Firewall...
netsh advfirewall firewall add rule name="Redis Server" dir=in action=allow protocol=TCP localport=6379 profile=private,domain >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Windows Firewall configured for Redis
) else (
    echo ⚠️  Failed to configure Windows Firewall
)

echo.
echo 🎉 Redis installation completed!
echo 📋 Summary:
echo   • Redis installed and configured
echo   • Service created and started
echo   • Password: z3uXABbNVsRWe9DTDJuVRHLeXxj4KwU54SLjJkwG0QA=
echo   • Port: 6379
echo   • Config: C:\Program Files\Redis\redis.conf
echo.
echo 🚀 You can now start your backend server with Redis enabled!
echo.
pause
