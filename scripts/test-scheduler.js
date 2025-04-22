/**
 * Test scheduler for scheduled chapter publishing
 * 
 * This script runs a cron job that calls the scheduled tasks API endpoint
 * every 3 minutes to check for and publish scheduled chapters.
 * 
 * Usage:
 *   node scripts/test-scheduler.js
 */

import cron from 'node-cron';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration
const API_URL = process.env.API_URL || "http://localhost:3000/api/scheduled-tasks";
const API_KEY = process.env.SCHEDULED_TASKS_API_KEY || "ilovemili";

console.log("🚀 Starting scheduled tasks test scheduler");
console.log(`📡 API URL: ${API_URL}`);
console.log(`🔑 Using API key: ${API_KEY.substring(0, 3)}...${API_KEY.substring(API_KEY.length - 3)}`);
console.log("⏱️ Schedule: Every 3 minutes");

// Initial run on startup
runScheduledTasks();

// Schedule: every 3 minutes
cron.schedule("*/3 * * * *", runScheduledTasks);

/**
 * Run the scheduled tasks by calling the API endpoint
 */
async function runScheduledTasks() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ⏱️ Running scheduled task check...`);

  try {
    // Call the API endpoint
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        tasks: ["publishScheduledChapters"],
      }),
    });

    // Parse the response
    const data = await response.json();

    // Check if the request was successful
    if (response.ok) {
      console.log(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      
      // Log published chapters if any
      const publishedChapters = data.results?.publishScheduledChapters?.publishedChapters || 0;
      const updatedStories = data.results?.publishScheduledChapters?.updatedStories || 0;
      
      if (publishedChapters > 0) {
        console.log(`📚 Published ${publishedChapters} chapter(s) and updated ${updatedStories} story status(es)`);
      } else {
        console.log(`📝 No chapters were due for publishing`);
      }
    } else {
      console.error(`❌ Error (${response.status}): ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error(`❌ Error calling scheduled task API:`, error.message);
  }
}

// Keep the process running
console.log("\n⏳ Scheduler is running. Press Ctrl+C to stop.");
