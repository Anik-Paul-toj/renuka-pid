import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getAdminCourses } from "@/lib/courses-admin/service";
import { CourseManager } from "@/components/admin/courses/CourseManager";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const courses = await getAdminCourses();

  return (
    <CourseManager
      initialCourses={courses}
      userRole={session.adminProfile.role}
    />
  );
}

