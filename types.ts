
export enum SportType {
  FOOTBALL = 'Football',
  BASKETBALL = 'Basketball',
  TENNIS = 'Tennis'
}

export enum PlatformType {
  TWITTER = 'Twitter',
  ESPN = 'ESPN',
  TIKTOK = 'TikTok'
}

export interface NewsPost {
  id: string;
  platform: PlatformType;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: string;
  shares: string;
  comments: string;
  sport: SportType;
}

export interface Competition {
  id: string;
  name: string;
  sport: SportType;
  logo?: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
}

export interface PlayerMarket {
  player: string;
  playerImage?: string;
  type: string;
  line: string;
  odds?: number;
}

export enum MatchStatus {
  UPCOMING = 'Upcoming',
  FINISHED = 'Finished',
  LIVE = 'Live'
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  scorers: string[];
  playerStats: { [playerName: string]: { [statType: string]: number } };
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  competition: string;
  date: string;
  status: MatchStatus;
  odds: {
    home: number;
    draw?: number;
    away: number;
  };
  playerMarkets?: PlayerMarket[];
  result?: MatchResult;
}

export interface PlayerProp {
  type: string;
  player: string;
  value: string;
  line?: string;
  choice?: 'MORE' | 'LESS';
  odds?: number;
}

export interface AIAnalysis {
  prediction: string;
  scoreline: string;
  likelyScorers: string[];
  suggestedPlay: string;
  reasoning: string;
  groundingSources: { title: string; uri: string }[];
  playerPropInsights?: string;
}

export enum SlipStatus {
  PENDING = 'Pending',
  WON = 'Won',
  LOST = 'Lost'
}

export interface PastSlip {
  id: string;
  timestamp: number;
  match: Match;
  userPrediction: string;
  playerProps: PlayerProp[];
  analysis: AIAnalysis;
  status: SlipStatus;
  payout?: number;
}

export interface DashboardStats {
  totalSlips: number;
  winRate: number;
  successfulPicks: number;
  totalProfit: number;
}

export interface LeaderboardUser {
  rank: number | string;
  username: string;
  avatar: string;
  winRate: number;
  totalSlips: number;
  streak: number;
  profit: number;
}

export interface UserProfile {
  username: string;
  avatar: string;
  joinedAt: number;
  pin: string; // Added for security
}
