import React from "react";
import { notFound } from "next/navigation";
import { getPublicCourseBySlug } from "@/lib/courses-admin/service";
import { CourseDetailPageClient } from "@/components/course/CourseDetailPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "WATERCOLOUR FOUNDATION | Renuka Art Studio",
  description:
    "A focused 2-session foundation program designed to help you understand the essentials of watercolour before moving into detailed painting projects.",
};

export default async function WatercolourFoundationPage() {
  const result = await getPublicCourseBySlug("watercolour-foundation");

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
