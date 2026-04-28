# Implementation Plan: Tool Registry, Turn Pipeline & OpenRouter Integration

## Context

**Why this change:** We've built the foundation (manifest types, database schema, 6 hot tools, chat UI), but they're not connected. The AI agent exists only as isolated pieces. This implementation wires everything together into a working conversational portfolio builder.

**What prompted it:** v1 acceptance criteria require a working end-to-end loop: user signs up → AI guides them → they publish a portfolio. We can't validate the core loop without a functioning agent system. The hot tools are ready, the UI is ready, but there's no orchestration layer to make them work together.

**Intended outcome:** A complete AI agent system where:
- Users can chat with the Guide Agent through the chat panel
- The agent uses tools to understand and modify portfolio state
- Conversations persist across sessions in D1
- Tool calls are tracked for cost/performance analysis
- The system gracefully handles errors and prevents infinite loops

**Why this is next:** This unlocks the entire v1 validation phase. Once this works, we can test the core loop with real users, measure drop-off rates, track time-to-publish, and validate whether the conversational UX actually helps people build portfolios.

---

## Architecture Overview

### Three Core Components

1. **Tool Registry** — Auto-discovers tools, validates schemas, routes execution
2. **Turn Pipeline** — Orchestrates AI ↔ tool call loop until completion
3. **OpenRouter Client** — Handles API calls, retries, token tracking

### Data Flow

```
User types message in ChatPanel
  ↓
POST /api/chat { message, conversationId, siteId }
  ↓
Chat API Handler
  ├─ Load conversation from D1
  ├─ Call Guide Agent orchestrator
  └─ Save conversation + metrics
      ↓
Guide Agent Orchestrator
  ├─ Build system prompt + tool schemas
  ├─ Call OpenRouter API
  ├─ Parse tool calls from response
  ├─ Execute tools via registry
  ├─ Feed results back to AI
  └─ Loop until 'done' or 'reply' (max 20 iterations)
      ↓
Tool Registry
  ├─ Look up tool by name
  ├─ Validate parameters
  ├─ Execute handler with ToolContext
  └─ Return result
      ↓
Response flows back to ChatPanel
  ├─ Display AI reply or structured questions
  └─ Update conversation history
```

---

## Design Decisions

### 1. Build-Time Tool Discovery (Not Runtime)

**Decision:** Generate tool registry at build time via script, not runtime YAML parsing.

**Rationale:**
- Cloudflare Workers can't scan filesystems at runtime
- Faster cold starts (no directory scanning)
- Type-safe at compile time
- Still follows her-go pattern (tools are self-contained directories)

**Implementation:**
- Node.js build script scans `src/agents/tools/` directories
- Parses YAML manifests at build time
- Generates `src/agents/tools/registry.generated.ts` with all tool definitions
- Runtime imports from generated file

### 2. Model Selection: Claude Haiku via OpenRouter

**Decision:** `anthropic/claude-haiku-latest` as the single v1 model.

**Rationale:**
- **Cost-effective:** $0.000001/prompt token, $0.000005/completion token (5x cheaper than Sonnet)
- **Fast:** Low latency for real-time chat (~2s typical)
- **Tool calling:** Native function calling support
- **200K context:** Sufficient for conversation history + tool schemas
- **Quality:** Haiku excels at structured tasks and following instructions
- **Upgrade path:** Easy swap to Sonnet for complex reasoning in v2

Alternative considered: Gemini Flash (even cheaper) but Claude has better tool-calling reliability.

### 3. Non-Streaming for v1 Simplicity

**Decision:** Batched (non-streaming) responses.

**Rationale:**
- Simpler implementation (no SSE parsing)
- Tool calls require full response anyway
- Acceptable latency (<3s typical)
- Streaming adds complexity in error handling
- **v2:** Add streaming for progressive text display

### 4. Conversation History: Sliding Window (20 Messages)

**Decision:** Keep last 20 messages in AI context, store full history in D1.

**Rationale:**
- Bounded token costs
- 20 messages ≈ 10 turns ≈ 15K tokens with tool schemas
- System prompt + last 20 + tools ≈ 25K tokens (within 200K limit)
- Full history preserved for analytics/debugging

### 5. Help Level: System Prompt Modification

Two modes stored in `ai_conversations.help_level`:

