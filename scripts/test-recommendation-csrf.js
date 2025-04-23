/**
 * Test script for the recommendation generation API endpoint
 * This script tests that the endpoint works without CSRF token
 * 
 * Usage:
 * node scripts/test-recommendation-csrf.js
 */

const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api/recommendations/generate';
const API_KEY = process.env.RECOMMENDATIONS_API_KEY;

if (!API_KEY) {
  console.error('Error: RECOMMENDATIONS_API_KEY environment variable is not set');
  process.exit(1);
}

// Request configuration
const config = {
  maxRecommendationsPerStory: 5,
  similarityThreshold: 0.1,
  excludeSameAuthor: true,
  batchSize: 10
};

async function testRecommendationApi() {
  console.log('Testing recommendation generation API endpoint without CSRF token...');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Prepare request body
    const requestBody = {
      config
    };
    
    console.log('Generating recommendations for all stories');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Send request to API endpoint without CSRF token
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    // Parse response
    const data = await response.json();
    
    // Check if request was successful
    if (response.ok) {
      console.log('\n✅ Success! The endpoint is now exempt from CSRF protection.');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response body:', JSON.stringify(data, null, 2));
    } else {
      console.error('\n❌ Error:');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

// Run the test
testRecommendationApi();
