// Public API exports for programmatic usage
export { authenticate, getAuthenticatedClient, getAuthStatus, logout } from "./auth";
export {
  createForm,
  getForm,
  listForms,
  updateFormInfo,
  deleteForm,
  getQuestions,
} from "./api/forms";
export {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  moveQuestion,
  addSection,
} from "./api/questions";
export {
  getResponses,
  getResponseCount,
  exportResponsesAsCSV,
  exportResponsesAsJSON,
} from "./api/responses";
export type {
  QuestionType,
  FormInfo,
  QuestionInfo,
  FormResponse,
  AnswerInfo,
  CreateQuestionOptions,
  FormTemplate,
  TemplateQuestion,
} from "./api/types";
