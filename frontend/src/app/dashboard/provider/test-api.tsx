'use client'

import { useEffect, useState } from 'react'
import { providerApi } from '@/services/provider.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestProviderAPI() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await providerApi.getDashboardStats()
      setStats(data)
      
      console.log('Provider Dashboard Stats:', data)
    } catch (err: any) {
      setError(err.message)
      console.error('API Test Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Provider API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAPI} disabled={loading}>
            {loading ? 'Testing...' : 'Test Provider Dashboard API'}
          </Button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}
          
          {stats && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold mb-2">API Response:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(stats, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}