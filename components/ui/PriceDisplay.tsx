"use client";

import React from "react";

export interface PriceDisplayProps {
  /** The final payable / offer price */
  amount: number | string;
  /** The original crossed-out anchor price (optional) */
  originalAmount?: number | string | null;
  /** Currency symbol, defaults to "₹" */
  currencySymbol?: string;
  /** Visual scale */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "hero";
  /** Optional suffix such as "/-" */
  showSuffix?: boolean;
  /** Custom suffix string, defaults to "/-" if showSuffix is true */
  suffixText?: string;
  /** Highlight badge, e.g. "Special Offer" or "35% OFF" */
  badgeText?: string | null;
  /** Extra supporting savings callout, e.g. "Save ₹1,500" */
  savingsText?: string | null;
  /** Container class */
  className?: string;
  /** Override styles for the primary price text */
  priceClassName?: string;
  /** Override styles for the strikethrough original price text */
  originalClassName?: string;
  /** Override styles for the badge */
  badgeClassName?: string;
}

export function formatIndianPrice(val: number | string): string {
  if (typeof val === "number") {
    return val.toLocaleString("en-IN");
  }
  const clean = String(val).trim();
  const num = Number(clean.replace(/[^0-9.-]+/g, ""));
  if (!isNaN(num) && clean.length > 0) {
    return num.toLocaleString("en-IN");
  }
  return clean;
}

const SIZE_VARIANTS = {
  xs: {
    price: "text-xs font-bold",
    original: "text-[0.65rem] font-medium",
    badge: "text-[0.55rem] px-1.5 py-0.2",
  },
  sm: {
    price: "text-sm font-bold",
    original: "text-xs font-semibold",
    badge: "text-[0.6rem] px-1.5 py-0.5",
  },
  md: {
    price: "text-base font-bold",
    original: "text-xs sm:text-sm font-semibold",
    badge: "text-[0.62rem] px-2 py-0.5",
  },
  lg: {
    price: "text-lg sm:text-xl font-bold",
    original: "text-xs sm:text-sm font-semibold",
    badge: "text-[0.62rem] px-2 py-0.5",
  },
  xl: {
    price: "text-xl sm:text-2xl font-extrabold",
    original: "text-xs sm:text-sm font-semibold",
    badge: "text-[0.64rem] px-2.5 py-0.5",
  },
  "2xl": {
    price: "text-2xl sm:text-3xl font-extrabold",
    original: "text-xs sm:text-sm font-semibold",
    badge: "text-[0.64rem] px-2.5 py-0.5",
  },
  "3xl": {
    price: "text-2xl sm:text-3xl lg:text-4xl font-extrabold",
    original: "text-sm sm:text-base font-semibold",
    badge: "text-[0.66rem] px-2.5 py-0.5",
  },
  hero: {
    price: "text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold",
    original: "text-sm sm:text-base font-semibold",
    badge: "text-[0.66rem] px-2.5 py-0.5",
  },
};

/**
 * Clean, accessible, and premium PriceDisplay component adhering to studio aesthetics:
 * - Uses dedicated `--font-price` (Manrope) with tabular numerals.
 * - Strikethrough for original anchor prices with muted contrast.
 * - Bold high-contrast accent for the offer price.
 */
export function PriceDisplay({
  amount,
  originalAmount,
  currencySymbol = "₹",
  size = "md",
  showSuffix = false,
  suffixText = "/-",
  badgeText,
  savingsText,
  className = "",
  priceClassName = "",
  originalClassName = "",
  badgeClassName = "",
}: PriceDisplayProps) {
  const variant = SIZE_VARIANTS[size] || SIZE_VARIANTS.md;
  const formattedAmount = formatIndianPrice(amount);

  const numAmount = typeof amount === "number" ? amount : Number(String(amount).replace(/[^0-9.-]+/g, ""));
  const numOriginal = originalAmount != null
    ? (typeof originalAmount === "number" ? originalAmount : Number(String(originalAmount).replace(/[^0-9.-]+/g, "")))
    : null;

  const hasDiscount = numOriginal != null && !isNaN(numOriginal) && !isNaN(numAmount) && numOriginal > numAmount;
  const formattedOriginal = hasDiscount ? formatIndianPrice(originalAmount!) : null;

  return (
    <div className={`inline-flex flex-wrap items-baseline gap-2 font-price ${className}`}>
      {/* Primary Discounted / Final Price */}
      <span
        className={`font-price tracking-tight tabular-nums text-[#B93821] drop-shadow-2xs leading-none ${variant.price} ${priceClassName}`}
      >
        <span className="price-symbol font-semibold mr-0.5">{currencySymbol}</span>
        {formattedAmount}
        {showSuffix && <span className="text-[0.75em] font-medium opacity-85 ml-0.5">{suffixText}</span>}
      </span>

      {/* Crossed-out Original Anchor Price */}
      {hasDiscount && formattedOriginal && (
        <span
          className={`font-price tabular-nums line-through text-[#6F6B61] leading-none ${variant.original} ${originalClassName}`}
          aria-label={`Original price: ${currencySymbol}${formattedOriginal}`}
        >
          <span className="mr-0.5">{currencySymbol}</span>
          {formattedOriginal}
          {showSuffix && <span className="opacity-75">{suffixText}</span>}
        </span>
      )}

      {/* Badge / Discount Tag */}
      {badgeText && (
        <span
          className={`uppercase tracking-wider font-bold text-[#8E2515] bg-[#B93821]/12 border border-[#B93821]/30 rounded-sm leading-tight self-center ${variant.badge} ${badgeClassName}`}
        >
          {badgeText}
        </span>
      )}

      {/* Savings Text */}
      {savingsText && (
        <span className="text-[0.7rem] font-bold text-emerald-800 ml-1">
          {savingsText}
        </span>
      )}
    </div>
  );
}

export default PriceDisplay;
