#!/usr/bin/env node

const path = require('path');

console.log('🚀 Starting Template Playground Server...');
console.log('');

// Parse command line arguments
const args = process.argv.slice(2);
let port = undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    port = parseInt(args[i + 1], 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('❌ Invalid port number. Port must be between 1 and 65535.');
      process.exit(1);
    }
    break;
  }
}

// Display usage info
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node start-playground-simple.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  -p, --port <number>    Port to run the server on (default: 3001)');
  console.log('  -h, --help            Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  PLAYGROUND_PORT       Port to run the server on');
  console.log('  PORT                  Alternative port variable');
  console.log('');
  console.log('Examples:');
  console.log('  node start-playground-simple.js --port 3002');
  console.log('  PLAYGROUND_PORT=3002 node start-playground-simple.js');
  process.exit(0);
}

// Change to project root
process.chdir(path.join(__dirname, '..'));

try {
  // Import and start the server
  const { TemplatePlaygroundServer } = require('../dist/template-playground-server.js');

  console.log('✅ Server module loaded successfully');

  const server = new TemplatePlaygroundServer(port);
  console.log('✅ Server instance created');

  server.start()
    .then(() => {
      console.log('✅ Template Playground is now running!');
      console.log(`🌐 Open http://localhost:${port || process.env.PLAYGROUND_PORT || process.env.PORT || 3001} in your browser`);
      console.log('');
      console.log('💡 Press Ctrl+C to stop the server');
    })
    .catch(error => {
      console.error('❌ Failed to start server:', error.message);
      console.error('');
      console.error('📝 Make sure you have run: npm run build && npm run build-template-playground');
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Error loading server module:', error.message);
  console.error('');
  console.error('📝 Make sure you have run: npm run build && npm run build-template-playground');
  console.error('📝 If the issue persists, try: npm install');
  process.exit(1);
}
