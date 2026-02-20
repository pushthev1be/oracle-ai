import { Match, MatchStatus } from "../types";
import { fetchWithProxy } from "./apiUtils";

const isProd = import.meta.env.PROD;

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const FOOTBALL_DATA_BASE = isProd ? "https://api.football-data.org/v4" : "/api/football-data/v4";
const ODDS_API_BASE = isProd ? "https://api.the-odds-api.com/v4" : "/api/odds/v4";

const FOOTBALL_DATA_API_KEY: string = (import.meta as any).env.VITE_FOOTBALL_DATA_API_KEY || "";
const ODDS_API_KEY: string = (import.meta as any).env.VITE_ODDS_API_KEY || "";

const FD_COMPETITION_MAP: Record<string, string> = {
  PL: "Premier League",
  CL: "Champions League",
  PD: "La Liga",
  PPL: "Liga Portugal",
  FL1: "Ligue 1",
  BL1: "Bundesliga",
  SA: "Serie A",
};

const ODDS_SPORT_KEYS: { key: string; competition: string }[] = [
  { key: "soccer_epl", competition: "Premier League" },
  { key: "soccer_spain_la_liga", competition: "La Liga" },
  { key: "soccer_uefa_champs_league", competition: "Champions League" },
  { key: "soccer_portugal_primeira_liga", competition: "Liga Portugal" },
  { key: "basketball_nba", competition: "NBA" },
];

const ESPN_FOOTBALL_FALLBACKS = [
  { endpoint: "soccer/eng.1", competition: "Premier League" },
  { endpoint: "soccer/uefa.champions", competition: "Champions League" },
  { endpoint: "soccer/esp.1", competition: "La Liga" },
  { endpoint: "soccer/por.1", competition: "Liga Portugal" },
];

type OddsEntry = { home: number; draw?: number; away: number };
type OddsLookup = Map<string, OddsEntry>;

