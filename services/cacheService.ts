import { supabase } from './supabaseClient';

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
}

export const getCache = async <T>(key: string): Promise<T | null> => {
    if (!supabase) return null;

    try {
        const { data, error, status } = await supabase
            .from('global_cache')
            .select('data, expires_at')
            .eq('key', key)
            .limit(1);

        if (error) {
            if (status === 406 || (error as any).message?.includes('Acceptable')) {
                console.warn('⚡ [Oracle Cache] 406 Error detected. Falling back to array-based fetch.');
            } else {
                console.error('[Cache] Error fetching from Supabase:', JSON.stringify(error, null, 2));
            }
            return null;
        }

        const record = data && data.length > 0 ? data[0] : null;
        if (!record) return null;

        if (new Date(record.expires_at) < new Date()) {
            console.log(`[Cache] Expired for key: ${key}`);
            await supabase.from('global_cache').delete().eq('key', key);
            return null;
        }

        return record.data as T;
    } catch (e) {
        console.error('[Cache] Unexpected error:', e);
        return null;
    }
};

export const setCache = async <T>(key: string, data: T, options: CacheOptions = {}): Promise<void> => {
    if (!supabase) return;

    const ttl = options.ttl || 4 * 60 * 60 * 1000; // Default 4 hours
    const expires_at = new Date(Date.now() + ttl).toISOString();

    try {
        const { error, status } = await supabase
            .from('global_cache')
            .upsert({
                key,
                data,
                expires_at,
                created_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            if (error.code === 'PGRST204' || error.code === 'PGRST205' || status === 406) {
                console.warn('⚠️ Supabase "global_cache" table not found. Please run the SQL script in your Supabase dashboard to enable global caching.');
            } else {
                console.error('[Cache] Error writing to Supabase:', JSON.stringify(error, null, 2));
            }
        } else {
            console.log(`✅ [Oracle Cache] Successfully saved to Global Cache: ${key}`);
        }
    } catch (e) {
        console.error('[Cache] Unexpected error:', e);
    }
};

/**
 * Searches for recent analyses for a specific team to provide context for new predictions.
 * Uses Supabase JSONB filtering to find matches where the team was either home or away.
 */
export const searchRecentAnalyses = async (teamName: string, limit = 2): Promise<any[]> => {
    if (!supabase) return [];

    try {
        // Query matches where team name appears in the stored match data
        // This allows the AI to learn from "Team X"'s recent performance
        const { data, error } = await supabase
            .from('global_cache')
            .select('data, created_at')
            .or(`data->match->homeTeam->>name.eq."${teamName}",data->match->awayTeam->>name.eq."${teamName}"`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.warn('[Cache] Search failed:', error.message);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error('[Cache] Search exception:', e);
        return [];
    }
};
/**
 * Fetches global live statistics from the global_cache table.
 * Returns the total count of analyses and the most recent few records.
 */
export const getGlobalLiveStats = async (): Promise<{ count: number; recent: any[] }> => {
    if (!supabase) return { count: 0, recent: [] };

    try {
        // 1. Get total count of analyses
        const { count, error: countError } = await supabase
            .from('global_cache')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.warn('[Cache] Count fetch failed:', countError.message);
        }

        // 2. Get 5 most recent analyses for the live feed
        const { data: recent, error: recentError } = await supabase
            .from('global_cache')
            .select('data, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) {
            console.warn('[Cache] Recent fetch failed:', recentError.message);
        }

        return {
            count: count || 0,
            recent: recent || []
        };
    } catch (e) {
        console.error('[Cache] Global stats exception:', e);
        return { count: 0, recent: [] };
    }
};
