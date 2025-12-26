import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initializeAnalytics, trackPageView } from "@/lib/analytics";

/**
 * Hook to initialize Google Analytics and track page views
 * Respects cookie consent preferences
 */
export const useAnalytics = () => {
  const location = useLocation();

  // Initialize analytics on mount (if consent given)
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
};

export default useAnalytics;