const normalize = (name: string): string =>
  name.toLowerCase().replace(/\b(fc|cf|afc|sc|de|the)\b/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

const statusFromFD = (s: string): MatchStatus => {
  if (["FINISHED", "AWARDED"].includes(s)) return MatchStatus.FINISHED;
  if (["IN_PLAY", "PAUSED", "HALFTIME", "EXTRA_TIME", "PENALTY_SHOOTOUT"].includes(s)) return MatchStatus.LIVE;
  return MatchStatus.UPCOMING;
};

const statusFromESPN = (state: string): MatchStatus => {
  if (state === "post") return MatchStatus.FINISHED;
  if (state === "in") return MatchStatus.LIVE;
  return MatchStatus.UPCOMING;
};

const fetchAllOdds = async (): Promise<Map<string, OddsLookup>> => {
  const result = new Map<string, OddsLookup>();
  if (!ODDS_API_KEY || isProd) return result; // Skip Odds API in production due to CORS

  const fetches = ODDS_SPORT_KEYS.map(async ({ key, competition }) => {
    try {
      const res = await fetchWithProxy(
        `${ODDS_API_BASE}/sports/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`
      );
      if (!res.ok) return;
      const events: Record<string, unknown>[] = await res.json();
      const lookup: OddsLookup = new Map();
      for (const event of events) {
        const homeTeam = event.home_team as string;
        const awayTeam = event.away_team as string;
        const bookmakers = event.bookmakers as Record<string, unknown>[];
        const bk = bookmakers?.[0];
        if (!bk) continue;
        const markets = bk.markets as Record<string, unknown>[];
        const mkt = markets?.find((m) => m.key === "h2h");
        if (!mkt) continue;
        const outcomes = mkt.outcomes as { name: string; price: number }[];
        const priceMap: Record<string, number> = {};
        for (const o of outcomes) priceMap[o.name] = o.price;
        lookup.set(`${normalize(homeTeam)}__${normalize(awayTeam)}`, {
          home: priceMap[homeTeam] ?? 2.0,
          draw: priceMap["Draw"],
          away: priceMap[awayTeam] ?? 2.0,
        });
      }
      result.set(competition, lookup);
    } catch (err) {
      console.error(`Odds API error for ${key}:`, err);
    }
  });
  await Promise.all(fetches);
  return result;
};

const findOdds = (lookup: OddsLookup | undefined, home: string, away: string, fallback: OddsEntry): OddsEntry => {
  if (!lookup || lookup.size === 0) return fallback;
  const hN = normalize(home);
  const aN = normalize(away);
  const exact = lookup.get(`${hN}__${aN}`);
  if (exact) return exact;
  for (const [key, odds] of lookup.entries()) {
    const [kH, kA] = key.split("__");
    if ((hN.includes(kH) || kH.includes(hN)) && (aN.includes(kA) || kA.includes(aN))) return odds;
  }
  return fallback;
};

const fetchFootballFromFD = async (oddsMap: Map<string, OddsLookup>): Promise<Match[]> => {
  if (!FOOTBALL_DATA_API_KEY) return [];
  try {
    const today = new Date();
    const dateFrom = today.toISOString().split("T")[0];
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 14);
    const dateTo = futureDate.toISOString().split("T")[0];
    const res = await fetchWithProxy(`${FOOTBALL_DATA_BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers: { "X-Auth-Token": FOOTBALL_DATA_API_KEY },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const matches: Match[] = [];
    for (const m of (data.matches ?? []) as Record<string, unknown>[]) {
      const comp = m.competition as Record<string, unknown>;
      const compCode = comp?.code as string;
      const competition = FD_COMPETITION_MAP[compCode];
      if (!competition) continue;

      const homeTeamData = m.homeTeam as Record<string, unknown>;
      const awayTeamData = m.awayTeam as Record<string, unknown>;
      const score = m.score as Record<string, unknown>;
      const fullTime = score?.fullTime as Record<string, unknown>;
      const fdStatus = m.status as string;
      const status = statusFromFD(fdStatus);
      const lookup = oddsMap.get(competition);
      const odds = findOdds(lookup, homeTeamData.name as string, awayTeamData.name as string, { home: 1.90, draw: 3.50, away: 3.80 });
      const dateStr = m.utcDate ? new Date(m.utcDate as string).toLocaleString() : "Upcoming";

      matches.push({
        id: `m_fd_${m.id}`,
        competition,
        homeTeam: {
          id: `t_fd_${homeTeamData.id}`,
          name: (homeTeamData.shortName as string) || (homeTeamData.name as string),
          logo: (homeTeamData.crest as string) || `https://api.dicebear.com/7.x/identicon/svg?seed=${homeTeamData.id}`,
        },
        awayTeam: {
          id: `t_fd_${awayTeamData.id}`,
          name: (awayTeamData.shortName as string) || (awayTeamData.name as string),
          logo: (awayTeamData.crest as string) || `https://api.dicebear.com/7.x/identicon/svg?seed=${awayTeamData.id}`,
        },
        date: status === MatchStatus.FINISHED ? "Full Time" : status === MatchStatus.LIVE ? "Live Now" : dateStr,
        status,
        odds,
        result: fdStatus !== "TIMED" && fdStatus !== "SCHEDULED" ? {
          homeScore: (fullTime?.home as number) ?? 0,
          awayScore: (fullTime?.away as number) ?? 0,
          scorers: [],
          playerStats: {},
        } : undefined,
        playerMarkets: [],
      });
    }
    return matches;
  } catch (err) {
    console.error("Football Data API error:", err);
    return [];
  }
};

