<script lang="ts">
  import type { TextContent } from "@/lib/manifest/blocks";
  import MarkdownIt from "markdown-it";

  interface Props {
    data: TextContent;
  }

  let { data }: Props = $props();

  // html: false prevents raw HTML pass-through (XSS defense)
  const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
  let renderedHtml = $derived(md.render(data.markdown));
</script>

<div class="prose prose-ink max-w-none">
  {@html renderedHtml}
</div>
