"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useErrorHandler } from "@/contexts/ErrorContext"
import { AlertTriangle, WifiOff, ServerCrash, Bug, Home, RefreshCw, ShieldX } from "lucide-react"

export default function TestErrorsPage() {
  const { handleError } = useErrorHandler()

  const triggerNetworkError = () => {
    const networkError = {
      message: "Network Error",
      code: "NETWORK_ERROR"
    }
    handleError(networkError, "Failed to connect to server. Please check your internet connection.")
  }

  const triggerServerError = () => {
    const serverError = {
      message: "Internal Server Error",
      response: {
        status: 500
      }
    }
    handleError(serverError, "Server is experiencing issues. Please try again later.")
  }

  const triggerGenericError = () => {
    const genericError = {
      message: "Something went wrong",
      response: {
        status: 400
      }
    }
    handleError(genericError, "An unexpected error occurred. Please try again.")
  }

  const triggerNatural404 = () => {
    // Navigate to a non-existent page to trigger Next.js 404 page
    window.location.href = '/non-existent-page-12345'
  }

  const triggerErrorBoundary = () => {
    // This will trigger the main error boundary
    throw new Error("Test error boundary - this is intentional for testing")
  }

  const triggerUnauthorizedError = () => {
    const unauthorizedError = {
      message: "Access Denied",
      response: {
        status: 403
      }
    }
    handleError(unauthorizedError, "You don't have permission to access this page.")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Error Handling Test Suite</h1>
          <p className="text-muted-foreground text-lg">
            Test all error types to see how they appear with the integrated error handling system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Network Error Test */}
          <Card className="border-red-200 dark:border-red-800 hover:shadow-lg hover:border-red-300 dark:hover:border-red-700 transition-all duration-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-700 dark:text-red-300">Network Error</CardTitle>
              </div>
              <CardDescription>
                Simulates network connectivity issues. Will show the beautiful network error page with header and footer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={triggerNetworkError}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 hover:text-red-800 hover:shadow-md transition-all duration-200 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950 dark:hover:border-red-600 dark:hover:text-red-200"
              >
                <WifiOff className="mr-2 h-4 w-4" />
                Trigger Network Error
              </Button>
            </CardContent>
          </Card>

          {/* Server Error Test */}
          <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ServerCrash className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-orange-700 dark:text-orange-300">Server Error (500)</CardTitle>
              </div>
              <CardDescription>
                Simulates server-side errors. Will show the animated server error page with header and footer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={triggerServerError}
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-800 hover:shadow-md transition-all duration-200 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950 dark:hover:border-orange-600 dark:hover:text-orange-200"
              >
                <ServerCrash className="mr-2 h-4 w-4" />
                Trigger Server Error
              </Button>
            </CardContent>
          </Card>

          {/* Generic Error Test */}
          <Card className="border-yellow-200 dark:border-yellow-800 hover:shadow-lg hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-yellow-700 dark:text-yellow-300">Generic Error</CardTitle>
              </div>
              <CardDescription>
                Simulates generic application errors. Will show the original error page design with header and footer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={triggerGenericError}
                variant="outline"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-800 hover:shadow-md transition-all duration-200 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-950 dark:hover:border-yellow-600 dark:hover:text-yellow-200"
              >
                <Bug className="mr-2 h-4 w-4" />
                Trigger Generic Error
              </Button>
            </CardContent>
          </Card>

          {/* 404 Error Test */}
          <Card className="border-blue-200 dark:border-blue-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-blue-700 dark:text-blue-300">404 Not Found</CardTitle>
              </div>
              <CardDescription>
                Test natural 404 errors. Navigates to a non-existent page to show the beautiful 404 page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={triggerNatural404}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 hover:shadow-md transition-all duration-200 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950 dark:hover:border-blue-600 dark:hover:text-blue-200"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Test 404 Page
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Unauthorized Error Test */}
        <Card className="mt-6 border-orange-200 dark:border-orange-800 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-orange-700 dark:text-orange-300">Unauthorized Access</CardTitle>
            </div>
            <CardDescription>
              Test unauthorized access errors and permission-based error pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={triggerUnauthorizedError}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-800 hover:shadow-md transition-all duration-200 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950 dark:hover:border-orange-600 dark:hover:text-orange-200"
            >
              <ShieldX className="mr-2 h-4 w-4" />
              Trigger Unauthorized Error
            </Button>
            <Button 
              onClick={() => window.location.href = '/test-errors/protected-admin'}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-800 hover:shadow-md transition-all duration-200 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950 dark:hover:border-orange-600 dark:hover:text-orange-200"
            >
              <ShieldX className="mr-2 h-4 w-4" />
              Test Protected Admin Page
            </Button>
          </CardContent>
        </Card>

        {/* Error Boundary Test */}
        <Card className="mt-6 border-purple-200 dark:border-purple-800 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-purple-700 dark:text-purple-300">Error Boundary Test</CardTitle>
            </div>
            <CardDescription>
              Throws an unhandled error to test the main error boundary. This will trigger the enhanced error.tsx page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={triggerErrorBoundary}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-800 hover:shadow-md transition-all duration-200 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950 dark:hover:border-purple-600 dark:hover:text-purple-200"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Trigger Error Boundary
            </Button>
          </CardContent>
        </Card>

        {/* Information Section */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Home className="h-5 w-5" />
              Test Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 dark:text-blue-300">
            <div className="space-y-2">
              <p><strong>Network Error:</strong> Shows custom network error page with header/footer</p>
              <p><strong>Server Error:</strong> Shows animated server error page with header/footer</p>
              <p><strong>Generic Error:</strong> Shows original error page design with header/footer</p>
              <p><strong>404 Error:</strong> Shows beautiful 404 page for navigation errors</p>
              <p><strong>Unauthorized Error:</strong> Shows permission-based error page with role information</p>
              <p><strong>Error Boundary:</strong> Shows enhanced error.tsx with error type detection</p>
            </div>
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> All error pages now include the site header and footer for consistent navigation. 
                The URL remains clean without any /error-pages/ routing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 text-center space-x-4">
          <Button 
            onClick={() => window.location.href = '/'}
            className="hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="hover:shadow-lg transition-all duration-200 hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  )
}
