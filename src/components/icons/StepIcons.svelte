<script lang="ts">
  import { contentIcons, navIcons } from "@lib/icons";

  interface Props {
    step: 1 | 2 | 3;
    size?: number;
  }

  let { step, size = 22 }: Props = $props();

  const icons = [contentIcons.chatCircle, contentIcons.compass, navIcons.arrowUpRight] as const;
  let icon = $derived(icons[step - 1]);
</script>

{#if icon}
  <svelte:component this={icon} {size} weight="duotone" />
{/if}
