import { GoogleGenAI } from "@google/genai";
import { Match, AIAnalysis, PlayerProp } from "../types";
import { fetchPrizepicksProjections } from "./prizepicksService";
import { getCache, setCache, searchRecentAnalyses } from "./cacheService";

// Circuit breaker for Search Grounding to avoid repeated 429s (Shared across calls)
let searchGroundingCooldownUntil = 0;
// Key rotation index
let currentKeyIndex = 0;

const CACHE_KEY_PREFIX = "oracle_analysis_";
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 Hours

// --- ADVANCED QUOTA MANAGEMENT ---
// Tracks when a specific key is available again
const keyCooldowns = new Map<string, number>();
// Tracks search usage per key to respect the ~2 RPM limit in free tier/experimental
const searchUsage = new Map<string, { count: number, resetAt: number }>();

const SEARCH_LIMIT_PERIOD = 60000; // 60 Seconds
const SEARCH_MAX_PER_PERIOD = 2;   // Increased capacity to reduce internal fallback
const KEY_COOLDOWN_MS = 150000;    // 2.5 Minutes for deeper recovery

/**
 * Generates a high-speed sports analysis using the Gemini Flash model with Google Search grounding.
 * Now includes Prediction Caching and Multi-Key Rotation.
 */
export const getAIAnalysis = async (match: Match, userPrediction: string, playerProps: PlayerProp[]): Promise<AIAnalysis> => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${match.id}`;

    // 1. CHECK CACHE (Global-First Strategy)
    try {
      const cachedData = await getCache<AIAnalysis>(cacheKey);
      if (cachedData) {
        console.log(`[Oracle] Global Cache HIT for match ${match.id}`);
        return cachedData;
      }

      // Fallback to local cache for transition (optional)
      const localCached = localStorage.getItem(cacheKey);
      if (localCached) {
        const { timestamp, data } = JSON.parse(localCached);
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log(`[Oracle] Local Cache HIT for match ${match.id}`);
          // Migrate to global cache
          await setCache(cacheKey, data, { ttl: CACHE_TTL });
          return data;
        }
      }
    } catch (e) {
      console.warn("[Oracle] Cache read error:", e);
    }

    // 2. PREPARE API KEYS (N-Key Dynamic Rotation)
    const env = (import.meta as any).env;
    const availableKeys = [
      env.VITE_GEMINI_API_KEY,
      env.VITE_GEMINI_API_KEY_2,
      env.VITE_GEMINI_API_KEY_3,
      env.VITE_GEMINI_API_KEY_4,
      env.VITE_GEMINI_API_KEY_5
    ].filter(Boolean);

    if (availableKeys.length === 0) {
      throw new Error("Missing Gemini API Keys (VITE_GEMINI_API_KEY)");
    }

    const today = new Date().toLocaleDateString();
    const propsString = playerProps.length > 0
      ? playerProps.map(p => `- ${p.player} to get ${p.value} (${p.type})`).join('\n')
      : "No specific player props provided.";

    // Get Supplemental Data
    const projections = await fetchPrizepicksProjections();
    const relevantProps = projections.filter(p =>
      p.player.toLowerCase().includes(match.homeTeam.name.toLowerCase()) ||
      p.player.toLowerCase().includes(match.awayTeam.name.toLowerCase()) ||
      p.team.toLowerCase().includes(match.homeTeam.name.toLowerCase()) ||
      p.team.toLowerCase().includes(match.awayTeam.name.toLowerCase())
    ).slice(0, 10);

    const supplementalString = relevantProps.length > 0
      ? relevantProps.map(p => `- ${p.player} (${p.team}): ${p.line} ${p.stat}`).join('\n')
      : "No supplemental market data found for this match.";

    // 2.5 ORACLE MEMORY: Fetch historical data for teams
    let historicalIntelligence = "No past Oracle analyses found for these teams.";
    try {
      const homeHistory = await searchRecentAnalyses(match.homeTeam.name, 1);
      const awayHistory = await searchRecentAnalyses(match.awayTeam.name, 1);

      const allHistory = [...homeHistory, ...awayHistory];
      if (allHistory.length > 0) {
        historicalIntelligence = allHistory.map((h: any) => {
          const pastMatch = h.data.match;
          const pastAnalysis = h.data;
          const isFinished = pastMatch.status === 'Finished';

          let log = `[Past Match: ${pastMatch.homeTeam.name} vs ${pastMatch.awayTeam.name} (${new Date(h.created_at).toLocaleDateString()})]\n`;
          log += `- Your Previous Prediction: ${pastAnalysis.prediction}\n`;

          if (isFinished && pastMatch.result) {
            const actualResult = `${pastMatch.result.homeScore}-${pastMatch.result.awayScore}`;
            log += `- ACTUAL RESULT: ${actualResult}\n`;
            log += `- LEARNING: If the result mismatch your prediction, identify the flaw in your past logic (e.g. underestimated defense, ignored injury).`;
          }
          return log;
        }).join('\n\n');
      }
    } catch (e) {
      console.warn("[Oracle] History fetch failed:", e);
    }

    const prompt = `
    TODAY'S DATE: ${today}
    
    ANALYZE THIS MATCH FOR EXPERT BETTING INSIGHTS:
    Competition: ${match.competition}
    Home Team: ${match.homeTeam.name}
    Away Team: ${match.awayTeam.name}
    Match Date: ${match.date}
    
    User context/hunch: ${userPrediction}
    User specific bets:
    ${propsString}

    SUPPLEMENTAL MARKET CONTEXT (PrizePicks):
    ${supplementalString}

    ORACLE MEMORY (Past Predictions & Results):
    ${historicalIntelligence}
    
    TASKS:
    1. Search for the LATEST team news, injuries, and lineup info relative to the Match Date (${match.date}).
    2. ***CRITICAL***: Verify the CURRENT SQUAD. Do NOT use historical knowledge (e.g., Mbappé is NO LONGER at PSG).
    3. ***HUNCH VALIDATION***: Specifically address the user's hunch/reasoning: "${userPrediction}". Is this substantiated by current data? Explain if you agree or disagree based on recent stats/news.
    4. ***ACCURACY CHECK (Target 70%+)***: 
       - Find last 3-5 match outcomes and last 3 Head-to-Head (H2H) results.
       - Analyze Home vs Away splits.
       - Identify "Triple Validation" points (Stats + Form + News).
    5. ***NARRATIVE SIGNALS (Superstitions)***:
       - Momentum: New manager bounce, revenge motivation, derby intensity.
       - Expectation: Media hype, public favorite bias.
       - Pressure: Relegation battle, title decider, upcoming cup/European fixture fatigue.
    6. ***DATA-FIRST RIGOR & BIAS CORRECTION***: 
       - **NEUTRALITY**: Do NOT default to "Over" predictions. If recent matches for both teams show low scoring or strong defense, prioritize "Under" markets.
       - **STATISTICAL THRESHOLD**: For "Over 9.5 Corners," verify that both teams combined average at least 10 corners per match. If data is missing or average is lower, suggest "Under 9.5 Corners" or choose a different market entirely.
       - **ORACLE LEARNING**: Look at the ORACLE MEMORY provided above. If your past prediction for either team was WRONG based on the ACTUAL RESULT, explain why in your reasoning and correct your logic for this new prediction.
       - **NO REPETITION**: Avoid picking the same market (e.g., Over 9.5 Corners) for multiple matches in a batch unless it is an extreme statistical outlier.
       - **UNDER MARKETS**: Actively look for "Clean Sheet" records, "Strong Defensive Form," and "Low xG" trends to justify "Under 2.5 Goals" recommendations.
    
    Format EXACTLY as tags:
    [PREDICTION] Summary verdict and win/draw probability [/PREDICTION]
    [SCORELINE] 2-1 [/SCORELINE]
    [SCORERS] Surname1, Surname2 (Cur. Team Verified) [/SCORERS]
    [PLAY] Specific suggested betting market [/PLAY]
    [PROP_INSIGHTS] Detailed analysis of user picks [/PROP_INSIGHTS]
    [QUICKPICKS]
    (DO NOT INCLUDE HEADERS. Provide only 3 lines like standard data:)
    CATEGORY|MARKET_NAME|SELECTION|CONFIDENCE_SCORE
    [/QUICKPICKS]
    [NARRATIVE]
    (List 1-3 psychological signals found, pipes separated:)
    Category|Label|Impact (positive/negative)|Description
    [/NARRATIVE]
    [REASONING] 
    Provide a comprehensive breakdown. You MUST include your verdict on the user's hunch ("${userPrediction}") here—tell them if their logic is sharp or flawed based on your research. 
    [/REASONING]
  `;

    const modelId = "gemini-2.0-flash";
    let response;
    // Dynamic max retries based on available keys
    const maxRetries = Math.min(availableKeys.length * 2, 6);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // SMART KEY SELECTION:
      // Pass 1: Prioritize keys that have search quota remaining.
      // Pass 2: Fall back to normal rotation.
      let keyIndex;
      if (attempt < availableKeys.length) {
        // Find first key starting from currentKeyIndex that has search budget
        let found = -1;
        for (let i = 0; i < availableKeys.length; i++) {
          const checkIdx = (currentKeyIndex + i) % availableKeys.length;
          const k = availableKeys[checkIdx];
          const usage = searchUsage.get(k) || { count: 0, resetAt: 0 };
          const inCooldown = Date.now() < (keyCooldowns.get(k) || 0);

          if (!inCooldown && (Date.now() > usage.resetAt || usage.count < SEARCH_MAX_PER_PERIOD)) {
            found = checkIdx;
            break;
          }
        }
        keyIndex = found !== -1 ? found : (currentKeyIndex + attempt) % availableKeys.length;
      } else {
        keyIndex = (currentKeyIndex + attempt) % availableKeys.length;
      }

      const selectedKey = availableKeys[keyIndex];

      // 1. Check if key is in hard cooldown (429)
      const cooldownUntil = keyCooldowns.get(selectedKey) || 0;
      if (Date.now() < cooldownUntil) {
        if (attempt === maxRetries - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
        continue;
      }

      console.log(`[Oracle] Attempt ${attempt + 1}/${maxRetries} using Key ${keyIndex + 1}`);

      try {
        const ai = new GoogleGenAI({ apiKey: selectedKey });

        // 2. Manage Search Grounding Quota (Token Bucket per key)
        const usage = searchUsage.get(selectedKey) || { count: 0, resetAt: 0 };
        if (Date.now() > usage.resetAt) {
          usage.count = 0;
          usage.resetAt = Date.now() + SEARCH_LIMIT_PERIOD;
        }

        const canUseSearch = usage.count < SEARCH_MAX_PER_PERIOD;

        try {
          // If we can't use search on THIS key, we jump straight to internal fallback to save the model request
          if (!canUseSearch) {
            console.warn(`[Oracle] Key ${keyIndex + 1} search budget exhausted. Using internal intelligence.`);
            throw new Error("Local search budget exhausted");
          }

          usage.count++;
          searchUsage.set(selectedKey, usage);

          response = await Promise.race([
            ai.models.generateContent({
              model: modelId,
              contents: prompt,
              config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.0,
              }
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Oracle Request Timeout (90s)")), 90000)
            )
          ]);
        } catch (searchError: any) {
          const isSearchLimit = searchError.message?.includes('429') || searchError.status === 429;

          if (isSearchLimit) {
            console.warn(`[Oracle] Search limit hit for Key ${keyIndex + 1}. Marking for search cooldown.`);
            // Mark search as exhausted for this key for this cycle
            usage.count = SEARCH_MAX_PER_PERIOD;
            usage.resetAt = Date.now() + SEARCH_LIMIT_PERIOD;
            searchUsage.set(selectedKey, usage);
          }

          // Simplify prompt for internal fallback to avoid search-related complexity/quota issues
          const internalPrompt = prompt
            .replace(/1\. Search for the LATEST team news.*/i, "1. Use your internal knowledge for team news.")
            .replace(/Search grounding/i, "Internal analysis");

          response = await ai.models.generateContent({
            model: modelId,
            contents: internalPrompt + "\n\nNOTE: Live search is currently unavailable. Perform this analysis using your internal knowledge. STICK TO YOUR STATISTICAL RIGOR.",
            config: {
              temperature: 0.0,
            }
          });
        }

        // Update current key index for the next global call to start from a fresh key
        currentKeyIndex = (keyIndex + 1) % availableKeys.length;
        break;
      } catch (err: any) {
        const isRateLimit = err.message?.includes('429') || err.status === 429;
        // Switch Key & Wait (Backoff)
        console.warn(`[Oracle] Key ${keyIndex + 1} fully exhausted. Mark for cooldown & retrying with next key in 2s.`);
        keyCooldowns.set(selectedKey, Date.now() + KEY_COOLDOWN_MS);
        await new Promise(r => setTimeout(r, 2000));
        continue;
        throw err;
      }
    }

    if (!response) {
      throw new Error("All Gemini API keys are currently exhausted (429). Please wait a minute for the quota to reset.");
    }

    const text = (response as any).text || "";


    const extract = (tag: string) => {
      // Improved regex to be case-insensitive and match even if closing tag is missing (greedy up to next tag or end)
      const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?:\\[\\/${tag}\\]|$)`, "i");
      const match = text.match(regex);
      return match?.[1]?.trim() || "";
    };

    // Parse QuickPicks - Limit to top 3 by confidence
    const rawQuickPicks = extract("QUICKPICKS");
    const quickPicks = rawQuickPicks.split("\n")
      .filter(line => line.includes("|") && !line.includes("MARKET_NAME")) // Filter out prompt headers
      .map(line => {
        const parts = line.split("|").map(s => s.trim());
        if (parts.length < 4) return null;
        const [category, market, selection, confidence] = parts;
        return {
          category: category as any,
          market,
          selection,
          confidence: parseInt(confidence.replace(/[^0-9]/g, "")) || 70
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    // Parse Narrative Signals
    const rawNarrative = extract("NARRATIVE");
    const narrativeSignals = rawNarrative.split("\n")
      .filter(line => line.includes("|") && !line.includes("Label"))
      .map(line => {
        const parts = line.split("|").map(s => s.trim());
        if (parts.length < 4) return null;
        const [category, label, impact, description] = parts;
        return {
          category: category as any,
          label,
          impact: impact.toLowerCase() as any,
          description
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

    const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchQueries = (response as any).candidates?.[0]?.groundingMetadata?.searchEntryPoint?.renderedContent || "";

    if (searchQueries) {
      console.log("Oracle Search Grounding used queries:", searchQueries);
    }

    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Live Source",
        uri: chunk.web.uri
      }));

    const result: AIAnalysis = {
      prediction: extract("PREDICTION"),
      scoreline: extract("SCORELINE"),
      likelyScorers: extract("SCORERS").split(",").map(s => s.trim()).filter(Boolean),
      suggestedPlay: extract("PLAY"),
      reasoning: extract("REASONING"),
      playerPropInsights: extract("PROP_INSIGHTS"),
      quickPicks,
      narrativeSignals,
      groundingSources: sources
    };

    // 3. SAVE TO CACHE (Global & Local)
    try {
      const cacheData = {
        ...result,
        match: match // Critical for the Live Dashboard to show team names
      };
      await setCache(cacheKey, cacheData, { ttl: CACHE_TTL });
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: cacheData
      }));
    } catch (e) {
      console.warn("[Oracle] Cache write error:", e);
    }

    return result;
  } catch (error) {
    console.error("Oracle Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      prediction: "Oracle Hub Connection Issue",
      scoreline: "ERR",
      likelyScorers: [],
      suggestedPlay: "Check API Settings",
      reasoning: `The AI analysis failed with the following error: ${errorMessage}. This usually happens when the prompt is too complex or the API rate limit is hit. Try simplifying your 'hunch'.`,
      playerPropInsights: "Detailed insights unavailable due to connection error.",
      groundingSources: [],
      narrativeSignals: []
    };
  }
};
