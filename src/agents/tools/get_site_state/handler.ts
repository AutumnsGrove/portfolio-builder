/**
 * get_site_state tool — read the current portfolio manifest.
 *
 * The AI calls this to see what the user has built so far.
 * Returns zones, blocks, style config, and metadata.
 */

import type { ToolHandler } from "../types";
import type { ManifestV1 } from "@/lib/manifest";

export interface GetSiteStateParams {
  include?: string[]; // Filter: ["zones", "blocks", "style", "meta"]
}

export interface GetSiteStateResult {
  manifest: Partial<ManifestV1>; // Full or filtered manifest
}

export const handler: ToolHandler<
  GetSiteStateParams,
  GetSiteStateResult
> = async (params, context) => {
  try {
    // In production, this would:
    // 1. Query D1 for site metadata
    // 2. Query zones table with blocks (JOIN)
    // 3. Query style_configs table
    // 4. Assemble into ManifestV1 structure
    // 5. Optionally filter by `include` param

    // For now, return a mock manifest
    const mockManifest: Partial<ManifestV1> = {
      version: "1.0",
      site: {
        title: "Untitled Portfolio",
        description: "",
        slug: "untitled",
        template: "generalist",
        style_layer: "minimal",
      },
      zones: [],
      style: {
        fonts: { heading: "Outfit", body: "Lexend" },
        colors: {
          primary: "#2563eb",
          background: "#ffffff",
          text: "#1f2937",
        },
        spacing: "comfortable",
        custom_css: "",
      },
      meta: {
        keywords: [],
        canonical: "",
      },
    };

    console.log(
      `[AI Read Site State] Site ID: ${context.siteId}, Zones: ${mockManifest.zones?.length ?? 0}`,
    );

    return {
      success: true,
      data: {
        manifest: mockManifest,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read site state: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};
