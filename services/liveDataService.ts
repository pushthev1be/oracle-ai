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
    // Using TheSportsDB free API for Premier League, La Liga, Champions League
    const competitions = [
      { id: 'league_39', name: 'Premier League', apiId: '133602' },
      { id: 'league_140', name: 'La Liga', apiId: '133603' },
      { id: 'league_78', name: 'Champions League', apiId: '133601' }
    ];
    
    const matches: Match[] = [];
    
    for (const comp of competitions) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/eventslast.php?id=${comp.apiId}`
        );
        const data = await response.json();
        
        if (data.results) {
          const compMatches = data.results.slice(0, 2).map((event: any) => ({
            id: `m_${event.idEvent}`,
            competition: comp.name,
            homeTeam: {
              id: `t_${event.idHomeTeam}`,
              name: event.strHomeTeam || "Team A",
              logo: event.strHomeTeamBadge || `https://api.dicebear.com/7.x/identicon/svg?seed=${event.strHomeTeam}`
            },
            awayTeam: {
              id: `t_${event.idAwayTeam}`,
              name: event.strAwayTeam || "Team B",
              logo: event.strAwayTeamBadge || `https://api.dicebear.com/7.x/identicon/svg?seed=${event.strAwayTeam}`
            },
            date: event.dateEvent ? `${event.dateEvent} ${event.strTime || '15:00'}` : 'Upcoming',
            status: determineMatchStatus(event),
            odds: {
              home: parseFloat(event.intHomeScore) > parseFloat(event.intAwayScore) ? 1.5 : 2.0,
              draw: 3.5,
              away: parseFloat(event.intHomeScore) < parseFloat(event.intAwayScore) ? 1.5 : 2.0
            },
            result: event.intHomeScore !== null ? {
              homeScore: parseInt(event.intHomeScore) || 0,
              awayScore: parseInt(event.intAwayScore) || 0,
              scorers: [],
              playerStats: {}
            } : undefined,
            playerMarkets: []
          }));
          
          matches.push(...compMatches);
        }
      } catch (error) {
        console.error(`Error fetching ${comp.name}:`, error);
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
      'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'
    );
    const data = await response.json();
    
    const matches: Match[] = [];
    
    if (data.events) {
      const nbaMatches = data.events.slice(0, 3).map((event: any) => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
        const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');
        
        return {
          id: `m_nba_${event.id}`,
          competition: 'NBA',
          homeTeam: {
            id: `t_${homeTeam?.id}`,
            name: homeTeam?.displayName || "Home Team",
            logo: homeTeam?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${homeTeam?.displayName}`
          },
          awayTeam: {
            id: `t_${awayTeam?.id}`,
            name: awayTeam?.displayName || "Away Team",
            logo: awayTeam?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${awayTeam?.displayName}`
          },
          date: event.date ? new Date(event.date).toLocaleString() : 'Upcoming',
          status: determineNBAStatus(event.status.type),
          odds: { home: 1.95, away: 1.95 },
          result: event.status.type !== 'pre' ? {
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
    // Using Tennis Explorer or similar free API
    const response = await fetch(
      'https://www.thesportsdb.com/api/v1/eventslast.php?id=133693'
    );
    const data = await response.json();
    
    const matches: Match[] = [];
    
    if (data.results) {
      const tennisMatches = data.results.slice(0, 2).map((event: any) => ({
        id: `m_tennis_${event.idEvent}`,
        competition: 'ATP Tour',
        homeTeam: {
          id: `t_${event.idHomeTeam}`,
          name: event.strHomeTeam || "Player 1",
          logo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.strHomeTeam}`
        },
        awayTeam: {
          id: `t_${event.idAwayTeam}`,
          name: event.strAwayTeam || "Player 2",
          logo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.strAwayTeam}`
        },
        date: event.dateEvent ? `${event.dateEvent} ${event.strTime || '14:00'}` : 'Upcoming',
        status: determineMatchStatus(event),
        odds: { home: 1.8, away: 2.0 },
        result: event.intHomeScore !== null ? {
          homeScore: parseInt(event.intHomeScore) || 0,
          awayScore: parseInt(event.intAwayScore) || 0,
          scorers: [],
          playerStats: {}
        } : undefined,
        playerMarkets: []
      }));
      
      matches.push(...tennisMatches);
    }
    
    return matches;
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
