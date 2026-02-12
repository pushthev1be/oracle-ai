
import { SportType, Competition, Match, MatchStatus, LeaderboardUser, NewsPost, PlatformType, Team } from './types';

export const COMPETITIONS: Competition[] = [
  { id: 'pl', name: 'Premier League', sport: SportType.FOOTBALL },
  { id: 'ucl', name: 'Champions League', sport: SportType.FOOTBALL },
  { id: 'liga_p', name: 'Liga Portugal', sport: SportType.FOOTBALL },
  { id: 'laliga', name: 'La Liga', sport: SportType.FOOTBALL },
  { id: 'nba', name: 'NBA', sport: SportType.BASKETBALL },
  { id: 'euroleague', name: 'EuroLeague', sport: SportType.BASKETBALL },
  { id: 'atp', name: 'ATP Tour', sport: SportType.TENNIS },
];

export const MOCK_NEWS: NewsPost[] = [
  {
    id: 'n1',
    platform: PlatformType.TWITTER,
    author: 'Fabrizio Romano',
    handle: '@FabrizioRomano',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fabrizio',
    content: '🚨 EXCLUSIVE: Sporting CP have no intention of letting Viktor Gyökeres leave in January unless the release clause is met. Many clubs are monitoring, but Lisbon is his home for now. 🟢⚪️ #SportingCP #Transfers',
    timestamp: '2h ago',
    likes: '45.2K',
    shares: '12.1K',
    comments: '1.2K',
    sport: SportType.FOOTBALL
  },
  {
    id: 'n2',
    platform: PlatformType.ESPN,
    author: 'ESPN FC',
    handle: '@ESPNFC',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ESPN',
    content: 'Klopp vs. Pep: The final dance at Anfield. Who takes the crown in this title-deciding clash? 🏆🔥 #PremierLeague #LIVMCI',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
    timestamp: '4h ago',
    likes: '88K',
    shares: '5.4K',
    comments: '3.1K',
    sport: SportType.FOOTBALL
  },
  {
    id: 'n3',
    platform: PlatformType.TIKTOK,
    author: 'NBA Highlights',
    handle: '@nbaofficial',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NBA',
    content: 'Steph Curry is NOT human! 😱 4th quarter takeover to seal the win against the Lakers. Look at that range! 🎯🏀 #NBA #Curry #Warriors',
    timestamp: '1h ago',
    likes: '1.2M',
    shares: '250K',
    comments: '45K',
    sport: SportType.BASKETBALL
  }
];

