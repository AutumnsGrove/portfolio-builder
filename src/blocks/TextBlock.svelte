<script lang="ts">
  import type { TextContent } from "@/lib/manifest/blocks";

  interface Props {
    data: TextContent;
  }

  let { data }: Props = $props();
</script>

<div class="prose prose-ink max-w-none">
  {@html data.markdown}
</div>
