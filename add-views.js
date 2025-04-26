// This script compiles and runs the TypeScript script to add views to stories
const { exec } = require('child_process');

// First compile the TypeScript file
exec('npx tsc src/scripts/add-views.ts --esModuleInterop --outDir dist', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error compiling TypeScript: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`TypeScript compilation stderr: ${stderr}`);
  }
  
  console.log(`TypeScript compilation stdout: ${stdout}`);
  console.log('TypeScript compilation complete. Running script...');
  
  // Then run the compiled JavaScript file
  exec('node dist/src/scripts/add-views.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running script: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
    }
    
    console.log(`Script stdout: ${stdout}`);
    console.log('Script execution complete.');
  });
});
