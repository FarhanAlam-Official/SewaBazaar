'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/services/api';

export default function KhaltiDebugPage() {
  const [bookingId, setBookingId] = useState('44'); // Default from our test
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testKhaltiConfig = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing Khalti configuration...');
      const response = await api.post('/bookings/payments/debug_khalti_config/');
      setResult(response.data);
    } catch (err: any) {
      console.error('Config test error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const testKhaltiPayment = async () => {
    if (!bookingId) {
      setError('Please enter a booking ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log(`Testing Khalti payment initiation for booking: ${bookingId}`);
      
      const requestPayload = {
        booking_id: parseInt(bookingId),
        return_url: `${window.location.origin}/payment/callback?booking_id=${bookingId}`,
        website_url: window.location.origin
      };
      
      console.log('Request payload:', requestPayload);
      
      const response = await api.post('/bookings/payments/initiate_khalti_payment/', requestPayload);
      
      console.log('Response:', response.data);
      setResult(response.data);
      
    } catch (err: any) {
      console.error('Payment test error:', err);
      
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers
      };
      
      console.error('Detailed error:', errorDetails);
      setError(JSON.stringify(errorDetails, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Khalti Payment Debug</h1>
      
      <div className="grid gap-6">
        {/* Configuration Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Khalti Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testKhaltiConfig} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Configuration'}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Payment Initiation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bookingId">Booking ID</Label>
              <Input
                id="bookingId"
                type="number"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Enter booking ID to test"
              />
            </div>
            
            <Button 
              onClick={testKhaltiPayment} 
              disabled={loading || !bookingId}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Payment Initiation'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <strong>Error:</strong>
              <pre className="mt-2 whitespace-pre-wrap text-xs">{error}</pre>
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>Success:</strong>
              <pre className="mt-2 whitespace-pre-wrap text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p><strong>Frontend URL:</strong> {process.env.NEXT_PUBLIC_FRONTEND_URL || 'Not set'}</p>
              <p><strong>Website URL:</strong> {process.env.NEXT_PUBLIC_WEBSITE_URL || 'Not set'}</p>
              <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
              <p><strong>Khalti Public Key:</strong> {process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY ? `${process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY.substring(0, 10)}...` : 'Not set'}</p>
              <p><strong>Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}