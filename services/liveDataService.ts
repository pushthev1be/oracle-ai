import { Match, MatchStatus } from "../types";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

const FOOTBALL_LEAGUES = [
  { endpoint: "soccer/eng.1", competition: "Premier League" },
  { endpoint: "soccer/uefa.champions", competition: "Champions League" },
  { endpoint: "soccer/por.1", competition: "Liga Portugal" },
  { endpoint: "soccer/esp.1", competition: "La Liga" },
];

const statusFromState = (state: string): MatchStatus => {
  if (state === "post") return MatchStatus.FINISHED;
  if (state === "in") return MatchStatus.LIVE;
  return MatchStatus.UPCOMING;
};

const parseESPNSoccerEvent = (event: Record<string, any>, competition: string): Match | null => {
  try {
    const comp = event.competitions?.[0];
    if (!comp) return null;
    const home = comp.competitors?.find((c: Record<string, any>) => c.homeAway === "home");
    const away = comp.competitors?.find((c: Record<string, any>) => c.homeAway === "away");
    if (!home || !away) return null;

    const state: string = event.status?.type?.state ?? "pre";
    const status = statusFromState(state);
    const dateStr: string = event.status?.type?.shortDetail ?? (event.date ? new Date(event.date).toLocaleString() : "Upcoming");

    return {
      id: `m_espn_${event.id}`,
      competition,
      homeTeam: {
        id: `t_espn_${home.team?.id ?? home.id}`,
        name: home.team?.displayName ?? "TBD",
        logo: home.team?.logo ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${home.team?.id}`,
      },
      awayTeam: {
        id: `t_espn_${away.team?.id ?? away.id}`,
        name: away.team?.displayName ?? "TBD",
        logo: away.team?.logo ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${away.team?.id}`,
      },
      date: status === MatchStatus.FINISHED ? "Full Time" : status === MatchStatus.LIVE ? "Live Now" : dateStr,
      status,
      odds: { home: 1.90, draw: 3.50, away: 3.80 },
      result: state !== "pre" ? {
        homeScore: parseInt(home.score ?? "0", 10),
        awayScore: parseInt(away.score ?? "0", 10),
        scorers: [],
        playerStats: {},
      } : undefined,
      playerMarkets: [],
    };
  } catch {
    return null;
  }
};

const fetchFootballMatches = async (): Promise<Match[]> => {
  const results: Match[] = [];
  const fetches = FOOTBALL_LEAGUES.map(async ({ endpoint, competition }) => {
    try {
      const res = await fetch(`${ESPN_BASE}/${endpoint}/scoreboard`);
      if (!res.ok) return;
      const data = await res.json();
      const events: Record<string, any>[] = data.events ?? [];
      for (const event of events) {
        const match = parseESPNSoccerEvent(event, competition);
        if (match) results.push(match);
      }
    } catch (err) {
      console.error(`Error fetching ${competition}:`, err);
    }
  });
  await Promise.all(fetches);
  return results;
};

const fetchNBAMatches = async (): Promise<Match[]> => {
  try {
    const res = await fetch(`${ESPN_BASE}/basketball/nba/scoreboard`);
    if (!res.ok) return [];
    const data = await res.json();
    const events: Record<string, any>[] = data.events ?? [];

    return events.map((event): Match | null => {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find((c: Record<string, any>) => c.homeAway === "home");
      const away = comp?.competitors?.find((c: Record<string, any>) => c.homeAway === "away");
      if (!home || !away) return null;

      const state: string = event.status?.type?.state ?? "pre";
      const status = statusFromState(state);
      const dateStr: string = event.status?.type?.shortDetail ?? (event.date ? new Date(event.date).toLocaleString() : "Upcoming");

      return {
        id: `m_espn_nba_${event.id}`,
        competition: "NBA",
        homeTeam: {
          id: `t_espn_${home.team?.id ?? home.id}`,
          name: home.team?.displayName ?? "TBD",
          logo: home.team?.logo ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${home.team?.id}`,
        },
        awayTeam: {
          id: `t_espn_${away.team?.id ?? away.id}`,
          name: away.team?.displayName ?? "TBD",
          logo: away.team?.logo ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${away.team?.id}`,
        },
        date: status === MatchStatus.FINISHED ? "Full Time" : status === MatchStatus.LIVE ? "Live Now" : dateStr,
        status,
        odds: { home: 1.95, away: 1.95 },
        result: state !== "pre" ? {
          homeScore: parseInt(home.score ?? "0", 10),
          awayScore: parseInt(away.score ?? "0", 10),
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
    const res = await fetch(`${ESPN_BASE}/tennis/atp/scoreboard`);
    if (!res.ok) return [];
    const data = await res.json();
    const matches: Match[] = [];

    for (const event of (data.events ?? [])) {
      for (const grouping of (event.groupings ?? [])) {
        for (const comp of (grouping.competitions ?? [])) {
          const competitors: Record<string, any>[] = comp.competitors ?? [];
          if (competitors.length < 2) continue;

          const p1 = competitors[0];
          const p2 = competitors[1];
          const state: string = comp.status?.type?.state ?? "pre";
          const status = statusFromState(state);
          const dateStr: string = comp.status?.type?.shortDetail ?? "Upcoming";

          matches.push({
            id: `m_espn_atp_${comp.id ?? event.id}_${p1.id}`,
            competition: "ATP Tour",
            homeTeam: {
              id: `t_espn_${p1.athlete?.id ?? p1.id}`,
              name: p1.athlete?.displayName ?? "TBD",
              logo: p1.athlete?.headshot?.href ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1.athlete?.id}`,
            },
            awayTeam: {
              id: `t_espn_${p2.athlete?.id ?? p2.id}`,
              name: p2.athlete?.displayName ?? "TBD",
              logo: p2.athlete?.headshot?.href ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2.athlete?.id}`,
            },
            date: status === MatchStatus.FINISHED ? "Full Time" : status === MatchStatus.LIVE ? "Live Now" : dateStr,
            status,
            odds: { home: 1.80, away: 2.10 },
            result: state !== "pre" ? {
              homeScore: parseInt(p1.score ?? "0", 10) || 0,
              awayScore: parseInt(p2.score ?? "0", 10) || 0,
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
    const [football, nba, tennis] = await Promise.all([
      fetchFootballMatches(),
      fetchNBAMatches(),
      fetchTennisMatches(),
    ]);
    matches.push(...football, ...nba, ...tennis);
  } catch (error) {
    console.error("Error fetching live data:", error);
  }

  return matches;
};
