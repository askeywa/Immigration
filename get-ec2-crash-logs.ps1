# PowerShell script to fetch EC2 crash logs
# Immigration Portal - Crash Investigation

Write-Host "🔍 Immigration Portal - Crash Investigation" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SSH_KEY = "C:\Main_Data\AI\_Keys\node-key.pem"
$EC2_HOST = "ubuntu@ec2-18-220-224-109.us-east-2.compute.amazonaws.com"

# Create log directory
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$LOG_DIR = "crash-investigation-$TIMESTAMP"
New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null

Write-Host "📋 Fetching logs from EC2 instance..." -ForegroundColor Yellow
Write-Host ""

# Function to run SSH command and save output
function Get-SSHLog {
    param(
        [string]$Command,
        [string]$OutputFile,
        [string]$Description
    )
    
    Write-Host "⏳ $Description..." -ForegroundColor Yellow
    $FullCommand = "ssh -i `"$SSH_KEY`" $EC2_HOST `"$Command`""
    Invoke-Expression $FullCommand > "$LOG_DIR\$OutputFile" 2>&1
    Write-Host "✅ Saved to $OutputFile" -ForegroundColor Green
}

# Fetch all logs
Get-SSHLog "pm2 logs immigration-portal --lines 500 --nostream" "pm2-logs.txt" "1️⃣  Fetching PM2 logs (last 500 lines)"
Get-SSHLog "pm2 logs immigration-portal --err --lines 500 --nostream" "pm2-error-logs.txt" "2️⃣  Fetching PM2 error logs"
Get-SSHLog "pm2 status" "pm2-status.txt" "3️⃣  Fetching PM2 process status"
Get-SSHLog "pm2 info immigration-portal" "pm2-info.txt" "4️⃣  Fetching PM2 process info"
Get-SSHLog "free -h && echo '---' && df -h" "system-memory.txt" "5️⃣  Fetching system memory usage"
Get-SSHLog "ss -tuln | grep 27017 || echo 'No MongoDB local connection'" "mongodb-status.txt" "6️⃣  Fetching MongoDB connection status"
Get-SSHLog "sudo tail -n 200 /var/log/nginx/error.log" "nginx-error-logs.txt" "7️⃣  Fetching Nginx logs (last 200 lines)"
Get-SSHLog "sudo journalctl -u node --since '24 hours ago' --no-pager" "system-logs.txt" "8️⃣  Fetching system logs"
Get-SSHLog "sudo dmesg | grep -i 'out of memory\|killed process' | tail -n 50" "oom-kills.txt" "9️⃣  Checking for Out Of Memory (OOM) kills"
Get-SSHLog "cat ~/.pm2/dump.pm2" "pm2-dump.txt" "🔟  Fetching PM2 resurrection list"

Write-Host ""
Write-Host "✅ All logs fetched successfully!" -ForegroundColor Green
Write-Host "📁 Logs saved to: $LOG_DIR\" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Critical files to check:" -ForegroundColor Yellow
Write-Host "   1. $LOG_DIR\pm2-error-logs.txt - Application errors" -ForegroundColor White
Write-Host "   2. $LOG_DIR\oom-kills.txt - Memory issues (OOM killer)" -ForegroundColor White
Write-Host "   3. $LOG_DIR\pm2-info.txt - Restart count and status" -ForegroundColor White
Write-Host "   4. $LOG_DIR\pm2-logs.txt - Full application logs" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Please share the contents of these files for analysis" -ForegroundColor Cyan

