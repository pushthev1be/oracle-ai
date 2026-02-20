
/**
 * PrizePicks Supplemental Data Service
 * Fetches projections for player props to provide extra context to the AI.
 */

import { fetchWithProxy } from "./apiUtils";

export interface PrizepicksProjection {
    player: string;
    line: string;
    stat: string;
    team: string;
    league: string;
}


let cachedProjections: PrizepicksProjection[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchPrizepicksProjections = async (): Promise<PrizepicksProjection[]> => {
    const isProd = (import.meta as any).env.PROD;
    if (isProd) return [];

    // Return cached data if valid
    const now = Date.now();
    if (cachedProjections && (now - lastFetchTime < CACHE_DURATION)) {
        console.log("Returning cached PrizePicks projections");
        return cachedProjections;
    }

    try {
        const targetUrl = "/api/prizepicks/projections";

        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Connection": "keep-alive"
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
        return projections;
    } catch (error) {
        console.error("PrizePicks Scraper Error:", error);
        return cachedProjections || [];
    }
};

