"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/api";
import { showToast } from "@/components/ui/enhanced-toast";

export default function LoginWithOTPPage() {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();

  // countdown for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (step === "verify" && otpDigits.every(digit => digit !== "") && otpDigits.length === 6) {
      const timer = setTimeout(() => {
        handleVerify();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [otpDigits, step]);

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await authService.requestOTP(email);
      showToast.success({ 
        title: "Code sent successfully", 
        description: `We've sent a 6-digit verification code to ${email}. Please check your inbox.`, 
        duration: 3000 
      });
      setStep("verify");
      setCooldown(60);
    } catch {
      // Generic success to avoid enumeration
      showToast.success({ 
        title: "Code sent successfully", 
        description: `We've sent a 6-digit verification code to ${email}. Please check your inbox.`, 
        duration: 3000 
      });
      setStep("verify");
      setCooldown(60);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const code = otpDigits.join("");
      if (code.length !== 6) throw new Error("Enter all 6 digits");
      await authService.verifyOTPLogin(email, code, rememberMe);
      showToast.success({ 
        title: "Login successful", 
        description: "Welcome back. You have been successfully signed in.", 
        duration: 2000 
      });
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.replace("/dashboard/customer");
      }, 500);
    } catch (err: any) {
      showToast.error({ 
        title: "Verification failed", 
        description: err.message || "Invalid verification code. Please double-check and try again.", 
        duration: 4000 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0B1120] dark:via-[#0D1424] dark:to-[#0F1627]">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-lg space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in with code</h1>
            <p className="text-gray-600 dark:text-gray-400">We'll email you a 6‑digit code to sign in.</p>
          </div>

          {step === "request" ? (
            <form onSubmit={requestOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium">
                {loading ? "Sending..." : "Send code"}
              </button>
              <Link 
                href="/login"
                className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all duration-300 font-medium shadow-sm hover:shadow-md dark:shadow-gray-900/50"
              >
                Back to login
              </Link>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-6">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">We sent a code to {email}</div>
              <div className="flex justify-center space-x-3">
                {otpDigits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={el => { if (el) inputRefs.current[idx] = el; }}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 1);
                      const next = [...otpDigits];
                      next[idx] = val;
                      setOtpDigits(next);
                      if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
                    }}
                    className="w-12 h-14 text-center text-xl rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 justify-center">
                <input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <label htmlFor="remember" className="text-sm">Remember me</label>
              </div>

              <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium">
                {loading ? "Verifying..." : "Verify and sign in"}
              </button>

              <button
                type="button"
                disabled={cooldown > 0}
                onClick={async () => {
                  try {
                    await authService.requestOTP(email);
                    setCooldown(60);
                    showToast.success({ 
                      title: "New code sent", 
                      description: `We've sent a new 6-digit verification code to ${email}.`, 
                      duration: 3000 
                    });
                  } catch {
                    showToast.success({ 
                      title: "New code sent", 
                      description: `We've sent a new 6-digit verification code to ${email}.`, 
                      duration: 3000 
                    });
                  }
                }}
                className="w-full inline-flex justify-center items-center rounded-lg border border-indigo-200 dark:border-indigo-800 px-4 py-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 transition-colors font-medium"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>

              <Link 
                href="/login"
                className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all duration-300 font-medium shadow-sm hover:shadow-md dark:shadow-gray-900/50"
              >
                Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}