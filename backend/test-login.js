const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    console.log('Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.accessToken;
    
    // Test the pending applications endpoint
    console.log('\nTesting agent applications endpoint...');
    const applicationsResponse = await axios.get('http://localhost:3000/agent/applications/pending', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Applications endpoint response:');
    console.log(JSON.stringify(applicationsResponse.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAdminLogin(); 