```typescript
const SYSTEM_PROMPTS = {
  guide_me: `Ask questions, suggest structure, highlight areas to improve. 
             NEVER write content — guide users to create it themselves.`,
  
  do_it_for_me: `Write content, place blocks, structure sections. 
                 Present drafts for review and approval.`
};
```

### 6. Error Handling: Three-Tier Strategy

1. **Tool-level:** Return `{ success: false, error }` to AI (AI can retry)
2. **Orchestrator-level:** Retry once, then pass error to AI
3. **Critical:** Log to metrics, halt turn gracefully

**Dead-end detection:**
- Max 20 tool calls per turn (prevent infinite loops)
- 30s timeout per AI call
- 2min total timeout per turn

---

## Implementation Plan

### Phase 1: Tool Registry Infrastructure

**Files to create:**
- `src/agents/tools/loader.ts` — Build-time script (Node.js)
- `src/agents/tools/registry.ts` — Runtime registry
- `src/agents/tools/schemas.ts` — Schema converters
- `src/agents/tools/registry.generated.ts` — Auto-generated (gitignored)

**1.1 Build-Time Loader (`loader.ts`)**

```typescript
// Node.js script - runs during build
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

interface ToolDefinition {
  name: string;
  description: string;
  category: 'hot' | 'blocks' | 'zones' | 'content' | 'publish';
  parameters: Record<string, any>;
  required: string[];
  handlerImport: string;
}

async function generateToolRegistry() {
  const toolsDir = './src/agents/tools';
  const tools: ToolDefinition[] = [];
  
  const dirs = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'registry.generated.ts');
  
  for (const dir of dirs) {
    const yamlPath = path.join(toolsDir, dir.name, 'tool.yaml');
    if (!fs.existsSync(yamlPath)) continue;
    
    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const manifest = yaml.parse(yamlContent);
    
    tools.push({
      name: manifest.name,
      description: manifest.description,
      category: manifest.category,
      parameters: manifest.parameters.properties,
      required: manifest.parameters.required || [],
      handlerImport: `./${dir.name}/handler`,
    });
  }
  
  const output = generateRegistryFile(tools);
  fs.writeFileSync('./src/agents/tools/registry.generated.ts', output);
  console.log(`✓ Generated registry with ${tools.length} tools`);
}

function generateRegistryFile(tools: ToolDefinition[]): string {
  const imports = tools.map(t => 
    `import { handler as ${t.name}Handler } from '${t.handlerImport}';`
  ).join('\n');
  
  const definitions = tools.map(t => `
  {
    name: '${t.name}',
    description: ${JSON.stringify(t.description)},
    category: '${t.category}',
    parameters: ${JSON.stringify(t.parameters, null, 2)},
    required: ${JSON.stringify(t.required)},
    handler: ${t.name}Handler,
  }`).join(',');
  
  return `// Auto-generated by loader.ts - DO NOT EDIT
${imports}

export const TOOL_DEFINITIONS = [${definitions}
] as const;
`;
}

generateToolRegistry().catch(console.error);
```

**1.2 Runtime Registry (`registry.ts`)**

```typescript
import { TOOL_DEFINITIONS } from './registry.generated';
import type { Tool, ToolContext, ToolResult, ToolHandler } from './types';

const TOOL_REGISTRY = new Map<string, Tool>();
const VALID_CATEGORIES = ['hot', 'blocks', 'zones', 'content', 'publish'] as const;

// Initialize registry on module load
TOOL_DEFINITIONS.forEach(def => {
  TOOL_REGISTRY.set(def.name, def as Tool);
});

export function getHotTools(): Tool[] {
  return Array.from(TOOL_REGISTRY.values())
    .filter(t => t.category === 'hot');
}

export function getDeferredTools(categories: string[]): Tool[] {
  return Array.from(TOOL_REGISTRY.values())
    .filter(t => categories.includes(t.category));
}

export async function executeTool(
  name: string,
  params: unknown,
  context: ToolContext
): Promise<ToolResult> {
  const tool = TOOL_REGISTRY.get(name);
  
  if (!tool) {
    return { 
      success: false, 
      error: `Unknown tool: ${name}` 
    };
  }
  
  try {
    // TODO: Add Zod validation here for v1.1
    return await tool.handler(params as any, context);
  } catch (error) {
    console.error(`[Tool Execution Error] ${name}:`, error);
    return {
      success: false,
      error: `Tool execution failed: ${error.message}`,
    };
  }
}

export function validateCategories(categories: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid = categories.filter(c => VALID_CATEGORIES.includes(c as any));
  const invalid = categories.filter(c => !VALID_CATEGORIES.includes(c as any));
  return { valid, invalid };
}
```

