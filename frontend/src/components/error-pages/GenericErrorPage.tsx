"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { AlertTriangle, RefreshCw, Home, Copy, Bug, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react"
import { useState } from "react"

interface GenericErrorPageProps {
  error?: Error & { digest?: string }
  reset?: () => void
  errorTitle?: string
  errorMessage?: string
}

export default function GenericErrorPage({ 
  error, 
  reset, 
  errorTitle = "Something went wrong",
  errorMessage = "An unexpected error occurred. Please try again."
}: GenericErrorPageProps) {
  const [detailsOpen, setDetailsOpen] = useState(true)

  const digest = error?.digest

  const handleCopy = async () => {
    try {
      const payload = JSON.stringify({
        title: errorTitle,
        message: errorMessage,
        digest,
        time: new Date().toISOString(),
      }, null, 2)
      await navigator.clipboard.writeText(payload)
      showToast.success({ title: "Error details copied" })
    } catch {
      showToast.error({ title: "Copy failed", description: "Please try again." })
    }
  }

  const handleReport = async () => {
    try {
      const subject = encodeURIComponent("SewaBazaar Error Report")
      const body = encodeURIComponent(
        `Please describe what you were doing when this happened.\n\n`+
        `Error Title: ${errorTitle}\n`+
        `Message: ${errorMessage}\n`+
        `Digest: ${digest || "N/A"}\n`+
        `Time: ${new Date().toISOString()}\n`
      )
      window.location.href = `mailto:support@sewabazaar.com?subject=${subject}&body=${body}`
      showToast.info({ title: "Opening mail client" })
    } catch {
      showToast.error({ title: "Could not open mail client" })
    }
  }

  const handleReset = () => {
    if (reset) {
      reset()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-[70vh] bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto border-0 shadow-none bg-transparent animate-fade-in-up">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-400/10 flex items-center justify-center mb-4 animate-bounce-in">
              <ShieldAlert className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
              {errorTitle}
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-300 mt-2">
              {errorMessage}
            </CardDescription>
            {digest && (
              <div className="mt-3">
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  Digest: {digest}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <Button 
                variant="outline"
                onClick={() => { window.location.href = "/" }}
                className="border-slate-300 text-slate-800 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Go home
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                variant="ghost" 
                onClick={handleCopy}
                className="justify-start hover:bg-red-50 hover:text-slate-900 dark:hover:bg-red-900/20 dark:hover:text-white"
              >
                <Copy className="w-4 h-4 mr-2 text-red-500" />
                Copy error details
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleReport}
                className="justify-start hover:bg-yellow-50 hover:text-slate-900 dark:hover:bg-yellow-900/20 dark:hover:text-white"
              >
                <Bug className="w-4 h-4 mr-2 text-yellow-600" />
                Report issue
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setDetailsOpen((v) => !v)}
                className="justify-start hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                {detailsOpen ? (
                  <ChevronUp className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-2" />
                )}
                {detailsOpen ? "Hide details" : "View details"}
              </Button>
            </div>

            {detailsOpen && (
              <div className="mt-6 animate-fade-in-up">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 p-4">
                  <pre className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words max-h-64 overflow-auto">
{`${error?.stack || errorMessage}`}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{icon: AlertTriangle, title: "What happened?", desc: "An unexpected error occurred. You can try again or return home."},
            {icon: RefreshCw, title: "Troubleshooting", desc: "Clear cache, reload the page, or try a different browser."},
            {icon: Bug, title: "Need help?", desc: "Report the issue with steps to reproduce so we can fix it quickly."}].map((item, i) => (
            <Card key={i} className="border-0 bg-transparent transition-colors duration-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{item.desc}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
