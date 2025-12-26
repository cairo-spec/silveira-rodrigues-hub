/**
 * Google Analytics Integration with Cookie Consent
 * 
 * This module handles Google Analytics (GA4) integration while respecting
 * user cookie consent preferences as required by LGPD.
 * 
 * SETUP:
 * 1. Create a Google Analytics 4 property at https://analytics.google.com
 * 2. Get your Measurement ID (format: G-XXXXXXXXXX)
 * 3. Replace the GA_MEASUREMENT_ID constant below
 */

// Replace with your actual Google Analytics Measurement ID
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

// Storage key for cookie preferences (must match CookieConsent.tsx)
const COOKIE_STORAGE_KEY = "cookie_consent_preferences";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  consentDate: string;
}

// Check if analytics cookies are consented
const hasAnalyticsConsent = (): boolean => {
  try {
    const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!stored) return false;
    const preferences: CookiePreferences = JSON.parse(stored);
    return preferences.analytics === true;
  } catch {
    return false;
  }
};

// Check if GA is already loaded
const isGALoaded = (): boolean => {
  return typeof window !== "undefined" && 
         typeof (window as any).gtag === "function";
};

// Load Google Analytics script dynamically
const loadGAScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isGALoaded()) {
      resolve();
      return;
    }

    // Don't load if no valid measurement ID
    if (GA_MEASUREMENT_ID === "G-XXXXXXXXXX") {
      console.warn("[Analytics] Google Analytics Measurement ID not configured");
      resolve();
      return;
    }

    // Create and inject gtag.js script
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    
    script.onload = () => {
      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(arguments);
      }
      (window as any).gtag = gtag;
      
      gtag("js", new Date());
      gtag("config", GA_MEASUREMENT_ID, {
        anonymize_ip: true, // LGPD: Anonymize IP addresses
        cookie_flags: "SameSite=None;Secure",
      });

      console.log("[Analytics] Google Analytics loaded successfully");
      resolve();
    };

    script.onerror = () => {
      console.error("[Analytics] Failed to load Google Analytics");
      reject(new Error("Failed to load GA script"));
    };

    document.head.appendChild(script);
  });
};

// Initialize analytics based on consent
export const initializeAnalytics = async (): Promise<void> => {
  if (!hasAnalyticsConsent()) {
    console.log("[Analytics] Analytics cookies not consented - skipping initialization");
    return;
  }

  try {
    await loadGAScript();
  } catch (error) {
    console.error("[Analytics] Initialization failed:", error);
  }
};

// Track page view
export const trackPageView = (path: string, title?: string): void => {
  if (!hasAnalyticsConsent() || !isGALoaded()) return;

  (window as any).gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
};

// Track custom event
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
): void => {
  if (!hasAnalyticsConsent() || !isGALoaded()) return;

  (window as any).gtag("event", eventName, params);
};

// Track user login
export const trackLogin = (method: string): void => {
  trackEvent("login", { method });
};

// Track signup
export const trackSignUp = (method: string): void => {
  trackEvent("sign_up", { method });
};

// Track conversion (e.g., subscription)
export const trackConversion = (
  transactionId: string,
  value: number,
  currency: string = "BRL"
): void => {
  trackEvent("purchase", {
    transaction_id: transactionId,
    value,
    currency,
  });
};

// Disable analytics (when user revokes consent)
export const disableAnalytics = (): void => {
  if (typeof window !== "undefined" && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
    (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    console.log("[Analytics] Analytics disabled");
  }
};

// Export measurement ID for reference
export const getMeasurementId = (): string => GA_MEASUREMENT_ID;