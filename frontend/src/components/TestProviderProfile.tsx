/**
 * PHASE 2 TEST COMPONENT: Provider Profile Integration Test
 * 
 * Purpose: Test the provider profile functionality with backend integration
 * Impact: Test component - validates Phase 2 frontend-backend integration
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProviderProfilePage } from './ProviderProfilePage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  User, 
  Star, 
  MessageSquare, 
  Database,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const TestProviderProfile: React.FC = () => {
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [customProviderId, setCustomProviderId] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Sample provider IDs for testing
  const sampleProviders = [
    { id: 1, name: 'John Doe', description: 'House Cleaning Provider' },
    { id: 2, name: 'Jane Smith', description: 'Plumbing Expert' },
    { id: 3, name: 'Mike Johnson', description: 'Electrical Technician' },
  ];

  const handleProviderSelect = (providerId: number) => {
    setSelectedProviderId(providerId);
  };

  const handleCustomProviderSubmit = () => {
    const id = parseInt(customProviderId);
    if (!isNaN(id) && id > 0) {
      setSelectedProviderId(id);
    }
  };

  const runAPITests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Backend Connection',
        description: 'Test if backend is running',
        test: async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/providers/1/profile/`);
            return { success: response.ok, message: response.ok ? 'Backend connected' : 'Backend not responding' };
          } catch (error) {
            return { success: false, message: `Connection failed: ${error}` };
          }
        }
      },
      {
        name: 'Provider Profile API',
        description: 'Test provider profile endpoint',
        test: async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/providers/1/profile/`);
            const data = await response.json();
            return { 
              success: response.ok, 
              message: response.ok ? 'Profile API working' : `Error: ${data.error || 'Unknown error'}`,
              data: response.ok ? data : null
            };
          } catch (error) {
            return { success: false, message: `Network error: ${error}` };
          }
        }
      },
      {
        name: 'Reviews API',
        description: 'Test provider reviews endpoint',
        test: async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/providers/1/reviews/`);
            const data = await response.json();
            return { 
              success: response.ok, 
              message: response.ok ? 'Reviews API working' : `Error: ${data.error || 'Unknown error'}`,
              data: response.ok ? data : null
            };
          } catch (error) {
            return { success: false, message: `Network error: ${error}` };
          }
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          ...test,
          ...result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          ...test,
          success: false,
          message: `Test failed: ${error}`,
          timestamp: new Date().toISOString()
        });
      }
      setTestResults([...results]);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }
    
    setIsRunningTests(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <TestTube className="w-8 h-8 text-blue-600" />
            Phase 2 Integration Test
          </h1>
          <p className="text-gray-600">
            Test the provider profile and reviews system integration between frontend and backend.
          </p>
        </div>

        <Tabs defaultValue="test-ui" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test-ui">UI Testing</TabsTrigger>
            <TabsTrigger value="api-tests">API Tests</TabsTrigger>
            <TabsTrigger value="integration">Full Integration</TabsTrigger>
          </TabsList>

          {/* UI Testing Tab */}
          <TabsContent value="test-ui" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Provider Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">Sample Providers</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sampleProviders.map((provider) => (
                      <Card 
                        key={provider.id} 
                        className={`cursor-pointer transition-all ${
                          selectedProviderId === provider.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleProviderSelect(provider.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Provider #{provider.id}</span>
                          </div>
                          <p className="text-sm text-gray-600">{provider.name}</p>
                          <p className="text-xs text-gray-500">{provider.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom-provider">Custom Provider ID</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="custom-provider"
                      type="number"
                      placeholder="Enter provider ID"
                      value={customProviderId}
                      onChange={(e) => setCustomProviderId(e.target.value)}
                    />
                    <Button onClick={handleCustomProviderSubmit}>
                      Load Provider
                    </Button>
                  </div>
                </div>

                {selectedProviderId && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Selected Provider ID: {selectedProviderId}. The provider profile will load below.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tests Tab */}
          <TabsContent value="api-tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backend API Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={runAPITests} 
                    disabled={isRunningTests}
                    className="flex items-center gap-2"
                  >
                    {isRunningTests ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    {isRunningTests ? 'Running Tests...' : 'Run API Tests'}
                  </Button>
                  
                  <Badge variant="outline">
                    API URL: {process.env.NEXT_PUBLIC_API_URL}
                  </Badge>
                </div>

                {testResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium">Test Results:</h3>
                    {testResults.map((result, index) => (
                      <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {result.success ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{result.name}</span>
                                <Badge variant={result.success ? 'default' : 'destructive'}>
                                  {result.success ? 'PASS' : 'FAIL'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                              <p className="text-sm">{result.message}</p>
                              {result.data && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-500 cursor-pointer">
                                    View Response Data
                                  </summary>
                                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(result.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Full Integration Tab */}
          <TabsContent value="integration" className="space-y-6">
            {selectedProviderId ? (
              <ProviderProfilePage providerId={selectedProviderId} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Provider Selected</h3>
                  <p className="text-gray-600 mb-4">
                    Please select a provider from the "UI Testing" tab to view their profile.
                  </p>
                  <Button onClick={() => setSelectedProviderId(1)}>
                    Load Sample Provider
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};