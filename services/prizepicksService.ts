
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

export const fetchPrizepicksProjections = async (): Promise<PrizepicksProjection[]> => {
    try {
        const url = "https://api.prizepicks.com/projections";
        const isProd = import.meta.env.PROD;
        const targetUrl = isProd ? url : "/api/prizepicks/projections";

        // PrizePicks requires these headers to avoid 403 blocks
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Connection": "keep-alive"
        };

        const response = await fetchWithProxy(targetUrl, { headers });

        if (!response.ok) {
            console.warn(`PrizePicks API returned ${response.status}. Skipping supplemental data.`);
            return [];
        }

        const json = await response.json();
        const { data, included } = json;

        if (!data || !included) return [];

        // 1. Build a record of players and leagues from the 'included' array
        const playersMap = new Map();
        const leaguesMap = new Map();

        included.forEach((item: any) => {
            if (item.type === 'new_player') {
                playersMap.set(item.id, item.attributes);
            } else if (item.type === 'league') {
                leaguesMap.set(item.id, item.attributes);
            }
        });

        // 2. Map the data projections to the players
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

        return projections;
    } catch (error) {
        console.error("PrizePicks Scraper Error:", error);
        return []; // Return empty array so analysis can still proceed
    }
};
