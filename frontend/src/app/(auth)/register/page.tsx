"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer",
    profileImage: null as File | null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const pendingUserDataRef = useRef<FormData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Countdown for OTP resend button
  useEffect(() => {
    if (step !== "otp") return;
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown, step]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (step === "otp" && otpDigits.every(digit => digit !== "") && otpDigits.length === 6) {
      const timer = setTimeout(() => {
        handleVerifyOTP();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [otpDigits, step]);

  const passwordStrength = calculatePasswordStrength(formData.password);
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData(prev => ({
      ...prev,
      password: newPassword,
      confirmPassword: newPassword
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.password || !formData.confirmPassword) {
      setError("Please fill in all password fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 3) {
      setError("Please use a stronger password");
      return;
    }

    setLoading(true);

    try {
      const userData = new FormData();
      userData.append("email", formData.email);
      userData.append("username", formData.email);
      userData.append("password", formData.password);
      userData.append("password2", formData.confirmPassword);
      userData.append("first_name", formData.firstName);
      userData.append("last_name", formData.lastName);
      userData.append("phone", formData.phone);
      userData.append("role", formData.role);
      if (formData.profileImage) {
        userData.append("profile_picture", formData.profileImage);
      }

      // Do NOT create the user yet. First send OTP and move to verify step.
      pendingUserDataRef.current = userData;
      showToast.info({ 
        title: "Verify your email", 
        description: `We sent a 6‑digit code to ${formData.email}. Please check your inbox.`, 
        duration: 3000 
      });
      setStep("otp");
      setResendCooldown(60);
      try {
        await authService.requestOTP(formData.email);
      } catch (_) {
        // ignore; keep user on OTP step
      }
    } catch (err: any) {
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            setError(firstError[0]);
          } else {
            setError(String(firstError));
          }
        } else {
          setError(String(errorData));
        }
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      showToast.error({ title: "Invalid code", description: "Enter the 6-digit code" });
      return;
    }
    try {
      // Create the user ONLY after OTP entry, then login via OTP
      if (!pendingUserDataRef.current) {
        showToast.error({ title: "Something went wrong", description: "Please try registering again." });
        return;
      }
      await authService.registerOnly(pendingUserDataRef.current);
      await authService.verifyOTPLogin(formData.email, code, true);
      showToast.success({ 
        title: "Account verified", 
        description: "Welcome to SewaBazaar! Your account has been successfully created.", 
        duration: 2500 
      });
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch (err: any) {
      showToast.error({ 
        title: "Verification failed", 
        description: err.message || "Invalid or expired code. Please try again.", 
        duration: 4000 
      });
    }
  };

  const isFormValid = () => {
    return formData.password === formData.confirmPassword && 
           formData.password !== "" && 
           formData.confirmPassword !== "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0B1120] dark:via-[#0D1424] dark:to-[#0F1627] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white/80 dark:bg-black/40 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-indigo-100/20 dark:border-white/10 transition-all duration-300 hover:shadow-2xl hover:border-indigo-300/30 dark:hover:border-white/20">
        <div>
          {step === "form" ? (
            <>
              <h2 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">Create your account</h2>
              <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">Join SewaBazaar today</p>
            </>
          ) : (
            <>
              <h2 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">Check your email</h2>
              <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">Enter the code sent to {formData.email}</p>
            </>
          )}
        </div>
        {step === "form" && (
          <div className="flex justify-center space-x-4 mb-8">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: "customer" }))}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                formData.role === "customer"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-gray-100 text-gray-600 hover:bg-indigo-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: "provider" }))}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                formData.role === "provider"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-gray-100 text-gray-600 hover:bg-indigo-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Service Provider
            </button>
          </div>
        )}

        {/* Profile Image Upload (hidden during OTP step) */}
        {step === "form" && (
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-32 h-32 mb-4 group">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Profile preview"
                fill
                className="rounded-full object-cover border-4 border-indigo-100 group-hover:border-indigo-200 dark:border-indigo-900 dark:group-hover:border-indigo-800 transition-colors duration-300"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-indigo-50 border-4 border-indigo-100 group-hover:border-indigo-200 dark:bg-indigo-950 dark:border-indigo-900 dark:group-hover:border-indigo-800 transition-colors duration-300 flex items-center justify-center">
                <svg className="w-16 h-16 text-indigo-200 dark:text-indigo-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <label htmlFor="profile-image" className="cursor-pointer">
            <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-all duration-300">
              Upload Profile Picture
            </span>
            <input
              id="profile-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        )}

        {step === "form" ? (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md animate-shake dark:bg-red-950/50 dark:border-red-600">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="rounded-md space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 dark:bg-black/50 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 dark:bg-black/50 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 dark:bg-black/50 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 dark:bg-black/50 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                placeholder="Phone number"
              />
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Password
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-20 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 dark:bg-black/50 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
                  placeholder="Enter your password"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent bg-white/50 dark:bg-black/50 transition-all duration-300 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? "border-red-300 focus:ring-red-500 dark:border-red-700 dark:focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-500 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : "Create Account"}
            </button>
          </div>
        </form>
        ) : (
          <div className="mt-8 space-y-6">
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
                    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                      inputRefs.current[idx - 1]?.focus();
                    }
                  }}
                  className="w-12 h-14 text-center text-xl rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ))}
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">Can't find the email? Check your spam folder</p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  const code = otpDigits.join("");
                  if (code.length !== 6) {
                    showToast.error({ title: "Invalid code", description: "Please enter the correct 6 digit code",duration:2500 });
                    return;
                  }
                  try {
                    // Create the user ONLY after OTP entry, then login via OTP
                    if (!pendingUserDataRef.current) {
                      showToast.error({ title: "Something went wrong", description: "Please try registering again.", duration:2500 });
                      return;
                    }
                    await authService.registerOnly(pendingUserDataRef.current);
                    await authService.verifyOTPLogin(formData.email, code, true);
                    showToast.success({ title: "Verified", description: "Welcome to SewaBazaar", duration: 1800 });
                    router.push("/dashboard");
                  } catch (err: any) {
                    showToast.error({ title: "Verification failed", description: err.message || "Invalid or expired code", duration: 3500 });
                  }
                }}
                className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 transition-colors font-medium"
              >
                Verify and Continue
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={async () => {
                  try {
                    await authService.requestOTP(formData.email);
                    showToast.success({ 
                      title: "New code sent", 
                      description: `We've sent a new 6-digit verification code to ${formData.email}.`, 
                      duration: 3000 
                    });
                    setResendCooldown(60);
                  } catch (_) {
                    showToast.success({ 
                      title: "New code sent", 
                      description: `We've sent a new 6-digit verification code to ${formData.email}.`, 
                      duration: 3000 
                    });
                    setResendCooldown(60);
                  }
                }}
                className="w-full inline-flex justify-center items-center rounded-lg border border-indigo-200 dark:border-indigo-800 px-4 py-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>

              <div className="space-y-2">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">Entered the wrong email?</p>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all duration-300 font-medium shadow-sm hover:shadow-md dark:shadow-gray-900/50"
                >
                  ← Go back and edit email
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all duration-300 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}