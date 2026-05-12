<script lang="ts">
  import type { ProjectCardContent } from "@/lib/manifest/blocks";

  interface Props {
    data: ProjectCardContent;
  }

  let { data }: Props = $props();
</script>

<div class="rounded-lg border border-ash bg-stone/50 p-5 transition-colors hover:bg-stone">
  <p class="text-sm text-graphite">Project: {data.project_id}</p>
  <p class="mt-1 text-xs text-graphite">Full rendering requires project card data from D1</p>
</div>
