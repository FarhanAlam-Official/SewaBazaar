"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface KhaltiConfig {
  publicKey: string
  environment: string
  baseUrl: string
}

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function KhaltiTestPage() {
  const [config, setConfig] = useState<KhaltiConfig | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    // Load Khalti configuration
    const khaltiConfig: KhaltiConfig = {
      publicKey: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY || '',
      environment: process.env.NEXT_PUBLIC_KHALTI_ENVIRONMENT || '',
      baseUrl: process.env.NEXT_PUBLIC_API_URL || ''
    }
    setConfig(khaltiConfig)
  }, [])

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result])
  }

  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(result => 
        result.name === name ? { ...result, ...updates } : result
      )
    )
  }

  const testKhaltiConfiguration = async () => {
    const testName = "Khalti Configuration"
    addTestResult({ name: testName, status: 'pending', message: 'Checking configuration...' })

    try {
      if (!config?.publicKey) {
        updateTestResult(testName, {
          status: 'error',
          message: 'Khalti public key not found in environment variables'
        })
        return false
      }

      if (config.environment !== 'sandbox') {
        updateTestResult(testName, {
          status: 'warning',
          message: `Environment is '${config.environment}', expected 'sandbox' for testing`
        })
      } else {
        updateTestResult(testName, {
          status: 'success',
          message: `Configuration valid - Public Key: ${config.publicKey.substring(0, 10)}...`
        })
      }
      return true
    } catch (error) {
      updateTestResult(testName, {
        status: 'error',
        message: `Configuration error: ${error}`
      })
      return false
    }
  }

  const testBackendConnectivity = async () => {
    const testName = "Backend Connectivity"
    addTestResult({ name: testName, status: 'pending', message: 'Testing backend connection...' })

    try {
      const response = await fetch(`${config?.baseUrl}/bookings/payment-methods/`)
      
      if (response.ok) {
        const data = await response.json()
        const khaltiMethod = data.find((method: any) => method.name === 'Khalti')
        
        if (khaltiMethod) {
          updateTestResult(testName, {
            status: 'success',
            message: 'Backend connected - Khalti payment method available',
            details: khaltiMethod
          })
        } else {
          updateTestResult(testName, {
            status: 'warning',
            message: 'Backend connected but Khalti payment method not found'
          })
        }
        return true
      } else {
        updateTestResult(testName, {
          status: 'error',
          message: `Backend connection failed: HTTP ${response.status}`
        })
        return false
      }
    } catch (error) {
      updateTestResult(testName, {
        status: 'error',
        message: `Backend connection error: ${error}`
      })
      return false
    }
  }

  const testKhaltiLibraryLoading = async () => {
    const testName = "Khalti Library Loading"
    addTestResult({ name: testName, status: 'pending', message: 'Loading Khalti SDK...' })

    try {
      // Check if Khalti SDK can be loaded
      const script = document.createElement('script')
      script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/khalti-checkout.iffe.js'
      
      return new Promise<boolean>((resolve) => {
        script.onload = () => {
          updateTestResult(testName, {
            status: 'success',
            message: 'Khalti SDK loaded successfully'
          })
          resolve(true)
        }
        
        script.onerror = () => {
          updateTestResult(testName, {
            status: 'error',
            message: 'Failed to load Khalti SDK'
          })
          resolve(false)
        }
        
        document.head.appendChild(script)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          updateTestResult(testName, {
            status: 'error',
            message: 'Khalti SDK loading timeout'
          })
          resolve(false)
        }, 10000)
      })
    } catch (error) {
      updateTestResult(testName, {
        status: 'error',
        message: `Khalti library error: ${error}`
      })
      return false
    }
  }

  const testKhaltiCheckoutInitialization = async () => {
    const testName = "Khalti Checkout Initialization"
    addTestResult({ name: testName, status: 'pending', message: 'Initializing Khalti checkout...' })

    try {
      // Check if KhaltiCheckout is available
      if (typeof (window as any).KhaltiCheckout !== 'undefined') {
        const checkout = new (window as any).KhaltiCheckout({
          publicKey: config?.publicKey,
          productIdentity: "test-product",
          productName: "Test Service",
          productUrl: window.location.origin,
          paymentPreference: [
            "KHALTI",
            "EBANKING",
            "MOBILE_BANKING",
            "CONNECT_IPS",
            "SCT",
          ],
          eventHandler: {
            onSuccess(payload: any) {
              console.log('Khalti payment success:', payload)
            },
            onError(error: any) {
              console.log('Khalti payment error:', error)
            },
            onClose() {
              console.log('Khalti widget closed')
            }
          }
        })

        updateTestResult(testName, {
          status: 'success',
          message: 'Khalti checkout initialized successfully'
        })
        return true
      } else {
        updateTestResult(testName, {
          status: 'error',
          message: 'KhaltiCheckout not available - SDK may not be loaded'
        })
        return false
      }
    } catch (error) {
      updateTestResult(testName, {
        status: 'error',
        message: `Khalti checkout initialization error: ${error}`
      })
      return false
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    try {
      await testKhaltiConfiguration()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testBackendConnectivity()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testKhaltiLibraryLoading()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await testKhaltiCheckoutInitialization()
    } catch (error) {
      console.error('Test suite error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Khalti Integration Test Suite
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Verify your Khalti payment integration is working correctly
          </p>
        </div>

        {/* Configuration Overview */}
        {config && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Public Key</p>
                  <p className="text-sm text-gray-900">
                    {config.publicKey ? `${config.publicKey.substring(0, 10)}...` : 'Not configured'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Environment</p>
                  <Badge variant={config.environment === 'sandbox' ? 'default' : 'destructive'}>
                    {config.environment || 'Not configured'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">API URL</p>
                  <p className="text-sm text-gray-900">{config.baseUrl}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="w-full md:w-auto"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {result.name}
                        </h3>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.message}
                      </p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            View Details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Testing Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Khalti Sandbox Testing Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <h4>Test Credentials for Khalti Sandbox:</h4>
              <ul>
                <li><strong>Phone:</strong> 9800000000</li>
                <li><strong>MPIN:</strong> 1111</li>
                <li><strong>OTP:</strong> 987654</li>
              </ul>
              
              <h4>Test Card Details:</h4>
              <ul>
                <li><strong>Card Number:</strong> 5200000000000022</li>
                <li><strong>CVV:</strong> 123</li>
                <li><strong>Expiry:</strong> Any future date</li>
              </ul>
              
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> This is sandbox mode - no real money is charged!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}