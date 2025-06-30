const axios = require('axios');

async function testDetailed() {
  try {
    console.log('=== Step 1: Testing admin login ===');
    
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    console.log('Login successful!');
    const token = loginResponse.data.data.accessToken;
    console.log('Token received:', token.substring(0, 50) + '...');

    console.log('\n=== Step 2: Testing token validation ===');
    
    // Test a simple admin endpoint first
    try {
      const statsResponse = await axios.get('http://localhost:3000/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Admin stats endpoint works!');
      console.log('Stats response:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.error('Admin stats failed:', error.response?.data || error.message);
    }

    console.log('\n=== Step 3: Testing agent applications endpoint ===');
    
    try {
      const applicationsResponse = await axios.get('http://localhost:3000/agent/applications/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Agent applications endpoint works!');
      console.log('Applications response:', JSON.stringify(applicationsResponse.data, null, 2));
    } catch (error) {
      console.error('Agent applications failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Headers:', error.response?.headers);
    }

  } catch (error) {
    console.error('Error in detailed test:', error.response?.data || error.message);
  }
}

testDetailed(); 