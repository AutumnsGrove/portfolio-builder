<script lang="ts">
  import type { FooterContent } from "@/lib/manifest/blocks";

  interface Props {
    data: FooterContent;
  }

  let { data }: Props = $props();
</script>

<footer class="flex flex-wrap items-center justify-between gap-4 text-sm text-graphite">
  {#if data.text}
    <span>{data.text}</span>
  {/if}
  {#if data.links && data.links.length > 0}
    <nav class="flex gap-4">
      {#each data.links as link}
        <a href={link.href} class="transition-colors hover:text-ink">{link.label}</a>
      {/each}
    </nav>
  {/if}
</footer>
