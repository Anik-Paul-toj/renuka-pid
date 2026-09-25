import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getStudentsList } from "@/lib/students/service";
import { StudentsManager } from "@/components/admin/students/StudentsManager";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Pre-fetch initial page of students server-side
  const initialResult = await getStudentsList({
    page: 1,
    limit: 20,
    search: "",
    status: "all",
    paymentStatus: "all",
  });

  const initialData = initialResult.success
    ? initialResult.data
    : {
        students: [],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };

  return <StudentsManager initialData={initialData} />;
}
