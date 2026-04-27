<script lang="ts">
/**
 * ChatMessage — Individual message in the conversation.
 *
 * Displays user or assistant messages with appropriate styling.
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  message: Message;
}

let { message }: Props = $props();

// Format timestamp
const timeString = $derived.by(() => {
  const now = new Date();
  const diff = now.getTime() - message.timestamp.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return message.timestamp.toLocaleDateString();
});
</script>

<div
  class="flex gap-3"
  class:flex-row-reverse={message.role === 'user'}
>
  <!-- Avatar -->
  <div
    class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
      message.role === 'assistant' ? 'bg-amber/15' : 'bg-ink'
    }`}
  >
    {#if message.role === 'assistant'}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" class="text-amber-dim">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"/>
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" class="text-cream">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-59.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,131.52,0Z"/>
      </svg>
    {/if}
  </div>

  <!-- Message Content -->
  <div class="flex flex-1 flex-col gap-1">
    <div
      class="rounded-lg px-3 py-2 text-sm leading-relaxed"
      class:bg-stone={message.role === 'assistant'}
      class:text-ink={message.role === 'assistant'}
      class:bg-ink={message.role === 'user'}
      class:text-cream={message.role === 'user'}
    >
      {message.content}
    </div>
    <span class="text-xs text-graphite">{timeString}</span>
  </div>
</div>
