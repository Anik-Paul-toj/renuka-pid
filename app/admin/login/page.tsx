"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Sparkles, ArrowRight, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Successful login -> Redirect to admin dashboard
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error("Login submission error:", err);
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="paper-card w-full max-w-md p-6 sm:p-8 bg-[#FAF8F2] border border-[#464137]/15 rounded-xl shadow-xl">
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-[#A24B4B]/10 p-3.5 border border-[#A24B4B]/20 text-xs text-[#A24B4B] flex items-start gap-2.5"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#68705A] mb-1.5">
            Admin Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 size-4 text-[#6F6B61]/60" />
            <input
              type="email"
              required
              placeholder="admin@renukaartstudio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[#464137]/15 bg-[#F7F4EC] pl-10 pr-4 py-3 text-sm text-[#292923] outline-none transition-all placeholder:text-[#6F6B61]/50 focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#68705A] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 size-4 text-[#6F6B61]/60" />
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[#464137]/15 bg-[#F7F4EC] pl-10 pr-4 py-3 text-sm text-[#292923] outline-none transition-all placeholder:text-[#6F6B61]/50 focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-studio w-full py-3.5 mt-3"
        >
          {isLoading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In to Admin Portal</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#464137]/10 text-center">
        <p className="text-[0.72rem] text-[#6F6B61]">
          🔒 Protected Area • Restricted to authorized staff & instructors only.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EC] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#C8D1C7]/35 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#68705A] mb-3">
          <Sparkles className="size-3.5" />
          <span>Art Studio</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#292923]">
          Admin Portal Login
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#6F6B61] max-w-sm mx-auto">
          Sign in with your verified administrator credentials to manage courses, content, and student bookings.
        </p>
      </div>

      <Suspense fallback={<div className="text-xs text-[#6F6B61]">Loading portal login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
