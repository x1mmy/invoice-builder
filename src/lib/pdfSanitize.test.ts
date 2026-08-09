import { describe, expect, it } from "vitest";
import {
  isHtml2CanvasUnsafeColor,
  rgbaFromPixel,
  sanitizeBackgroundImage,
} from "@/lib/pdfSanitize";

describe("isHtml2CanvasUnsafeColor", () => {
  it("flags modern absolute color functions Tailwind v4 resolves to", () => {
    expect(isHtml2CanvasUnsafeColor("lab(15.0353 1.96067 1.53427)")).toBe(true);
    expect(
      isHtml2CanvasUnsafeColor(
        "oklab(0.999994 0.0000455677 0.0000200868 / 0.8)",
      ),
    ).toBe(true);
    expect(isHtml2CanvasUnsafeColor("oklch(26.8% 0.007 34.298)")).toBe(true);
  });

  it("allows colors html2canvas can parse", () => {
    expect(isHtml2CanvasUnsafeColor("rgb(41, 37, 36)")).toBe(false);
    expect(isHtml2CanvasUnsafeColor("rgba(255, 255, 255, 0.8)")).toBe(false);
    expect(isHtml2CanvasUnsafeColor("#292524")).toBe(false);
    expect(isHtml2CanvasUnsafeColor("transparent")).toBe(false);
  });
});

describe("sanitizeBackgroundImage", () => {
  it("strips color-space keywords and converts embedded modern color stops", () => {
    const out = sanitizeBackgroundImage(
      "linear-gradient(to right in oklab, lab(15 2 1) 0%, rgb(92, 74, 50) 100%)",
      (color) => (color.startsWith("lab(") ? "rgb(41, 37, 36)" : color),
    );
    expect(out).toBe(
      "linear-gradient(to right, rgb(41, 37, 36) 0%, rgb(92, 74, 50) 100%)",
    );
  });
});

describe("rgbaFromPixel", () => {
  it("formats opaque and translucent canvas pixels for html2canvas", () => {
    expect(rgbaFromPixel(41, 37, 36, 255)).toBe("rgb(41, 37, 36)");
    expect(rgbaFromPixel(255, 255, 255, 204)).toBe("rgba(255, 255, 255, 0.8)");
  });
});
