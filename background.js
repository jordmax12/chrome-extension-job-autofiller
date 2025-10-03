console.log('🚀 Background script loaded');

// Live reload functionality for development
let devSocket = null;
const DEV_SERVER_URL = 'ws://localhost:8080';

function connectToDevServer() {
    // Only try to connect in development (when the dev server is running)
    try {
        devSocket = new WebSocket(DEV_SERVER_URL);
        
        devSocket.onopen = () => {
            console.log('🔗 Connected to dev server for live reload');
        };
        
        devSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'RELOAD') {
                console.log(`🔄 Reloading extension due to change in: ${message.file}`);
                
                // Reload the extension
                chrome.runtime.reload();
            }
        };
        
        devSocket.onclose = () => {
            // Silently handle connection close and try to reconnect
            devSocket = null;
            setTimeout(connectToDevServer, 2000);
        };
        
        devSocket.onerror = () => {
            // Silently handle connection errors - no console output
            devSocket = null;
        };
        
    } catch (error) {
        // Silently handle any connection errors
        devSocket = null;
    }
}

// Connect to dev server on startup (only in development)
// Check if we're in development mode by looking for unpacked extension
chrome.management.getSelf((extensionInfo) => {
    if (extensionInfo.installType === 'development') {
        console.log('🔧 Development mode detected - enabling live reload');
        connectToDevServer();
    } else {
        console.log('📦 Production mode - live reload disabled');
    }
});

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('📦 Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        console.log('🎉 Extension installed for the first time');
    } else if (details.reason === 'update') {
        console.log('🔄 Extension updated');
    }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received in background:', request);
    
    // Handle different message types here
    if (request.type === 'BACKGROUND_PING') {
        sendResponse({ status: 'Background script is running' });
    }
    
    return true; // Keep message channel open for async responses
});
