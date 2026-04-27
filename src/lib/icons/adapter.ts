// Icon adapter — the ONE file that imports from phosphor-svelte.
// Resolves manifest aliases to actual Svelte components.
// Swapping icon packs = replacing this file.

import type { Component } from "svelte";
import * as Phosphor from "phosphor-svelte";
import { ICON_MANIFEST } from "./manifest.js";
import type { IconGroupName } from "./manifest.js";

// Build a lookup from Phosphor's exports
const _phosphorMap = new Map<string, Component>();
for (const [name, component] of Object.entries(Phosphor)) {
  if (typeof component === "function" || typeof component === "object") {
    _phosphorMap.set(name, component as Component);
  }
}

// Resolve a manifest group into a map of alias → Component
function resolveGroup(
  group: Record<string, string>,
): Record<string, Component> {
  const resolved: Record<string, Component> = {};
  for (const [alias, phosphorName] of Object.entries(group)) {
    const component = _phosphorMap.get(phosphorName);
    if (component) {
      resolved[alias] = component;
    }
  }
  return resolved;
}

// Resolved icon maps — one per group
export const navIcons = resolveGroup(ICON_MANIFEST.nav);
export const actionIcons = resolveGroup(ICON_MANIFEST.action);
export const contentIcons = resolveGroup(ICON_MANIFEST.content);
export const stateIcons = resolveGroup(ICON_MANIFEST.state);
export const authIcons = resolveGroup(ICON_MANIFEST.auth);

// Flat lookup across all groups
const _allGroups: Record<IconGroupName, Record<string, Component>> = {
  nav: navIcons,
  action: actionIcons,
  content: contentIcons,
  state: stateIcons,
  auth: authIcons,
};

export function resolveIcon(
  group: IconGroupName,
  key: string,
  fallback?: Component,
): Component | undefined {
  const map = _allGroups[group];
  return map?.[key] ?? fallback;
}

export function resolveAnyIcon(
  key: string,
  fallback?: Component,
): Component | undefined {
  for (const map of Object.values(_allGroups)) {
    if (key in map) return map[key];
  }
  return fallback;
}
