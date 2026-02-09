
import { GoogleGenAI } from "@google/genai";
import { Match, AIAnalysis, PlayerProp } from "../types";

/**
 * Generates a high-speed sports analysis using the Gemini Flash model with Google Search grounding.
 */
export const getAIAnalysis = async (match: Match, userPrediction: string, playerProps: PlayerProp[]): Promise<AIAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const propsString = playerProps.length > 0 
    ? playerProps.map(p => `- ${p.player} to get ${p.value} (${p.type})`).join('\n')
    : "No specific player props provided.";

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
    
    TASKS:
    1. Search for TODAY'S LATEST team news (injuries, lineup leaks, manager quotes).
    2. Check the last 3 matches of form for both teams.
    3. Provide an expert verdict on the likely winner or draw.
    4. Predict the exact scoreline.
    5. Briefly validate if the user's bets/props make sense based on current stats.

    Format EXACTLY as tags:
    [PREDICTION] summary verdict [/PREDICTION]
    [SCORELINE] 2-1 [/SCORELINE]
    [SCORERS] name1, name2 [/SCORERS]
    [PLAY] specific suggested betting market [/PLAY]
    [PROP_INSIGHTS] analysis of user picks [/PROP_INSIGHTS]
    [REASONING] clear core logic with source citations [/REASONING]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      }
    });

    const text = response.text || "";
    
    const extract = (tag: string) => {
      const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`);
      return text.match(regex)?.[1]?.trim() || "";
    };

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
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
    throw error;
  }
};
