<script lang="ts">
  import { navIcons } from "@lib/icons";

  interface Props {
    size?: number;
  }

  let { size = 18 }: Props = $props();
</script>

<svelte:component this={navIcons.arrowRight} {size} weight="bold" />
