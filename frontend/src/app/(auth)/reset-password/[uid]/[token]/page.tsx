"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/api";
import { showToast } from "@/components/ui/enhanced-toast";

const generatePassword = () => {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const calculatePasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (password.match(/[a-z]+/)) strength += 1;
  if (password.match(/[A-Z]+/)) strength += 1;
  if (password.match(/[0-9]+/)) strength += 1;
  if (password.match(/[!@#$%^&*()_+]+/)) strength += 1;
  return strength;
};

export default function ResetPasswordLinkPage() {
  const params = useParams<{ uid: string; token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = calculatePasswordStrength(password);
  
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return "bg-red-500 dark:bg-red-600";
      case 2:
      case 3:
        return "bg-yellow-500 dark:bg-yellow-600";
      case 4:
        return "bg-indigo-500 dark:bg-indigo-600";
      case 5:
        return "bg-purple-500 dark:bg-purple-600";
      default:
        return "bg-gray-200 dark:bg-gray-700";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return "Very Weak";
      case 2:
        return "Weak";
      case 3:
        return "Medium";
      case 4:
        return "Strong";
      case 5:
        return "Very Strong";
      default:
        return "";
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

  const isValid = password.length >= 8 && password === confirmPassword;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await authService.confirmPasswordReset(params.uid, params.token, password);
      showToast.success({ 
        title: "Password updated successfully", 
        description: "Your password has been reset. You can now sign in with your new password.", 
        duration: 3500 
      });
      // Redirect to login page after 2 seconds for better user feedback
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "The reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0B1120] dark:via-[#0D1424] dark:to-[#0F1627] py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/40 backdrop-blur-sm p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-indigo-300/30 dark:hover:border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:scale-110">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.567-3 3.5-3S19 9.343 19 11v1m-7 4h6m-9-5a4 4 0 10-8 0v6a4 4 0 008 0v-6z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set a new password</h1>
            <p className="text-gray-600 dark:text-gray-400">Choose a strong password to secure your account.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-300 animate-shake">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-black/50 px-4 py-3 pr-20 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                  placeholder="Enter new password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="mr-8 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    Generate
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="pr-3"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px]">{getPasswordStrengthText()}</span>
                </div>
              </div>
            </div>

            <div className="group">
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 pr-10 outline-none bg-white/70 dark:bg-black/50 transition-all duration-300 ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-red-400 dark:hover:border-red-500"
                      : "border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                  placeholder="Re-enter new password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)} 
                  className="absolute inset-y-0 right-0 pr-3 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                  {showConfirm ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-90 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 overflow-hidden"
            >
              <span className="inline-flex items-center">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating password...
                  </>
                ) : (
                  "Update Password"
                )}
              </span>
              <span className="absolute inset-0 flex items-center justify-start">
                <span className="h-full w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_2s_infinite]" />
              </span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-gray-300 dark:border-gray-700 flex-grow"></div>
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">or</span>
              <div className="border-t border-gray-300 dark:border-gray-700 flex-grow"></div>
            </div>

            <Link 
              href="/login"
              className="group relative w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
            >
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </span>
            </Link>
          </form>

          {/* Add OTP Alternative Option */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Want to use a code instead?</p>
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
        </div>
      </div>
    </div>
  );
}