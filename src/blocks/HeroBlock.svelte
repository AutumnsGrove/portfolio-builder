<script lang="ts">
  import type { HeroContent } from "@/lib/manifest/blocks";

  interface Props {
    data: HeroContent;
  }

  let { data }: Props = $props();
</script>

<div class="space-y-4">
  <h1 class="font-display text-3xl font-extrabold tracking-tight md:text-4xl">{data.heading}</h1>
  {#if data.subheading}
    <p class="text-lg text-graphite">{data.subheading}</p>
  {/if}
  {#if data.image}
    <img src={data.image} alt={data.heading} class="mt-4 w-full rounded-lg object-cover" />
  {/if}
  {#if data.cta}
    <a
      href={data.cta.href}
      class="mt-4 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover"
    >
      {data.cta.text}
    </a>
  {/if}
</div>
