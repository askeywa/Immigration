const axios = require('axios');

async function findHoneynwildTenant() {
  console.log('🔍 Searching for honeynwild tenant...');
  
  try {
    // First, login as super admin
    const superAdminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'superadmin@immigrationapp.com',
      password: 'ImmigrationDB2024'
    });
    
    const token = superAdminLogin.data.data.token;
    
    // Search for honeynwild tenant by domain
    console.log('🔍 Searching by domain...');
    const searchResponse = await axios.get('http://localhost:5000/api/super-admin/tenants?search=honeynwild', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('🔍 Search results:', searchResponse.data);
    
    // Also try to get all tenants with different parameters
    console.log('🔍 Getting all tenants with different parameters...');
    const allTenantsResponse = await axios.get('http://localhost:5000/api/super-admin/tenants?limit=1000&page=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📋 All tenants count:', allTenantsResponse.data.pagination?.totalTenants);
    
    // Look for any tenant with honeynwild in name or domain
    const honeynwildTenants = allTenantsResponse.data.data?.tenants?.filter(t => 
      t.name?.toLowerCase().includes('honeynwild') ||
      t.domain?.toLowerCase().includes('honeynwild') ||
      t.name?.toLowerCase().includes('honey') ||
      t.name?.toLowerCase().includes('wild')
    );
    
    if (honeynwildTenants && honeynwildTenants.length > 0) {
      console.log('✅ Found honeynwild-related tenants:');
      honeynwildTenants.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.name} (${tenant.domain}) - Status: ${tenant.status}`);
        console.log(`   Admin: ${tenant.adminUser?.email || 'undefined'}`);
        console.log(`   ID: ${tenant._id}`);
      });
    } else {
      console.log('❌ No honeynwild-related tenants found');
    }
    
    // Try to get tenant by direct API call if we have an ID
    if (honeynwildTenants && honeynwildTenants.length > 0) {
      const tenantId = honeynwildTenants[0]._id;
      console.log(`🔍 Getting tenant details for ID: ${tenantId}`);
      
      try {
        const tenantDetailsResponse = await axios.get(`http://localhost:5000/api/super-admin/tenants/${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📋 Tenant details:', tenantDetailsResponse.data);
        
        // Check if admin user exists
        if (tenantDetailsResponse.data.data?.adminUser) {
          console.log('👤 Admin user found:', tenantDetailsResponse.data.data.adminUser);
        } else {
          console.log('❌ No admin user found for this tenant');
        }
        
      } catch (error) {
        console.log('❌ Error getting tenant details:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

findHoneynwildTenant();
