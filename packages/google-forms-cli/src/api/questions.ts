import { forms_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { CreateQuestionOptions } from "./types";
import { getFormsClient } from "./forms";

export async function addQuestion(
  auth: OAuth2Client,
  formId: string,
  options: CreateQuestionOptions
): Promise<string> {
  const forms = getFormsClient(auth);

  // Build the question based on type
  const question = buildQuestion(options);

  // Determine location
  const location: forms_v1.Schema$Location = options.afterItemId
    ? { index: (await getItemIndex(auth, formId, options.afterItemId)) + 1 }
    : { index: 0 }; // Add at beginning by default, will be moved to end

  // If no afterItemId, get current item count to add at end
  if (!options.afterItemId) {
    const formData = await forms.forms.get({ formId });
    const itemCount = formData.data.items?.length || 0;
    location.index = itemCount;
  }

  const response = await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          createItem: {
            item: {
              title: options.title,
              description: options.description,
              questionItem: {
                question,
              },
            },
            location,
          },
        },
      ],
    },
  });

  // Extract the created item ID from the response
  const replies = response.data.replies || [];
  const createItemReply = replies[0]?.createItem;
  return createItemReply?.itemId || "";
}

function buildQuestion(options: CreateQuestionOptions): forms_v1.Schema$Question {
  const question: forms_v1.Schema$Question = {
    required: options.required || false,
  };

  switch (options.type) {
    case "short-answer":
      question.textQuestion = { paragraph: false };
      break;

    case "paragraph":
      question.textQuestion = { paragraph: true };
      break;

    case "multiple-choice":
      question.choiceQuestion = {
        type: "RADIO",
        options: (options.options || []).map((value) => ({ value })),
      };
      break;

    case "checkbox":
      question.choiceQuestion = {
        type: "CHECKBOX",
        options: (options.options || []).map((value) => ({ value })),
      };
      break;

    case "dropdown":
      question.choiceQuestion = {
        type: "DROP_DOWN",
        options: (options.options || []).map((value) => ({ value })),
      };
      break;

    case "linear-scale":
      question.scaleQuestion = {
        low: options.lowValue || 1,
        high: options.highValue || 5,
        lowLabel: options.lowLabel,
        highLabel: options.highLabel,
      };
      break;

    case "date":
      question.dateQuestion = {
        includeTime: false,
        includeYear: true,
      };
      break;

    case "time":
      question.timeQuestion = {
        duration: false,
      };
      break;

    case "file-upload":
      question.fileUploadQuestion = {
        folderId: "", // Required, but can be empty to use default
        maxFiles: 1,
      };
      break;

    default:
      throw new Error(`Unsupported question type: ${options.type}`);
  }

  return question;
}

export async function updateQuestion(
  auth: OAuth2Client,
  formId: string,
  itemId: string,
  updates: {
    title?: string;
    description?: string;
    required?: boolean;
    options?: string[];
  }
): Promise<void> {
  const forms = getFormsClient(auth);
  const requests: forms_v1.Schema$Request[] = [];

  // Get current item to determine question type
  const formData = await forms.forms.get({ formId });
  const item = formData.data.items?.find((i) => i.itemId === itemId);

  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }

  // Build update mask and info update
  const updateMasks: string[] = [];
  const itemUpdate: forms_v1.Schema$Item = { itemId };

  if (updates.title !== undefined) {
    itemUpdate.title = updates.title;
    updateMasks.push("title");
  }

  if (updates.description !== undefined) {
    itemUpdate.description = updates.description;
    updateMasks.push("description");
  }

  if (updateMasks.length > 0) {
    requests.push({
      updateItem: {
        item: itemUpdate,
        location: { index: await getItemIndex(auth, formId, itemId) },
        updateMask: updateMasks.join(","),
      },
    });
  }

  // Handle required and options updates via question update
  if (updates.required !== undefined || updates.options !== undefined) {
    const questionUpdate: forms_v1.Schema$Question = {};
    const questionMasks: string[] = [];

    if (updates.required !== undefined) {
      questionUpdate.required = updates.required;
      questionMasks.push("required");
    }

    if (updates.options !== undefined && item.questionItem?.question?.choiceQuestion) {
      questionUpdate.choiceQuestion = {
        ...item.questionItem.question.choiceQuestion,
        options: updates.options.map((value) => ({ value })),
      };
      questionMasks.push("choiceQuestion.options");
    }

    if (questionMasks.length > 0) {
      requests.push({
        updateItem: {
          item: {
            itemId,
            questionItem: {
              question: questionUpdate,
            },
          },
          location: { index: await getItemIndex(auth, formId, itemId) },
          updateMask: questionMasks.join(","),
        },
      });
    }
  }

  if (requests.length > 0) {
    await forms.forms.batchUpdate({
      formId,
      requestBody: { requests },
    });
  }
}

export async function deleteQuestion(
  auth: OAuth2Client,
  formId: string,
  itemId: string
): Promise<void> {
  const forms = getFormsClient(auth);

  await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          deleteItem: {
            location: { index: await getItemIndex(auth, formId, itemId) },
          },
        },
      ],
    },
  });
}

export async function moveQuestion(
  auth: OAuth2Client,
  formId: string,
  itemId: string,
  newIndex: number
): Promise<void> {
  const forms = getFormsClient(auth);
  const currentIndex = await getItemIndex(auth, formId, itemId);

  await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          moveItem: {
            originalLocation: { index: currentIndex },
            newLocation: { index: newIndex },
          },
        },
      ],
    },
  });
}

async function getItemIndex(auth: OAuth2Client, formId: string, itemId: string): Promise<number> {
  const forms = getFormsClient(auth);
  const formData = await forms.forms.get({ formId });
  const items = formData.data.items || [];

  const index = items.findIndex((item) => item.itemId === itemId);
  if (index === -1) {
    throw new Error(`Item not found: ${itemId}`);
  }

  return index;
}

export async function addSection(
  auth: OAuth2Client,
  formId: string,
  title: string,
  description?: string
): Promise<string> {
  const forms = getFormsClient(auth);

  // Get current item count to add at end
  const formData = await forms.forms.get({ formId });
  const itemCount = formData.data.items?.length || 0;

  const response = await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          createItem: {
            item: {
              title,
              description,
              pageBreakItem: {},
            },
            location: { index: itemCount },
          },
        },
      ],
    },
  });

  const replies = response.data.replies || [];
  return replies[0]?.createItem?.itemId || "";
}
