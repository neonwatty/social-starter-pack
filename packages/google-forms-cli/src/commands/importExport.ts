import * as fs from "fs";
import * as yaml from "js-yaml";
import { getAuthenticatedClient } from "../auth";
import { createForm, getForm, getQuestions } from "../api/forms";
import { addQuestion } from "../api/questions";
import { FormTemplate, QuestionType } from "../api/types";
import { success, error, info, printJson } from "../utils/output";

export async function handleExport(args: string[]): Promise<void> {
  let formId: string | undefined;
  let format: "json" | "yaml" = "json";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--format" || arg === "-f") {
      format = args[++i] as "json" | "yaml";
    } else if (arg === "--yaml") {
      format = "yaml";
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId) {
    error("Usage: gforms export <form-id> [--format json|yaml]");
    process.exit(1);
  }

  try {
    const auth = await getAuthenticatedClient();
    const form = await getForm(auth, formId);
    const questions = await getQuestions(auth, formId);

    const template: FormTemplate = {
      title: form.title,
      description: form.description,
      questions: questions.map((q) => ({
        type: q.type as QuestionType,
        title: q.title,
        description: q.description,
        required: q.required,
        options: q.options,
      })),
    };

    if (format === "yaml") {
      console.log(yaml.dump(template, { indent: 2, lineWidth: -1 }));
    } else {
      printJson(template);
    }
  } catch (err) {
    error(`Failed to export form: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export async function handleImport(args: string[]): Promise<void> {
  let filePath: string | undefined;
  let titleOverride: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--title" || arg === "-t") {
      titleOverride = args[++i];
    } else if (!arg.startsWith("-")) {
      filePath = arg;
    }
  }

  if (!filePath) {
    error('Usage: gforms import <file.json|file.yaml> [--title "..."]');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    error(`File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    let template: FormTemplate;

    if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
      template = yaml.load(content) as FormTemplate;
    } else {
      template = JSON.parse(content);
    }

    // Validate template
    if (!template.title && !titleOverride) {
      error("Template must have a title, or provide --title");
      process.exit(1);
    }

    const auth = await getAuthenticatedClient();

    // Create the form
    info("Creating form...");
    const form = await createForm(auth, titleOverride || template.title, template.description);

    // Add questions
    if (template.questions && template.questions.length > 0) {
      info(`Adding ${template.questions.length} questions...`);

      for (const q of template.questions) {
        await addQuestion(auth, form.formId, {
          type: q.type,
          title: q.title,
          description: q.description,
          required: q.required,
          options: q.options,
          lowValue: q.lowValue,
          highValue: q.highValue,
          lowLabel: q.lowLabel,
          highLabel: q.highLabel,
        });
      }
    }

    success(`Form created from template!`);
    console.log(`Form ID: ${form.formId}`);
    console.log(`Edit URL: ${form.editUri}`);
    console.log(`Response URL: ${form.responderUri}`);
  } catch (err) {
    error(`Failed to import form: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
