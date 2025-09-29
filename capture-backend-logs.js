// Capture backend logs to file
const fs = require('fs');
const path = require('path');

console.log('📝 Capturing Backend Logs...');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `backend-logs-${timestamp}.txt`);

console.log(`📁 Log file created: ${logFile}`);

// Function to capture logs
function captureLogs() {
  const { spawn } = require('child_process');
  
  // Start the backend server and capture its output
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Create write stream for log file
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  // Log start time
  logStream.write(`\n=== BACKEND LOGS STARTED AT ${new Date().toISOString()} ===\n\n`);

  // Capture stdout
  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('📊 Backend output:', output);
    logStream.write(`[STDOUT] ${output}`);
  });

  // Capture stderr
  backendProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.log('❌ Backend error:', output);
    logStream.write(`[STDERR] ${output}`);
  });

  // Handle process exit
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    logStream.write(`\n=== BACKEND PROCESS EXITED WITH CODE ${code} AT ${new Date().toISOString()} ===\n`);
    logStream.end();
  });

  // Handle errors
  backendProcess.on('error', (error) => {
    console.error('Failed to start backend process:', error);
    logStream.write(`\n=== ERROR STARTING BACKEND: ${error.message} ===\n`);
    logStream.end();
  });

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping log capture...');
    backendProcess.kill();
    logStream.end();
    process.exit(0);
  });

  console.log('✅ Log capture started! Backend logs will be saved to:', logFile);
  console.log('📋 To stop capturing, press Ctrl+C');
}

captureLogs();
