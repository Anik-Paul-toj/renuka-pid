import React from "react";
import { getPublicLandingContent } from "@/lib/cms/public-loader";
import { LandingPageClient } from "@/components/LandingPageClient";

export const revalidate = 60;

export default async function MasterclassLandingPage() {
  const content = await getPublicLandingContent();

  return <LandingPageClient content={content} />;
}
