import { google, forms_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { FormInfo, QuestionInfo } from "./types";

export function getFormsClient(auth: OAuth2Client): forms_v1.Forms {
  return google.forms({ version: "v1", auth });
}

export async function createForm(
  auth: OAuth2Client,
  title: string,
  description?: string
): Promise<FormInfo> {
  const forms = getFormsClient(auth);

  // Create form with title
  const createResponse = await forms.forms.create({
    requestBody: {
      info: {
        title,
        documentTitle: title,
      },
    },
  });

  const formId = createResponse.data.formId!;

  // If description provided, update the form
  if (description) {
    await forms.forms.batchUpdate({
      formId,
      requestBody: {
        requests: [
          {
            updateFormInfo: {
              info: {
                description,
              },
              updateMask: "description",
            },
          },
        ],
      },
    });
  }

  return parseFormInfo(createResponse.data);
}

export async function getForm(auth: OAuth2Client, formId: string): Promise<FormInfo> {
  const forms = getFormsClient(auth);
  const response = await forms.forms.get({ formId });
  return parseFormInfo(response.data);
}

export async function listForms(auth: OAuth2Client, _limit?: number): Promise<FormInfo[]> {
  // Note: Forms API doesn't have a list endpoint
  // We need to use Drive API to list forms
  const drive = google.drive({ version: "v3", auth });

  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.form'",
    pageSize: _limit || 50,
    fields: "files(id, name, createdTime, modifiedTime)",
    orderBy: "modifiedTime desc",
  });

  const forms = getFormsClient(auth);
  const formInfos: FormInfo[] = [];

  for (const file of response.data.files || []) {
    if (file.id) {
      try {
        const formResponse = await forms.forms.get({ formId: file.id });
        formInfos.push(parseFormInfo(formResponse.data));
      } catch {
        // Skip forms we can't access
      }
    }
  }

  return formInfos;
}

export async function updateFormInfo(
  auth: OAuth2Client,
  formId: string,
  updates: { title?: string; description?: string }
): Promise<void> {
  const forms = getFormsClient(auth);
  const requests: forms_v1.Schema$Request[] = [];

  if (updates.title) {
    requests.push({
      updateFormInfo: {
        info: {
          title: updates.title,
        },
        updateMask: "title",
      },
    });
  }

  if (updates.description !== undefined) {
    requests.push({
      updateFormInfo: {
        info: {
          description: updates.description,
        },
        updateMask: "description",
      },
    });
  }

  if (requests.length > 0) {
    await forms.forms.batchUpdate({
      formId,
      requestBody: { requests },
    });
  }
}

export async function deleteForm(auth: OAuth2Client, formId: string): Promise<void> {
  // Forms API doesn't support deletion, use Drive API
  const drive = google.drive({ version: "v3", auth });
  await drive.files.delete({ fileId: formId });
}

export async function getQuestions(auth: OAuth2Client, formId: string): Promise<QuestionInfo[]> {
  const forms = getFormsClient(auth);
  const response = await forms.forms.get({ formId });

  const questions: QuestionInfo[] = [];
  const items = response.data.items || [];

  for (const item of items) {
    if (item.questionItem?.question) {
      const question = item.questionItem.question;
      const questionInfo: QuestionInfo = {
        questionId: question.questionId || "",
        itemId: item.itemId || "",
        title: item.title || "",
        description: item.description || undefined,
        type: getQuestionTypeName(question),
        required: question.required || false,
        options: getQuestionOptions(question),
      };
      questions.push(questionInfo);
    }
  }

  return questions;
}

function getQuestionTypeName(question: forms_v1.Schema$Question): string {
  if (question.textQuestion) {
    return question.textQuestion.paragraph ? "paragraph" : "short-answer";
  }
  if (question.choiceQuestion) {
    const type = question.choiceQuestion.type;
    if (type === "RADIO") return "multiple-choice";
    if (type === "CHECKBOX") return "checkbox";
    if (type === "DROP_DOWN") return "dropdown";
  }
  if (question.scaleQuestion) return "linear-scale";
  if (question.dateQuestion) return "date";
  if (question.timeQuestion) return "time";
  if (question.fileUploadQuestion) return "file-upload";
  if (question.rowQuestion) return "grid";
  return "unknown";
}

function getQuestionOptions(question: forms_v1.Schema$Question): string[] | undefined {
  if (question.choiceQuestion?.options) {
    return question.choiceQuestion.options.map((opt) => opt.value || "").filter((v) => v);
  }
  return undefined;
}

function parseFormInfo(data: forms_v1.Schema$Form): FormInfo {
  return {
    formId: data.formId || "",
    title: data.info?.title || "",
    description: data.info?.description || undefined,
    documentTitle: data.info?.documentTitle || undefined,
    responderUri: data.responderUri || "",
    editUri: `https://docs.google.com/forms/d/${data.formId}/edit`,
    linkedSheetId: data.linkedSheetId || undefined,
    questionCount: data.items?.filter((i) => i.questionItem).length || 0,
  };
}
