
/**
 * Shared API Utilities
 */

const isProd = import.meta.env.PROD;

/**
 * Fetches data from a URL. In production (static deployments), we skip problematic APIs
 * that don't support CORS to avoid console errors.
 */
export const fetchWithProxy = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // In production, only allow APIs that are known to work with CORS
    if (isProd) {
        // Allow ESPN APIs (they work)
        if (url.includes('espn.com')) {
            return fetch(url, options);
        }
        // Block other APIs that have CORS issues in production
        throw new Error(`API not available in production: ${url}`);
    }

    // Development: allow all APIs
    return fetch(url, options);
};
