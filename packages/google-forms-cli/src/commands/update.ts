import { getAuthenticatedClient } from "../auth";
import { updateFormInfo } from "../api/forms";
import { success, error } from "../utils/output";

export async function handleUpdate(args: string[]): Promise<void> {
  let formId: string | undefined;
  let title: string | undefined;
  let description: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--title" || arg === "-t") {
      title = args[++i];
    } else if (arg === "--description" || arg === "-d") {
      description = args[++i];
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId) {
    error('Usage: gforms update <form-id> [--title "..."] [--description "..."]');
    process.exit(1);
  }

  if (!title && description === undefined) {
    error("Please specify at least one update: --title or --description");
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    await updateFormInfo(auth, formId, { title, description });
    success("Form updated.");
  } catch (err) {
    error(`Failed to update form: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
