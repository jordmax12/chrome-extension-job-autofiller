# Simple Chrome Extension

A basic Chrome extension that displays "Hello World" in a popup with a close button.

## Files Structure
```
chrome-job-auto-filler/
├── manifest.json       # Extension configuration
├── popup.html         # Popup interface
├── popup.js          # Popup functionality
├── ICON_SETUP.md     # Instructions for adding icons
└── README.md         # This file
```

## Installation Instructions

1. **Open Chrome Extensions Page**:
   - Go to `chrome://extensions/` in your Chrome browser
   - OR click the three dots menu → More tools → Extensions

2. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**:
   - Click "Load unpacked"
   - Navigate to and select the `chrome-job-auto-filler` folder
   - Click "Select Folder"

4. **Test the Extension**:
   - You should see the extension appear in your extensions list
   - Click the extension icon in the Chrome toolbar (puzzle piece icon if needed)
   - Click on your extension to open the popup
   - You should see "Hello World!" with a close button

## Usage

- Click the extension icon in the Chrome toolbar
- A popup will appear showing "Hello World!"
- Click the "Close" button to close the popup

## Next Steps

This is a basic foundation. You can now:
- Add more functionality to the popup
- Add content scripts to interact with web pages
- Add background scripts for persistent functionality
- Style the popup further
- Add icons (see ICON_SETUP.md)

## Troubleshooting

- **Extension not loading**: Make sure you selected the correct folder containing `manifest.json`
- **Popup not showing**: Check the Chrome DevTools console for any JavaScript errors
- **Icon not showing**: Add icon files or remove icon references from manifest.json (see ICON_SETUP.md)