export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, username: 'OracleKing_99', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=King', winRate: 84.5, totalSlips: 142, streak: 8, profit: 4250 },
  { rank: 2, username: 'PrizeMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Master', winRate: 79.2, totalSlips: 88, streak: 3, profit: 3100 },
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm_gyokeres',
    competition: 'Liga Portugal',
    homeTeam: { id: 't_sporting', name: 'Sporting CP', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Sporting' },
    awayTeam: { id: 't_benfica', name: 'Benfica', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Benfica' },
    date: 'Final Score',
    status: MatchStatus.FINISHED,
    odds: { home: 1.90, draw: 3.50, away: 3.80 },
    result: { homeScore: 2, awayScore: 0, scorers: [], playerStats: {} },
    playerMarkets: [
      { player: 'Viktor Gyökeres', type: 'GOALS', line: '0.5', playerImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viktor' }
    ]
  },
  {
    id: 'm_pl1',
    competition: 'Premier League',
    homeTeam: { id: 't_arsenal', name: 'Arsenal', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Arsenal' },
    awayTeam: { id: 't_chelsea', name: 'Chelsea', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Chelsea' },
    date: 'Live Now',
    status: MatchStatus.LIVE,
    odds: { home: 1.65, draw: 4.00, away: 5.20 },
    result: { homeScore: 1, awayScore: 1, scorers: [], playerStats: {} }
  },
  {
    id: 'm_pl2',
    competition: 'Premier League',
    homeTeam: { id: 't_liverpool', name: 'Liverpool', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Liverpool' },
    awayTeam: { id: 't_mancity', name: 'Man City', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ManCity' },
    date: 'Full Time',
    status: MatchStatus.FINISHED,
    odds: { home: 2.10, draw: 3.40, away: 2.40 },
    result: { homeScore: 2, awayScore: 1, scorers: [], playerStats: {} }
  },
  {
    id: 'm_pl3',
    competition: 'Premier League',
    homeTeam: { id: 't_tottenham', name: 'Tottenham', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tottenham' },
    awayTeam: { id: 't_manchester_utd', name: 'Man United', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ManUtd' },
    date: '2026-02-12 15:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 2.20, draw: 3.50, away: 2.80 },
    playerMarkets: [
      { player: 'Erling Haaland', type: 'GOALS', line: '1.5', playerImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Haaland' }
    ]
  },
  {
    id: 'm_ucl1',
    competition: 'Champions League',
    homeTeam: { id: 't_real_madrid', name: 'Real Madrid', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RealMadrid' },
    awayTeam: { id: 't_bayern', name: 'Bayern Munich', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Bayern' },
    date: 'Final Score',
    status: MatchStatus.FINISHED,
    odds: { home: 2.15, draw: 3.40, away: 2.95 },
    result: { homeScore: 1, awayScore: 0, scorers: [], playerStats: {} },
    playerMarkets: [
      { player: 'Kylian Mbappé', type: 'GOALS', line: '0.5', playerImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mbappe' }
    ]
  },
  {
    id: 'm_ucl2',
    competition: 'Champions League',
    homeTeam: { id: 't_manchester_city', name: 'Manchester City', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ManCity' },
    awayTeam: { id: 't_inter', name: 'Inter Milan', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Inter' },
    date: '2024-05-26 19:30',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.88, draw: 3.60, away: 4.20 },
    playerMarkets: []
  },
  {
    id: 'm_laliga1',
    competition: 'La Liga',
    homeTeam: { id: 't_barcelona', name: 'Barcelona', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Barcelona' },
    awayTeam: { id: 't_atletico', name: 'Atlético Madrid', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Atletico' },
    date: 'Final Score',
    status: MatchStatus.FINISHED,
    odds: { home: 2.05, draw: 3.30, away: 3.40 },
    result: { homeScore: 3, awayScore: 2, scorers: [], playerStats: {} },
    playerMarkets: [
      { player: 'Robert Lewandowski', type: 'GOALS', line: '0.5', playerImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lewa' }
    ]
  },
  {
    id: 'm_laliga2',
    competition: 'La Liga',
    homeTeam: { id: 't_sevilla', name: 'Sevilla', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Sevilla' },
    awayTeam: { id: 't_villarreal', name: 'Villarreal', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Villarreal' },
    date: '2026-05-23 19:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.95, draw: 3.40, away: 3.80 },
    playerMarkets: []
  },
  {
    id: 'm_nba1',
    competition: 'NBA',
    homeTeam: { id: 't_lakers', name: 'Lakers', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Lakers' },
    awayTeam: { id: 't_warriors', name: 'Warriors', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Warriors' },
    date: 'Tonight, 03:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.95, away: 1.95 }
  },
  {
    id: 'm_nba2',
    competition: 'NBA',
    homeTeam: { id: 't_celtics', name: 'Boston Celtics', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Celtics' },
    awayTeam: { id: 't_heat', name: 'Miami Heat', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Heat' },
    date: 'Tomorrow, 19:30',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.80, away: 2.10 }
  },
  {
    id: 'm_nba3',
    competition: 'NBA',
    homeTeam: { id: 't_bulls', name: 'Chicago Bulls', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Bulls' },
    awayTeam: { id: 't_nets', name: 'Brooklyn Nets', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Nets' },
    date: '2026-05-20 01:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.65, away: 2.35 }
  },
  {
    id: 'm_nba4',
    competition: 'NBA',
    homeTeam: { id: 't_mavs', name: 'Dallas Mavericks', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Mavericks' },
    awayTeam: { id: 't_suns', name: 'Phoenix Suns', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Suns' },
    date: '2026-05-21 22:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.90, away: 1.98 }
  },
  {
    id: 'm_nba5',
    competition: 'NBA',
    homeTeam: { id: 't_nuggets', name: 'Denver Nuggets', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Nuggets' },
    awayTeam: { id: 't_grizzlies', name: 'Memphis Grizzlies', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Grizzlies' },
    date: '2026-05-22 20:30',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.75, away: 2.20 }
  },
  {
    id: 'm_euroleague1',
    competition: 'EuroLeague',
    homeTeam: { id: 't_real_madrid_bball', name: 'Real Madrid', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RealMadridBB' },
    awayTeam: { id: 't_barcelona_bball', name: 'Barcelona', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=BarcelonaBB' },
    date: '2026-05-20 19:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.88, away: 1.98 }
  },
  {
    id: 'm_euroleague2',
    competition: 'EuroLeague',
    homeTeam: { id: 't_olympiacos', name: 'Olympiacos', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Olympiacos' },
    awayTeam: { id: 't_panathinaikos', name: 'Panathinaikos', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Panathinaikos' },
    date: '2026-05-21 20:30',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.92, away: 1.92 }
  },
  {
    id: 'm_euroleague3',
    competition: 'EuroLeague',
    homeTeam: { id: 't_anadolu_efes', name: 'Anadolu Efes', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Efes' },
    awayTeam: { id: 't_fenerbahce', name: 'Fenerbahçe', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Fenerbahce' },
    date: '2026-05-22 18:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.85, away: 2.05 }
  },
  {
    id: 'm_atp1',
    competition: 'ATP Tour',
    homeTeam: { id: 't_djokovic', name: 'Novak Djokovic', logo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Djokovic' },
    awayTeam: { id: 't_alcaraz', name: 'Carlos Alcaraz', logo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alcaraz' },
    date: '2026-05-21 14:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 2.40, away: 1.58 },
    playerMarkets: [
      { player: 'Novak Djokovic', type: 'SETS WON', line: '1.5', playerImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Djokovic' }
    ]
  },
  {
    id: 'm_atp2',
    competition: 'ATP Tour',
    homeTeam: { id: 't_sinner', name: 'Jannik Sinner', logo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sinner' },
    awayTeam: { id: 't_medvedev', name: 'Daniil Medvedev', logo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Medvedev' },
    date: '2026-05-22 16:30',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.70, away: 2.15 },
    playerMarkets: []
  }
];
