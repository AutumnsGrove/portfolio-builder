/**
 * AI Agent Tool System — Hot Tools
 *
 * These 6 tools are always loaded in the AI's context.
 * Import handlers and types from here.
 */

// Type definitions
export type {
  ToolContext,
  ToolResult,
  ToolHandler,
  Tool,
  StructuredQuestion,
  StructuredResponse,
} from "./types";

// Hot tool handlers
export { handler as thinkHandler } from "./think/handler";
export { handler as replyHandler } from "./reply/handler";
export { handler as doneHandler } from "./done/handler";
export { handler as askUserHandler } from "./ask_user/handler";
export { handler as useToolsHandler } from "./use_tools/handler";
export { handler as getSiteStateHandler } from "./get_site_state/handler";

// Hot tool param types
export type { ThinkParams } from "./think/handler";
export type { ReplyParams } from "./reply/handler";
export type { DoneParams } from "./done/handler";
export type { AskUserParams, AskUserResult } from "./ask_user/handler";
export type { UseToolsParams, UseToolsResult } from "./use_tools/handler";
export type {
  GetSiteStateParams,
  GetSiteStateResult,
} from "./get_site_state/handler";
