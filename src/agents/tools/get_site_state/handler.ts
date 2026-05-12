/**
 * get_site_state tool — read the current portfolio manifest.
 *
 * The AI calls this to see what the user has built so far.
 * Returns zones, blocks, style config, and metadata.
 */

import type { ToolHandler } from "../types";
import type { ManifestV1, Zone, Block, StyleConfig } from "@/lib/manifest";

export interface GetSiteStateParams {
  include?: string[]; // Filter: ["zones", "blocks", "style", "meta"]
}

export interface GetSiteStateResult {
  manifest: Partial<ManifestV1>; // Full or filtered manifest
}

// Raw D1 row shapes
interface SiteRow {
  id: string;
  name: string;
  slug: string;
  template_id: string | null;
  style_layer_id: string | null;
}

interface ZoneRow {
  id: string;
  zone_id: number;
  label: string;
  order: number;
  style_overrides: string | null;
}

interface BlockRow {
  id: string;
  zone_id: string;
  order: number;
  type: string;
  size: string;
  content_json: string;
  style_overrides: string | null;
}

interface StyleConfigRow {
  fonts: string;
  colors: string;
  spacing: "compact" | "comfortable" | "spacious";
  custom_css: string;
}

const DEFAULT_STYLE: StyleConfig = {
  fonts: { heading: "Outfit", body: "Lexend" },
  colors: { primary: "#2563eb", background: "#ffffff", text: "#1f2937" },
  spacing: "comfortable",
  custom_css: "",
};

export const handler: ToolHandler<
  GetSiteStateParams,
  GetSiteStateResult
> = async (params, context) => {
  try {
    const { db, siteId } = context;
    const include = params.include ?? ["zones", "blocks", "style", "meta"];
    const includeAll = (key: string) => include.includes(key);

    // 1. Fetch site record
    const site = await db
      .prepare(
        "SELECT id, name, slug, template_id, style_layer_id FROM sites WHERE id = ?",
      )
      .bind(siteId)
      .first<SiteRow>();

    if (!site) {
      return { success: false, error: "Site not found" };
    }

    const manifest: Partial<ManifestV1> = {
      version: "1.0",
    };

    // Always include site metadata (it's the foundation)
    manifest.site = {
      title: site.name,
      description: "",
      slug: site.slug,
      template: "generalist",
      style_layer: "minimal",
    };

    // 2. Fetch zones (and blocks if requested)
    if (includeAll("zones") || includeAll("blocks")) {
      const zoneRows = await db
        .prepare(
          `SELECT id, zone_id, label, "order", style_overrides FROM zones WHERE site_id = ? ORDER BY "order" ASC`,
        )
        .bind(siteId)
        .all<ZoneRow>();

      const zoneList = zoneRows.results ?? [];

      // 3. Fetch blocks — one query per zone (D1 does not support complex JOINs well with typed results)
      const zones: Zone[] = await Promise.all(
        zoneList.map(async (zoneRow) => {
          let blocks: Block[] = [];

          if (includeAll("blocks")) {
            const blockRows = await db
              .prepare(
                `SELECT id, zone_id, "order", type, size, content_json, style_overrides FROM blocks WHERE zone_id = ? ORDER BY "order" ASC`,
              )
              .bind(zoneRow.id)
              .all<BlockRow>();

            blocks = (blockRows.results ?? []).map((b) => {
              const block: Block = {
                id: b.id,
                type: b.type as Block["type"],
                size: b.size as Block["size"],
                content: JSON.parse(b.content_json),
              };
              if (b.style_overrides) {
                block.style_overrides = JSON.parse(b.style_overrides);
              }
              return block;
            });
          }

          const zone: Zone = {
            id: zoneRow.zone_id,
            label: zoneRow.label,
            order: zoneRow.order,
            blocks,
          };
          if (zoneRow.style_overrides) {
            zone.style_overrides = JSON.parse(zoneRow.style_overrides);
          }
          return zone;
        }),
      );

      manifest.zones = zones;
    }

    // 4. Fetch style config (graceful default if missing)
    if (includeAll("style")) {
      const styleRow = await db
        .prepare(
          "SELECT fonts, colors, spacing, custom_css FROM style_configs WHERE site_id = ?",
        )
        .bind(siteId)
        .first<StyleConfigRow>();

      if (styleRow) {
        manifest.style = {
          fonts: JSON.parse(styleRow.fonts),
          colors: JSON.parse(styleRow.colors),
          spacing: styleRow.spacing,
          custom_css: styleRow.custom_css,
        };
      } else {
        manifest.style = DEFAULT_STYLE;
      }
    }

    // 5. Meta tags (assembled from site data; no dedicated table in v1)
    if (includeAll("meta")) {
      manifest.meta = {
        keywords: [],
        canonical: "",
      };
    }

    const zoneCount = manifest.zones?.length ?? 0;
    const blockCount =
      manifest.zones?.reduce((sum, z) => sum + z.blocks.length, 0) ?? 0;

    console.log(
      `[AI Read Site State] Site ID: ${siteId}, Zones: ${zoneCount}, Blocks: ${blockCount}`,
    );

    return {
      success: true,
      data: {
        manifest,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read site state: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};
