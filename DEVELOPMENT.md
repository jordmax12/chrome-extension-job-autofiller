# Development Setup with Live Reload

This guide shows you how to set up live reload for faster Chrome extension development.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd chrome-job-auto-filler
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

You should see:
```
🚀 Chrome Extension Dev Server Starting...
👀 Watching for changes in:
   - manifest.json
   - popup.html
   - popup.js
   - content.js
   - *.css files
   - *.json files

🌐 WebSocket server running on ws://localhost:8080
💡 Make sure to reload your extension once to connect to dev server
```

### 3. Load Extension in Chrome
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-job-auto-filler` folder
4. **Important**: Click the reload button on your extension once to connect to the dev server

### 4. Start Developing!
Now when you make changes to any of these files:
- `manifest.json`
- `popup.html`
- `popup.js` 
- `content.js`
- Any `.css` or `.json` files

The extension will **automatically reload** in Chrome! 🎉

## 🔧 How It Works

1. **File Watcher**: `dev-server.js` watches for file changes using `chokidar`
2. **WebSocket Communication**: When files change, the dev server sends a message via WebSocket
3. **Background Script**: `background.js` listens for reload messages and calls `chrome.runtime.reload()`
4. **Automatic Reload**: Chrome reloads the entire extension with your changes

## 📝 Development Workflow

1. Start the dev server: `npm run dev`
2. Make changes to your extension files
3. See changes instantly in Chrome (no manual reload needed!)
4. Check the dev server console for file change notifications
5. Check Chrome DevTools for any errors

