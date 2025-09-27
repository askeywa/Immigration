// Simple API monitoring script for testing
const http = require('http');
const fs = require('fs');

// Create a simple HTTP server to monitor API calls
const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  
  console.log(`[${timestamp}] ${method} ${url}`);
  
  // Log to file
  const logEntry = `${timestamp} - ${method} ${url}\n`;
  fs.appendFileSync('api-monitor.log', logEntry);
  
  // Simple response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'API call logged', timestamp, method, url }));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🔍 API Monitor running on http://localhost:${PORT}`);
  console.log('📝 All API calls will be logged to api-monitor.log');
  console.log('🌐 Open your browser and navigate to your app to see API calls');
  console.log('⏹️  Press Ctrl+C to stop monitoring\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping API monitor...');
  server.close(() => {
    console.log('✅ API monitor stopped');
    process.exit(0);
  });
});
