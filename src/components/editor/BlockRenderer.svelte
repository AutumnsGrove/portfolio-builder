<script lang="ts">
  import type { Block } from "@/lib/manifest/types";
  import { BLOCK_COMPONENTS } from "@/blocks/index";

  interface Props {
    block: Block;
  }

  let { block }: Props = $props();

  const sizeClasses = {
    S: "col-span-1",
    M: "col-span-2",
    L: "col-span-3",
  } as const;

  let BlockComponent = $derived(BLOCK_COMPONENTS[block.type]);
</script>

<div class="rounded-lg border border-ash bg-cream p-4 {sizeClasses[block.size]}">
  {#if BlockComponent}
    <BlockComponent data={block.content.data} size={block.size} />
  {:else}
    <p class="text-sm text-graphite">Unknown block type: {block.type}</p>
  {/if}
</div>
