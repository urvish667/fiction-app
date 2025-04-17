/**
 * Script to run the recommendation generation process
 * 
 * This script:
 * 1. Compiles and runs the TypeScript recommendation generator
 * 2. Logs the output to the console
 * 
 * Usage:
 * node scripts/run-recommendations.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const SCRIPT_PATH = path.join(__dirname, 'generateRecommendations.ts');

// Function to run the recommendation generator
function runRecommendationGenerator() {
  console.log('Starting recommendation generation process...');
  
  try {
    // Run the TypeScript script using ts-node
    const output = execSync(`npx ts-node ${SCRIPT_PATH}`, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    
    console.log('Recommendation generation completed successfully');
    return true;
  } catch (error) {
    console.error('Error running recommendation generator:', error.message);
    return false;
  }
}

// Run the script
runRecommendationGenerator();
