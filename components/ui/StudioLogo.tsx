import Image from "next/image";

export const LOGO_BLACK = "/images/renuka-art-studio-logo-black.png";
export const LOGO_WHITE = "/images/renuka-art-studio-logo-white.png";

/**
 * Natural canvas size of the logo PNGs (square 1080×1080 px).
 * Used to let Next.js preserve the aspect ratio without layout shift.
 */
const LOGO_NATURAL_SIZE = 1080;

interface StudioLogoProps {
  /**
   * "black" — black text + red accent, for light/cream/white backgrounds.
   * "white" — white text + red accent, for dark backgrounds.
   */
  variant?: "black" | "white";
  /**
   * Rendered height in px. Width is calculated automatically from the
   * 1:1 canvas aspect ratio and then constrained by the parent.
   * Defaults to 40 (suitable for a compact header on desktop).
   */
  height?: number;
  /** Additional Tailwind classes applied to the wrapping <span>. */
  className?: string;
  /** Forwarded to the Next.js <Image> priority prop. */
  priority?: boolean;
}

/**
 * Official Renuka Art Studio logo.
 *
 * Always use the black variant on light/cream backgrounds and
 * the white variant on dark backgrounds.
 *
 * The PNG canvas is 1:1 (square) with the visible mark sitting in
 * the lower-left area. Use a constrained container (max-h / max-w)
 * and object-contain to keep proportions correct.
 */
export function StudioLogo({
  variant = "black",
  height = 40,
  className = "",
  priority = false,
}: StudioLogoProps) {
  const src = variant === "white" ? LOGO_WHITE : LOGO_BLACK;

  return (
    <span
      className={`inline-flex items-center shrink-0 ${className}`}
      style={{ height }}
    >
      <Image
        src={src}
        alt="Renuka Art Studio logo"
        width={LOGO_NATURAL_SIZE}
        height={LOGO_NATURAL_SIZE}
        priority={priority}
        style={{
          height: "100%",
          width: "auto",
          objectFit: "contain",
          display: "block",
        }}
        // Transparent PNG — never add a background that would hide it
        className="select-none"
        draggable={false}
      />
    </span>
  );
}