**1.3 Schema Converters (`schemas.ts`)**

```typescript
import type { Tool } from './types';

// Convert internal Tool format to OpenRouter/Anthropic format
export function toOpenRouterToolSchema(tool: Tool) {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters,
        required: tool.required,
      },
    },
  };
}
```

**1.4 Add build script to `package.json`:**

```json
{
  "scripts": {
    "build:tools": "tsx src/agents/tools/loader.ts",
    "prebuild": "pnpm run build:tools",
    "predev": "pnpm run build:tools"
  }
}
```

**1.5 Install dependencies:**

```bash
pnpm add -D yaml tsx
```

---

### Phase 2: OpenRouter Client

**Files to create:**
- `src/lib/ai/openrouter.ts` — API client
- `src/lib/ai/types.ts` — AI-specific types

**2.1 OpenRouter Client (`openrouter.ts`)**

```typescript
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  tools?: any[];
  tool_choice?: 'auto' | 'none';
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: [{
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: 'stop' | 'tool_calls' | 'length';
  }];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model = 'anthropic/claude-haiku-latest';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async chatCompletion(
    messages: OpenRouterMessage[],
    tools?: any[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<OpenRouterResponse> {
    const request: OpenRouterRequest = {
      model: this.model,
      messages,
      tools,
      tool_choice: tools && tools.length > 0 ? 'auto' : undefined,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    };
    
    return this.makeRequest('/chat/completions', request);
  }
  
  private async makeRequest(
    endpoint: string,
    body: any,
    attempt = 1
  ): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://portfoliobuilder.com',
          'X-Title': 'Portfolio Builder',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        return await response.json();
      }
      
      // Retry logic
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, body, attempt + 1);
      }
      
      const errorData = await response.json();
      throw new OpenRouterError(
        response.status,
        errorData.error?.message || 'Unknown error'
      );
      
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new OpenRouterError(408, 'Request timeout after 30s');
      }
      throw error;
    }
  }
  
  calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): string {
    const promptCost = usage.prompt_tokens * 0.000001;
    const completionCost = usage.completion_tokens * 0.000005;
    return (promptCost + completionCost).toFixed(6);
  }
}

export class OpenRouterError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}
```

---

### Phase 3: Guide Agent Orchestrator

**Files to create:**
- `src/lib/ai/guide-agent.ts` — Turn orchestration
- `src/lib/ai/prompts.ts` — System prompt builders

**3.1 Guide Agent (`guide-agent.ts`)**

