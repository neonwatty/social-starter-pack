#!/usr/bin/env node

import { handleAuth } from "./commands/auth";
import { handleCreate } from "./commands/create";
import { handleList } from "./commands/list";
import { handleGet } from "./commands/get";
import { handleUpdate } from "./commands/update";
import { handleDelete } from "./commands/delete";
import {
  handleAddQuestion,
  handleUpdateQuestion,
  handleDeleteQuestion,
  handleMoveQuestion,
  handleAddSection,
} from "./commands/questions";
import { handleResponses, handleWatch } from "./commands/responses";
import { handleExport, handleImport } from "./commands/importExport";

const VERSION = "1.0.0";

function printHelp(): void {
  console.log(`
Google Forms CLI v${VERSION}

Usage: gforms <command> [options]

Authentication:
  auth                    Authenticate with Google
  auth --status           Check authentication status
  auth --logout           Clear stored credentials

Form Management:
  create <title>          Create a new form
    --description, -d     Form description
    --json                Output as JSON

  list                    List all forms
    --limit, -l           Limit number of results
    --json                Output as JSON

  get <form-id>           Get form details
    --include-questions   Include question list
    --json                Output as JSON

  update <form-id>        Update form metadata
    --title, -t           New title
    --description, -d     New description
    --collect-emails      Email collection: none, verified, input

  delete <form-id>        Delete a form
    --confirm, -y         Skip confirmation prompt

Question Management:
  add-question <form-id>  Add a question
    --type, -t            Question type (required)
    --title               Question title (required)
    --description, -d     Helper text
    --required, -r        Make required
    --options, -o         Comma-separated options
    --low, --high         Scale range
    --low-label           Low end label
    --high-label          High end label

  update-question <form-id> <item-id>
    --title               New title
    --description, -d     New description
    --required            true/false
    --options, -o         New options

  delete-question <form-id> <item-id>
                          Delete a question

  move-question <form-id> <item-id>
    --to                  New index position

  add-section <form-id>   Add a page break/section
    --title               Section title (required)
    --description, -d     Section description

Question Types:
  short-answer, paragraph, multiple-choice, checkbox,
  dropdown, linear-scale, date, time

Responses:
  responses <form-id>     Get form responses
    --format, -f          Output format (json, csv, table)
    --json                Shortcut for --format json
    --csv                 Shortcut for --format csv
    --count               Show only response count
    --limit, -l           Limit number of responses
    --after               Filter by date (YYYY-MM-DD)

  watch <form-id>         Watch for new responses
    --interval, -i        Poll interval in seconds (default: 60)
    --exec                Command to run on new response

Import/Export:
  export <form-id>        Export form structure
    --format, -f          Output format (json, yaml)
    --yaml                Shortcut for --format yaml

  import <file>           Create form from template
    --title, -t           Override template title

Other:
  help                    Show this help message
  --version, -v           Show version

Examples:
  gforms auth
  gforms create "Customer Survey" --description "Annual feedback"
  gforms add-question abc123 --type multiple-choice --title "Rating?" --options "Good,OK,Bad" --required
  gforms responses abc123 --csv > responses.csv
  gforms export abc123 --yaml > template.yaml
  gforms import template.yaml --title "New Survey"
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return;
  }

  if (args[0] === "--version" || args[0] === "-v") {
    console.log(VERSION);
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case "auth":
        await handleAuth(commandArgs);
        break;

      case "create":
        await handleCreate(commandArgs);
        break;

      case "list":
        await handleList(commandArgs);
        break;

      case "get":
        await handleGet(commandArgs);
        break;

      case "update":
        await handleUpdate(commandArgs);
        break;

      case "delete":
        await handleDelete(commandArgs);
        break;

      case "add-question":
        await handleAddQuestion(commandArgs);
        break;

      case "update-question":
        await handleUpdateQuestion(commandArgs);
        break;

      case "delete-question":
        await handleDeleteQuestion(commandArgs);
        break;

      case "move-question":
        await handleMoveQuestion(commandArgs);
        break;

      case "add-section":
        await handleAddSection(commandArgs);
        break;

      case "responses":
        await handleResponses(commandArgs);
        break;

      case "watch":
        await handleWatch(commandArgs);
        break;

      case "export":
        await handleExport(commandArgs);
        break;

      case "import":
        await handleImport(commandArgs);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "gforms help" for usage information.');
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
