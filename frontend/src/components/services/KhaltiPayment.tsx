/**
 * PHASE 1 NEW COMPONENT: Khalti Payment Integration
 * 
 * Purpose: Handle Khalti payment processing for bookings
 * Impact: New component - adds payment functionality without affecting existing booking flow
 * 
 * Features:
 * - Khalti checkout popup integration
 * - Payment verification with backend
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

// Khalti SDK types
declare global {
  interface Window {
    KhaltiCheckout: any;
  }
}

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
  status: 'idle' | 'processing' | 'success' | 'error';
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
  const [khaltiLoaded, setKhaltiLoaded] = useState(false);

  // Khalti configuration
  const khaltiConfig = {
    // Khalti sandbox public key for Nepal
    publicKey: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY || 'test_public_key_dc74e0fd57cb46cd93832aee0a507256',
    productIdentity: `booking_${booking.id}`,
    productName: booking.service.title,
    productUrl: `${window.location.origin}/bookings/${booking.id}`,
    paymentPreference: [
      'KHALTI',
      'EBANKING',
      'MOBILE_BANKING',
      'CONNECT_IPS',
      'SCT',
    ],
    eventHandler: {
      onSuccess: async (payload: any) => {
        console.log('Khalti payment success:', payload);
        await handlePaymentSuccess(payload);
      },
      onError: (error: any) => {
        console.error('Khalti payment error:', error);
        handlePaymentError('Payment failed. Please try again.');
      },
      onClose: () => {
        console.log('Khalti checkout closed');
        setPaymentState({ status: 'idle', message: '' });
      }
    }
  };

  // Load Khalti SDK
  useEffect(() => {
    const loadKhaltiSDK = () => {
      if (window.KhaltiCheckout) {
        setKhaltiLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/khalti-checkout.iffe.js';
      script.async = true;
      script.onload = () => {
        setKhaltiLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Khalti SDK');
        setPaymentState({
          status: 'error',
          message: 'Failed to load payment system. Please refresh and try again.'
        });
      };
      document.head.appendChild(script);
    };

    loadKhaltiSDK();

    return () => {
      // Cleanup script if component unmounts
      const script = document.querySelector('script[src*="khalti-checkout"]');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handlePaymentSuccess = async (khaltiResponse: any) => {
    setPaymentState({ status: 'processing', message: 'Verifying payment...' });

    try {
      const response = await fetch('/api/bookings/payments/process_khalti_payment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          token: khaltiResponse.token,
          amount: khaltiResponse.amount,
          booking_id: booking.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
    } catch (error) {
      console.error('Payment verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
      setPaymentState({ status: 'error', message: errorMessage });
      onPaymentError(errorMessage);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setPaymentState({ status: 'error', message: errorMessage });
    toast.error(errorMessage);
    onPaymentError(errorMessage);
  };

  const initiateKhaltiPayment = () => {
    if (!khaltiLoaded || !window.KhaltiCheckout) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    setPaymentState({ status: 'processing', message: 'Initializing payment...' });

    try {
      const checkout = new window.KhaltiCheckout({
        ...khaltiConfig,
        amount: Math.round(booking.total_amount * 100), // Convert to paisa
      });
      
      checkout.show();
    } catch (error) {
      console.error('Error initializing Khalti checkout:', error);
      handlePaymentError('Failed to initialize payment. Please try again.');
    }
  };

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
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{paymentState.message}</p>
          {paymentState.paymentData && (
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <p><strong>Transaction ID:</strong> {paymentState.paymentData.transaction_id}</p>
              <p><strong>Khalti ID:</strong> {paymentState.paymentData.khalti_transaction_id}</p>
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

        {/* Payment Buttons */}
        <div className="space-y-3">
          <Button
            onClick={initiateKhaltiPayment}
            disabled={!khaltiLoaded || paymentState.status === 'processing'}
            className="w-full bg-[#5C2D91] hover:bg-[#4A1F7A] text-white"
          >
            {paymentState.status === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
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
            disabled={paymentState.status === 'processing'}
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
        </div>
      </CardContent>
    </Card>
  );
};