import { Match, MatchStatus, Team } from "../types";

/**
 * Fetches live sports data from free APIs
 * Uses TheSportsDB for football and other sports
 */

export const fetchLiveMatches = async (): Promise<Match[]> => {
  const matches: Match[] = [];
  
  try {
    // Fetch football matches from football-data.org
    const footballMatches = await fetchFootballMatches();
    matches.push(...footballMatches);
    
    // Fetch NBA matches from ESPN
    const nbaMatches = await fetchNBAMatches();
    matches.push(...nbaMatches);
    
    // Fetch Tennis matches from ATP data
    const tennisMatches = await fetchTennisMatches();
    matches.push(...tennisMatches);
  } catch (error) {
    console.error("Error fetching live data:", error);
  }
  
  return matches;
};

const fetchFootballMatches = async (): Promise<Match[]> => {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY || 
                   (typeof window !== 'undefined' ? (window as any).FOOTBALL_DATA_API_KEY : '');
    
    if (!apiKey) {
      console.warn("FOOTBALL_DATA_API_KEY not provided");
      return [];
    }

    // Fetch matches from multiple competitions
    const competitions = ['PL', 'CL', 'SA', 'PD', 'ELC']; // Premier League, Champions League, Serie A, La Liga, Championship
    const matches: Match[] = [];

    for (const comp of competitions) {
      try {
        const response = await fetch(
          `https://api.football-data.org/v4/competitions/${comp}/matches?status=SCHEDULED,LIVE`,
          {
            method: 'GET',
            headers: {
              'X-Auth-Token': apiKey
            }
          }
        );

        if (!response.ok) {
          console.warn(`Failed to fetch ${comp} matches: ${response.status}`);
          continue;
        }

        const data = await response.json();

        if (data.matches && Array.isArray(data.matches)) {
          const competitionMatches = data.matches.slice(0, 5).map((match: any) => ({
            id: `m_football_${match.id}`,
            competition: match.competition?.name || 'Football',
            homeTeam: {
              id: `t_${match.homeTeam?.id || 'home'}`,
              name: match.homeTeam?.name || "Home Team",
              logo: match.homeTeam?.crest || `https://api.dicebear.com/7.x/identicon/svg?seed=${match.homeTeam?.name}`
            },
            awayTeam: {
              id: `t_${match.awayTeam?.id || 'away'}`,
              name: match.awayTeam?.name || "Away Team",
              logo: match.awayTeam?.crest || `https://api.dicebear.com/7.x/identicon/svg?seed=${match.awayTeam?.name}`
            },
            date: match.utcDate ? new Date(match.utcDate).toLocaleString() : 'Upcoming',
            status: determineFootballStatus(match.status),
            odds: { home: 1.95, away: 1.95, draw: 3.2 },
            result: match.status === 'FINISHED' ? {
              homeScore: match.score?.fullTime?.home || 0,
              awayScore: match.score?.fullTime?.away || 0,
              scorers: [],
              playerStats: {}
            } : undefined,
            playerMarkets: []
          }));

          matches.push(...competitionMatches);
        }
      } catch (error) {
        console.error(`Error fetching ${comp} matches:`, error);
      }
    }

    return matches;
  } catch (error) {
    console.error("Error fetching football matches:", error);
    return [];
  }
};

const fetchNBAMatches = async (): Promise<Match[]> => {
  try {
    // ESPN API for NBA scores
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
      { method: 'GET' }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    const matches: Match[] = [];
    
    if (data.events && Array.isArray(data.events)) {
      const nbaMatches = data.events.slice(0, 3).map((event: any) => {
        const competition = event.competitions?.[0];
        const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');
        
        return {
          id: `m_nba_${event.id}`,
          competition: 'NBA',
          homeTeam: {
            id: `t_${homeTeam?.id || 'home'}`,
            name: homeTeam?.displayName || "Home Team",
            logo: homeTeam?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=home`
          },
          awayTeam: {
            id: `t_${awayTeam?.id || 'away'}`,
            name: awayTeam?.displayName || "Away Team",
            logo: awayTeam?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=away`
          },
          date: event.date ? new Date(event.date).toLocaleString() : 'Upcoming',
          status: determineNBAStatus(event.status?.type),
          odds: { home: 1.95, away: 1.95 },
          result: event.status?.type !== 'pre' ? {
            homeScore: homeTeam?.score || 0,
            awayScore: awayTeam?.score || 0,
            scorers: [],
            playerStats: {}
          } : undefined,
          playerMarkets: []
        };
      });
      
      matches.push(...nbaMatches);
    }
    
    return matches;
  } catch (error) {
    console.error("Error fetching NBA matches:", error);
    return [];
  }
};

const fetchTennisMatches = async (): Promise<Match[]> => {
  try {
    // Tennis data would require a specific API
    // Returning empty to use mock data
    return [];
  } catch (error) {
    console.error("Error fetching tennis matches:", error);
    return [];
  }
};

const determineMatchStatus = (status: string): MatchStatus => {
  if (status === 'FINISHED') {
    return MatchStatus.FINISHED;
  } else if (status === 'LIVE') {
    return MatchStatus.LIVE;
  }
  return MatchStatus.UPCOMING;
};

const determineFootballStatus = (status: string): MatchStatus => {
  return determineMatchStatus(status);
};

const determineNBAStatus = (status: string): MatchStatus => {
  if (status === 'post') return MatchStatus.FINISHED;
  if (status === 'in') return MatchStatus.LIVE;
  return MatchStatus.UPCOMING;
};
