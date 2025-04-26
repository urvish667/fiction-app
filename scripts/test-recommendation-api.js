/**
 * Test script for the recommendation generation API endpoint
 *
 * This script sends a request to the recommendation generation API endpoint
 * to test its functionality.
 *
 * Usage:
 * node scripts/test-recommendation-api.js
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
  maxRecommendationsPerStory: 10,
  similarityThreshold: 0.1,
  excludeSameAuthor: true,
  batchSize: 50
};

async function testRecommendationApi() {
  console.log('Testing recommendation generation API endpoint...');
  console.log(`API URL: ${API_URL}`);

  try {
    // Prepare request body
    const requestBody = {
      config
    };

    console.log('Generating recommendations for all stories');

    // Send request to API endpoint
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
      console.log('\n✅ Success!');
      console.log('Response:');
      console.log(JSON.stringify(data, null, 2));

      // Log summary
      if (data.result) {
        if (data.result.storyId) {
          console.log(`\nGenerated ${data.result.recommendationsGenerated} recommendations for story ${data.result.storyId}`);
        } else {
          console.log(`\nProcessed ${data.result.processedStories} stories`);
          console.log(`Generated ${data.result.totalRecommendations} recommendations`);
          if (data.result.errors > 0) {
            console.log(`Encountered ${data.result.errors} errors`);
          }
        }
      }

      console.log(`\nTotal duration: ${data.duration}`);
    } else {
      console.error('\n❌ Error:');
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error);
  }
}

// Run the test
testRecommendationApi();