const fetchFootballFromESPN = async (oddsMap: Map<string, OddsLookup>): Promise<Match[]> => {
  const results: Match[] = [];
  const fetches = ESPN_FOOTBALL_FALLBACKS.map(async ({ endpoint, competition }) => {
    try {
      const res = await fetchWithProxy(`${ESPN_BASE}/${endpoint}/scoreboard`);
      if (!res.ok) return;
      const data = await res.json();
      for (const event of (data.events ?? []) as Record<string, unknown>[]) {
        const comp = (event.competitions as Record<string, unknown>[])?.[0];
        if (!comp) continue;
        const competitors = comp.competitors as Record<string, unknown>[];
        const home = competitors?.find((c) => c.homeAway === "home");
        const away = competitors?.find((c) => c.homeAway === "away");
        if (!home || !away) continue;

        const homeTeam = home.team as Record<string, unknown>;
        const awayTeam = away.team as Record<string, unknown>;
        const state = ((event.status as Record<string, unknown>)?.type as Record<string, unknown>)?.state as string ?? "pre";
        const status = statusFromESPN(state);
        const detail = ((event.status as Record<string, unknown>)?.type as Record<string, unknown>)?.shortDetail as string;
        const dateStr = detail ?? (event.date ? new Date(event.date as string).toLocaleString() : "Upcoming");
        const lookup = oddsMap.get(competition);
        const odds = findOdds(lookup, (homeTeam?.displayName as string) ?? "TBD", (awayTeam?.displayName as string) ?? "TBD", { home: 1.90, draw: 3.50, away: 3.80 });

        results.push({
          id: `m_espn_${event.id}`,
          competition,
          homeTeam: {
            id: `t_espn_${homeTeam?.id ?? home.id}`,
            name: (homeTeam?.displayName as string) ?? "TBD",
            logo: (homeTeam?.logo as string) ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${homeTeam?.id}`,
          },
          awayTeam: {
            id: `t_espn_${awayTeam?.id ?? away.id}`,
            name: (awayTeam?.displayName as string) ?? "TBD",
            logo: (awayTeam?.logo as string) ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${awayTeam?.id}`,
          },
          date: status === MatchStatus.FINISHED ? "Full Time" : status === MatchStatus.LIVE ? "Live Now" : dateStr,
          status,
          odds,
          result: state !== "pre" ? {
            homeScore: parseInt((home.score as string) ?? "0", 10),
            awayScore: parseInt((away.score as string) ?? "0", 10),
            scorers: [],
            playerStats: {},
          } : undefined,
          playerMarkets: [],
        });
      }
    } catch (err) {
      console.error(`ESPN fallback error for ${competition}:`, err);
    }
  });
  await Promise.all(fetches);
  return results;
};

const fetchNBAMatches = async (oddsMap: Map<string, OddsLookup>): Promise<Match[]> => {
  try {
    const res = await fetchWithProxy(`${ESPN_BASE}/basketball/nba/scoreboard`);
    if (!res.ok) return [];
    const data = await res.json();
    const events: Record<string, unknown>[] = data.events ?? [];
    const nbaLookup = oddsMap.get("NBA");

    return events.map((event): Match | null => {
      const comp = (event.competitions as Record<string, unknown>[])?.[0];
      const competitors = comp?.competitors as Record<string, unknown>[];
      const home = competitors?.find((c) => c.homeAway === "home");
      const away = competitors?.find((c) => c.homeAway === "away");
      if (!home || !away) return null;

      const homeTeam = home.team as Record<string, unknown>;
      const awayTeam = away.team as Record<string, unknown>;
      const state = ((event.status as Record<string, unknown>)?.type as Record<string, unknown>)?.state as string ?? "pre";
      const status = statusFromESPN(state);
      const detail = ((event.status as Record<string, unknown>)?.type as Record<string, unknown>)?.shortDetail as string;
      const dateStr = detail ?? (event.date ? new Date(event.date as string).toLocaleString() : "Upcoming");
      const odds = findOdds(nbaLookup, (homeTeam?.displayName as string) ?? "TBD", (awayTeam?.displayName as string) ?? "TBD", { home: 1.95, away: 1.95 });

      return {
        id: `m_espn_nba_${event.id}`,
        competition: "NBA",
        homeTeam: {
          id: `t_espn_${homeTeam?.id ?? home.id}`,
          name: (homeTeam?.displayName as string) ?? "TBD",
          logo: (homeTeam?.logo as string) ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${homeTeam?.id}`,
        },
        awayTeam: {
          id: `t_espn_${awayTeam?.id ?? away.id}`,
          name: (awayTeam?.displayName as string) ?? "TBD",
          logo: (awayTeam?.logo as string) ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${awayTeam?.id}`,
        },
        date: status === MatchStatus.FINISHED ? "Full Time" : status === MatchStatus.LIVE ? "Live Now" : dateStr,
        status,
        odds,
        result: state !== "pre" ? {
          homeScore: parseInt((home.score as string) ?? "0", 10),
          awayScore: parseInt((away.score as string) ?? "0", 10),
          scorers: [],
          playerStats: {},
        } : undefined,
        playerMarkets: [],
      };
    }).filter((m): m is Match => m !== null);
  } catch (err) {
    console.error("Error fetching NBA matches:", err);
    return [];
  }
};

