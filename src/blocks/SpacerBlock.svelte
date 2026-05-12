<script lang="ts">
  import type { SpacerContent } from "@/lib/manifest/blocks";

  interface Props {
    data: SpacerContent;
    size: "S" | "M" | "L";
  }

  let { data, size = "M" }: Props = $props();

  const heightMap = { S: "h-6", M: "h-12", L: "h-24" } as const;
</script>

{#if data.as_divider}
  <hr class="border-ash" />
{:else}
  <div class={heightMap[size]} aria-hidden="true"></div>
{/if}
