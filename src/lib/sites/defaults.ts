import type { Zone } from "@/lib/manifest/types";

const DEFAULT_ZONE_LABELS = ["Hero", "Projects", "About", "Contact", "Footer"];

export function getDefaultZones(): Zone[] {
  return DEFAULT_ZONE_LABELS.map((label, i) => ({
    id: i + 1,
    label,
    order: i,
    blocks: [],
  }));
}
