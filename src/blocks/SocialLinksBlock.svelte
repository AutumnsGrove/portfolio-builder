<script lang="ts">
  import type { SocialLinksContent } from "@/lib/manifest/blocks";

  interface Props {
    data: SocialLinksContent;
  }

  let { data }: Props = $props();
</script>

<nav class="flex flex-wrap gap-3" aria-label="Social links">
  {#each data.links as link}
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 rounded-full border border-ash px-4 py-2 text-sm text-ink transition-colors hover:border-amber/40 hover:bg-amber/5"
      aria-label={link.label ?? link.platform}
    >
      {link.platform}
    </a>
  {/each}
</nav>
