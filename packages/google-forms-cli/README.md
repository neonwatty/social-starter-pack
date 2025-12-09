# google-forms-cli

CLI tool for managing Google Forms - create forms, add questions, and export responses.

## Setup

### Google Cloud Setup

1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Forms API** and **Google Drive API**
3. Create **OAuth 2.0 credentials** (Desktop application type)
4. Add `http://localhost:3000` as authorized redirect URI

### Requirements

- Node.js 18+

## Installation

```bash
npm install
npm run build
npm link
```

Or install globally from npm:

```bash
npm install -g @neonwatty/google-forms-cli
```

## Secrets Configuration

### Option A: Environment Variables

```bash
export GOOGLE_FORMS_CLIENT_ID=your-client-id
export GOOGLE_FORMS_CLIENT_SECRET=your-client-secret
```

### Option B: Local .env File

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Option C: Local client_secrets.json

Download OAuth credentials from Google Cloud Console as `client_secrets.json`.

## Commands

### `gforms auth`

Authenticate with Google (required before other commands).

```bash
gforms auth              # Start OAuth flow
gforms auth --status     # Check auth status
gforms auth --logout     # Clear stored credentials
```

### `gforms create <title> [options]`

Create a new form.

| Option              | Description      |
| ------------------- | ---------------- |
| `--description, -d` | Form description |
| `--json`            | Output as JSON   |

```bash
gforms create "Customer Survey"
gforms create "Feedback Form" --description "Please share your thoughts"
gforms create "Quick Poll" --json
```

### `gforms list [options]`

List all your forms.

| Option        | Description                     |
| ------------- | ------------------------------- |
| `--limit, -l` | Max forms to show (default: 50) |
| `--json`      | Output as JSON                  |

```bash
gforms list
gforms list --limit 20 --json
```

### `gforms get <form-id> [options]`

Get form details.

| Option                | Description           |
| --------------------- | --------------------- |
| `--include-questions` | Include question list |
| `--json`              | Output as JSON        |

```bash
gforms get abc123
gforms get abc123 --include-questions
gforms get abc123 --json
```

### `gforms update <form-id> [options]`

Update form metadata.

| Option              | Description     |
| ------------------- | --------------- |
| `--title, -t`       | New title       |
| `--description, -d` | New description |

```bash
gforms update abc123 --title "New Title"
gforms update abc123 --description "Updated description"
```

### `gforms delete <form-id> [options]`

Delete a form.

| Option          | Description              |
| --------------- | ------------------------ |
| `--confirm, -y` | Skip confirmation prompt |

```bash
gforms delete abc123
gforms delete abc123 --confirm
```

### `gforms add-question <form-id> [options]`

Add a question to a form.

| Option              | Description                                |
| ------------------- | ------------------------------------------ |
| `--type, -t`        | Question type (required)                   |
| `--title`           | Question title (required)                  |
| `--description, -d` | Helper text                                |
| `--required, -r`    | Make question required                     |
| `--options, -o`     | Comma-separated options (for choice types) |
| `--low`             | Low value (for linear-scale)               |
| `--high`            | High value (for linear-scale)              |
| `--low-label`       | Label for low end                          |
| `--high-label`      | Label for high end                         |

**Question Types:** `short-answer`, `paragraph`, `multiple-choice`, `checkbox`, `dropdown`, `linear-scale`, `date`, `time`

```bash
gforms add-question abc123 --type short-answer --title "What is your name?"
gforms add-question abc123 --type multiple-choice --title "Favorite color?" --options "Red,Blue,Green" --required
gforms add-question abc123 --type linear-scale --title "Rate 1-10" --low 1 --high 10
gforms add-question abc123 --type paragraph --title "Any comments?" --description "Optional feedback"
```

### `gforms update-question <form-id> <item-id> [options]`

Update an existing question.

| Option              | Description                 |
| ------------------- | --------------------------- |
| `--title`           | New title                   |
| `--description, -d` | New description             |
| `--required`        | true/false                  |
| `--options, -o`     | New comma-separated options |

```bash
gforms update-question abc123 xyz789 --title "Updated question"
gforms update-question abc123 xyz789 --required true
```

### `gforms delete-question <form-id> <item-id>`

Delete a question from a form.

```bash
gforms delete-question abc123 xyz789
```

### `gforms move-question <form-id> <item-id> --to <index>`

Move a question to a new position.

```bash
gforms move-question abc123 xyz789 --to 0
```

### `gforms add-section <form-id> [options]`

Add a page break/section.

| Option              | Description              |
| ------------------- | ------------------------ |
| `--title`           | Section title (required) |
| `--description, -d` | Section description      |

```bash
gforms add-section abc123 --title "Part 2" --description "Additional questions"
```

### `gforms responses <form-id> [options]`

Get form responses.

| Option         | Description                     |
| -------------- | ------------------------------- |
| `--format, -f` | Output format: json, csv, table |
| `--json`       | Shortcut for --format json      |
| `--csv`        | Shortcut for --format csv       |
| `--count`      | Show only response count        |
| `--limit, -l`  | Limit number of responses       |
| `--after`      | Filter by date (YYYY-MM-DD)     |

```bash
gforms responses abc123
gforms responses abc123 --count
gforms responses abc123 --csv > responses.csv
gforms responses abc123 --json --limit 100
gforms responses abc123 --after "2024-01-01"
```

### `gforms watch <form-id> [options]`

Watch for new responses (polling).

| Option           | Description                            |
| ---------------- | -------------------------------------- |
| `--interval, -i` | Poll interval in seconds (default: 60) |
| `--exec`         | Command to run on new response         |

```bash
gforms watch abc123
gforms watch abc123 --interval 30
gforms watch abc123 --exec "notify-send 'New response!'"
```

### `gforms export <form-id> [options]`

Export form structure as a template.

| Option         | Description                |
| -------------- | -------------------------- |
| `--format, -f` | Output format: json, yaml  |
| `--yaml`       | Shortcut for --format yaml |

```bash
gforms export abc123 > template.json
gforms export abc123 --yaml > template.yaml
```

### `gforms import <file> [options]`

Create a form from a template file.

| Option        | Description             |
| ------------- | ----------------------- |
| `--title, -t` | Override template title |

```bash
gforms import template.json
gforms import template.yaml --title "New Survey"
```

## Template Format

Templates can be JSON or YAML:

```json
{
  "title": "Customer Feedback",
  "description": "Please share your experience",
  "questions": [
    {
      "type": "multiple-choice",
      "title": "How satisfied are you?",
      "required": true,
      "options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"]
    },
    {
      "type": "paragraph",
      "title": "Any additional comments?",
      "required": false
    }
  ]
}
```

## Token Storage

Credentials are stored at `~/.config/google-forms-cli/token.json` and automatically refreshed.

## License

MIT
