// Comprehensive authentication timeout diagnosis
const https = require('https');

async function diagnoseAuthTimeout() {
    console.log('🔍 COMPREHENSIVE AUTHENTICATION TIMEOUT DIAGNOSIS');
    console.log('================================================\n');

    try {
        // 1. Test server health (should work)
        console.log('1️⃣ Testing Server Health...');
        const healthResult = await testHealthEndpoint();
        console.log('   Result:', healthResult.success ? '✅ SUCCESS' : '❌ FAILED');
        if (healthResult.success) {
            console.log('   Database:', healthResult.data?.database?.connected ? 'Connected' : 'Disconnected');
            console.log('   Environment:', healthResult.data?.environment);
        }
        console.log('');

        // 2. Test super admin login with detailed timing
        console.log('2️⃣ Testing Super Admin Login (Detailed)...');
        const superAdminResult = await testSuperAdminDetailed();
        console.log('   Result:', superAdminResult.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log('   Status Code:', superAdminResult.status);
        console.log('   Response Time:', superAdminResult.responseTime + 'ms');
        console.log('   Error:', superAdminResult.error);
        console.log('');

        // 3. Test tenant login with detailed timing
        console.log('3️⃣ Testing Tenant Login (Detailed)...');
        const tenantResult = await testTenantDetailed();
        console.log('   Result:', tenantResult.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log('   Status Code:', tenantResult.status);
        console.log('   Response Time:', tenantResult.responseTime + 'ms');
        console.log('   Error:', tenantResult.error);
        console.log('');

        // 4. Test other endpoints for comparison
        console.log('4️⃣ Testing Other Endpoints for Comparison...');
        const otherEndpoints = await testOtherEndpoints();
        console.log('   Users Endpoint:', otherEndpoints.users.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log('   Tenants Endpoint:', otherEndpoints.tenants.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log('');

        // 5. Analysis and recommendations
        console.log('📊 ANALYSIS & RECOMMENDATIONS:');
        console.log('==============================');
        
        if (healthResult.success && !superAdminResult.success && !tenantResult.success) {
            console.log('🔴 ISSUE: Authentication endpoints specifically hanging');
            console.log('   → Problem is in authentication logic, not server');
            console.log('   → Possible causes:');
            console.log('     • Infinite loop in auth service');
            console.log('     • Database query hanging in auth process');
            console.log('     • Memory leak in authentication code');
            console.log('     • Authentication middleware blocking');
        } else if (!healthResult.success) {
            console.log('🔴 ISSUE: Server completely down');
            console.log('   → Need to restart server');
        } else {
            console.log('🟡 PARTIAL ISSUE: Some endpoints working, some not');
            console.log('   → Mixed server state, needs investigation');
        }

        console.log('\n🚀 RECOMMENDED ACTIONS:');
        console.log('1. Check server logs for authentication errors');
        console.log('2. Restart authentication service specifically');
        console.log('3. Check database connection in auth endpoints');
        console.log('4. Review authentication middleware for blocking code');

    } catch (error) {
        console.error('❌ Diagnosis Error:', error.message);
    }
}

function testHealthEndpoint() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const options = {
            hostname: 'ibuyscrap.ca',
            port: 443,
            path: '/api/health',
            method: 'GET',
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                try {
                    const response = JSON.parse(data);
                    resolve({
                        success: res.statusCode === 200,
                        status: res.statusCode,
                        responseTime: responseTime,
                        data: response
                    });
                } catch (e) {
                    resolve({
                        success: false,
                        status: res.statusCode,
                        responseTime: responseTime,
                        error: 'JSON parse failed',
                        raw: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            const responseTime = Date.now() - startTime;
            resolve({
                success: false,
                responseTime: responseTime,
                error: e.message,
                code: e.code
            });
        });

        req.on('timeout', () => {
            const responseTime = Date.now() - startTime;
            resolve({
                success: false,
                responseTime: responseTime,
                error: 'Health endpoint timeout',
                code: 'TIMEOUT'
            });
        });

        req.end();
    });
}

function testSuperAdminDetailed() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const postData = JSON.stringify({
            email: 'superadmin@immigrationapp.com',
            password: 'SuperAdmin123!'
        });

        const options = {
            hostname: 'ibuyscrap.ca',
            port: 443,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                try {
                    const response = JSON.parse(data);
                    resolve({
                        success: res.statusCode === 200,
                        status: res.statusCode,
                        responseTime: responseTime,
                        data: response,
                        error: response.message || response.error
                    });
                } catch (e) {
                    resolve({
                        success: false,
                        status: res.statusCode,
                        responseTime: responseTime,
                        error: 'JSON parse failed',
                        raw: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            const responseTime = Date.now() - startTime;
            resolve({
                success: false,
                responseTime: responseTime,
                error: e.message,
                code: e.code
            });
        });

        req.on('timeout', () => {
            const responseTime = Date.now() - startTime;
            resolve({
                success: false,
                responseTime: responseTime,
                error: 'Super admin login timeout',
                code: 'TIMEOUT'
            });
        });

        req.write(postData);
        req.end();
    });
}

function testTenantDetailed() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const postData = JSON.stringify({
            email: 'admin@honeynwild.com',
            password: 'Admin123!'
        });

        const options = {
            hostname: 'ibuyscrap.ca',
            port: 443,
            path: '/api/v1/tenant/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-Original-Host': 'honeynwild.com',
                'X-Tenant-Domain': 'honeynwild.com'
            },
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                try {
                    const response = JSON.parse(data);
                    resolve({
                        success: res.statusCode === 200 && response.success,
                        status: res.statusCode,
                        responseTime: responseTime,
                        data: response.data,
                        error: response.message || response.error,
                        fullResponse: response
                    });
                } catch (e) {
                    resolve({
                        success: false,
                        status: res.statusCode,
                        responseTime: responseTime,
                        error: 'JSON parse failed',
                        raw: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            const responseTime = Date.now() - startTime;
            resolve({
                success: false,
                responseTime: responseTime,
                error: e.message,
                code: e.code
            });
        });

        req.on('timeout', () => {
            const responseTime = Date.now() - startTime;
            resolve({
                success: false,
                responseTime: responseTime,
                error: 'Tenant login timeout',
                code: 'TIMEOUT'
            });
        });

        req.write(postData);
        req.end();
    });
}

async function testOtherEndpoints() {
    const results = {};
    
    // Test users endpoint
    results.users = await testEndpoint('/api/super-admin/users', 'GET');
    
    // Test tenants endpoint  
    results.tenants = await testEndpoint('/api/super-admin/tenants', 'GET');
    
    return results;
}

function testEndpoint(path, method) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const options = {
            hostname: 'ibuyscrap.ca',
            port: 443,
            path: path,
            method: method,
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                resolve({
                    success: res.statusCode === 200,
                    status: res.statusCode,
                    responseTime: responseTime
                });
            });
        });

        req.on('error', (e) => {
            const responseTime = Date.now() - startTime;
            resolve({
                success: false,
                responseTime: responseTime,
                error: e.message
            });
        });

        req.on('timeout', () => {
            const responseTime = Date.now() - startTime;
            resolve({
                success: false,
                responseTime: responseTime,
                error: 'Endpoint timeout'
            });
        });

        req.end();
    });
}

// Run the diagnosis
diagnoseAuthTimeout().catch(console.error);
