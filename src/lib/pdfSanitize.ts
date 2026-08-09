/**
 * html2canvas 1.4.x cannot parse CSS Color 4 absolute colors (lab/oklab/oklch)
 * or Color 4 gradient interpolators (`in oklab`). Tailwind v4 emits those for
 * palette utilities like `text-stone-*` and `bg-gradient-to-*`, which crashes
 * invoice PDF download in modern Chromium.
 */

const MODERN_COLOR_FN_RE = /(?:oklch|oklab|lab|lch|color-mix|color)\([^)]*\)/gi;

const GRADIENT_COLORSPACE_RE =
  /\s+in\s+(?:oklab|oklch|lab|lch|srgb|hsl|hwb|xyz)(?:-[a-z]+)?\b/gi;

const COLOR_STYLE_PROPS = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
] as const;

export function isHtml2CanvasUnsafeColor(value: string): boolean {
  // Non-global test copy — avoids lastIndex side effects on the shared /g regex.
  return /(?:oklch|oklab|lab|lch|color-mix|color)\(/i.test(value);
}

/** Make a computed background-image string safe for html2canvas. */
export function sanitizeBackgroundImage(
  backgroundImage: string,
  convertColor: (color: string) => string,
): string {
  return backgroundImage
    .replace(GRADIENT_COLORSPACE_RE, "")
    .replace(MODERN_COLOR_FN_RE, (match) => convertColor(match));
}

export function rgbaFromPixel(
  r: number,
  g: number,
  b: number,
  a: number,
): string {
  if (a >= 255) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
}

function createCanvasColorConverter(): (color: string) => string {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return (color) => color;
  }

  return (color: string): string => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000000";
    ctx.fillStyle = color.trim();
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return rgbaFromPixel(r, g, b, a);
  };
}

function camelToKebab(prop: string): string {
  return prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Mutate a cloned subtree so every computed color is html2canvas-safe.
 * Call from html2canvas `onclone` with the cloned `#invoice-preview` root.
 */
export function prepareCloneForHtml2Canvas(root: HTMLElement): void {
  const convertColor = createCanvasColorConverter();

  const walk = (el: Element) => {
    if (el instanceof HTMLElement) {
      const cs = getComputedStyle(el);

      for (const prop of COLOR_STYLE_PROPS) {
        const raw = String(cs[prop] ?? "");
        if (raw && isHtml2CanvasUnsafeColor(raw)) {
          el.style.setProperty(camelToKebab(prop), convertColor(raw));
        }
      }

      const bgImage = cs.backgroundImage;
      if (bgImage && bgImage !== "none") {
        const next = sanitizeBackgroundImage(bgImage, convertColor);
        if (next !== bgImage) {
          el.style.backgroundImage = next;
        }
      }
    }

    for (const child of el.children) {
      walk(child);
    }
  };

  walk(root);
}
