#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Template Playground...');
console.log('');

// Run the npm script
const npmProcess = spawn('npm', ['run', 'start-playground'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

npmProcess.on('error', (error) => {
  console.error('❌ Failed to start Template Playground:', error.message);
  process.exit(1);
});

npmProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Template Playground exited with code ${code}`);
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Template Playground...');
  npmProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Template Playground...');
  npmProcess.kill('SIGTERM');
});
