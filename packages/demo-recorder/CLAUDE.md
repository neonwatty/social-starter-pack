# Claude Code Instructions

This project is a CLI tool for recording demo videos and screenshots of web apps.

## Example Prompts

### Creating Demos

- "Create a demo for my app at localhost:3000 that shows the login flow"
- "Make a demo file that clicks through the signup process"

### Recording Videos

- "Record a video of the example demo"
- "Run the bleep wordlist demo and record it"
- "Record demos/my-feature.demo.ts with headed mode"

### Capturing Screenshots

- "Take screenshots of the hackernews demo"
- "Capture screenshots from the bleep wordlist demo"
- "Create a screenshot walkthrough of the signup flow"
- "Generate screenshots for documentation from demos/example.demo.ts"

### Both Outputs

- "Record a video and capture screenshots of the login demo"
- "I need both a video and screenshots of this feature demo"

### Thumbnails

- "Create a thumbnail from the video"
- "Extract a preview image from the recording"
- "Generate a thumbnail at 5 seconds into the video"

### GIF Conversion

- "Convert the video to a GIF"
- "Make a GIF from the demo recording for the README"
- "Create an animated GIF at 600px wide with 8 fps"

### Documentation Generation

- "Generate markdown docs from the screenshots"
- "Create a walkthrough document from the captured screenshots"
- "Export the screenshots to markdown format"

### Embed Code

- "Generate embed code for the video"
- "Create HTML snippets to embed the demo video"
- "Get the code to put this video in my README"

### Mobile Screenshots

- "Capture screenshots on iPhone 15 Pro viewport"
- "Take mobile screenshots of the demo"
- "Run the demo on iPad viewport"

### Annotated Screenshots

- "Add step numbers to the screenshots"
- "Capture screenshots with action captions"
- "Take numbered screenshots for the tutorial"

## Commands Reference

```bash
# Video recording
demo-recorder record <demo-file> [--headed] [--no-convert]

# Screenshot capture
demo-recorder screenshot <demo-file> [--format png|jpeg|webp] [--headed] [--no-gallery]
  [--viewport <preset>] [--step-numbers] [--step-position <pos>] [--captions]

# Thumbnail extraction
demo-recorder thumbnail <video-file> [-t <seconds>] [-w <width>] [-f <format>]

# GIF conversion
demo-recorder gif <video-file> [--fps <n>] [--width <n>] [--fast]

# Markdown documentation
demo-recorder markdown <screenshot-dir> [-t <title>] [-d <description>] [--timestamps] [--selectors]

# Embed code generation
demo-recorder embed <video-file> [-w <width>] [-h <height>] [--autoplay] [--loop] [--poster <url>]

# List viewport presets
demo-recorder viewports

# Create new demo
demo-recorder create <id> --url <url>

# List demos
demo-recorder list
```

## Output Locations

- Videos: `output/<demo-id>/<filename>.mp4`
- Screenshots: `output/<demo-id>/screenshot-*.png`
- Gallery: `output/<demo-id>/gallery.html`
- Thumbnails: `output/<demo-id>/<filename>-thumb.png`
- GIFs: `output/<demo-id>/<filename>.gif`
- Markdown: `output/<demo-id>/walkthrough.md`
- Embed snippets: `output/<demo-id>/<filename>-embed.md`
