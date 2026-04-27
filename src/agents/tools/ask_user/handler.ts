/**
 * ask_user tool — present structured questions with options.
 *
 * This is the PRIMARY interaction pattern for the Guide Agent.
 * Instead of freeform chat, the AI presents clear choices that reduce
 * cognitive load and prevent blank-page paralysis.
 *
 * Based on SPEC_v1.md §4.8.
 */

import type { ToolHandler, StructuredQuestion } from "../types";

export interface AskUserParams {
  questions: StructuredQuestion[]; // 1-4 questions per call
}

export interface AskUserResult {
  questionId: string; // Generated ID for tracking responses
  questions: StructuredQuestion[];
}

export const handler: ToolHandler<AskUserParams, AskUserResult> = async (
  params,
) => {
  // Validate question count (1-4 per spec)
  if (params.questions.length === 0 || params.questions.length > 4) {
    return {
      success: false,
      error: "Must provide 1-4 questions per ask_user call",
    };
  }

  // Validate each question has 2-4 options
  for (const q of params.questions) {
    if (q.options.length < 2 || q.options.length > 4) {
      return {
        success: false,
        error: `Question "${q.question}" must have 2-4 options`,
      };
    }
  }

  // Generate a unique ID for this question set
  const questionId = crypto.randomUUID();

  // In production:
  // 1. Store questions in conversation state
  // 2. Render UI with option buttons
  // 3. Wait for user response
  // 4. Return response to AI in next turn

  console.log(`[AI Asked Questions] ${questionId}:`, params.questions);

  return {
    success: true,
    data: {
      questionId,
      questions: params.questions,
    },
  };
};
