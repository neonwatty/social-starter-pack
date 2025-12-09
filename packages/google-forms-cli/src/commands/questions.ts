import { getAuthenticatedClient } from "../auth";
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  moveQuestion,
  addSection,
} from "../api/questions";
import { QuestionType } from "../api/types";
import { success, error } from "../utils/output";

const VALID_TYPES: QuestionType[] = [
  "short-answer",
  "paragraph",
  "multiple-choice",
  "checkbox",
  "dropdown",
  "linear-scale",
  "date",
  "time",
];

export async function handleAddQuestion(args: string[]): Promise<void> {
  let formId: string | undefined;
  let type: QuestionType | undefined;
  let title: string | undefined;
  let description: string | undefined;
  let required = false;
  let options: string[] | undefined;
  let lowValue: number | undefined;
  let highValue: number | undefined;
  let lowLabel: string | undefined;
  let highLabel: string | undefined;
  let afterItemId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--type" || arg === "-t") {
      type = args[++i] as QuestionType;
    } else if (arg === "--title") {
      title = args[++i];
    } else if (arg === "--description" || arg === "-d") {
      description = args[++i];
    } else if (arg === "--required" || arg === "-r") {
      required = true;
    } else if (arg === "--options" || arg === "-o") {
      options = args[++i].split(",").map((o) => o.trim());
    } else if (arg === "--low") {
      lowValue = parseInt(args[++i], 10);
    } else if (arg === "--high") {
      highValue = parseInt(args[++i], 10);
    } else if (arg === "--low-label") {
      lowLabel = args[++i];
    } else if (arg === "--high-label") {
      highLabel = args[++i];
    } else if (arg === "--after") {
      afterItemId = args[++i];
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId || !type || !title) {
    error('Usage: gforms add-question <form-id> --type <type> --title "..." [options]');
    console.log("\nTypes:", VALID_TYPES.join(", "));
    console.log("\nOptions:");
    console.log("  --description, -d  Question description/helper text");
    console.log("  --required, -r     Make question required");
    console.log("  --options, -o      Comma-separated options (for choice questions)");
    console.log("  --low, --high      Scale range (for linear-scale)");
    console.log("  --low-label        Label for low end of scale");
    console.log("  --high-label       Label for high end of scale");
    console.log("  --after            Add after specific item ID");
    process.exit(1);
  }

  if (!VALID_TYPES.includes(type)) {
    error(`Invalid type: ${type}. Valid types: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  // Validate options for choice questions
  if (
    ["multiple-choice", "checkbox", "dropdown"].includes(type) &&
    (!options || options.length === 0)
  ) {
    error(`Question type "${type}" requires --options`);
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    const itemId = await addQuestion(auth, formId, {
      type,
      title,
      description,
      required,
      options,
      lowValue,
      highValue,
      lowLabel,
      highLabel,
      afterItemId,
    });

    success(`Question added (ID: ${itemId})`);
  } catch (err) {
    error(`Failed to add question: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export async function handleUpdateQuestion(args: string[]): Promise<void> {
  let title: string | undefined;
  let description: string | undefined;
  let required: boolean | undefined;
  let options: string[] | undefined;

  // First two non-flag args are formId and itemId
  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--title") {
      title = args[++i];
    } else if (arg === "--description" || arg === "-d") {
      description = args[++i];
    } else if (arg === "--required") {
      required = args[++i].toLowerCase() === "true";
    } else if (arg === "--options" || arg === "-o") {
      options = args[++i].split(",").map((o) => o.trim());
    } else if (!arg.startsWith("-")) {
      positionalArgs.push(arg);
    }
  }

  const formId = positionalArgs[0];
  const itemId = positionalArgs[1];

  if (!formId || !itemId) {
    error(
      'Usage: gforms update-question <form-id> <item-id> [--title "..."] [--description "..."] [--required true/false] [--options "..."]'
    );
    process.exit(1);
  }

  if (
    title === undefined &&
    description === undefined &&
    required === undefined &&
    options === undefined
  ) {
    error("Please specify at least one update");
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    await updateQuestion(auth, formId, itemId, { title, description, required, options });
    success("Question updated.");
  } catch (err) {
    error(`Failed to update question: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export async function handleDeleteQuestion(args: string[]): Promise<void> {
  const positionalArgs = args.filter((a) => !a.startsWith("-"));
  const formId = positionalArgs[0];
  const itemId = positionalArgs[1];

  if (!formId || !itemId) {
    error("Usage: gforms delete-question <form-id> <item-id>");
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    await deleteQuestion(auth, formId, itemId);
    success("Question deleted.");
  } catch (err) {
    error(`Failed to delete question: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export async function handleMoveQuestion(args: string[]): Promise<void> {
  let toIndex: number | undefined;

  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--to") {
      toIndex = parseInt(args[++i], 10);
    } else if (!arg.startsWith("-")) {
      positionalArgs.push(arg);
    }
  }

  const formId = positionalArgs[0];
  const itemId = positionalArgs[1];

  if (!formId || !itemId || toIndex === undefined) {
    error("Usage: gforms move-question <form-id> <item-id> --to <index>");
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    await moveQuestion(auth, formId, itemId, toIndex);
    success(`Question moved to index ${toIndex}.`);
  } catch (err) {
    error(`Failed to move question: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export async function handleAddSection(args: string[]): Promise<void> {
  let formId: string | undefined;
  let title: string | undefined;
  let description: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--title") {
      title = args[++i];
    } else if (arg === "--description" || arg === "-d") {
      description = args[++i];
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId || !title) {
    error('Usage: gforms add-section <form-id> --title "..." [--description "..."]');
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    const itemId = await addSection(auth, formId, title, description);
    success(`Section added (ID: ${itemId})`);
  } catch (err) {
    error(`Failed to add section: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
