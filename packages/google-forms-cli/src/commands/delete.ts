import * as readline from "readline";
import { getAuthenticatedClient } from "../auth";
import { deleteForm, getForm } from "../api/forms";
import { success, error, warn } from "../utils/output";

export async function handleDelete(args: string[]): Promise<void> {
  let formId: string | undefined;
  let confirmed = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--confirm" || arg === "-y") {
      confirmed = true;
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId) {
    error("Usage: gforms delete <form-id> [--confirm]");
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();

    // Get form info first
    const form = await getForm(auth, formId);

    if (!confirmed) {
      warn(`You are about to delete: "${form.title}"`);
      const answer = await askConfirmation("Are you sure? (y/N): ");
      if (answer.toLowerCase() !== "y") {
        console.log("Cancelled.");
        return;
      }
    }

    await deleteForm(auth, formId);
    success(`Form "${form.title}" deleted.`);
  } catch (err) {
    error(`Failed to delete form: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

function askConfirmation(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
