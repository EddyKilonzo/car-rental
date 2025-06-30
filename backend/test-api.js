const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing agent applications API...');
    
    // First, let's login as admin to get a token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('Admin login successful');
    
    // Now test the pending applications endpoint
    console.log('\n2. Testing pending applications endpoint...');
    const applicationsResponse = await axios.get('http://localhost:3000/agent/applications/pending', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', applicationsResponse.status);
    console.log('Response data:', JSON.stringify(applicationsResponse.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testAPI(); 