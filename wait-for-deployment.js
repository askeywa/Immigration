const https = require('https');

const repoOwner = 'askeywa';
const repoName = 'Immigration';
const runId = '18203493133';

async function waitForDeployment() {
  console.log('⏳ Waiting for deployment to complete...\n');
  
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes max
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const status = await checkDeploymentStatus();
      
      if (status === 'completed') {
        console.log('✅ Deployment completed!');
        return true;
      } else if (status === 'failed') {
        console.log('❌ Deployment failed!');
        return false;
      } else {
        console.log(`🔄 Still in progress... (attempt ${attempts}/${maxAttempts})`);
      }
      
      // Wait 30 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      console.log(`❌ Error checking status: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('⏰ Timeout reached. Check GitHub Actions manually.');
  return false;
}

function checkDeploymentStatus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoOwner}/${repoName}/actions/runs/${runId}`,
      headers: {
        'User-Agent': 'Deployment-Monitor'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.status);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Start monitoring
waitForDeployment().then(success => {
  if (success) {
    console.log('\n🎉 Deployment completed successfully!');
    console.log('🔗 View logs: https://github.com/askeywa/Immigration/actions/runs/' + runId);
    console.log('\nNext steps:');
    console.log('1. Test application: http://18.220.224.109:5000/api/health');
    console.log('2. Check domain: https://ibuyscrap.ca');
  } else {
    console.log('\n❌ Deployment failed or timed out');
    console.log('🔗 Check logs: https://github.com/askeywa/Immigration/actions/runs/' + runId);
  }
});
