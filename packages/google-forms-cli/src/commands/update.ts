import { getAuthenticatedClient } from "../auth";
import { updateFormInfo, EmailCollectionType } from "../api/forms";
import { success, error } from "../utils/output";

export const VALID_COLLECT_EMAILS_VALUES = ["none", "verified", "input"] as const;

export interface UpdateArgs {
  formId?: string;
  title?: string;
  description?: string;
  collectEmails?: EmailCollectionType;
}

export type ParseResult =
  | {
      success: true;
      args: Required<Pick<UpdateArgs, "formId">> & Omit<UpdateArgs, "formId">;
    }
  | {
      success: false;
      error: string;
    };

export function parseUpdateArgs(args: string[]): ParseResult {
  let formId: string | undefined;
  let title: string | undefined;
  let description: string | undefined;
  let collectEmails: EmailCollectionType | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--title" || arg === "-t") {
      title = args[++i];
    } else if (arg === "--description" || arg === "-d") {
      description = args[++i];
    } else if (arg === "--collect-emails") {
      const value = args[++i];
      if (!VALID_COLLECT_EMAILS_VALUES.includes(value as EmailCollectionType)) {
        return {
          success: false,
          error: `Invalid --collect-emails value: "${value}". Must be one of: none, verified, input`,
        };
      }
      collectEmails = value as EmailCollectionType;
    } else if (!arg.startsWith("-")) {
      formId = arg;
    }
  }

  if (!formId) {
    return {
      success: false,
      error: 'Usage: gforms update <form-id> [--title "..."] [--description "..."] [--collect-emails none|verified|input]',
    };
  }

  if (!title && description === undefined && collectEmails === undefined) {
    return {
      success: false,
      error: "Please specify at least one update: --title, --description, or --collect-emails",
    };
  }

  return {
    success: true,
    args: { formId, title, description, collectEmails },
  };
}

export async function handleUpdate(args: string[]): Promise<void> {
  const result = parseUpdateArgs(args);

  if (!result.success) {
    error(result.error);
    process.exit(1);
  }

  const { formId, title, description, collectEmails } = result.args;

  try {
    const auth = await getAuthenticatedClient();
    await updateFormInfo(auth, formId, { title, description, collectEmails });
    success("Form updated.");
  } catch (err) {
    error(`Failed to update form: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
