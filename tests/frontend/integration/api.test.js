// Simple test script to check API connectivity
const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

async function testAPI() {
  console.log('Testing API connectivity...');
  
  try {
    // Test basic API health
    const response = await axios.get(`${API_URL}/services/`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API is working!');
    console.log(`Status: ${response.status}`);
    console.log(`Services found: ${response.data.count || response.data.length || 'Unknown'}`);
    
    // Test categories
    const categoriesResponse = await axios.get(`${API_URL}/services/categories/`);
    console.log(`✅ Categories loaded: ${categoriesResponse.data.length || 'Unknown'}`);
    
    // Test cities
    const citiesResponse = await axios.get(`${API_URL}/services/cities/`);
    console.log(`✅ Cities loaded: ${citiesResponse.data.length || 'Unknown'}`);
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
  }
}

testAPI();