```typescript
import { OpenRouterClient, type OpenRouterMessage, type ToolCall } from './openrouter';
import { getHotTools, getDeferredTools, executeTool } from '@/agents/tools/registry';
import { toOpenRouterToolSchema } from '@/agents/tools/schemas';
import type { ToolContext } from '@/agents/tools/types';

interface AgentContext {
  conversationId: string;
  userId: string;
  siteId: string;
  db: D1Database;
  history: Array<{ role: string; content: string }>;
  helpLevel: 'guide_me' | 'do_it_for_me';
}

interface AgentResponse {
  conversationId: string;
  reply?: string;
  questions?: any;
  trace: Array<{ tool: string; params: any; result: any }>;
  metrics: {
    turnCount: number;
    toolCallCount: number;
    tokensIn: number;
    tokensOut: number;
    costUsd: string;
    latencyMs: number;
  };
}

export class GuideAgent {
  private client: OpenRouterClient;
  
  constructor(apiKey: string) {
    this.client = new OpenRouterClient(apiKey);
  }
  
  async processMessage(
    userMessage: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const trace: Array<{ tool: string; params: any; result: any }> = [];
    const toolContext: ToolContext = {
      db: context.db,
      userId: context.userId,
      siteId: context.siteId,
      conversationId: context.conversationId,
    };
    
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let reply: string | undefined;
    let questions: any | undefined;
    let loadedCategories = new Set<string>();
    
    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(context.helpLevel);
    
    // Build messages (system + last 20 history + user message)
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.history.slice(-20),
      { role: 'user', content: userMessage },
    ];
    
    // Tool call loop (max 20 iterations)
    let turn = 0;
    let shouldContinue = true;
    
    while (shouldContinue && turn < 20) {
      turn++;
      
      // Get available tools (hot + loaded deferred)
      const availableTools = [
        ...getHotTools(),
        ...getDeferredTools(Array.from(loadedCategories)),
      ];
      const toolSchemas = availableTools.map(toOpenRouterToolSchema);
      
      // Call OpenRouter
      const response = await this.client.chatCompletion(messages, toolSchemas);
      
      totalTokensIn += response.usage.prompt_tokens;
      totalTokensOut += response.usage.completion_tokens;
      
      const choice = response.choices[0];
      
      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          const toolName = toolCall.function.name;
          const params = JSON.parse(toolCall.function.arguments);
          
          // Execute tool
          const result = await executeTool(toolName, params, toolContext);
          
          trace.push({
            tool: toolName,
            params,
            result: result.success ? result.data : { error: result.error },
          });
          
          // Special handling for use_tools
          if (toolName === 'use_tools' && result.success) {
            result.data.loaded?.forEach((cat: string) => 
              loadedCategories.add(cat)
            );
          }
          
          // Check for terminal tools
          if (toolName === 'reply' && result.success) {
            reply = params.message;
            shouldContinue = false;
          } else if (toolName === 'ask_user' && result.success) {
            questions = result.data;
            shouldContinue = false;
          } else if (toolName === 'done') {
            shouldContinue = false;
          }
        }
        
        // Add assistant message + tool results to conversation
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: choice.message.tool_calls,
        });
        
        for (const toolCall of choice.message.tool_calls) {
          const toolResult = trace.find(t => 
            t.tool === toolCall.function.name
          );
          
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult?.result || {}),
          });
        }
      } else {
        // No tool calls (shouldn't happen with tool_choice: auto)
        shouldContinue = false;
      }
    }
    
    // Dead-end detection
    if (turn >= 20 && shouldContinue) {
      console.error('[Dead-end] Turn exceeded 20 tool calls');
    }
    
    const latencyMs = Date.now() - startTime;
    const costUsd = this.client.calculateCost({
      prompt_tokens: totalTokensIn,
      completion_tokens: totalTokensOut,
    });
    
    return {
      conversationId: context.conversationId,
      reply,
      questions,
      trace,
      metrics: {
        turnCount: turn,
        toolCallCount: trace.length,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        costUsd,
        latencyMs,
      },
    };
  }
  
  private buildSystemPrompt(helpLevel: 'guide_me' | 'do_it_for_me'): string {
    const base = `You are the Guide — an AI assistant helping users build their portfolio website.

Your tools:
- think: Internal reasoning (use liberally to plan)
- reply: Send a message to the user
- ask_user: Present structured questions with options (PRIMARY pattern!)
- get_site_state: Read the current site structure
- use_tools: Load additional tools (blocks, zones, content, publish)
- done: Signal turn completion

Rules:
1. Use 'think' before every action to plan your approach
2. Prefer 'ask_user' over 'reply' for decisions
3. Always call 'reply' or 'ask_user' before 'done'
4. Never make assumptions — ask when uncertain`;
    
    if (helpLevel === 'guide_me') {
      return base + `\n\nMode: GUIDE ME
- Ask questions, suggest structure
- NEVER write content — guide users to create it
- Be a patient coach`;
    } else {
      return base + `\n\nMode: DO IT FOR ME
- Write content, place blocks, structure sections
- Present drafts for review
- Be proactive`;
    }
  }
}
```

---

### Phase 4: Chat API Endpoint

**Files to create:**
- `src/pages/api/chat.ts` — Astro API route

**4.1 Chat API Route (`src/pages/api/chat.ts`)**

