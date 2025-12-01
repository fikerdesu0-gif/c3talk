export const GA_MEASUREMENT_ID = 'G-RZLNZ1TP76';

/**
 * Sends a page view event to Google Analytics.
 * @param path The virtual path to track (e.g., '/home', '/voice')
 */
export const trackPageView = (path: string) => {
  // Simple check to avoid tracking during local development
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';

  if (typeof window.gtag !== 'undefined' && isProduction) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }
};

/**
 * Sends a custom event to Google Analytics.
 */
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';

  if (typeof window.gtag !== 'undefined' && isProduction) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};