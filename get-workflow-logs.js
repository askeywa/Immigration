const https = require('https');

const repoOwner = 'askeywa';
const repoName = 'Immigration';
const runId = '18203493133';

async function getWorkflowLogs() {
  console.log('🔍 Fetching detailed workflow logs...\n');
  
  try {
    // Get job details first
    const jobs = await getWorkflowJobs();
    
    for (const job of jobs) {
      console.log(`\n📋 Job: ${job.name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Conclusion: ${job.conclusion}`);
      console.log(`   Steps: ${job.steps?.length || 0}`);
      
      if (job.conclusion === 'failure') {
        console.log(`   ❌ FAILED JOB - Analyzing steps:`);
        
        if (job.steps) {
          job.steps.forEach((step, index) => {
            console.log(`      ${index + 1}. ${step.name}`);
            console.log(`         Status: ${step.status}`);
            console.log(`         Conclusion: ${step.conclusion || 'N/A'}`);
            
            if (step.conclusion === 'failure') {
              console.log(`         ❌ FAILED STEP`);
            }
          });
        }
      }
    }
    
    // Try to get log content for the failed job
    const failedJob = jobs.find(job => job.conclusion === 'failure');
    if (failedJob) {
      console.log(`\n🔍 Attempting to fetch logs for failed job: ${failedJob.name}`);
      console.log(`   Job ID: ${failedJob.id}`);
      
      // Note: GitHub API requires authentication for logs
      console.log(`   💡 To view full logs, go to:`);
      console.log(`   https://github.com/${repoOwner}/${repoName}/actions/runs/${runId}`);
      console.log(`   And click on the "${failedJob.name}" job`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
  }
}

function getWorkflowJobs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoOwner}/${repoName}/actions/runs/${runId}/jobs`,
      headers: {
        'User-Agent': 'Workflow-Log-Fetcher'
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
getWorkflowLogs();
