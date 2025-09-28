# Jordan's Auto Job Filler Chrome Extension

A Chrome extension that detects job application forms and helps fill them out automatically.

## Features

- **Smart Detection**: Automatically detects job application forms on websites
- **Domain Recognition**: Recognizes known job platforms like `jobs.ashbyhq.com` and `*.myworkdayjobs.com` (wildcard detection)
- **Field Analysis**: Identifies common form fields (name, email, resume upload, etc.)
- **Visual Feedback**: Shows detection confidence and found fields in popup

## Installation

1. Go to `chrome://extensions/` in Chrome
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select this folder
4. Click the extension icon to test

## Development

For live reload during development:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then reload your extension once in Chrome to connect to the dev server. Now changes to your files will automatically reload the extension!

**Watched files**: `manifest.json`, `popup.html`, `popup.js`, `content.js`, `*.css`, `*.json`

## Usage

1. Navigate to any job application website
2. Click the extension icon in Chrome toolbar
3. View detection results:
   - Green dot = Job application detected
   - Glowing green = Known job platform detected
   - Confidence percentage and detected fields shown

## Adding New Job Domains

To add more guaranteed job application domains, edit `content.js`:

```javascript
const knownJobApplicationDomains = [
    'jobs.ashbyhq.com',
    '*.myworkdayjobs.com',
    'your-new-domain.com'  // Add here
];
```

## Troubleshooting

- **Extension not loading**: Check you selected the correct folder with `manifest.json`
- **Auto-reload not working**: Make sure dev server is running and you reloaded extension once
- **Detection not working**: Check browser console for errors
