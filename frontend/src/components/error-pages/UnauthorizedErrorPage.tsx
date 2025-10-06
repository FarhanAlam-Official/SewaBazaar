"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldX, Home, ArrowLeft, Lock, UserCheck, AlertTriangle, XCircle, ShieldAlert } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { useError } from "@/contexts/ErrorContext"

export default function UnauthorizedErrorPage() {
  const { user } = useAuth()
  const { error } = useError()
  
  const viewerRole = user?.role || 'guest'
  const userName = user?.first_name || 'User'
  const required = (error?.requiredRoles && error.requiredRoles[0]) || error?.requestedRole || 'provider'
  const requestedPath = error?.requestedPath
  const isMismatch = viewerRole !== required

  const getRoleInfo = (requiredRole: string) => {
    switch (requiredRole) {
      case 'admin':
        return { 
          title: 'Admin Access Required', 
          description: 'This page is restricted to administrators only.',
          icon: ShieldX,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        }
      case 'provider':
        return { 
          title: 'Provider Access Required', 
          description: 'This page is restricted to service providers only.',
          icon: UserCheck,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        }
      case 'customer':
        return { 
          title: 'Customer Access Required', 
          description: 'This page is restricted to customers only.',
          icon: Lock,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        }
      default:
        return { 
          title: 'Authentication Required', 
          description: 'Please log in to access this page.',
          icon: Lock,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20'
        }
    }
  }

  const roleInfo = getRoleInfo(required)

  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15 } }
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background px-6 py-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.06),transparent_52%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_52%)]" />
      {/* Subtle animated gradient beams with red accent */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full blur-3xl opacity-50 dark:opacity-35" style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.28), rgba(59,130,246,0.22))" }} />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-[28rem] rounded-full blur-3xl opacity-45 dark:opacity-35" style={{ background: "linear-gradient(90deg, rgba(147,51,234,0.22), rgba(239,68,68,0.24))" }} />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center"
      >
        {/* Big attention heading */}
        <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-red-500 to-pink-500">
          Hold Up !
        </h2>
        {/* Main Icon */}
        {/* Static shield with exclamation as the main icon */}
        <div className={`relative w-24 h-24 rounded-2xl ${roleInfo.bgColor} flex items-center justify-center shadow-lg`}>
          <ShieldAlert className="w-14 h-14 text-blue-500 dark:text-blue-500" />
        </div>

        {/* Error Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 inline-flex items-center gap-3">
            <span>{roleInfo.title}</span>
            {isMismatch && (
              <XCircle className="w-6 h-6 md:w-7 md:h-7 text-red-500" />
            )}
          </h1>
          {isMismatch && (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-3 py-1 text-xs md:text-sm font-semibold shadow-sm">
                <ShieldX className="w-3.5 h-3.5" /> Access denied
              </span>
            </div>
          )}
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {roleInfo.description}
          </p>
          {requestedPath && (
            <div className={`inline-flex items-center gap-2 rounded-full border ${isMismatch ? 'border-red-200 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'} bg-white/60 dark:bg-slate-800/60 px-3 py-1 text-xs md:text-sm text-slate-700 dark:text-slate-200 hover:shadow-sm transition-shadow`}>
              <span className="font-medium">Requested</span>
              <span className="opacity-70">{requestedPath}</span>
            </div>
          )}
        </motion.div>

        {/* User Info Card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-xl"
        >
          <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300" style={{ background: "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(59,130,246,0.08), transparent 40%)" }} />
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg">Current Access Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user ? userName : 'Guest User'}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className="mt-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    {viewerRole.charAt(0).toUpperCase() + viewerRole.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap text-xs md:text-sm">
                <Badge className={`${isMismatch ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>Required: {required}</Badge>
                <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">You are: {viewerRole}</Badge>
              </div>
              
              {!user && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Not Logged In</span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Please log in to access restricted content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-xl"
        >
          <Button
            asChild
            className="group flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-y-0.5" />
              Go Home
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            className="group flex-1 border-slate-300 text-slate-800 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-0.5" />
              Go Back
            </Link>
          </Button>
        </motion.div>

        {/* Additional Help */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full max-w-3xl"
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <ShieldX className="w-6 h-6 text-red-500 mx-auto" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Access Denied</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    You don't have permission to view this page
                  </p>
                </div>
                <div className="space-y-2">
                  <Lock className="w-6 h-6 text-orange-500 mx-auto" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Authentication</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Make sure you're logged in with the correct account
                  </p>
                </div>
                <div className="space-y-2">
                  <UserCheck className="w-6 h-6 text-blue-500 mx-auto" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Role Required</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Contact support if you need access to this page
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="font-medium text-slate-900 dark:text-white">Try these steps</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Switch to the correct account</li>
                    <li>Ask an admin to grant you access</li>
                    <li>Return to your dashboard for available pages</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="font-medium text-slate-900 dark:text-white">Need assistance?</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    If you believe this is a mistake, please contact support with the page you tried to access and your role.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl animate-pulse" />
    </div>
  )
}
