"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuth } from '@/context/auth-context';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const { trackPageView, setUser, setUserProps } = useAnalytics();
  const { user } = useAuth();

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname, trackPageView]);

  // Set user properties when user changes
  useEffect(() => {
    if (user) {
      setUser(user.id.toString());
      setUserProps({
        user_email: user.email,
        user_name: user.username,
        user_document_id: user.documentId,
      });
    }
  }, [user, setUser, setUserProps]);

  return <>{children}</>;
} 