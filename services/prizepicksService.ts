
/**
 * PrizePicks Supplemental Data Service
 * Fetches projections for player props to provide extra context to the AI.
 */

import { fetchWithProxy } from "./apiUtils";
import { getCache, setCache } from "./cacheService";

export interface PrizepicksProjection {
    player: string;
    line: string;
    stat: string;
    team: string;
    league: string;
}


let cachedProjections: PrizepicksProjection[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export const fetchPrizepicksProjections = async (): Promise<PrizepicksProjection[]> => {
    const isProd = (import.meta as any).env.PROD;
    if (isProd) return [];

    // Return cached data if valid
    const now = Date.now();

    // 1. Check Global Cache
    const globalCacheKey = "prizepicks_projections";
    const globalCached = await getCache<PrizepicksProjection[]>(globalCacheKey);
    if (globalCached) {
        console.log("Returning global cached PrizePicks projections");
        return globalCached;
    }

    // 2. Return local memory cache if valid (for very fast repeat access in same session)
    if (cachedProjections && (now - lastFetchTime < CACHE_DURATION)) {
        console.log("Returning memory cached PrizePicks projections");
        return cachedProjections;
    }

    try {
        const targetUrl = "/api/prizepicks/projections";

        const headers = {
            "Accept": "application/json",
        };

        const response = await fetchWithProxy(targetUrl, { headers });

        if (!response.ok) {
            console.warn(`PrizePicks API returned ${response.status}. Skipping supplemental data.`);
            return cachedProjections || []; // Return cache even if expired if fetch fails
        }

        const json = await response.json();
        const { data, included } = json;

        if (!data || !included) return cachedProjections || [];

        const playersMap = new Map();
        const leaguesMap = new Map();

        included.forEach((item: any) => {
            if (item.type === 'new_player') {
                playersMap.set(item.id, item.attributes);
            } else if (item.type === 'league') {
                leaguesMap.set(item.id, item.attributes);
            }
        });

        const projections: PrizepicksProjection[] = data.map((proj: any) => {
            const playerId = proj.relationships?.new_player?.data?.id;
            const leagueId = proj.relationships?.league?.data?.id;

            const playerAttr = playersMap.get(playerId);
            const leagueAttr = leaguesMap.get(leagueId);

            return {
                player: playerAttr?.display_name || playerAttr?.name || "Unknown",
                line: proj.attributes?.line_score?.toString() || "0",
                stat: proj.attributes?.stat_type || "Unknown",
                team: playerAttr?.team || "Unknown",
                league: leagueAttr?.name || leagueAttr?.abbreviation || "Unknown"
            };
        });

        cachedProjections = projections;
        lastFetchTime = now;

        // Save to Global Cache
        await setCache(globalCacheKey, projections, { ttl: CACHE_DURATION });

        return projections;
    } catch (error) {
        console.error("PrizePicks Scraper Error:", error);
        return cachedProjections || [];
    }
};

