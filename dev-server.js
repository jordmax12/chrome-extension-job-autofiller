#!/usr/bin/env node

const chokidar = require('chokidar');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

console.log('🚀 Chrome Extension Dev Server Starting...');

// Create WebSocket server for communication with extension
const wss = new WebSocket.Server({ port: 8080 });

// Track connected clients
let clients = new Set();

wss.on('connection', function connection(ws) {
    clients.add(ws);
    console.log('📱 Extension connected to dev server');
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log('📱 Extension disconnected from dev server');
    });
});

// Function to notify all connected extensions to reload
function notifyReload(changedFile) {
    if (clients.size > 0) {
        console.log(`🔄 File changed: ${changedFile}`);
        console.log(`📡 Notifying ${clients.size} connected extension(s) to reload...`);
        
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'RELOAD',
                    file: changedFile,
                    timestamp: Date.now()
                }));
            }
        });
    }
}

// Watch for file changes
const watcher = chokidar.watch([
    'manifest.json',
    'popup.html',
    'popup.js',
    'content.js',
    '*.css',
    '*.json'
], {
    ignored: [
        'node_modules/**',
        '.git/**',
        'package-lock.json',
        'dev-server.js'
    ],
    persistent: true,
    ignoreInitial: true
});

watcher
    .on('change', (filePath) => {
        const relativePath = path.relative(process.cwd(), filePath);
        notifyReload(relativePath);
    })
    .on('add', (filePath) => {
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`➕ New file: ${relativePath}`);
        notifyReload(relativePath);
    })
    .on('unlink', (filePath) => {
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`🗑️  Deleted file: ${relativePath}`);
        notifyReload(relativePath);
    });

console.log('👀 Watching for changes in:');
console.log('   - manifest.json');
console.log('   - popup.html');
console.log('   - popup.js');
console.log('   - content.js');
console.log('   - *.css files');
console.log('   - *.json files');
console.log('');
console.log('🌐 WebSocket server running on ws://localhost:8080');
console.log('💡 Make sure to reload your extension once to connect to dev server');
console.log('');
console.log('Press Ctrl+C to stop watching...');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping dev server...');
    watcher.close();
    wss.close();
    process.exit(0);
});
