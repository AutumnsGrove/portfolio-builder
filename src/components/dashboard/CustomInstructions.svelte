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

<div class="space-y-2.5">
  <div class="flex items-center justify-between">
    <h2 class="font-display text-xs font-semibold uppercase tracking-wide text-graphite">
      Guide Instructions
    </h2>
    {#if saved}
      <span class="text-xs text-success">Saved</span>
    {/if}
  </div>

  <p class="text-xs leading-relaxed text-graphite">
    How should the Guide work with you? These apply to all your portfolios.
  </p>

  <textarea
    bind:value
    rows="4"
    placeholder="e.g. I'm a backend developer, keep things minimal. Focus on technical projects."
    class="w-full resize-none rounded-md border border-ash bg-stone/50 px-3 py-2 text-sm text-ink placeholder-graphite/60 transition-colors focus:border-amber focus:bg-cream focus:outline-none focus:ring-2 focus:ring-amber/20"
  ></textarea>

  <div class="flex justify-end">
    <button
      onclick={handleSave}
      disabled={!dirty || saving}
      class="rounded-md bg-amber px-3.5 py-1.5 text-xs font-medium text-ink transition-all duration-200 hover:-translate-y-px hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      {saving ? 'Saving…' : 'Save'}
    </button>
  </div>
</div>
