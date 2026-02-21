/**
 * Analytics Service
 * Handles custom event tracking for Google Analytics
 */

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, params);
        console.log(`[Analytics] Tracked: ${eventName}`, params);
    }
};

export const AnalyticsEvents = {
    SEARCH_GROUNDED_ANALYSIS: 'deep_scan_triggered',
    QUICKSLIP_ADDED: 'quickslip_match_added',
    QUICKSLIP_BATCH_ANALYSIS: 'quickslip_batch_triggered',
    QUICKSLIP_BATCH_ANALYSIS_SUCCESS: 'quickslip_batch_success',
    QUICKSLIP_BATCH_ANALYSIS_FAILURE: 'quickslip_batch_failure',
    ONBOARDING_COMPLETED: 'onboarding_finalized',
    ONBOARDING_SKIPPED: 'onboarding_skipped',
    MATCH_SELECTED: 'match_selection_viewed',
    AUTH_SUCCESS: 'user_identity_created',
    AUTH_LOGOUT: 'user_deauthenticated',
};
