"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import { showToast } from "@/components/ui/enhanced-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [emailError, setEmailError] = useState("");
  const router = useRouter();

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;

    // Validate email
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    setLoading(true);
    
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
      setRetryCount(prev => prev + 1);
      setCooldown(60); // 1 minute cooldown
      
      showToast.success({
        title: "Email sent",
        description: "Check your inbox for reset instructions.",
        duration: 2400,
      });
    } catch (err: any) {
      // We still show success to avoid user enumeration
      setSent(true);
      setRetryCount(prev => prev + 1);
      setCooldown(60);
      
      showToast.success({
        title: "Email sent",
        description: "Check your inbox for reset instructions.",
        duration: 2400,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    try {
      setLoading(true);
      await authService.requestPasswordReset(email);
      setCooldown(60);
      showToast.success({
        title: "Email resend",
        description: "We sent another reset email. Check your inbox.",
        duration: 2400,
      });
    } catch (_) {
      // Keep generic success to avoid enumeration
      setCooldown(60);
      showToast.success({
        title: "Email sent",
        description: "We sent another reset email. Check your inbox.",
        duration: 2400,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0B1120] dark:via-[#0D1424] dark:to-[#0F1627]">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Forgot Password?</h1>
            <p className="text-gray-600 dark:text-gray-400">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              {/* Success State */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We've sent password reset instructions to <span className="font-medium text-indigo-600 dark:text-indigo-400">{email}</span>
                </p>
              </div>

              {/* Important Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Important Information
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Check your spam/junk folder if you don't see the email</li>
                  <li>• The reset link expires in 24 hours</li>
                  <li>• You can only use the link once</li>
                  <li>• Contact support if you need help</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : (loading ? "Sending..." : "Resend Email")}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="group relative w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
                >
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Login
                  </span>
                </button>
              </div>

              {/* Alternative Options */}
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Still having trouble?</p>
                <div className="flex justify-center space-x-4 text-sm">
                  <Link href="/login-otp" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Try OTP Login
                  </Link>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full rounded-lg border px-4 py-3 outline-none transition-colors ${
                    emailError
                      ? "border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                  } bg-transparent`}
                  placeholder="Enter your email address"
                />
                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="group relative w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
                >
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Login
                  </span>
                </Link>
              </div>

              {/* Add OTP Alternative Option */}
              <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Prefer to reset with a code instead?</p>
                <Link 
                  href="/reset-password-otp" 
                  className="inline-flex items-center justify-center px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors text-sm font-medium"
                >
                  Reset with OTP Code
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Need help? <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">Contact our support team</Link></p>
        </div>
      </div>
    </div>
  );
}


