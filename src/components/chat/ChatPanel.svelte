<script lang="ts">
/**
 * ChatPanel — The AI guide interface.
 *
 * This is the conversational UI where users interact with the Guide Agent.
 * Displays message history, AI traces, structured questions, and input area.
 */

import { Toaster, toast } from 'svelte-sonner';
import ChatMessage from './ChatMessage.svelte';
import ChatInput from './ChatInput.svelte';
import StructuredQuestions from './StructuredQuestions.svelte';

interface Props {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

let { isCollapsed = false, onToggle }: Props = $props();

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// Mock conversation state (will connect to real state later)
let messages = $state<Message[]>([
  {
    id: '1',
    role: 'assistant',
    content: "Hi! I'm here to help you build your portfolio. Let's start with the basics — what kind of work do you want to showcase?",
    timestamp: new Date(),
  },
]);

let isAiThinking = $state(false);
let currentQuestions = $state<any>(null);
let lastUserMessage = $state<string>(''); // For retry on error

// Progressive thinking messages
const thinkingMessages = [
  'Reading your work…',
  'Thinking through options…',
  'Crafting suggestions…',
];
let thinkingMessageIndex = $state(0);
let thinkingInterval: number | undefined;


// Auto-scroll to bottom when new messages arrive
let messagesContainer: HTMLDivElement;
$effect(() => {
  if (messagesContainer && messages.length > 0) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});

async function handleSendMessage(message: string) {
  // Save for retry
  lastUserMessage = message;

  // Add user message
  messages = [
    ...messages,
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    },
  ];

  // Start AI thinking with progressive messages
  isAiThinking = true;
  thinkingMessageIndex = 0;

  // Rotate thinking message every 2 seconds
  thinkingInterval = window.setInterval(() => {
    thinkingMessageIndex = (thinkingMessageIndex + 1) % thinkingMessages.length;
  }, 2000);

  try {
    // TODO: Replace with real API call
    // const response = await fetch('/api/chat', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message, conversationId: 'xxx' })
    // });
    // if (!response.ok) throw new Error('AI request failed');
    // const data = await response.json();

    // Mock: Simulate random failure (50% for testing, adjust as needed)
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.5) {
          reject(new Error('AI service temporarily unavailable'));
        } else {
          resolve(null);
        }
      }, 1500);
    });

    // Success: Add AI response
    messages = [
      ...messages,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Great! I'll help you set that up. First, let's pick a starting layout.",
        timestamp: new Date(),
      },
    ];
  } catch (error) {
    // Error handling
    console.error('AI request failed:', error);

    // Show error toast with retry action
    toast.error('Something went wrong', {
      description: 'The Guide had trouble responding. Would you like to try again?',
      action: {
        label: 'Retry',
        onClick: () => handleRetry(),
      },
      duration: 10000, // 10s to give user time to read/decide
    });
  } finally {
    // Always stop thinking animation
    isAiThinking = false;
    if (thinkingInterval) {
      clearInterval(thinkingInterval);
      thinkingInterval = undefined;
    }
  }
}

function handleRetry() {
  if (lastUserMessage) {
    handleSendMessage(lastUserMessage);
  }
}

async function handleQuestionResponse(response: any) {
  console.log('User answered:', response);
  currentQuestions = null;

  // Format selection for display
  const selectedText = response.selected.length > 0
    ? `Selected: ${response.selected.join(', ')}`
    : '';
  const otherText = response.other ? `Other: ${response.other}` : '';
  const displayMessage = [selectedText, otherText].filter(Boolean).join(' | ');

  // TODO: Send structured response to AI agent API
  // For now, just send as a regular message
  await handleSendMessage(displayMessage);
}
</script>

<Toaster position="top-right" richColors closeButton />

<aside
  class="flex h-full flex-col border-r border-ash bg-cream transition-all duration-300"
  class:w-80={!isCollapsed}
  class:w-0={isCollapsed}
  aria-label="AI Guide Chat"
>
  {#if !isCollapsed}
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-ash px-4 py-3">
      <div class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" class="text-amber-dim">
            <path opacity="0.2" d="M128,32a96,96,0,1,0,96,96A96,96,0,0,0,128,32ZM80,176l17.37-69.47L167,80Z"/>
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM172.42,72.84l-64,32a8.05,8.05,0,0,0-3.58,3.58l-32,64A8,8,0,0,0,80,184a8.1,8.1,0,0,0,3.58-.84l64-32a8.05,8.05,0,0,0,3.58-3.58l32-64a8,8,0,0,0-10.74-10.74ZM138,138,97.89,158.11,118,118l40.15-20.07Z"/>
          </svg>
        </div>
        <h2 class="font-display text-lg font-semibold tracking-tight text-ink">Guide</h2>
      </div>

      {#if onToggle}
        <button
          onclick={onToggle}
          class="rounded p-1.5 text-graphite transition-colors hover:bg-stone hover:text-ink"
          aria-label="Collapse chat panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
            <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/>
          </svg>
        </button>
      {/if}
    </header>

    <!-- Messages Area -->
    <div
      bind:this={messagesContainer}
      class="flex-1 space-y-4 overflow-y-auto px-4 py-4"
    >
      {#each messages as message (message.id)}
        <ChatMessage {message} />
      {/each}

      {#if isAiThinking}
        <div class="flex items-center gap-2 text-sm text-graphite">
          <div class="flex gap-1">
            <span class="thinking-dot" style="--delay: 0ms">●</span>
            <span class="thinking-dot" style="--delay: 150ms">●</span>
            <span class="thinking-dot" style="--delay: 300ms">●</span>
          </div>
          <span>{thinkingMessages[thinkingMessageIndex]}</span>
        </div>
      {/if}

      {#if currentQuestions}
        <StructuredQuestions
          questions={currentQuestions}
          onRespond={handleQuestionResponse}
        />
      {/if}
    </div>

    <!-- Input Area -->
    <ChatInput
      onSend={handleSendMessage}
      disabled={isAiThinking}
    />
  {:else}
    <!-- Collapsed state: just a button to expand -->
    <button
      onclick={onToggle}
      class="flex h-12 w-full items-center justify-center border-b border-ash text-graphite transition-colors hover:bg-stone hover:text-ink"
      aria-label="Expand chat panel"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path opacity="0.2" d="M224,128A96,96,0,0,1,79.93,211.11h0L42.34,221.66a8,8,0,0,1-9.72-9.72l10.06-36.66-.47-.81A96,96,0,1,1,224,128Z"/>
        <path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,218.05a16,16,0,0,0,19.52,19.52l41.17-11.35A104,104,0,1,0,128,24Zm0,192a88.11,88.11,0,0,1-44.06-11.78,8,8,0,0,0-4-1.08,8.09,8.09,0,0,0-2.12.28L40,215.56l12.06-37.81a8,8,0,0,0-.79-6.14A88,88,0,1,1,128,216Z"/>
      </svg>
    </button>
  {/if}
</aside>

<style>
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
      animation-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1); /* ease-out-quart */
    }
    50% {
      transform: translateY(-4px);
      animation-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);
    }
  }

  .thinking-dot {
    animation: float 1s infinite;
    animation-delay: var(--delay);
  }
</style>
