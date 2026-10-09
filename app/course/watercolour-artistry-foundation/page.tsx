import React from "react";
import { notFound } from "next/navigation";
import { getPublicCourseBySlug } from "@/lib/courses-admin/service";
import { CourseDetailPageClient } from "@/components/course/CourseDetailPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "WATERCOLOUR ARTISTRY + FOUNDATION COURSE | Renuka Art Studio",
  description:
    "A Complete 3-Months Watercolour Learning Journey across Landscape, Floral, and Still Life with 24 live interactive sessions.",
};

export default async function WatercolourArtistryFoundationPage() {
  const result = await getPublicCourseBySlug(
    "watercolour-artistry-foundation"
  );

  if (!result) {
    notFound();
  }

  return (
    <CourseDetailPageClient
      course={result.course}
      activeBatch={result.activeBatch}
    />
  );
}
