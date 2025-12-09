import { getAuthenticatedClient } from "../auth";
import { getForm, getQuestions } from "../api/forms";
import { error, printJson, printKeyValue, printTable } from "../utils/output";

export async function handleGet(args: string[]): Promise<void> {
  let formId: string | undefined;
  let jsonOutput = false;
  let includeQuestions = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--json") {
      jsonOutput = true;
    } else if (arg === "--include-questions" || arg === "-q") {
      includeQuestions = true;
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId) {
    error("Usage: gforms get <form-id> [--json] [--include-questions]");
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    const form = await getForm(auth, formId);

    if (jsonOutput) {
      if (includeQuestions) {
        const questions = await getQuestions(auth, formId);
        printJson({ ...form, questions });
      } else {
        printJson(form);
      }
    } else {
      printKeyValue({
        "Form ID": form.formId,
        Title: form.title,
        Description: form.description || "(none)",
        Questions: form.questionCount,
        "Edit URL": form.editUri,
        "Response URL": form.responderUri,
      });

      if (includeQuestions) {
        const questions = await getQuestions(auth, formId);
        if (questions.length > 0) {
          console.log("\nQuestions:");
          printTable(
            ["ID", "Type", "Title", "Required"],
            questions.map((q) => [q.itemId, q.type, q.title, q.required ? "Yes" : "No"])
          );
        }
      }
    }
  } catch (err) {
    error(`Failed to get form: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
