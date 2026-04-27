// Public API — import icons from here, never from phosphor-svelte directly.
//
// Usage:
//   import { navIcons, contentIcons } from "@lib/icons";
//   <svelte:component this={navIcons.arrowRight} size={18} weight="bold" />

export {
  navIcons,
  actionIcons,
  contentIcons,
  stateIcons,
  authIcons,
  resolveIcon,
  resolveAnyIcon,
} from "./adapter.js";

export { ICON_MANIFEST } from "./manifest.js";
export type { IconGroupName, IconName } from "./manifest.js";
