"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-2 rounded-md bg-[#EEE9DE] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6F6B61] transition-colors hover:bg-[#E8DED0] hover:text-[#292923]"
    >
      <LogOut className="size-3.5" />
      <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
