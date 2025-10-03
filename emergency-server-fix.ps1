# PowerShell Emergency Server Fix Script
Write-Host "🚨 EMERGENCY SERVER FIX SCRIPT" -ForegroundColor Red
Write-Host "==============================" -ForegroundColor Red
Write-Host ""

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "🔍 STEP 1: CHECKING SYSTEM STATUS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check system resources
Write-Status "Checking system resources..."
Get-WmiObject -Class Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory
Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}

# Check Node.js processes
Write-Status "Checking Node.js processes..."
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses) {
    Write-Success "Node.js processes found:"
    $nodeProcesses | Select-Object Id, ProcessName, CPU
} else {
    Write-Error "No Node.js processes found!"
}

Write-Host ""
Write-Host "🎯 EMERGENCY ACTIONS TO TAKE ON YOUR EC2 INSTANCE:" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SSH INTO YOUR EC2 INSTANCE:" -ForegroundColor White
Write-Host "   ssh -i your-key.pem ubuntu@18.220.224.109" -ForegroundColor Gray
Write-Host ""
Write-Host "2. RUN THESE COMMANDS ON YOUR EC2 INSTANCE:" -ForegroundColor White
Write-Host "   cd /var/www/immigration-portal" -ForegroundColor Gray
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host "   pm2 restart all" -ForegroundColor Gray
Write-Host "   sudo systemctl restart mongod" -ForegroundColor Gray
Write-Host "   sudo systemctl restart redis" -ForegroundColor Gray
Write-Host "   sudo systemctl restart nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "3. CREATE SUPER ADMIN USER:" -ForegroundColor White
Write-Host "   cd /var/www/immigration-portal/backend" -ForegroundColor Gray
Write-Host "   node -e \"const mongoose = require('mongoose'); const bcrypt = require('bcryptjs'); const User = require('./src/models/User'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const existingAdmin = await User.findOne({ email: 'superadmin@immigrationapp.com' }); if (existingAdmin) { existingAdmin.password = await bcrypt.hash('SuperAdmin123!', 12); existingAdmin.isSuperAdmin = true; await existingAdmin.save(); console.log('Super admin updated'); } else { const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12); const superAdmin = new User({ firstName: 'Super', lastName: 'Admin', email: 'superadmin@immigrationapp.com', password: hashedPassword, role: 'super_admin', isSuperAdmin: true, isEmailVerified: true }); await superAdmin.save(); console.log('Super admin created'); } process.exit(0); });\"" -ForegroundColor Gray
Write-Host ""
Write-Host "4. CHECK LOGS:" -ForegroundColor White
Write-Host "   pm2 logs" -ForegroundColor Gray
Write-Host "   sudo journalctl -u mongod -f" -ForegroundColor Gray
Write-Host ""
Write-Host "5. IF STILL NOT WORKING:" -ForegroundColor White
Write-Host "   - Restart EC2 instance from AWS Console" -ForegroundColor Gray
Write-Host "   - Check CloudWatch logs" -ForegroundColor Gray
Write-Host "   - Verify security groups allow HTTP/HTTPS traffic" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 IMMEDIATE FIX SUMMARY:" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "The issue is that your super admin user is missing from the database." -ForegroundColor White
Write-Host "This likely happened during the EC2 crashes." -ForegroundColor White
Write-Host ""
Write-Host "Root cause: Database connection lost during crashes" -ForegroundColor Yellow
Write-Host "Solution: Recreate super admin user in database" -ForegroundColor Yellow
Write-Host "Prevention: Set up database backups and monitoring" -ForegroundColor Yellow
Write-Host ""
