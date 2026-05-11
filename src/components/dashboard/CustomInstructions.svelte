<script lang="ts">
  interface Props {
    initialValue: string;
    userId: string;
  }

  let { initialValue, userId }: Props = $props();

  let value = $state(initialValue);
  let saving = $state(false);
  let saved = $state(false);
  let dirty = $derived(value !== initialValue);

  async function handleSave() {
    if (!dirty || saving) return;
    saving = true;
    saved = false;

    try {
      const res = await fetch('/api/user/instructions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customInstructions: value }),
      });

      if (!res.ok) throw new Error('Failed to save');
      initialValue = value;
      saved = true;
      setTimeout(() => saved = false, 2000);
    } catch (e) {
      console.error('Failed to save instructions:', e);
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <label for="custom-instructions" class="font-display text-sm font-semibold text-ink">
      Custom Instructions
    </label>
    {#if saved}
      <span class="text-xs text-success">Saved</span>
    {/if}
  </div>

  <p class="text-xs text-graphite">
    Tell the Guide how you'd like it to work with you. These apply to all your portfolios.
  </p>

  <textarea
    id="custom-instructions"
    bind:value
    rows="4"
    placeholder="e.g. I'm a backend developer, keep things minimal. Don't use emojis. Focus on technical projects."
    class="w-full resize-none rounded-lg border border-ash bg-cream px-3 py-2 text-sm text-ink placeholder-graphite transition-colors focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
  ></textarea>

  <div class="flex justify-end">
    <button
      onclick={handleSave}
      disabled={!dirty || saving}
      class="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      {saving ? 'Saving…' : 'Save'}
    </button>
  </div>
</div>
