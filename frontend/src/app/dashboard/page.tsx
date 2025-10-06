"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
// Remove in-page spinner; rely on route-level loading.tsx

export default function DashboardPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      redirect(`/dashboard/${user.role}`);
    }
  }, [user, loading]);

  // While loading, render nothing so app/dashboard/loading.tsx takes over
  if (loading) return null;

  if (!user) {
    redirect("/login");
  }

  return null;
} 