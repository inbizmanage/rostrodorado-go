export const GA_TRACKING_ID = 'G-0BRGVHGC76';

// https://developers.google.com/tag-platform/gtagjs/reference
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Update consent
export const updateGtagConsent = (granted: boolean) => {
  if (typeof window !== 'undefined' && window.gtag) {
    if (granted) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
      // console.log('✅ GA4 Consent Granted');
    }
  }
};

// Log specific events (pageview is an event called 'page_view')
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Only send the event if consent is historically given, though Consent Mode handles it anyway
    const consent = localStorage.getItem('rd_cookie_consent');
    if (consent === 'all') {
      window.gtag('config', GA_TRACKING_ID, {
        page_path: url,
      });
    }
  }
};

// Log specific events
export const event = ({ action, category, label, value }: { action: string; category?: string; label?: string; value?: number }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const consent = localStorage.getItem('rd_cookie_consent');
    if (consent === 'all') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }
};
