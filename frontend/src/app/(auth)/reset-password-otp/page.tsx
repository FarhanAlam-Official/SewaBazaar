"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function ResetPasswordOTPPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const requestCode = async () => {
    if (!email) return showToast.error({ title: "Email required", description: "Enter your email first" });
    if (password.length < 8 || password !== confirmPassword) return showToast.error({ title: "Invalid password", description: "Passwords must match and be at least 8 characters" });
    
    try {
      setLoading(true);
      await authService.requestOTP(email);
      showToast.success({ 
        title: "Code sent successfully", 
        description: `We've sent a 6-digit verification code to ${email}. Please check your inbox.`, 
        duration: 3000 
      });
      setCodeSent(true);
      setCooldown(60);
    } catch (err: any) {
      showToast.error({ 
        title: "Failed to send code", 
        description: err.message || "Unable to send verification code. Please try again.", 
        duration: 3500 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return showToast.error({ title: "Invalid code", description: "Enter all 6 digits" });
    
    setLoading(true);
    try {
      await authService.resetPasswordWithOTP(email, code, password);
      showToast.success({ 
        title: "Password updated successfully", 
        description: "Your password has been reset. You can now sign in with your new password.", 
        duration: 3500 
      });
      // Reset form after successful password update
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setOtp(["", "", "", "", "", ""]);
      setCodeSent(false);
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 1000);
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

  const handleResendCode = async () => {
    if (!email) return showToast.error({ title: "Email required", description: "Enter your email first" });
    
    try {
      setLoading(true);
      await authService.requestOTP(email);
      showToast.success({ 
        title: "New code sent", 
        description: `We've sent a new 6-digit verification code to ${email}.`, 
        duration: 3000 
      });
      setCooldown(60);
      // Clear previous OTP
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      showToast.error({ 
        title: "Failed to resend code", 
        description: err.message || "Unable to resend verification code. Please try again.", 
        duration: 3500 
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (codeSent && otp.every(digit => digit !== "") && otp.length === 6) {
      const timer = setTimeout(() => {
        handleVerify();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [otp, codeSent]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0B1120] dark:via-[#0D1424] dark:to-[#0F1627] py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/40 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-indigo-300/30 dark:hover:border-white/20 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:scale-110">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.567-3 3.5-3S19 9.343 19 11v1m-7 4h6m-9-5a4 4 0 10-8 0v6a4 4 0 008 0v-6z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset your password</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {codeSent 
                ? `Enter the 6-digit code we sent to ${email}` 
                : "Enter your email and new password, then request a verification code"}
            </p>
          </div>

          <div className="space-y-6">
            {!codeSent ? (
              <>
                {/* Email Input - Only visible before code is sent */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-black/50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                {/* Password Fields - Only visible before code is sent */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">New Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-black/50 px-4 py-3 pr-32 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                      placeholder="Enter new password"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="mr-3 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
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
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full rounded-lg border px-4 py-3 pr-12 outline-none bg-white/70 dark:bg-black/50 transition-all duration-300 ${
                        confirmPassword && password !== confirmPassword
                          ? "border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-red-400 dark:hover:border-red-500"
                          : "border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                      placeholder="Re-enter new password"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Send Code Button */}
                <button
                  type="button"
                  disabled={loading || cooldown > 0}
                  onClick={requestCode}
                  className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-90 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 overflow-hidden"
                >
                  <span className="inline-flex items-center">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending code...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-start">
                    <span className="h-full w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_2s_infinite]" />
                  </span>
                </button>
              </>
            ) : (
              <>
                {/* OTP Input - Only visible after code is sent */}
                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">6-digit code</label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading || cooldown > 0}
                      className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>
                  </div>
                  <div className="flex justify-between space-x-2">
                    {otp.map((d, idx) => (
                      <input
                        key={idx}
                        ref={el => { if (el) inputRefs.current[idx] = el; }}
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 1);
                          const next = [...otp];
                          next[idx] = val;
                          setOtp(next);
                          if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
                        }}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                      />
                    ))}
                  </div>
                  {cooldown > 0 && (
                    <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                      You can resend the code in {cooldown} seconds
                    </div>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleVerify}
                  className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-90 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 overflow-hidden"
                >
                  <span className="inline-flex items-center">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      "Verify & Update Password"
                    )}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-start">
                    <span className="h-full w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_2s_infinite]" />
                  </span>
                </button>
              </>
            )}

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
          </div>
        </div>

        {/* Add Email-based Reset Option */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Prefer to reset via email link?{" "}
            <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all duration-300 hover:underline">
              Request email reset
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}