const https = require('https');

const repoOwner = 'askeywa';
const repoName = 'Immigration';
const runId = '18204722727';
const jobId = '51832262174';

async function fetchActualLogs() {
  console.log('🔍 Fetching Actual GitHub Workflow Logs...\n');
  
  try {
    // Try to get the job logs directly
    console.log(`📋 Attempting to fetch logs for Job ID: ${jobId}`);
    
    const logData = await getJobLogs(jobId);
    
    if (logData) {
      console.log('✅ Successfully fetched log data!');
      console.log('\n📜 Log Content:');
      console.log('================');
      console.log(logData);
    } else {
      console.log('❌ Could not fetch log data');
      console.log('💡 This might require authentication or the logs might be archived');
    }
    
  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
    
    // Try alternative approach
    console.log('\n🔄 Trying alternative approach...');
    await tryAlternativeApproach();
  }
}

function getJobLogs(jobId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoOwner}/${repoName}/actions/jobs/${jobId}/logs`,
      headers: {
        'User-Agent': 'GitHub-Log-Fetcher',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`📊 Response Status: ${res.statusCode}`);
      console.log(`📊 Response Headers:`, res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else if (res.statusCode === 404) {
          console.log('❌ Logs not found (404) - might be archived or require auth');
          resolve(null);
        } else if (res.statusCode === 403) {
          console.log('❌ Access forbidden (403) - authentication required');
          resolve(null);
        } else {
          console.log(`❌ Unexpected status code: ${res.statusCode}`);
          console.log('Response:', data);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function tryAlternativeApproach() {
  console.log('🔍 Trying to get workflow run details...');
  
  try {
    const runDetails = await getWorkflowRunDetails();
    
    if (runDetails) {
      console.log('📋 Workflow Run Details:');
      console.log(`   Status: ${runDetails.status}`);
      console.log(`   Conclusion: ${runDetails.conclusion}`);
      console.log(`   Created: ${runDetails.created_at}`);
      console.log(`   Updated: ${runDetails.updated_at}`);
      
      if (runDetails.conclusion === 'failure') {
        console.log('\n❌ Workflow failed - checking for error details...');
        
        // Try to get more details about the failure
        const jobs = await getWorkflowJobs();
        
        if (jobs && jobs.length > 0) {
          const failedJob = jobs.find(job => job.conclusion === 'failure');
          
          if (failedJob) {
            console.log(`\n🔧 Failed Job: ${failedJob.name}`);
            console.log(`   Status: ${failedJob.status}`);
            console.log(`   Conclusion: ${failedJob.conclusion}`);
            console.log(`   Steps: ${failedJob.steps?.length || 0}`);
            
            if (failedJob.steps) {
              console.log('\n📋 Job Steps:');
              failedJob.steps.forEach((step, index) => {
                console.log(`   ${index + 1}. ${step.name}`);
                console.log(`      Status: ${step.status}`);
                console.log(`      Conclusion: ${step.conclusion || 'N/A'}`);
                
                if (step.conclusion === 'failure') {
                  console.log(`      ❌ FAILED STEP`);
                }
              });
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Alternative approach failed:', error.message);
  }
}

function getWorkflowRunDetails() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoOwner}/${repoName}/actions/runs/${runId}`,
      headers: {
        'User-Agent': 'GitHub-Workflow-Fetcher',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function getWorkflowJobs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoOwner}/${repoName}/actions/runs/${runId}/jobs`,
      headers: {
        'User-Agent': 'GitHub-Jobs-Fetcher',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.jobs || []);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Run the log fetcher
fetchActualLogs();