```typescript
import type { APIRoute } from 'astro';
import { GuideAgent } from '@/lib/ai/guide-agent';
import { trackEvent, trackAgentMetrics, hasTriggeredEvent } from '@/lib/analytics/track';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
  siteId: z.string().uuid(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request
    const body = await request.json();
    const { message, conversationId, siteId } = ChatRequestSchema.parse(body);
    
    // 2. Auth (mock for v1)
    const userId = 'mock-user-id'; // TODO: WorkOS integration
    
    // 3. Database from runtime
    const db = (locals.runtime.env as any).DB;
    const apiKey = (locals.runtime.env as any).OPENROUTER_API_KEY;
    
    // 4. Load or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db
        .prepare('SELECT * FROM ai_conversations WHERE id = ? AND site_id = ?')
        .bind(conversationId, siteId)
        .first();
        
      if (!conversation) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const newId = crypto.randomUUID();
      await db
        .prepare(`
          INSERT INTO ai_conversations (id, site_id, messages_json, help_level, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(newId, siteId, '[]', 'guide_me', Date.now(), Date.now())
        .run();
        
      conversation = { id: newId, messages_json: '[]', help_level: 'guide_me' };
      
      const hasStarted = await hasTriggeredEvent(db, 'started_build', userId);
      if (!hasStarted) {
        await trackEvent(db, 'started_build', { userId, siteId });
      }
    }
    
    const history = JSON.parse(conversation.messages_json);
    
    // 5. Call Guide Agent
    const agent = new GuideAgent(apiKey);
    const response = await agent.processMessage(message, {
      conversationId: conversation.id,
      userId,
      siteId,
      db,
      history,
      helpLevel: conversation.help_level,
    });
    
    // 6. Save conversation
    const updatedHistory = [
      ...history,
      { role: 'user', content: message },
      ...(response.reply ? [{ role: 'assistant', content: response.reply }] : []),
    ];
    
    await db
      .prepare('UPDATE ai_conversations SET messages_json = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(updatedHistory), Date.now(), conversation.id)
      .run();
    
    // 7. Track metrics
    await trackAgentMetrics(db, {
      conversationId: conversation.id,
      turnCount: response.metrics.turnCount,
      toolCallCount: response.metrics.toolCallCount,
      replyLatencyMs: response.metrics.latencyMs,
      tokensIn: response.metrics.tokensIn,
      tokensOut: response.metrics.tokensOut,
      costUsd: parseFloat(response.metrics.costUsd),
    });
    
    // 8. Return response
    return new Response(
      JSON.stringify({
        reply: response.reply,
        questions: response.questions,
        conversationId: conversation.id,
        trace: response.trace,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Chat API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

### Phase 5: Frontend Integration

**Update `src/components/chat/ChatPanel.svelte`:**

Replace mock API call with real endpoint:

```svelte
<script lang="ts">
  // ... existing code ...
  
  // Add props for context
  let { 
    isCollapsed = false, 
    onToggle,
    siteId, // New prop
  }: { 
    isCollapsed?: boolean; 
    onToggle?: () => void;
    siteId: string;
  } = $props();
  
  let currentConversationId = $state<string | undefined>(undefined);
  
  async function handleSendMessage(message: string) {
    lastUserMessage = message;
    
    messages = [
      ...messages,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
    ];
    
    isAiThinking = true;
    thinkingMessageIndex = 0;
    thinkingInterval = window.setInterval(() => {
      thinkingMessageIndex = (thinkingMessageIndex + 1) % thinkingMessages.length;
    }, 2000);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId,
          siteId,
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI request failed');
      }
      
      const data = await response.json();
      currentConversationId = data.conversationId;
      
      // Handle reply
      if (data.reply) {
        messages = [
          ...messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.reply,
            timestamp: new Date(),
          },
        ];
      }
      
      // Handle structured questions
      if (data.questions) {
        currentQuestions = data.questions;
      }
      
    } catch (error) {
      console.error('AI request failed:', error);
      toast.error('Something went wrong', {
        description: 'The Guide had trouble responding. Would you like to try again?',
        action: {
          label: 'Retry',
          onClick: () => handleRetry(),
        },
        duration: 10000,
      });
    } finally {
      isAiThinking = false;
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = undefined;
      }
    }
  }
</script>
```

---

### Phase 6: Environment Setup

**6.1 Create `.dev.vars` for local development:**

```
OPENROUTER_API_KEY=sk-or-v1-...
```

**6.2 Set production secret:**

```bash
pnpm exec wrangler secret put OPENROUTER_API_KEY
# Paste key when prompted
```

**6.3 Update `src/env.d.ts`:**

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare runtime types
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    // Additional locals here
  }
}

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  OPENROUTER_API_KEY: string;
}
```

---

## Verification Plan

### 1. Tool Registry Tests

```bash
# Build tools
pnpm run build:tools

# Check generated file
cat src/agents/tools/registry.generated.ts

# Verify hot tools load
pnpm run test tests/tool-registry.test.ts
```

**Test file (`tests/tool-registry.test.ts`):**

```typescript
import { describe, it, expect } from 'vitest';
import { getHotTools, getDeferredTools, validateCategories } from '@/agents/tools/registry';

describe('Tool Registry', () => {
  it('should load 6 hot tools', () => {
    const hotTools = getHotTools();
    expect(hotTools).toHaveLength(6);
    expect(hotTools.map(t => t.name)).toContain('think');
    expect(hotTools.map(t => t.name)).toContain('reply');
  });
  
  it('should validate categories', () => {
    const { valid, invalid } = validateCategories(['blocks', 'invalid', 'zones']);
    expect(valid).toEqual(['blocks', 'zones']);
    expect(invalid).toEqual(['invalid']);
  });
});
```

### 2. OpenRouter Client Tests

```typescript
// tests/openrouter-client.test.ts
import { describe, it, expect, vi } from 'vitest';
import { OpenRouterClient } from '@/lib/ai/openrouter';

describe('OpenRouterClient', () => {
  it('should retry on 429', async () => {
    let callCount = 0;
    global.fetch = vi.fn(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: async () => ({ error: { message: 'Rate limited' } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ 
          choices: [{ message: { content: 'OK' } }], 
          usage: { prompt_tokens: 10, completion_tokens: 5 }
        }),
      });
    });
    
    const client = new OpenRouterClient('test-key');
    const response = await client.chatCompletion([
      { role: 'user', content: 'Hi' }
    ]);
    
    expect(callCount).toBe(2);
  });
});
```

### 3. Integration Test

```bash
# Start local dev server
pnpm dev

