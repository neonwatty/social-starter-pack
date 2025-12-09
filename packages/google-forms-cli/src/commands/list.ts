import { getAuthenticatedClient } from "../auth";
import { listForms } from "../api/forms";
import { error, info, printJson, printTable } from "../utils/output";

export async function handleList(args: string[]): Promise<void> {
  let limit: number | undefined;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--limit" || arg === "-l") {
      limit = parseInt(args[++i], 10);
    } else if (arg === "--json") {
      jsonOutput = true;
    }
  }

  try {
    const auth = await getAuthenticatedClient();
    const forms = await listForms(auth, limit);

    if (forms.length === 0) {
      info("No forms found.");
      return;
    }

    if (jsonOutput) {
      printJson(forms);
    } else {
      printTable(
        ["Form ID", "Title", "Questions"],
        forms.map((f) => [f.formId, f.title, String(f.questionCount)])
      );
    }
  } catch (err) {
    error(`Failed to list forms: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
