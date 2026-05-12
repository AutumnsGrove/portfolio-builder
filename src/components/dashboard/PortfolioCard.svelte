<script lang="ts">
  interface Version {
    id: string;
    name: string;
    createdAt: string;
  }

  interface Props {
    id: string;
    name: string;
    slug: string;
    status: 'draft' | 'published';
    updatedAt: string;
    versions: Version[];
  }

  let { id, name, slug, status, updatedAt, versions }: Props = $props();

  let showVersions = $state(false);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/sites/${id}`, { method: 'DELETE' });
    if (res.ok) {
      window.location.reload();
    }
  }
</script>

<div class="group rounded-lg border border-ash bg-stone/50 px-5 py-4 transition-colors duration-200 hover:bg-stone">
  <div class="flex items-center justify-between gap-4">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2.5">
        <h3 class="truncate font-display text-base font-semibold text-ink">{name}</h3>
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none {status === 'draft' ? 'bg-amber/10 text-amber-dim' : 'bg-success/10 text-success'}"
        >
          {status === 'draft' ? 'Draft' : 'Live'}
        </span>
      </div>
      <div class="mt-1 flex items-center gap-3 text-xs text-graphite">
        <span>{slug}.portfoliobuilder.com</span>
        <span class="text-ash">·</span>
        <span>{updatedAt}</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={handleDelete}
        class="rounded-md border border-ash px-3 py-1.5 text-xs text-graphite transition-colors hover:border-error/40 hover:text-error"
        title="Delete portfolio"
      >
        Delete
      </button>
      <button
        class="rounded-md border border-ash px-3 py-1.5 text-xs text-graphite transition-colors hover:border-amber/40 hover:text-ink"
        disabled
        title="Export coming soon"
      >
        Export
      </button>
      <a
        href="/builder/{id}"
        class="rounded-md bg-amber px-4 py-1.5 text-xs font-medium text-ink transition-all duration-200 hover:-translate-y-px hover:shadow-hover"
      >
        Open
      </a>
    </div>
  </div>

  {#if versions.length > 0}
    <div class="mt-3 border-t border-ash pt-3">
      <button
        onclick={() => showVersions = !showVersions}
        class="flex items-center gap-1.5 text-xs text-graphite transition-colors hover:text-ink"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 256 256" fill="currentColor">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,184,128Z"/>
        </svg>
        {versions.length} version{versions.length !== 1 ? 's' : ''}
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 256 256" fill="currentColor" class="transition-transform duration-200" class:rotate-180={showVersions}>
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
        </svg>
      </button>

      {#if showVersions}
        <div class="mt-2 space-y-1">
          {#each versions as version (version.id)}
            <button
              class="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs text-ink transition-colors hover:bg-cream"
            >
              <span class="truncate font-medium">{version.name}</span>
              <span class="shrink-0 text-graphite">{version.createdAt}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
