# Icon Setup Instructions

To complete your Chrome extension, you need to add icon files:

## Required Icons:
- `icon16.png` - 16x16 pixels (for toolbar)
- `icon48.png` - 48x48 pixels (for extension management page)

## How to create icons:

1. **Simple approach**: Create a simple colored square or use any image editor
2. **Online tools**: Use favicon generators or icon makers
3. **Design tools**: Use Canva, Figma, or any graphics software

## Quick solution:
You can temporarily use any 16x16 and 48x48 PNG images renamed to `icon16.png` and `icon48.png`.

## Alternative:
If you don't want to create icons right now, you can remove the icon references from `manifest.json` and the extension will still work (Chrome will use a default icon).

To remove icons, delete these lines from manifest.json:
```json
"default_icon": {
  "16": "icon16.png",
  "48": "icon48.png"
},
```
and
```json
"icons": {
  "16": "icon16.png",
  "48": "icon48.png"
}
```
