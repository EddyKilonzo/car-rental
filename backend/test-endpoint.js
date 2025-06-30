const axios = require('axios');

async function testAgentApplicationsEndpoint() {
  try {
    console.log('Testing agent applications endpoint...');
    
    // First, let's login as admin to get a token
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.accessToken;
    console.log('Admin login successful, token received');

    // Test the pending applications endpoint
    const applicationsResponse = await axios.get('http://localhost:3000/agent/applications/pending', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Endpoint response:', JSON.stringify(applicationsResponse.data, null, 2));

  } catch (error) {
    console.error('Error testing endpoint:', error.response?.data || error.message);
  }
}

testAgentApplicationsEndpoint(); 