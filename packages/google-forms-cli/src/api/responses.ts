import { forms_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { FormResponse, AnswerInfo } from "./types";
import { getFormsClient } from "./forms";

export async function getResponses(
  auth: OAuth2Client,
  formId: string,
  options?: {
    limit?: number;
    afterTimestamp?: string;
  }
): Promise<FormResponse[]> {
  const forms = getFormsClient(auth);

  let pageToken: string | undefined;
  const allResponses: FormResponse[] = [];
  const limit = options?.limit;

  do {
    const response = await forms.forms.responses.list({
      formId,
      pageToken,
      pageSize: limit ? Math.min(limit - allResponses.length, 5000) : 5000,
    });

    const responses = response.data.responses || [];

    for (const resp of responses) {
      // Filter by timestamp if provided
      if (options?.afterTimestamp && resp.createTime) {
        const createTime = new Date(resp.createTime);
        const afterTime = new Date(options.afterTimestamp);
        if (createTime <= afterTime) {
          continue;
        }
      }

      allResponses.push(parseResponse(resp));

      if (limit && allResponses.length >= limit) {
        return allResponses;
      }
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return allResponses;
}

export async function getResponseCount(auth: OAuth2Client, formId: string): Promise<number> {
  const responses = await getResponses(auth, formId);
  return responses.length;
}

function parseResponse(data: forms_v1.Schema$FormResponse): FormResponse {
  const answers: Record<string, AnswerInfo> = {};

  if (data.answers) {
    for (const [questionId, answer] of Object.entries(data.answers)) {
      answers[questionId] = {
        questionId,
        textAnswers: answer.textAnswers?.answers?.map((a) => a.value || "") || undefined,
        fileUploadAnswers:
          answer.fileUploadAnswers?.answers?.map((a) => a.fileId || "") || undefined,
      };
    }
  }

  return {
    responseId: data.responseId || "",
    createTime: data.createTime || "",
    lastSubmittedTime: data.lastSubmittedTime || "",
    respondentEmail: data.respondentEmail || undefined,
    answers,
  };
}

export async function exportResponsesAsCSV(
  auth: OAuth2Client,
  formId: string,
  options?: { limit?: number; afterTimestamp?: string }
): Promise<string> {
  const forms = getFormsClient(auth);

  // Get form structure to get question titles
  const formData = await forms.forms.get({ formId });
  const items = formData.data.items || [];

  // Build question ID to title mapping
  const questionMap: Map<string, string> = new Map();
  for (const item of items) {
    if (item.questionItem?.question?.questionId) {
      questionMap.set(item.questionItem.question.questionId, item.title || "Untitled");
    }
  }

  // Get responses
  const responses = await getResponses(auth, formId, options);

  if (responses.length === 0) {
    return "";
  }

  // Build CSV header
  const questionIds = Array.from(questionMap.keys());
  const headers = ["Timestamp", "Email", ...questionIds.map((id) => questionMap.get(id) || id)];

  // Build CSV rows
  const rows: string[][] = [];
  for (const response of responses) {
    const row: string[] = [
      response.createTime,
      response.respondentEmail || "",
      ...questionIds.map((id) => {
        const answer = response.answers[id];
        if (!answer) return "";
        if (answer.textAnswers) return answer.textAnswers.join("; ");
        if (answer.fileUploadAnswers) return answer.fileUploadAnswers.join("; ");
        return "";
      }),
    ];
    rows.push(row);
  }

  // Convert to CSV string
  const csvRows = [headers, ...rows].map((row) =>
    row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
  );

  return csvRows.join("\n");
}

export async function exportResponsesAsJSON(
  auth: OAuth2Client,
  formId: string,
  options?: { limit?: number; afterTimestamp?: string }
): Promise<object> {
  const forms = getFormsClient(auth);

  // Get form structure
  const formData = await forms.forms.get({ formId });
  const items = formData.data.items || [];

  // Build question ID to title mapping
  const questionMap: Map<string, string> = new Map();
  for (const item of items) {
    if (item.questionItem?.question?.questionId) {
      questionMap.set(item.questionItem.question.questionId, item.title || "Untitled");
    }
  }

  // Get responses
  const responses = await getResponses(auth, formId, options);

  // Format responses with question titles
  const formattedResponses = responses.map((response) => {
    const answers: Record<string, unknown> = {};

    for (const [questionId, answer] of Object.entries(response.answers)) {
      const title = questionMap.get(questionId) || questionId;
      if (answer.textAnswers) {
        answers[title] =
          answer.textAnswers.length === 1 ? answer.textAnswers[0] : answer.textAnswers;
      } else if (answer.fileUploadAnswers) {
        answers[title] = answer.fileUploadAnswers;
      }
    }

    return {
      responseId: response.responseId,
      timestamp: response.createTime,
      email: response.respondentEmail,
      answers,
    };
  });

  return {
    formId,
    formTitle: formData.data.info?.title,
    responseCount: responses.length,
    responses: formattedResponses,
  };
}
