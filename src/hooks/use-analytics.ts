import { useCallback } from 'react';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, parameters?: Record<string, unknown>) => {
    if (analytics) {
      logEvent(analytics, eventName, parameters);
    }
  }, []);

  const setUser = useCallback((userId: string) => {
    if (analytics) {
      setUserId(analytics, userId);
    }
  }, []);

  const setUserProps = useCallback((properties: Record<string, unknown>) => {
    if (analytics) {
      setUserProperties(analytics, properties);
    }
  }, []);

  const trackPageView = useCallback((pageName: string, pageTitle?: string) => {
    trackEvent('page_view', {
      page_name: pageName,
      page_title: pageTitle || pageName,
    });
  }, [trackEvent]);

  const trackLogin = useCallback((method: string) => {
    trackEvent('login', { method });
  }, [trackEvent]);

  const trackSignUp = useCallback((method: string) => {
    trackEvent('sign_up', { method });
  }, [trackEvent]);

  const trackVideoPlay = useCallback((videoTitle: string, videoId: string) => {
    trackEvent('video_play', {
      video_title: videoTitle,
      video_id: videoId,
    });
  }, [trackEvent]);

  const trackVideoDownload = useCallback((videoTitle: string, videoId: string) => {
    trackEvent('video_download', {
      video_title: videoTitle,
      video_id: videoId,
    });
  }, [trackEvent]);

  const trackPackAccess = useCallback((packName: string, packId: string) => {
    trackEvent('pack_access', {
      pack_name: packName,
      pack_id: packId,
    });
  }, [trackEvent]);

  const trackCommissionReport = useCallback((reportType: string) => {
    trackEvent('commission_report_upload', {
      report_type: reportType,
    });
  }, [trackEvent]);

  const trackControlCampaign = useCallback((action: 'create' | 'update' | 'delete', campaignName: string) => {
    trackEvent('control_campaign', {
      action,
      campaign_name: campaignName,
    });
  }, [trackEvent]);

  const trackArtView = useCallback((artTitle: string, artId: string) => {
    trackEvent('art_view', {
      art_title: artTitle,
      art_id: artId,
    });
  }, [trackEvent]);

  const trackStickerView = useCallback((stickerTitle: string, stickerId: string) => {
    trackEvent('sticker_view', {
      sticker_title: stickerTitle,
      sticker_id: stickerId,
    });
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm: string, category: string) => {
    trackEvent('search', {
      search_term: searchTerm,
      category,
    });
  }, [trackEvent]);

  const trackError = useCallback((errorMessage: string, errorCode?: string) => {
    trackEvent('error', {
      error_message: errorMessage,
      error_code: errorCode,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    setUser,
    setUserProps,
    trackPageView,
    trackLogin,
    trackSignUp,
    trackVideoPlay,
    trackVideoDownload,
    trackPackAccess,
    trackCommissionReport,
    trackControlCampaign,
    trackArtView,
    trackStickerView,
    trackSearch,
    trackError,
  };
}; 