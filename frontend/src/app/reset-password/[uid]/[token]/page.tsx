"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authService } from "@/services/api";
import { showToast } from "@/components/ui/enhanced-toast";

const calculateStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = calculateStrength(password);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authService.confirmPasswordReset(uid, token, password);
      showToast.success({ title: "Password updated", description: "You can now sign in." });
      router.replace("/login");
    } catch (err: any) {
      setError(err.message || "The reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Reset password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Choose a strong new password for your account.
        </p>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">New password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded">
              <div
                className={`h-2 rounded transition-all ${
                  strength <= 2
                    ? "bg-red-500 w-1/5"
                    : strength === 3
                    ? "bg-yellow-500 w-3/5"
                    : "bg-green-500 w-full"
                }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm" className="block text-sm font-medium">Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}


