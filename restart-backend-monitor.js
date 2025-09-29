// Restart backend and monitor logs
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Restarting Backend and Monitoring Logs...');

async function restartBackend() {
  try {
    // Step 1: Kill existing backend processes
    console.log('🛑 Step 1: Stopping existing backend processes...');
    
    // Kill the specific backend process
    exec('taskkill /PID 29008 /F', (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Process might already be stopped:', error.message);
      } else {
        console.log('✅ Backend process stopped');
      }
    });

    // Wait a moment for process to stop
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Start backend with monitoring
    console.log('🚀 Step 2: Starting backend with log monitoring...');
    
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Create logs directory
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create log file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logsDir, `backend-restart-${timestamp}.txt`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    console.log(`📁 Logging to: ${logFile}`);

    // Monitor stdout
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📊 Backend:', output);
      logStream.write(`[${new Date().toISOString()}] ${output}`);
    });

    // Monitor stderr
    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('❌ Backend Error:', output);
      logStream.write(`[${new Date().toISOString()}] ERROR: ${output}`);
    });

    // Handle process events
    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      logStream.write(`\n[${new Date().toISOString()}] Backend exited with code ${code}\n`);
      logStream.end();
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      logStream.write(`\n[${new Date().toISOString()}] Failed to start: ${error.message}\n`);
      logStream.end();
    });

    console.log('✅ Backend restarted with monitoring');
    console.log('📋 Now run your tenant creation test...');
    console.log('📋 Press Ctrl+C to stop monitoring');

    // Keep running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping backend monitoring...');
      backendProcess.kill();
      logStream.end();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error restarting backend:', error.message);
  }
}

restartBackend();
