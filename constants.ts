
import { SportType, Competition, Match, MatchStatus, LeaderboardUser, NewsPost, PlatformType, Team } from './types';

export const COMPETITIONS: Competition[] = [
  { id: 'pl', name: 'Premier League', sport: SportType.FOOTBALL },
  { id: 'ucl', name: 'Champions League', sport: SportType.FOOTBALL },
  { id: 'liga_p', name: 'Liga Portugal', sport: SportType.FOOTBALL },
  { id: 'laliga', name: 'La Liga', sport: SportType.FOOTBALL },
  { id: 'nba', name: 'NBA', sport: SportType.BASKETBALL },
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
    date: '2024-05-18 20:30',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.90, draw: 3.50, away: 3.80 },
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
    result: { homeScore: 2, awayScore: 1, scorers: [], playerStats: {} }
  },
  {
    id: 'm_pl2',
    competition: 'Premier League',
    homeTeam: { id: 't_liverpool', name: 'Liverpool', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Liverpool' },
    awayTeam: { id: 't_mancity', name: 'Man City', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ManCity' },
    date: 'Full Time',
    status: MatchStatus.FINISHED,
    odds: { home: 2.10, draw: 3.40, away: 2.40 },
    result: { homeScore: 3, awayScore: 3, scorers: [], playerStats: {} }
  },
  {
    id: 'm_nba1',
    competition: 'NBA',
    homeTeam: { id: 't_lakers', name: 'Lakers', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Lakers' },
    awayTeam: { id: 't_warriors', name: 'Warriors', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Warriors' },
    date: 'Tonight, 03:00',
    status: MatchStatus.UPCOMING,
    odds: { home: 1.95, away: 1.95 }
  }
];
