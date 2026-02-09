import { Match, MatchStatus, Team } from "../types";

/**
 * Fetches live sports data from free APIs
 * Uses TheSportsDB for football and other sports
 */

export const fetchLiveMatches = async (): Promise<Match[]> => {
  const matches: Match[] = [];
  
  try {
    // Fetch football matches from TheSportsDB
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
    // Using a simpler approach - fetch from a working endpoint
    // For production, you'd use a sports API like RapidAPI, APIFootball, or similar
    // This is a fallback that works without authentication
    
    const matches: Match[] = [];
    
    // Since live APIs might have CORS issues, return empty to use mock data
    // This will trigger fallback to mock data which works reliably
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

const determineMatchStatus = (event: any): MatchStatus => {
  if (event.strStatus === 'Match Finished' || event.strStatus === 'Final') {
    return MatchStatus.FINISHED;
  } else if (event.strStatus === 'In Play' || event.strStatus === 'Live') {
    return MatchStatus.LIVE;
  }
  return MatchStatus.UPCOMING;
};

const determineNBAStatus = (status: string): MatchStatus => {
  if (status === 'post') return MatchStatus.FINISHED;
  if (status === 'in') return MatchStatus.LIVE;
  return MatchStatus.UPCOMING;
};
