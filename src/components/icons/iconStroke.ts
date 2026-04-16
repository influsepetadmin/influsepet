import type { SVGProps } from "react";

/**
 * Shared 24×24 outline stroke props — one visual language for metadata icons app-wide.
 * (strokeWidth 1.5, round caps — matches public profile / dashboard glyphs.)
 */
export const outlineIconBase: SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};
