/**
 * Script to replace console.log statements with proper logger calls
 * 
 * This script helps replace console.log, console.error, console.warn, console.info, and console.debug
 * statements with proper logger calls.
 * 
 * Usage:
 * node scripts/replace-console-logs.js <file-path>
 */

const fs = require('fs');
const path = require('path');

// Check if a file path was provided
if (process.argv.length < 3) {
  console.error('Please provide a file path to process');
  console.log('Usage: node scripts/replace-console-logs.js <file-path>');
  process.exit(1);
}

// Get the file path from command line arguments
const filePath = process.argv[2];

// Check if the file exists
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read the file content
const content = fs.readFileSync(filePath, 'utf8');

// Determine if this is a client-side or server-side file
const isClientSide = filePath.includes('/components/') || 
                     filePath.includes('/hooks/') || 
                     (filePath.includes('/app/') && !filePath.includes('/api/'));

// Determine the logger import statement
const loggerImport = isClientSide
  ? "import { clientLogger } from '@/lib/logger/client-logger';"
  : "import { logger } from '@/lib/logger';";

// Check if the logger is already imported
const hasLoggerImport = content.includes(isClientSide ? 'clientLogger' : 'logger');

// Create a logger variable name based on the file name
const fileName = path.basename(filePath, path.extname(filePath));
const loggerVarName = `${fileName.replace(/[^a-zA-Z0-9]/g, '')}Logger`;

// Create the logger initialization statement
const loggerInit = isClientSide
  ? `const ${loggerVarName} = clientLogger.child('${fileName}');`
  : `const ${loggerVarName} = logger.child('${fileName}');`;

// Replace console.log statements with logger calls
let modifiedContent = content;

// Replace console.log
modifiedContent = modifiedContent.replace(
  /console\.log\((.*?)\);/g, 
  `${loggerVarName}.debug($1);`
);

// Replace console.error
modifiedContent = modifiedContent.replace(
  /console\.error\((.*?)\);/g, 
  `${loggerVarName}.error($1);`
);

// Replace console.warn
modifiedContent = modifiedContent.replace(
  /console\.warn\((.*?)\);/g, 
  `${loggerVarName}.warn($1);`
);

// Replace console.info
modifiedContent = modifiedContent.replace(
  /console\.info\((.*?)\);/g, 
  `${loggerVarName}.info($1);`
);

// Replace console.debug
modifiedContent = modifiedContent.replace(
  /console\.debug\((.*?)\);/g, 
  `${loggerVarName}.debug($1);`
);

// Add the logger import if it's not already there
if (!hasLoggerImport) {
  // Find the last import statement
  const lastImportIndex = content.lastIndexOf('import');
  if (lastImportIndex !== -1) {
    const lastImportEndIndex = content.indexOf('\n', lastImportIndex);
    if (lastImportEndIndex !== -1) {
      modifiedContent = 
        content.substring(0, lastImportEndIndex + 1) + 
        loggerImport + '\n' + 
        content.substring(lastImportEndIndex + 1);
    }
  }
}

// Add the logger initialization
// Find a good place to add the logger initialization
const componentStartIndex = modifiedContent.indexOf('function ') || modifiedContent.indexOf('const ');
if (componentStartIndex !== -1) {
  // Find the line before the component definition
  const lineBeforeComponent = modifiedContent.lastIndexOf('\n', componentStartIndex);
  if (lineBeforeComponent !== -1) {
    modifiedContent = 
      modifiedContent.substring(0, lineBeforeComponent + 1) + 
      '\n' + loggerInit + '\n' + 
      modifiedContent.substring(lineBeforeComponent + 1);
  }
}

// Write the modified content back to the file
fs.writeFileSync(filePath + '.modified', modifiedContent);

console.log(`Modified file saved as ${filePath}.modified`);
console.log('Please review the changes before replacing the original file.');
