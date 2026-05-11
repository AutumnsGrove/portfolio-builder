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
</script>

<div class="group rounded-xl border border-ash bg-cream p-5 transition-all duration-300 hover:border-amber/40 hover:shadow-hover">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <h3 class="truncate font-display text-lg font-semibold text-ink">{name}</h3>
      <p class="mt-0.5 text-xs text-graphite">{slug}.portfoliobuilder.com</p>
    </div>

    <span
      class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium {status === 'draft' ? 'bg-amber/15 text-amber-dim' : 'bg-success/15 text-success'}"
    >
      {status === 'draft' ? 'Draft' : 'Published'}
    </span>
  </div>

  <p class="mt-3 text-xs text-graphite">
    Last edited {updatedAt}
  </p>

  <!-- Version dropdown -->
  {#if versions.length > 0}
    <div class="relative mt-3">
      <button
        onclick={() => showVersions = !showVersions}
        class="flex items-center gap-1.5 rounded-md border border-ash px-2.5 py-1 text-xs text-graphite transition-colors hover:border-amber/40 hover:text-ink"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,184,128Z"/>
        </svg>
        {versions.length} version{versions.length !== 1 ? 's' : ''}
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 256 256" fill="currentColor" class="transition-transform" class:rotate-180={showVersions}>
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
        </svg>
      </button>

      {#if showVersions}
        <div class="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-ash bg-cream py-1 shadow-overlay">
          {#each versions as version (version.id)}
            <button
              class="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-ink transition-colors hover:bg-stone"
            >
              <span class="truncate font-medium">{version.name}</span>
              <span class="shrink-0 text-graphite">{version.createdAt}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Actions -->
  <div class="mt-4 flex gap-2">
    <a
      href="/builder/{id}"
      class="flex-1 rounded-lg bg-amber px-4 py-2 text-center text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover"
    >
      Open
    </a>
    <button
      class="rounded-lg border border-ash px-3 py-2 text-sm text-graphite transition-colors hover:border-amber/40 hover:text-ink"
      disabled
      title="Export coming soon"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z"/>
      </svg>
    </button>
  </div>
</div>
