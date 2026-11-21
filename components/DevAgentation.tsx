"use client";

import { Agentation } from "agentation";

/** Dev-only visual feedback toolbar (agentation). Renders nothing in production. */
export function DevAgentation() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Agentation endpoint="http://localhost:4747" />;
}
