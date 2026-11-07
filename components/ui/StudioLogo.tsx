import Image from "next/image";

export const LOGO_BLACK = "/images/renuka-art-studio-logo-black.png";
export const LOGO_WHITE = "/images/renuka-art-studio-logo-white.png";

/**
 * Natural canvas size of the logo PNGs (1080×1080 px square).
 * The visible mark (text + red accent) sits in the lower-left ~80% of the canvas.
 * Controlling by WIDTH is the most predictable approach:
 *   - Desktop header: width ≈ 140px  → visible mark ≈ 112px wide
 *   - Tablet  header: width ≈ 120px  → visible mark ≈  96px wide
 *   - Mobile  header: width ≈ 100px  → visible mark ≈  80px wide
 */
const LOGO_NATURAL_SIZE = 1080;

interface StudioLogoProps {
  /**
   * "black" — black text + red accent, for light/cream/white backgrounds.
   * "white" — white text + red accent, for dark backgrounds.
   */
  variant?: "black" | "white";
  /**
   * Rendered width in px. The Image is square so height = width automatically.
   * Use this for header / inline placements where you want a fixed width budget.
   * Either `width` or `height` must be set; `width` takes precedence.
   */
  width?: number;
  /**
   * Rendered height in px (legacy). Used when you want a height-constrained
   * container (e.g. sidebar, login page centred logo). Width becomes `auto`.
   * Ignored when `width` is also provided.
   */
  height?: number;
  /** Additional Tailwind classes applied to the wrapping <span>. */
  className?: string;
  /** Forwarded to the Next.js Image priority prop (set true for LCP elements). */
  priority?: boolean;
}

/**
 * Official Renuka Art Studio logo.
 *
 * Always use the black variant on light/cream backgrounds and
 * the white variant on dark backgrounds.
 *
 * The PNG canvas is 1:1 (square). Use width-based sizing in the header
 * so the full square canvas (including the red accent on the right edge)
 * is always fully visible.
 */
export function StudioLogo({
  variant = "black",
  width,
  height,
  className = "",
  priority = false,
}: StudioLogoProps) {
  const src = variant === "white" ? LOGO_WHITE : LOGO_BLACK;

  // Sizing styles: apply inline width/height if explicitly passed as numbers,
  // or allow responsive sizing classes (e.g. w-[68px] h-[68px]) via className.
  const inlineStyle: React.CSSProperties = {};
  if (width !== undefined) {
    inlineStyle.width = width;
    inlineStyle.height = width;
  } else if (height !== undefined) {
    inlineStyle.height = height;
    inlineStyle.width = "auto";
  }

  return (
    <span
      className={`inline-flex items-center shrink-0 ${className}`}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      <Image
        src={src}
        alt="Renuka Art Studio logo"
        width={LOGO_NATURAL_SIZE}
        height={LOGO_NATURAL_SIZE}
        priority={priority}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
        className="select-none"
        draggable={false}
      />
    </span>
  );
}
