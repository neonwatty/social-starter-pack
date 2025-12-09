import { getAuthenticatedClient } from "../auth";
import { createForm } from "../api/forms";
import { success, error, printKeyValue, printJson } from "../utils/output";

export async function handleCreate(args: string[]): Promise<void> {
  // Parse arguments
  let title: string | undefined;
  let description: string | undefined;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--description" || arg === "-d") {
      description = args[++i];
    } else if (arg === "--json") {
      jsonOutput = true;
    } else if (!arg.startsWith("-") && !title) {
      title = arg;
    }
  }

  if (!title) {
    error('Usage: gforms create <title> [--description "..."] [--json]');
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    const form = await createForm(auth, title, description);

    if (jsonOutput) {
      printJson(form);
    } else {
      success(`Form created: ${form.formId}`);
      printKeyValue({
        Title: form.title,
        "Edit URL": form.editUri,
        "Response URL": form.responderUri,
      });
    }
  } catch (err) {
    error(`Failed to create form: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
