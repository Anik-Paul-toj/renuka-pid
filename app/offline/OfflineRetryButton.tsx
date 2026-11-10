"use client";

export function OfflineRetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      style={{
        background: "#444C38",
        color: "#fff",
        border: "1.5px solid #2B3122",
        borderRadius: "8px",
        padding: "0.75rem 1.75rem",
        fontSize: "0.8rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        cursor: "pointer",
        boxShadow: "3px 3px 0 #24291D, 4px 5px 12px rgba(36,41,29,0.28)",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      ↺ Try again
    </button>
  );
}
