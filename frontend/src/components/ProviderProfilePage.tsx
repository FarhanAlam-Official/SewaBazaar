/**
 * PHASE 2 NEW PAGE COMPONENT: Public Provider Profile Page
 * 
 * Purpose: Public provider profile page with reviews and portfolio
 * Impact: New page component - provides public access to provider information
 */

'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProviderProfileComponent } from '@/components/features/ProviderProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ProviderProfilePageProps {
  providerId?: number | string | null;
}

export const ProviderProfilePage: React.FC<ProviderProfilePageProps> = ({ 
  providerId: providerIdProp 
}) => {
  const { user, isAuthenticated } = useAuth();
  
  const providerId = typeof providerIdProp === 'string' 
    ? parseInt(providerIdProp) 
    : typeof providerIdProp === 'number' 
    ? providerIdProp 
    : null;

  if (!providerId || isNaN(providerId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Invalid Provider ID</h1>
            <p className="text-gray-600 mb-6">
              Please provide a valid provider ID.
            </p>
            <Link href="/">
              <Button>Go Back Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProviderProfileComponent
      providerId={providerId}
      user={user}
      isAuthenticated={isAuthenticated}
    />
  );
};