# In another terminal, test API
curl -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to build a portfolio",
    "siteId": "test-site-123"
  }'
```

### 4. End-to-End Test

```bash
# Open browser to chat demo
open http://localhost:4321/chat-demo

# Type message in chat
# Verify:
# - AI responds with text or questions
# - Conversation persists (check D1)
# - Metrics logged (check agent_metrics table)
# - No infinite loops (max 20 calls enforced)
```

---

## Critical Files to Create/Modify

### New Files:
- `src/agents/tools/loader.ts`
- `src/agents/tools/registry.ts`
- `src/agents/tools/schemas.ts`
- `src/lib/ai/openrouter.ts`
- `src/lib/ai/guide-agent.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/types.ts`
- `src/pages/api/chat.ts`
- `.dev.vars`

### Modified Files:
- `package.json` (add build scripts)
- `src/components/chat/ChatPanel.svelte` (real API integration)
- `wrangler.jsonc` (environment variables)
- `src/env.d.ts` (type definitions)
- `.gitignore` (add .dev.vars, registry.generated.ts)

---

## Cost Estimation (v1)

**Assumptions:**
- Average conversation: 10 user messages
- Each turn: 2-3 tool calls
- System prompt + tools: 5K tokens
- History (20 msgs): 1K tokens
- User message: 50 tokens
- AI response: 300 tokens

**Cost per Turn:**
- Input: 6K tokens x $0.000001 = $0.006
- Output: 300 tokens x $0.000005 = $0.0015
- **Total: ~$0.0075 per turn**

**Cost per Portfolio (10 turns):**
- **~$0.075 per published portfolio**

**Scale estimates:**
- 100 portfolios/month: $7.50/month
- 1000 portfolios/month: $75/month
- 10,000 portfolios/month: $750/month

**v2 optimizations:**
- Prompt caching (50% reduction)
- Gemini Flash for simple tasks (70% cost reduction)
- Shorter history window (30% reduction)

---

## Edge Cases & Considerations

### 1. Empty Deferred Categories in v1

Since deferred tools aren't implemented yet, `getDeferredTools()` returns empty array. The `use_tools` handler validates categories and returns success, but loads nothing. Orchestrator handles this gracefully.

### 2. Conversation History Trimming

Last 20 messages only sent to AI. Full history stored in D1 for analytics.

### 3. Dead-End Detection

Max 20 tool calls per turn. Logged to metrics with `deadEnd: true` flag.

### 4. Tool Parameter Validation

For v1, trust AI output. For v1.1, add Zod validation before handler execution.

### 5. Streaming Responses (v2)

For v1, use batched responses. For v2, implement SSE streaming for progressive text display.

---

## Next Steps After Implementation

1. **Test adversarial inputs** — Long messages, rapid requests, invalid data
2. **Implement deferred tool categories** — blocks/, zones/, content/, publish/
3. **Add WorkOS auth** — Replace mock userId
4. **Build editor UI** — Zone/block manipulation interface
5. **Measure v1 acceptance criteria** — Drop-off rates, time-to-publish, stall rate
