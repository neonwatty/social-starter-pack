# demo-recorder

Record demo videos and screenshots of web apps using Playwright.

## Installation

```bash
npm install -g @neonwatty/demo-recorder
```

Requires FFmpeg for video processing:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

## Commands

```
demo-recorder create <id>              Create a new demo definition file
demo-recorder record <demo-file>       Record video from demo definition
demo-recorder screenshot <demo-file>   Capture screenshots (auto after each interaction)
demo-recorder list                     List all demo definition files
demo-recorder thumbnail <video>        Extract thumbnail from video
demo-recorder gif <video>              Convert video to animated GIF
demo-recorder markdown <dir>           Generate markdown docs from screenshots
demo-recorder embed <video>            Generate embed code snippets
demo-recorder viewports                List available viewport presets
```

## Demo Definition Files

Create a TypeScript file defining your demo:

```typescript
// demos/my-app.ts
export default {
  url: 'https://example.com',
  viewport: 'desktop',
  actions: [
    { type: 'click', selector: '#login-btn' },
    { type: 'type', selector: '#email', text: 'user@example.com' },
    { type: 'wait', duration: 1000 },
    { type: 'screenshot', name: 'login-form' }
  ]
}
```

## Examples

Create a new demo:
```bash
demo-recorder create my-app
# Creates demos/my-app.ts template
```

Record a video:
```bash
demo-recorder record demos/my-app.ts -o output.mp4
```

Capture screenshots:
```bash
demo-recorder screenshot demos/my-app.ts -o ./screenshots
```

Convert to GIF:
```bash
demo-recorder gif video.mp4 -o demo.gif
```

Extract thumbnail:
```bash
demo-recorder thumbnail video.mp4 -o thumb.png
```

Generate documentation:
```bash
demo-recorder markdown ./screenshots -o DEMO.md
```

List viewport presets:
```bash
demo-recorder viewports
# Shows: desktop, mobile, tablet, etc.
```
