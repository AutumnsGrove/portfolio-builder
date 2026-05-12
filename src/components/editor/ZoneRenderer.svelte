<script lang="ts">
  import type { Zone } from "@/lib/manifest/types";
  import BlockRenderer from "./BlockRenderer.svelte";

  interface Props {
    zone: Zone;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
  }

  let { zone, onMoveUp, onMoveDown, isFirst = false, isLast = false }: Props = $props();
</script>

<section class="rounded-lg border border-ash bg-stone/30 p-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 items-center justify-center rounded bg-amber/10 text-[10px] font-bold text-amber-dim">
        {zone.id}
      </span>
      <h2 class="font-display text-sm font-semibold">{zone.label}</h2>
      <span class="text-xs text-graphite">({zone.blocks.length} block{zone.blocks.length !== 1 ? 's' : ''})</span>
    </div>

    <div class="flex items-center gap-1">
      <button
        onclick={onMoveUp}
        disabled={isFirst}
        class="rounded p-1 text-graphite transition-colors hover:bg-stone hover:text-ink disabled:opacity-30"
        title="Move zone up"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
          <path d="M213.66,165.66a8,8,0,0,1-11.32,0L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,165.66Z"/>
        </svg>
      </button>
      <button
        onclick={onMoveDown}
        disabled={isLast}
        class="rounded p-1 text-graphite transition-colors hover:bg-stone hover:text-ink disabled:opacity-30"
        title="Move zone down"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
        </svg>
      </button>
    </div>
  </div>

  {#if zone.blocks.length === 0}
    <div class="mt-3 rounded border border-dashed border-ash px-4 py-6 text-center text-xs text-graphite">
      Empty zone — add blocks via the Guide or tools
    </div>
  {:else}
    <div class="mt-3 grid grid-cols-3 gap-3">
      {#each zone.blocks as block (block.id)}
        <BlockRenderer {block} />
      {/each}
    </div>
  {/if}
</section>
