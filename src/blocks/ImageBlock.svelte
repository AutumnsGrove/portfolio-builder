<script lang="ts">
  import type { ImageContent } from "@/lib/manifest/blocks";

  interface Props {
    data: ImageContent;
  }

  let { data }: Props = $props();
</script>

<figure>
  <img src={data.src} alt={data.alt} class="w-full rounded-lg object-cover" />
  {#if data.caption}
    <figcaption class="mt-2 text-center text-sm text-graphite">{data.caption}</figcaption>
  {/if}
</figure>
