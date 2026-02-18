
import { GoogleGenAI } from "@google/genai";
import { Match, AIAnalysis, PlayerProp } from "../types";
import { fetchPrizepicksProjections } from "./prizepicksService";

/**
 * Generates a high-speed sports analysis using the Gemini Flash model with Google Search grounding.
 */
export const getAIAnalysis = async (match: Match, userPrediction: string, playerProps: PlayerProp[]): Promise<AIAnalysis> => {
  // Try real API call with timeout
  try {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.VITE_API_KEY;
    console.log("Checking Gemini API Key:", apiKey ? "FOUND (starts with " + apiKey.substring(0, 4) + ")" : "MISSING");
    if (!apiKey) throw new Error("Missing Gemini API Key in environment variables (VITE_GEMINI_API_KEY)");

    const ai = new GoogleGenAI({ apiKey });

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

    const today = new Date().toLocaleDateString();

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
    
    TASKS:
    1. Search for the LATEST team news, injuries, and lineup info relative to the Match Date (${match.date}).
    2. ***CRITICAL***: Verify the CURRENT SQUAD. Do NOT use historical knowledge.
    3. ***HARD WARNING***: Kylian Mbappé is NO LONGER at PSG (he is at Real Madrid). Do not list him as a PSG scorer under any circumstances.
    4. Provide an expert verdict on the likely winner or draw.
    4. Predict the exact scoreline.
    5. DETAILED ANALYSIS of user's bets/props based on current stats.

    Format EXACTLY as tags:
    [PREDICTION] summary verdict [/PREDICTION]
    [SCORELINE] 2-1 [/SCORELINE]
    [SCORERS] Surname1, Surname2 (Cur. Team Verified) [/SCORERS]
    [PLAY] specific suggested betting market [/PLAY]
    [PROP_INSIGHTS] detailed analysis of user picks [/PROP_INSIGHTS]
    [REASONING] 
    Provide a comprehensive breakdown. 
    - Discuss team form and motivation.
    - Confirm key players are available and currently at the club.
    - Explain why the predicted scoreline is likely.
    [/REASONING]
  `;

    // Add timeout to API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // Increased to 90 second timeout

    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Oracle Request Timeout (90s) - The analysis took too long. Try a shorter hunch.")), 90000)
      )
    ]);

    clearTimeout(timeoutId);

    const text = (response as any).text || "";

    const extract = (tag: string) => {
      // Improved regex to be case-insensitive and match even if closing tag is missing (greedy up to next tag or end)
      const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?:\\[\\/${tag}\\]|$)`, "i");
      const match = text.match(regex);
      return match?.[1]?.trim() || "";
    };

    const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Live Source",
        uri: chunk.web.uri
      }));

    return {
      prediction: extract("PREDICTION"),
      scoreline: extract("SCORELINE"),
      likelyScorers: extract("SCORERS").split(",").map(s => s.trim()).filter(Boolean),
      suggestedPlay: extract("PLAY"),
      reasoning: extract("REASONING"),
      playerPropInsights: extract("PROP_INSIGHTS"),
      groundingSources: sources
    };
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
      groundingSources: []
    };
  }
};
