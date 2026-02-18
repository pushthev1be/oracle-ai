
/**
 * Shared API Utilities
 */

const isProd = import.meta.env.PROD;

/**
 * Fetches data from a URL, using a CORS proxy in production if needed.
 * This is a workaround for static deployments (Render/Vercel) to reach external APIs.
 */
export const fetchWithProxy = async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!isProd) {
        return fetch(url, options);
    }

    // Use allorigins.win as a proxy to bypass CORS in production
    // We use the /raw endpoint to get the direct response
    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxiedUrl, options);
        return response;
    } catch (error) {
        console.error(`Proxy Fetch Error for ${url}:`, error);
        // Fallback to direct fetch if proxy fails
        return fetch(url, options);
    }
};
