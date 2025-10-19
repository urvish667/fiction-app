/**
 * Rate Limiting Test Script
 * 
 * This script tests the rate limiting functionality by making rapid requests
 * to various API endpoints.
 * 
 * Usage:
 *   node test-rate-limit.js [endpoint] [requests]
 * 
 * Examples:
 *   node test-rate-limit.js /api/stories 150
 *   node test-rate-limit.js /api/auth/signin 10
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ENDPOINT = process.argv[2] || '/api/stories';
const NUM_REQUESTS = parseInt(process.argv[3]) || 120;
const DELAY_MS = 100; // Delay between requests

// Parse URL
const url = new URL(BASE_URL + ENDPOINT);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

// Test results
const results = {
  success: 0,
  rateLimited: 0,
  errors: 0,
  responses: [],
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.blue}  Rate Limiting Test${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`Endpoint: ${ENDPOINT}`);
console.log(`Requests: ${NUM_REQUESTS}`);
console.log(`Base URL: ${BASE_URL}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

/**
 * Make a single request
 */
function makeRequest(requestNum) {
  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Rate-Limit-Test-Script',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const result = {
          requestNum,
          status: res.statusCode,
          headers: {
            limit: res.headers['x-ratelimit-limit'],
            remaining: res.headers['x-ratelimit-remaining'],
            reset: res.headers['x-ratelimit-reset'],
            retryAfter: res.headers['retry-after'],
          },
        };

        // Track results
        if (res.statusCode === 429) {
          results.rateLimited++;
          console.log(
            `${colors.red}✗${colors.reset} Request #${requestNum}: ${colors.red}RATE LIMITED${colors.reset} ` +
            `(Retry after: ${result.headers.retryAfter}s, Remaining: ${result.headers.remaining})`
          );
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          results.success++;
          console.log(
            `${colors.green}✓${colors.reset} Request #${requestNum}: ${colors.green}SUCCESS${colors.reset} ` +
            `(Status: ${res.statusCode}, Remaining: ${result.headers.remaining}/${result.headers.limit})`
          );
        } else {
          results.errors++;
          console.log(
            `${colors.yellow}!${colors.reset} Request #${requestNum}: ${colors.yellow}ERROR${colors.reset} ` +
            `(Status: ${res.statusCode})`
          );
        }

        results.responses.push(result);
        resolve(result);
      });
    });

    req.on('error', (error) => {
      results.errors++;
      console.log(
        `${colors.red}✗${colors.reset} Request #${requestNum}: ${colors.red}FAILED${colors.reset} ` +
        `(${error.message})`
      );
      resolve({ requestNum, error: error.message });
    });

    req.end();
  });
}

/**
 * Run the test
 */
async function runTest() {
  console.log(`${colors.blue}Starting test...${colors.reset}\n`);

  const startTime = Date.now();

  // Make requests sequentially with a small delay
  for (let i = 1; i <= NUM_REQUESTS; i++) {
    await makeRequest(i);
    
    // Add delay between requests
    if (i < NUM_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}  Test Summary${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`Duration: ${duration}s`);
  console.log(`${colors.green}Successful: ${results.success}${colors.reset}`);
  console.log(`${colors.red}Rate Limited: ${results.rateLimited}${colors.reset}`);
  console.log(`${colors.yellow}Errors: ${results.errors}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // Analyze rate limit behavior
  if (results.responses.length > 0) {
    const firstRateLimited = results.responses.find(r => r.status === 429);
    if (firstRateLimited) {
      console.log(`${colors.yellow}First rate limit occurred at request #${firstRateLimited.requestNum}${colors.reset}`);
      console.log(`Rate limit: ${firstRateLimited.headers.limit} requests`);
      console.log(`Retry after: ${firstRateLimited.headers.retryAfter}s`);
      
      if (firstRateLimited.headers.reset) {
        const resetTime = new Date(firstRateLimited.headers.reset * 1000);
        console.log(`Reset time: ${resetTime.toLocaleTimeString()}`);
      }
    } else {
      console.log(`${colors.green}✓ No rate limiting occurred${colors.reset}`);
      console.log(`${colors.yellow}Try increasing the number of requests to trigger rate limiting${colors.reset}`);
    }
  }
}

// Run the test
runTest().catch(console.error);
