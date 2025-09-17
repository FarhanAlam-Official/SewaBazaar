"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import { showToast } from "@/components/ui/enhanced-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
      showToast.success({
        title: "Check your email",
        description: "If an account exists, we sent a reset link.",
      });
    } catch (err: any) {
      // We still show success to avoid user enumeration
      setSent(true);
      showToast.success({
        title: "Check your email",
        description: "If an account exists, we sent a reset link.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Forgot password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="space-y-6">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              If an account exists for <span className="font-medium">{email}</span>, you’ll receive an email with a reset link.
            </div>
            <button
              type="button"
              className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors"
              onClick={() => router.push("/login")}
            >
              Return to login
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <div className="text-center text-sm">
              <Link href="/login" className="text-indigo-600 hover:underline">Back to login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


