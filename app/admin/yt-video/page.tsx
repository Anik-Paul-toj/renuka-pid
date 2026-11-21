import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { YouTubeVideoManager } from "@/components/admin/cms/YouTubeVideoManager";

export const dynamic = "force-dynamic";

export default async function AdminYouTubeVideoPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return (
    <YouTubeVideoManager
      canPublish={["admin", "super_admin"].includes(session.adminProfile.role)}
    />
  );
}
