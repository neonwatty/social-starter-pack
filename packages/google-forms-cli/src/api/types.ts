// Google Forms API Types

export type QuestionType =
  | "short-answer"
  | "paragraph"
  | "multiple-choice"
  | "checkbox"
  | "dropdown"
  | "linear-scale"
  | "date"
  | "time"
  | "file-upload"
  | "grid"
  | "checkbox-grid";

// Maps CLI question types to Forms API types
export const QUESTION_TYPE_MAP: Record<QuestionType, string> = {
  "short-answer": "TEXT",
  paragraph: "PARAGRAPH_TEXT",
  "multiple-choice": "RADIO",
  checkbox: "CHECKBOX",
  dropdown: "DROP_DOWN",
  "linear-scale": "SCALE",
  date: "DATE",
  time: "TIME",
  "file-upload": "FILE_UPLOAD",
  grid: "GRID",
  "checkbox-grid": "CHECKBOX_GRID",
};

export interface FormInfo {
  formId: string;
  title: string;
  description?: string;
  documentTitle?: string;
  responderUri: string;
  editUri: string;
  linkedSheetId?: string;
  questionCount: number;
}

export interface QuestionInfo {
  questionId: string;
  itemId: string;
  title: string;
  description?: string;
  type: string;
  required: boolean;
  options?: string[];
}

export interface FormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers: Record<string, AnswerInfo>;
}

export interface AnswerInfo {
  questionId: string;
  textAnswers?: string[];
  fileUploadAnswers?: string[];
}

export interface CreateQuestionOptions {
  title: string;
  type: QuestionType;
  description?: string;
  required?: boolean;
  options?: string[];
  lowValue?: number;
  highValue?: number;
  lowLabel?: string;
  highLabel?: string;
  afterItemId?: string;
}

export interface FormTemplate {
  title: string;
  description?: string;
  settings?: {
    collectEmail?: boolean;
    quizMode?: boolean;
  };
  questions: TemplateQuestion[];
}

export interface TemplateQuestion {
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  options?: string[];
  lowValue?: number;
  highValue?: number;
  lowLabel?: string;
  highLabel?: string;
}
