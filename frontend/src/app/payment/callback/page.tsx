'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';

interface CallbackState {
  status: 'loading' | 'success' | 'error' | 'cancelled';
  message: string;
  paymentData?: any;
}

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processing payment...'
  });

  useEffect(() => {
    const processCallback = async () => {
      // Log all URL parameters for debugging
      console.log('All URL parameters:', Object.fromEntries(searchParams.entries()));
      console.log('Full URL:', window.location.href);
      
      // Get all parameters from the URL
      let pidx = searchParams.get('pidx');
      let transactionId = searchParams.get('transaction_id');
      let status = searchParams.get('status');
      let bookingId = searchParams.get('booking_id');

      console.log('Initial callback parameters:', { pidx, transactionId, status, bookingId });

      // Handle case where parameters might be in a malformed URL after extra /?
      if (!pidx || !transactionId || !status || !bookingId) {
        // Try to extract parameters from the URL using regex for malformed URLs
        const url = window.location.href;
        console.log('Full URL for regex parsing:', url);
        
        // Extract all parameters using regex to handle malformed URLs
        const paramRegex = /[?&]([^=?&]+)=([^?&/#]+)/g;
        let match;
        const extractedParams: Record<string, string> = {};
        
        while ((match = paramRegex.exec(url)) !== null) {
          extractedParams[match[1]] = match[2];
        }
        
        console.log('Extracted parameters from URL:', extractedParams);
        
        // Use extracted parameters if we don't have them from searchParams
        if (!pidx && extractedParams.pidx) {
          pidx = extractedParams.pidx;
          console.log('Using extracted pidx:', pidx);
        }
        if (!transactionId && extractedParams.transaction_id) {
          transactionId = extractedParams.transaction_id;
          console.log('Using extracted transaction_id:', transactionId);
        }
        if (!status && extractedParams.status) {
          status = extractedParams.status;
          console.log('Using extracted status:', status);
        }
        if (!bookingId && extractedParams.booking_id) {
          bookingId = extractedParams.booking_id;
          console.log('Using extracted booking_id:', bookingId);
        }
      }

      // If we still don't have a booking ID, try to extract it from other malformed patterns
      if (!bookingId) {
        const url = window.location.href;
        console.log('Trying specific pattern matching for URL:', url);
        
        // Handle the specific case in the user's URL where there's an extra /?
        // Pattern: ?booking_id=126/?status=Completed...
        const bookingIdMatch = url.match(/[?&]booking_id=(\d+)(?:\/\?|[?&])/);
        if (bookingIdMatch) {
          bookingId = bookingIdMatch[1];
          console.log('Extracted booking_id from malformed URL pattern:', bookingId);
        } else {
          // Try another pattern where booking_id might be embedded in the URL
          const altMatch = url.match(/[?&]booking_id=(\d+)/);
          if (altMatch) {
            bookingId = altMatch[1];
            console.log('Extracted booking_id from alternative pattern:', bookingId);
          }
        }
      }

      // If we still don't have parameters, try to extract them from the full URL string
      if (!pidx || !transactionId || !status || !bookingId) {
        const url = window.location.href;
        console.log('Doing final parameter extraction from URL:', url);
        
        // Extract all parameters with a more comprehensive regex
        const allParamsRegex = /[?&]([^=?&]+)=([^?&#]+)/g;
        let match;
        const allParams: Record<string, string> = {};
        
        while ((match = allParamsRegex.exec(url)) !== null) {
          allParams[match[1]] = match[2];
        }
        
        console.log('All parameters from comprehensive regex:', allParams);
        
        if (!pidx && allParams.pidx) {
          pidx = allParams.pidx;
          console.log('Using pidx from comprehensive extraction:', pidx);
        }
        if (!transactionId && allParams.transaction_id) {
          transactionId = allParams.transaction_id;
          console.log('Using transaction_id from comprehensive extraction:', transactionId);
        }
        if (!status && allParams.status) {
          status = allParams.status;
          console.log('Using status from comprehensive extraction:', status);
        }
        if (!bookingId && allParams.booking_id) {
          bookingId = allParams.booking_id;
          console.log('Using booking_id from comprehensive extraction:', bookingId);
        }
      }

      if (!bookingId) {
        setCallbackState({
          status: 'error',
          message: 'Invalid payment callback parameters - booking ID not found'
        });
        return;
      }

      await processPayment(bookingId, pidx, transactionId, status);
    };

    const processPayment = async (bookingId: string, pidx: string | null, transactionId: string | null, status: string | null) => {
      if (!pidx) {
        setCallbackState({
          status: 'error',
          message: 'Invalid payment callback parameters - pidx not found'
        });
        return;
      }

      if (status === 'User canceled') {
        setCallbackState({
          status: 'cancelled',
          message: 'Payment was cancelled by user'
        });
        return;
      }

      if (status !== 'Completed') {
        setCallbackState({
          status: 'error',
          message: `Payment failed with status: ${status || 'unknown'}`
        });
        return;
      }

      try {
        const response = await api.post('/bookings/payments/process_khalti_callback/', {
          pidx: pidx,
          transaction_id: transactionId,
          booking_id: parseInt(bookingId),
          purchase_order_id: `booking_${bookingId}_${Date.now()}`
        });

        const data = response.data;

        if (data.success) {
          setCallbackState({
            status: 'success',
            message: 'Payment completed successfully!',
            paymentData: data
          });
        } else {
          throw new Error(data.error || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment callback processing error:', error);
        setCallbackState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Payment processing failed'
        });
      }
    };

    processCallback();
  }, [searchParams]);

  const handleContinue = () => {
    if (callbackState.status === 'success') {
      router.push('/dashboard/customer/bookings');
    } else {
      router.push('/services');
    }
  };

  const handleRetry = () => {
    // Try multiple approaches to extract booking ID for retry
    let bookingId = searchParams.get('booking_id');
    
    if (!bookingId) {
      // Try to extract booking ID from URL using regex as fallback
      const url = window.location.href;
      
      // Try comprehensive parameter extraction first
      const allParamsRegex = /[?&]([^=?&]+)=([^?&#]+)/g;
      let match;
      const allParams: Record<string, string> = {};
      
      while ((match = allParamsRegex.exec(url)) !== null) {
        allParams[match[1]] = match[2];
      }
      
      if (allParams.booking_id) {
        bookingId = allParams.booking_id;
      }
      
      // If still no booking ID, try specific patterns
      if (!bookingId) {
        const bookingIdMatch = url.match(/[?&]booking_id=(\d+)/);
        if (bookingIdMatch) {
          bookingId = bookingIdMatch[1];
        } else {
          // Handle the specific malformed URL pattern
          const malformedMatch = url.match(/\?booking_id=(\d+)\/\?/);
          if (malformedMatch) {
            bookingId = malformedMatch[1];
          }
        }
      }
    }
    
    if (bookingId) {
      router.push(`/bookings/${bookingId}/payment`);
    } else {
      // If we can't find booking ID, go to bookings dashboard instead of services
      router.push('/dashboard/customer/bookings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          {callbackState.status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <CardTitle className="text-blue-600 dark:text-blue-400">Processing Payment</CardTitle>
            </>
          )}
          
          {callbackState.status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
            </>
          )}
          
          {callbackState.status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600 dark:text-red-400">Payment Failed</CardTitle>
            </>
          )}
          
          {callbackState.status === 'cancelled' && (
            <>
              <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <CardTitle className="text-orange-600 dark:text-orange-400">Payment Cancelled</CardTitle>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={`${
            callbackState.status === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
            callbackState.status === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
            callbackState.status === 'cancelled' ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20' :
            'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
          }`}>
            <AlertDescription className={`${
              callbackState.status === 'success' ? 'text-green-800 dark:text-green-200' :
              callbackState.status === 'error' ? 'text-red-800 dark:text-red-200' :
              callbackState.status === 'cancelled' ? 'text-orange-800 dark:text-orange-200' :
              'text-blue-800 dark:text-blue-200'
            } text-center`}>
              {callbackState.message}
            </AlertDescription>
          </Alert>

          {callbackState.paymentData && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Payment Details</h4>
              <div className="space-y-1">
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100 font-medium">{callbackState.paymentData.transaction_id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Khalti ID:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100 font-medium">{callbackState.paymentData.khalti_transaction_id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Booking Status:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{callbackState.paymentData.booking_status}</span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {callbackState.status === 'success' && (
              <Button onClick={handleContinue} className="w-full">
                View My Bookings
              </Button>
            )}
            
            {(callbackState.status === 'error' || callbackState.status === 'cancelled') && (
              <>
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button onClick={handleContinue} variant="outline" className="w-full">
                  Browse Services
                </Button>
              </>
            )}
            
            {callbackState.status === 'loading' && (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}