const fetchTennisMatches = async (): Promise<Match[]> => {
  try {
    const res = await fetchWithProxy(`${ESPN_BASE}/tennis/atp/scoreboard`);
    if (!res.ok) return [];
    const data = await res.json();
    const matches: Match[] = [];

    for (const event of (data.events ?? []) as Record<string, unknown>[]) {
      for (const grouping of ((event.groupings ?? []) as Record<string, unknown>[])) {
        for (const comp of ((grouping.competitions ?? []) as Record<string, unknown>[])) {
          const competitors = comp.competitors as Record<string, unknown>[];
          if (!competitors || competitors.length < 2) continue;

          const p1 = competitors[0];
          const p2 = competitors[1];
          const p1Athlete = p1.athlete as Record<string, unknown>;
          const p2Athlete = p2.athlete as Record<string, unknown>;
          const state = ((comp.status as Record<string, unknown>)?.type as Record<string, unknown>)?.state as string ?? "pre";
          const status = statusFromESPN(state);
          const dateStr = ((comp.status as Record<string, unknown>)?.type as Record<string, unknown>)?.shortDetail as string ?? "Upcoming";

          matches.push({
            id: `m_espn_atp_${comp.id ?? event.id}_${p1.id}`,
            competition: "ATP Tour",
            homeTeam: {
              id: `t_espn_${p1Athlete?.id ?? p1.id}`,
              name: (p1Athlete?.displayName as string) ?? "TBD",
              logo: ((p1Athlete?.headshot as Record<string, unknown>)?.href as string) ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1Athlete?.id}`,
            },
            awayTeam: {
              id: `t_espn_${p2Athlete?.id ?? p2.id}`,
              name: (p2Athlete?.displayName as string) ?? "TBD",
              logo: ((p2Athlete?.headshot as Record<string, unknown>)?.href as string) ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2Athlete?.id}`,
            },
            date: status === MatchStatus.FINISHED ? "Full Time" : status === MatchStatus.LIVE ? "Live Now" : dateStr,
            status,
            odds: { home: 1.80, away: 2.10 },
            result: state !== "pre" ? {
              homeScore: parseInt((p1.score as string) ?? "0", 10) || 0,
              awayScore: parseInt((p2.score as string) ?? "0", 10) || 0,
              scorers: [],
              playerStats: {},
            } : undefined,
            playerMarkets: [],
          });
        }
      }
    }
    return matches;
  } catch (err) {
    console.error("Error fetching tennis matches:", err);
    return [];
  }
};

export const fetchLiveMatches = async (): Promise<Match[]> => {
  const matches: Match[] = [];

  try {
    const oddsMap = await fetchAllOdds();

    // Skip Football Data API in production due to CORS issues
    const fdFootball = isProd ? [] : await fetchFootballFromFD(oddsMap);

    const [espnFootball, nba, tennis] = await Promise.all([
      fetchFootballFromESPN(oddsMap),
      fetchNBAMatches(oddsMap),
      fetchTennisMatches(),
    ]);

    const fdCompetitions = new Set(fdFootball.map((m) => m.competition));
    const deduped = espnFootball.filter((m) => !fdCompetitions.has(m.competition));

    matches.push(...fdFootball, ...deduped, ...nba, ...tennis);
  } catch (error) {
    console.error("Error fetching live data:", error);
  }

  return matches;
};
