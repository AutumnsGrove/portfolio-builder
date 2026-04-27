<script lang="ts">
/**
 * ChatInput — Message input area with send button.
 *
 * Textarea that auto-expands and supports keyboard shortcuts.
 */

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

let {
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
}: Props = $props();

let value = $state('');
let textarea: HTMLTextAreaElement;

function handleSubmit() {
  const trimmed = value.trim();
  if (!trimmed || disabled) return;

  onSend(trimmed);
  value = '';

  // Reset textarea height
  if (textarea) {
    textarea.style.height = 'auto';
  }
}

function handleKeydown(e: KeyboardEvent) {
  // Submit on Enter (without Shift)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
}

function handleInput() {
  // Auto-expand textarea
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}
</script>

<div class="border-t border-ash bg-cream px-4 py-3">
  <div class="flex items-end gap-2">
    <textarea
      bind:this={textarea}
      bind:value
      onkeydown={handleKeydown}
      oninput={handleInput}
      {disabled}
      {placeholder}
      rows="1"
      class="max-h-32 flex-1 resize-none rounded-lg border border-ash bg-cream px-3 py-2 text-sm text-ink placeholder-graphite transition-colors focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Message input"
    ></textarea>

    <button
      onclick={handleSubmit}
      disabled={!value.trim() || disabled}
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      aria-label="Send message"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
        <path d="M231.87,114l-168-95.89A16,16,0,0,0,40.92,37.34L71.55,128,40.92,218.67A16,16,0,0,0,63.87,237.9l168-95.89a16,16,0,0,0,0-27.94ZM63.87,223.84l0,0Zm0-191.7,152.58,87L63.87,206.86,92.66,128Z"/>
      </svg>
    </button>
  </div>

  <p class="mt-1.5 text-xs text-graphite">
    Press <kbd class="rounded bg-stone px-1.5 py-0.5 font-mono text-ink">Enter</kbd> to send,
    <kbd class="rounded bg-stone px-1.5 py-0.5 font-mono text-ink">Shift + Enter</kbd> for new line
  </p>
</div>
