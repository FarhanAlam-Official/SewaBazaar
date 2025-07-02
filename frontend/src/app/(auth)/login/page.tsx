"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Cookies from "js-cookie";
import { showToast } from "@/components/ui/enhanced-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    setFieldErrors({ email: false, password: false });

    try {
      await login(email, password, rememberMe);
      // Get the user role from the cookie
      const userRole = Cookies.get("user_role") || "customer";
      // Show success toast
      showToast.success({
        title: "Login Successful",
        description: "Welcome back! Redirecting to dashboard...",
        duration: 1500,
      });
      // Redirect after toast duration
      setTimeout(() => {
        router.replace(`/dashboard/${userRole}`);
      }, 1500);
    } catch (err: any) {
      setFieldErrors({ email: true, password: true });
      showToast.error({
        title: "Authentication Error",
        description: err.message || "Invalid email or password",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName: 'email' | 'password') => `
    pl-10 appearance-none relative block w-full px-3 py-3 border 
    ${fieldErrors[fieldName] 
      ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500'} 
    rounded-lg placeholder-gray-500 dark:placeholder-gray-400 
    text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 
    focus:border-transparent bg-white/50 dark:bg-black/50 
    transition-all duration-300 
    ${fieldErrors[fieldName] 
      ? 'hover:border-red-400 dark:hover:border-red-400' 
      : 'hover:border-indigo-300 dark:hover:border-indigo-700'}
  `;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0B1120] dark:via-[#0D1424] dark:to-[#0F1627] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white/80 dark:bg-black/40 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-indigo-100/20 dark:border-white/10 transition-all duration-300 hover:shadow-2xl hover:border-indigo-300/30 dark:hover:border-white/20">
        <div>
          <h2 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
            Welcome back
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .spinner {
            animation: spin 0.8s linear infinite;
          }
        `}</style>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-5">
            <div className="group">
              <label htmlFor="email" className={`block text-sm font-medium ${fieldErrors.email ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'} transition-colors`}>
                Email address
              </label>
              <div className="mt-1 relative">
                <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${fieldErrors.email ? 'text-red-400 dark:text-red-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors(prev => ({ ...prev, email: false }));
                  }}
                  className={getInputClassName('email')}
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div className="group">
              <label htmlFor="password" className={`block text-sm font-medium ${fieldErrors.password ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'} transition-colors`}>
                Password
              </label>
              <div className="mt-1 relative">
                <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${fieldErrors.password ? 'text-red-400 dark:text-red-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors(prev => ({ ...prev, password: false }));
                  }}
                  className={getInputClassName('password')}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 rounded transition-all duration-300 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all duration-300 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-90 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 overflow-hidden"
            >
              <span className="inline-flex items-center">
                <span>{loading ? 'Signing in' : 'Sign in'}</span>
                <span className="relative flex items-center ml-2">
                  {loading ? (
                    <svg
                      className="spinner h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-white/80 group-hover:text-white transition-colors"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  )}
                </span>
              </span>
              <span className="absolute inset-0 flex items-center justify-start">
                <span className="h-full w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_2s_infinite]" />
              </span>
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all duration-300 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Add this to your global CSS or create a new CSS module
const styles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
`;