# Oracle Odds AI

A professional sports prediction platform that leverages Google's Gemini AI and real-time ESPN data to generate expert betting insights across football, basketball, and tennis.

## Features

- **Live Data** — Real-time scores and fixtures from ESPN's public API for Premier League, Champions League, La Liga, Liga Portugal, NBA, and ATP Tour
- **AI Predictions** — Gemini AI analyzes matchups, team form, and current news to generate predicted scores, likely scorers, and reasoning
- **Player Props** — Select specific player proposition bets (goals, assists, etc.) and get AI-powered analysis
- **Prediction Vault** — Track your prediction history and performance
- **Leaderboard** — Compete against other users with win rate and profit rankings

## Demo

See [demo.mp4](demo.mp4) for a walkthrough of the live data integration.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env.local` file and set your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Google Gemini AI (gemini-2.0-flash)
- ESPN public API (no auth required)

## Data Sources

| Sport | Source | Leagues |
|-------|--------|---------|
| Football | ESPN | Premier League, Champions League, La Liga, Liga Portugal |
| Basketball | ESPN | NBA (EuroLeague via mock data) |
| Tennis | ESPN | ATP Tour |

Live data is fetched in parallel. If any endpoint fails, the app gracefully falls back to mock data.
