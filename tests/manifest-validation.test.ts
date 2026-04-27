/**
 * Test that validates the example manifest against our Zod schemas.
 */

import { describe, it, expect } from "vitest";
import { ManifestV1Schema } from "../src/lib/manifest/schemas";
import generalistExample from "../src/lib/manifest/examples/generalist.json";

describe("Manifest validation", () => {
  it("should validate the generalist example manifest", () => {
    const result = ManifestV1Schema.safeParse(generalistExample);

    if (!result.success) {
      console.error("Validation errors:", result.error.format());
    }

    expect(result.success).toBe(true);
  });

  it("should reject a manifest with invalid version", () => {
    const invalid = {
      ...generalistExample,
      version: "2.0",
    };

    const result = ManifestV1Schema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject a manifest with invalid semantic size", () => {
    const invalid = {
      ...generalistExample,
      zones: [
        {
          ...generalistExample.zones[0],
          blocks: [
            {
              ...generalistExample.zones[0].blocks[0],
              size: "XL", // Invalid size
            },
          ],
        },
      ],
    };

    const result = ManifestV1Schema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
