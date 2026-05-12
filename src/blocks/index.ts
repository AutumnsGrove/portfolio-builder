import type { BlockType } from "@/lib/manifest/types";
import type { Component } from "svelte";

import HeroBlock from "./HeroBlock.svelte";
import TextBlock from "./TextBlock.svelte";
import ImageBlock from "./ImageBlock.svelte";
import ProjectCardBlock from "./ProjectCardBlock.svelte";
import SocialLinksBlock from "./SocialLinksBlock.svelte";
import FooterBlock from "./FooterBlock.svelte";
import SpacerBlock from "./SpacerBlock.svelte";

export const BLOCK_COMPONENTS: Record<BlockType, Component<any>> = {
  hero: HeroBlock,
  text: TextBlock,
  image: ImageBlock,
  "project-card": ProjectCardBlock,
  "social-links": SocialLinksBlock,
  footer: FooterBlock,
  spacer: SpacerBlock,
};
