import React from "react";
import { notFound } from "next/navigation";
import { getPublicCourseBySlug } from "@/lib/courses-admin/service";
import { CourseDetailPageClient } from "@/components/course/CourseDetailPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicCourseBySlug(slug);

  if (!result) {
    return {
      title: "Course Not Found | Renuka Art Studio",
    };
  }

  return {
    title: `${result.course.title} | Renuka Art Studio`,
    description:
      result.course.details.fullDescription ||
      `Live watercolour course with Renuka Aggarwal at Renuka Art Studio.`,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicCourseBySlug(slug);

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
