# Oracle Odds AI 🔮
https://oracle-ai-ulvr.onrender.com

A professional-grade sports prediction platform that combines real-time data with **Gemini 2.0 Flash** search-grounding to generate high-accuracy betting insights.

## Core Features

- **Search-Grounded AI** — Uses Google Search Retrieval to verify current team rosters, injury reports, and transfer news (e.g., handles Mbappe/Kane transfers automatically).
- **Live Match Engine** — Real-time scores and fixtures for Premier League, Champions League, NBA, and ATP Tour via ESPN and Football-Data.org APIs.
- **Dynamic Prop Analysis** — Input specific player props and get reasoned logic based on the latest 24-hour performance data.
- **Production-Ready** — Intelligent environment detection for both local development and cloud deployment (Render/Vercel).

## Technical Architecture

- **Frontend**: React 19, TypeScript, **Tailwind CSS v4** (Modern aesthetic).
- **AI Core**: `@google/genai` (Unified SDK) with **Gemini 2.0 Flash**.
- **Grounding**: Automatic verification via `googleSearch` tool to prevent player hallucinations.
- **Resilience**: Parallel API fetching with greedy fallback to 2026-aligned mock data.

## Deployment & Setup

### 1. Local Development
1. `npm install`
2. Create `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_key
   VITE_FOOTBALL_DATA_API_KEY=your_key
   VITE_ODDS_API_KEY=your_key
   ```
3. `npm run dev` (Runs at localhost:3000)

### 2. Production (Render)
Ensure the following **Environment Variables** are added to your Render Dashboard:
- `VITE_GEMINI_API_KEY`
- `VITE_FOOTBALL_DATA_API_KEY`
- `VITE_ODDS_API_KEY`

## Data Pipeline

| Category | API Source | Scope |
| :--- | :--- | :--- |
| **Football** | Football-Data.org / ESPN | Top 5 European Leagues + UCL |
| **Basketball** | ESPN | NBA |
| **Tennis** | ESPN | ATP Tour |
| **Grounding** | Google Search | Live news, transfers, and lineups |

---
*Developed for professional bettors and sports enthusiasts who require real-time verification of AI reasoning.*
