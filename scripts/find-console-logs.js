/**
 * Script to find console.log statements in the codebase
 * 
 * This script searches for console.log, console.error, console.warn, console.info, and console.debug
 * statements in the codebase and reports their locations.
 * 
 * Usage:
 * node scripts/find-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to search
const SEARCH_DIRS = ['src'];

// File extensions to search
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to search for
const PATTERNS = [
  'console.log',
  'console.error',
  'console.warn',
  'console.info',
  'console.debug',
];

// Files to ignore (relative to project root)
const IGNORE_FILES = [
  'src/lib/logger/index.ts',
  'src/lib/logger/client-logger.ts',
  'jest.setup.js',
  'scripts/find-console-logs.js',
];

// Function to check if a file should be ignored
function shouldIgnoreFile(filePath) {
  return IGNORE_FILES.some(ignorePath => filePath.endsWith(ignorePath));
}

// Function to search for patterns in a file
function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const results = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of PATTERNS) {
        if (line.includes(pattern)) {
          // Check if this is a commented line
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('*')) {
            results.push({
              pattern,
              line: i + 1,
              content: line.trim(),
            });
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Function to walk a directory and find files
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(filePath))) {
      if (!shouldIgnoreFile(filePath)) {
        callback(filePath);
      }
    }
  });
}

// Main function
function main() {
  console.log('Searching for console statements...');
  
  const results = {};
  let totalCount = 0;
  
  SEARCH_DIRS.forEach(dir => {
    walkDir(dir, filePath => {
      const fileResults = searchFile(filePath);
      if (fileResults.length > 0) {
        results[filePath] = fileResults;
        totalCount += fileResults.length;
      }
    });
  });
  
  console.log(`\nFound ${totalCount} console statements in ${Object.keys(results).length} files:\n`);
  
  for (const [filePath, fileResults] of Object.entries(results)) {
    console.log(`\x1b[1m${filePath}\x1b[0m (${fileResults.length} occurrences):`);
    fileResults.forEach(result => {
      console.log(`  Line ${result.line}: \x1b[33m${result.content}\x1b[0m`);
    });
    console.log('');
  }
  
  console.log('To properly log in production, replace these with the appropriate logger:');
  console.log('- Server-side: import { logger } from "@/lib/logger"');
  console.log('- Client-side: import { clientLogger } from "@/lib/logger/client-logger"');
}

// Run the main function
main();
