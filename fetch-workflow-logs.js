const https = require('https');

const repoOwner = 'askeywa';
const repoName = 'Immigration';

async function fetchLatestWorkflowLogs() {
  console.log('🔍 Fetching Latest GitHub Workflow Logs...\n');
  
  try {
    // Get the latest workflow run
    const latestRun = await getLatestWorkflowRun();
    
    if (!latestRun) {
      console.log('❌ No workflow runs found');
      return;
    }
    
    console.log(`📋 Latest Run Details:`);
    console.log(`   ID: ${latestRun.id}`);
    console.log(`   Status: ${latestRun.status}`);
    console.log(`   Conclusion: ${latestRun.conclusion || 'N/A'}`);
    console.log(`   Created: ${new Date(latestRun.created_at).toLocaleString()}`);
    console.log(`   Updated: ${new Date(latestRun.updated_at).toLocaleString()}`);
    console.log(`   Head SHA: ${latestRun.head_sha.substring(0, 7)}`);
    console.log(`   Branch: ${latestRun.head_branch}\n`);
    
    // Get jobs for this run
    const jobs = await getWorkflowJobs(latestRun.id);
    
    console.log(`📊 Jobs (${jobs.length}):`);
    
    for (const job of jobs) {
      console.log(`\n🔧 Job: ${job.name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Conclusion: ${job.conclusion || 'N/A'}`);
      console.log(`   Steps: ${job.steps?.length || 0}`);
      
      if (job.conclusion === 'failure') {
        console.log(`   ❌ FAILED JOB - Detailed Steps:`);
        
        if (job.steps) {
          job.steps.forEach((step, index) => {
            console.log(`      ${index + 1}. ${step.name}`);
            console.log(`         Status: ${step.status}`);
            console.log(`         Conclusion: ${step.conclusion || 'N/A'}`);
            
            if (step.conclusion === 'failure') {
              console.log(`         ❌ FAILED STEP - This is where the error occurred`);
            }
          });
        }
        
        // Try to get logs for this job
        console.log(`\n🔍 Fetching logs for failed job: ${job.name}`);
        console.log(`   Job ID: ${job.id}`);
        
        // Note: GitHub API requires authentication for detailed logs
        console.log(`\n💡 To see the exact error:`);
        console.log(`   1. Go to: https://github.com/${repoOwner}/${repoName}/actions/runs/${latestRun.id}`);
        console.log(`   2. Click on the "${job.name}" job`);
        console.log(`   3. Click on the failed step to see the error message`);
        
        // Provide direct link to the failed step
        console.log(`\n🔗 Direct Link to Failed Job:`);
        console.log(`   https://github.com/${repoOwner}/${repoName}/actions/runs/${latestRun.id}/jobs/${job.id}`);
      } else if (job.conclusion === 'success') {
        console.log(`   ✅ Job completed successfully`);
      }
    }
    
    // Summary
    console.log(`\n📋 Summary:`);
    console.log(`   • Latest Run: ${latestRun.id}`);
    console.log(`   • Status: ${latestRun.status} (${latestRun.conclusion || 'in progress'})`);
    console.log(`   • Failed Jobs: ${jobs.filter(j => j.conclusion === 'failure').length}`);
    console.log(`   • Successful Jobs: ${jobs.filter(j => j.conclusion === 'success').length}`);
    
  } catch (error) {
    console.error('❌ Error fetching workflow logs:', error.message);
    console.log('\n💡 Manual Steps:');
    console.log('   1. Go to: https://github.com/askeywa/Immigration/actions');
    console.log('   2. Click on the latest "Deploy to EC2" workflow run');
    console.log('   3. Click on the failed "deploy" job');
    console.log('   4. Click on the failed step to see the error');
  }
}

function getLatestWorkflowRun() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoOwner}/${repoName}/actions/runs?per_page=1`,
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
          resolve(response.workflow_runs?.[0] || null);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function getWorkflowJobs(runId) {
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
fetchLatestWorkflowLogs();
