"use client"

import Image from "next/image"
import Link from "next/link"

// Background pattern for auth pages
const backgroundPattern = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`

interface AuthLayoutProps {
  children: React.ReactNode
  mode: "login" | "register"
}

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  const isLoginPage = mode === "login"

  return (
    <div className="min-h-screen bg-[#F3F4F6] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-10" />
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ backgroundImage: `url("${backgroundPattern}")` }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/frontend/public/favicon.png"
                  alt="SewaBazaar"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                SewaBazaar
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href={isLoginPage ? "/register" : "/login"}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isLoginPage ? "Create an account" : "Sign in"}
              </Link>
              <Link
                href={isLoginPage ? "/register" : "/login"}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isLoginPage
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-white text-purple-600 hover:bg-gray-50"}
                `}
              >
                {isLoginPage ? "Sign up" : "Login"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between space-y-2 text-sm text-gray-600 sm:flex-row sm:space-y-0">
            <p>© {new Date().getFullYear()} SewaBazaar. All rights reserved.</p>
            <nav className="flex space-x-4">
              <Link href="/terms" className="hover:text-gray-900 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <Link href="/contact" className="hover:text-gray-900 transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}