"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      redirect(`/dashboard/${user.role}`);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return null;
} 