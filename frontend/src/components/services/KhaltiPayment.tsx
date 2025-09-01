/**
 * UPDATED COMPONENT: Khalti Payment Integration with e-Payment API v2
 * 
 * Purpose: Handle Khalti payment processing using new e-Payment API flow
 * Impact: Updated component - uses latest Khalti e-Payment API with redirect flow
 * 
 * Features:
 * - New e-Payment API v2 integration
 * - Payment initiation and redirect flow
 * - Callback handling and verification
 * - Error handling and success states
 * - Responsive design for mobile and desktop
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/services/api';

interface KhaltiPaymentProps {
  booking: {
    id: number;
    service: {
      title: string;
      provider: {
        full_name: string;
      };
    };
    total_amount: number;
    booking_date: string;
    booking_time: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentState {
  status: 'idle' | 'initiating' | 'redirecting' | 'processing' | 'success' | 'error';
  message: string;
  paymentData?: any;
}

export const KhaltiPayment: React.FC<KhaltiPaymentProps> = ({
  booking,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}) => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: 'idle',
    message: ''
  });

  // Initialize payment with Khalti e-Payment API
  const initiateKhaltiPayment = async () => {
    setPaymentState({ status: 'initiating', message: 'Initiating payment...' });

    try {
      // Initialize payment with proper error handling
      const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      // Fixed the return URL to ensure it works correctly with Khalti's redirect
      const returnUrl = `${frontendUrl}/payment/callback?booking_id=${booking.id}`;
      
      const requestPayload = {
        booking_id: booking.id,
        return_url: returnUrl,
        website_url: (process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000').replace(/\/$/, '')
      };

      const response = await api.post('/bookings/payments/initiate_khalti_payment/', requestPayload);
      const data = response.data;

      if (data.success) {
        setPaymentState({ status: 'redirecting', message: 'Redirecting to Khalti...' });
        
        // Redirect to Khalti payment page
        window.location.href = data.data.payment_url;
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }
    } catch (error: any) {
      // Enhanced error logging
      if (error.response) {
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message || 
                           `Request failed with status ${error.response.status}`;
        
        setPaymentState({ status: 'error', message: errorMessage });
        onPaymentError(errorMessage);
      } else if (error.request) {
        const errorMessage = 'Network error - please check your connection';
        setPaymentState({ status: 'error', message: errorMessage });
        onPaymentError(errorMessage);
      } else {
        const errorMessage = error.message || 'Payment initiation failed';
        setPaymentState({ status: 'error', message: errorMessage });
        onPaymentError(errorMessage);
      }
    }
  };

  // Handle payment callback processing
  const processPaymentCallback = async (pidx: string, transactionId: string) => {
    setPaymentState({ status: 'processing', message: 'Verifying payment...' });

    try {
      const response = await api.post('/bookings/payments/process_khalti_callback/', {
        pidx: pidx,
        transaction_id: transactionId,
        booking_id: booking.id,
        purchase_order_id: `booking_${booking.id}_${Date.now()}`
      });

      const data = response.data;

      if (data.success) {
        setPaymentState({
          status: 'success',
          message: 'Payment completed successfully!',
          paymentData: data
        });
        
        toast.success('Payment completed successfully!');
        onPaymentSuccess(data);
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
    } catch (error: any) {
      // Log error for debugging purposes
      console.error('Payment verification error:', error);
      
      // Prepare user-friendly error message
      let errorMessage = 'Payment verification failed';
      
      if (error.response) {
        if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status) {
          errorMessage = `Payment verification failed with status ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPaymentState({ status: 'error', message: errorMessage });
      onPaymentError(errorMessage);
    }
  };

  // Check for payment callback parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pidx = urlParams.get('pidx');
    const transactionId = urlParams.get('transaction_id');
    const status = urlParams.get('status');
    
    if (pidx && transactionId && status === 'Completed') {
      processPaymentCallback(pidx, transactionId);
    } else if (status === 'User canceled') {
      setPaymentState({ status: 'error', message: 'Payment was cancelled by user' });
      onPaymentError('Payment was cancelled by user');
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ne-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (paymentState.status === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-300">{paymentState.message}</p>
          {paymentState.paymentData && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Payment Details</h4>
              <div className="space-y-1">
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100 font-medium">{paymentState.paymentData.transaction_id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Khalti ID:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100 font-medium">{paymentState.paymentData.khalti_transaction_id}</span>
                </p>
              </div>
            </div>
          )}
          <Button onClick={() => window.location.href = '/dashboard/bookings'} className="w-full">
            View Booking
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold">{booking.service.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Provider: {booking.service.provider.full_name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Date: {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
          </p>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Total Amount:</span>
            <span className="font-bold text-lg">{formatCurrency(booking.total_amount)}</span>
          </div>
        </div>

        {/* Payment Status */}
        {paymentState.status === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {paymentState.message}
            </AlertDescription>
          </Alert>
        )}

        {paymentState.status === 'processing' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              {paymentState.message}
            </AlertDescription>
          </Alert>
        )}

        {paymentState.status === 'initiating' && (
          <Alert className="border-orange-200 bg-orange-50">
            <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
            <AlertDescription className="text-orange-800">
              {paymentState.message}
            </AlertDescription>
          </Alert>
        )}

        {paymentState.status === 'redirecting' && (
          <Alert className="border-purple-200 bg-purple-50">
            <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
            <AlertDescription className="text-purple-800">
              {paymentState.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Buttons */}
        <div className="space-y-3">
          <Button
            onClick={initiateKhaltiPayment}
            disabled={['initiating', 'redirecting', 'processing'].includes(paymentState.status)}
            className="w-full bg-[#5C2D91] hover:bg-[#4A1F7A] text-white"
          >
            {['initiating', 'redirecting', 'processing'].includes(paymentState.status) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {paymentState.status === 'initiating' && 'Initiating...'}
                {paymentState.status === 'redirecting' && 'Redirecting...'}
                {paymentState.status === 'processing' && 'Processing...'}
              </>
            ) : (
              <>
                <img 
                  src="https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/img/khalti-logo.png" 
                  alt="Khalti" 
                  className="w-5 h-5 mr-2" 
                />
                Pay with Khalti
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onCancel}
            disabled={['initiating', 'redirecting', 'processing'].includes(paymentState.status)}
            className="w-full"
          >
            Cancel Payment
          </Button>
        </div>

        {/* Payment Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Secure payment powered by Khalti</p>
          <p>• Supports all major banks and wallets in Nepal</p>
          <p>• Your payment information is encrypted and secure</p>
          <p>• You will be redirected to Khalti's secure payment page</p>
        </div>
      </CardContent>
    </Card>
  );
};