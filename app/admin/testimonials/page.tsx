import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getAdminVideoTestimonials,
  getAvailableCourseOptions,
} from "@/lib/testimonials/service";
import { TestimonialsManager } from "@/components/admin/testimonials/TestimonialsManager";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [{ testimonials, migrationPending }, courseOptions] = await Promise.all([
    getAdminVideoTestimonials(),
    getAvailableCourseOptions(),
  ]);

  return (
    <TestimonialsManager
      initialTestimonials={testimonials}
      courseOptions={courseOptions}
      migrationPending={migrationPending}
      userRole={session.adminProfile.role}
    />
  );
}
