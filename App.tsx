
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import { BetSlip } from './components/BetSlip';
import { Onboarding } from './components/Onboarding';
import { SportType, Match, PlayerProp, AIAnalysis, PastSlip, PlayerMarket, SlipStatus, MatchStatus, DashboardStats, LeaderboardUser, UserProfile, NewsPost, PlatformType, Team, DailyPrediction } from './types';
import { QuickSlip } from './components/QuickSlip';
import { COMPETITIONS, MOCK_MATCHES, MOCK_LEADERBOARD, MOCK_NEWS } from './constants';
import {
  ChevronRight, Search, Dribbble, Flame, CircleDot, Loader2, Target, Sparkles,
  ArrowRightCircle, Clock, ExternalLink, Trophy, UserPlus, Trash2, History,
  FileText, Users, Zap, ArrowUp, ArrowDown, LayoutDashboard, CheckCircle2,
  XCircle, TrendingUp, Wallet, Award, Medal, User as UserIcon, RefreshCw, LogOut,
  Newspaper, Twitter, Share2, MessageSquare, Heart, Music, LayoutGrid, Lock, Filter,
  PlusCircle, MinusCircle, Check, Radio, Info, Calendar, Wifi, BarChart3, Activity
} from 'lucide-react';
import { getAIAnalysis } from './services/geminiService';
import { fetchLiveMatches } from './services/liveDataService';
import { trackEvent, AnalyticsEvents } from './services/analyticsService';
import { getGlobalLiveStats } from './services/cacheService';

const LOADING_MESSAGES = [
  "Scraping live team news...",
  "Checking injury reports...",
  "Analyzing head-to-head stats...",
  "Verifying player prop value...",
  "Finalizing expert verdict..."
];

const App: React.FC = () => {
  // Navigation & Selection State
  const [selectedSport, setSelectedSport] = useState<SportType | null>(SportType.FOOTBALL);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [userPrediction, setUserPrediction] = useState<string>('');
  const [playerProps, setPlayerProps] = useState<PlayerProp[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'active' | 'history' | 'dashboard' | 'leaderboard' | 'news' | 'fixtures' | 'daily_tips'>('active');
  const [pastSlips, setPastSlips] = useState<PastSlip[]>([]);

  // User Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpPin, setSignUpPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(Math.random().toString(36).substring(7));

  // Identity Helpers
  const getGlobalRegistry = (): Record<string, UserProfile> => {
    const reg = localStorage.getItem('oracle_global_registry');
    return reg ? JSON.parse(reg) : {};
  };

  const isUsernameTaken = useMemo(() => {
    const registry = getGlobalRegistry();
    return !!registry[signUpName.trim().toLowerCase()];
  }, [signUpName]);

  // Daily Predictions State
  const [dailyPredictions, setDailyPredictions] = useState<DailyPrediction[]>([]);
  const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);
  const [globalStats, setGlobalStats] = useState<{ count: number; recent: any[] }>({ count: 0, recent: [] });

  // Poll for global stats every 30s
  useEffect(() => {
    const fetchGlobal = async () => {
      const stats = await getGlobalLiveStats();
      setGlobalStats(stats);
    };

    fetchGlobal();
    const interval = setInterval(fetchGlobal, 30000);
    return () => clearInterval(interval);
  }, []);

  // QuickSlip State
  const [quickSlipMatches, setQuickSlipMatches] = useState<Match[]>([]);
  const [showQuickSlip, setShowQuickSlip] = useState(false);

  const addToQuickSlip = (match: Match) => {
    if (quickSlipMatches.find(m => m.id === match.id)) return;
    if (quickSlipMatches.length >= 7) {
      alert("QuickSlip is limited to 7 matches for high-speed processing.");
      return;
    }
    setQuickSlipMatches([...quickSlipMatches, match]);
  };

  const removeFromQuickSlip = (id: string) => {
    setQuickSlipMatches(quickSlipMatches.filter(m => m.id !== id));
  };

  useEffect(() => {
    // Check for cached daily predictions
    const today = new Date().toLocaleDateString();
    const cacheKey = `oracle_daily_predictions_${today}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        setDailyPredictions(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse daily cache", e);
      }
    }
  }, []);

  const generateDailyPredictions = async () => {
    if (dailyPredictions.length > 0) return; // Already have them

    setIsGeneratingDaily(true);
    const today = new Date().toLocaleDateString();
    const cacheKey = `oracle_daily_predictions_${today}`;

    // Select top 3 matches (prioritize major leagues)
    const candidates = matches.filter(m =>
      (m.competition === 'Premier League' || m.competition === 'NBA' || m.competition === 'Champions League') &&
      m.status !== MatchStatus.FINISHED
    ).slice(0, 3);

    // If no major leagues, just take top 3 upcoming
    const targetMatches = candidates.length > 0 ? candidates : matches.filter(m => m.status !== MatchStatus.FINISHED).slice(0, 3);

    if (targetMatches.length === 0) {
      setIsGeneratingDaily(false);
      return;
    }

    try {

      const promises = targetMatches.map(async (match) => {
        const analysis = await getAIAnalysis(match, "Generate a general daily betting tip for this match. Focus on the most likely outcome.", []);

        return {
          id: Math.random().toString(36).substr(2, 9),
          match,
          analysis,
          timestamp: Date.now()
        } as DailyPrediction;
      });

      const results = await Promise.all(promises);
      setDailyPredictions(results);
      localStorage.setItem(cacheKey, JSON.stringify(results));
    } catch (error) {
      console.error("Failed to generate daily predictions", error);
    } finally {
      setIsGeneratingDaily(false);
    }
  };

  const handleViewDailyTips = () => {
    setViewMode('daily_tips');
    if (dailyPredictions.length === 0) {
      generateDailyPredictions();
    }
  };


  const currentAvatar = useMemo(() => {
    if (isUsernameTaken) {
      const registry = getGlobalRegistry();
      return registry[signUpName.trim().toLowerCase()].avatar;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
  }, [avatarSeed, isUsernameTaken, signUpName]);

  // Initial Load
  useEffect(() => {
    const savedUser = localStorage.getItem('oracle_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Check if user has completed onboarding
      const onboardingKey = `oracle_onboarding_completed_${parsedUser.username}`;
      const hasCompletedOnboarding = localStorage.getItem(onboardingKey);
      // Show onboarding if not yet completed
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    } else {
      setShowSignUp(true);
    }

    const loadMatches = async () => {
      try {
        const liveMatches = await fetchLiveMatches();
        if (liveMatches && liveMatches.length > 0) {
          setMatches(liveMatches);
        } else {
          setMatches(MOCK_MATCHES);
        }
      } catch (error) {
        console.error("Failed to fetch live matches, using mock data:", error);
        setMatches(MOCK_MATCHES);
      }
    };

    loadMatches();
  }, []);

  // Vault Sync
  const syncVault = () => {
    if (user) {
      const storageKey = `oracle_vault_${user.username.toLowerCase()}`;
      const savedSlips = localStorage.getItem(storageKey);
      if (savedSlips) {
        try {
          setPastSlips(JSON.parse(savedSlips));
        } catch (e) {
          setPastSlips([]);
        }
      }
    }
  };

  useEffect(() => {
    syncVault();
  }, [user]);

  // Auth Handling
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const name = signUpName.trim();
    const nameLower = name.toLowerCase();
    const registry = getGlobalRegistry();
    const isNewUser = !registry[nameLower];

    if (isUsernameTaken) {
      const existingUser = registry[nameLower];
      if (existingUser.pin === signUpPin) {
        localStorage.setItem('oracle_user', JSON.stringify(existingUser));
        setUser(existingUser);
        trackEvent(AnalyticsEvents.AUTH_SUCCESS, { username: name, is_new_user: false });
        setShowSignUp(false);
        setSignUpName('');
        setSignUpPin('');
      } else {
        setAuthError('INVALID ACCESS PIN');
      }
    } else {
      if (signUpPin.length < 4) {
        setAuthError('PIN MUST BE AT LEAST 4 DIGITS');
        return;
      }
      const newUser: UserProfile = {
        username: name,
        avatar: currentAvatar,
        joinedAt: Date.now(),
        pin: signUpPin
      };
      registry[nameLower] = newUser;
      localStorage.setItem('oracle_global_registry', JSON.stringify(registry));
      localStorage.setItem('oracle_user', JSON.stringify(newUser));
      setUser(newUser);
      trackEvent(AnalyticsEvents.AUTH_SUCCESS, { username: name, is_new_user: true });
      setShowSignUp(false);
      setSignUpName('');
      setSignUpPin('');
      // Show onboarding for new users
      setShowOnboarding(true);
    }
  };

  const handleSignOut = () => {
    if (confirm("Sign out of the Oracle network?")) {
      trackEvent(AnalyticsEvents.AUTH_LOGOUT, { username: user?.username });
      localStorage.removeItem('oracle_user');
      setUser(null);
      setPastSlips([]);
      setShowSignUp(true);
    }
  };

  // Match Filtering
  const availableComps = useMemo(() => COMPETITIONS.filter(c => c.sport === selectedSport), [selectedSport]);

  const filteredMatches = useMemo(() => {
    let list = matches;
    if (selectedSport) {
      const compNames = availableComps.map(c => c.name);
      list = list.filter(m => compNames.includes(m.competition));
    }
    if (selectedCompId) {
      const comp = COMPETITIONS.find(c => c.id === selectedCompId);
      if (comp) list = list.filter(m => m.competition === comp.name);
    }
    if (selectedTeam) {
      list = list.filter(m => m.homeTeam.id === selectedTeam.id || m.awayTeam.id === selectedTeam.id);
    }
    return list;
  }, [selectedSport, selectedCompId, selectedTeam, availableComps, matches]);

  const uniqueTeams = useMemo(() => {
    const teams = new Map<string, Team>();
    filteredMatches.forEach(m => {
      teams.set(m.homeTeam.id, m.homeTeam);
      teams.set(m.awayTeam.id, m.awayTeam);
    });
    return Array.from(teams.values());
  }, [filteredMatches]);

  const handleSelectMatch = (match: Match) => {
    setActiveMatch(match);
    setAiAnalysis(null);
    setUserPrediction('');
    setPlayerProps([]);
    trackEvent(AnalyticsEvents.MATCH_SELECTED, {
      match_id: match.id,
      competition: match.competition,
      match_name: `${match.homeTeam.name} vs ${match.awayTeam.name}`
    });
    setViewMode('active');
  };

  const togglePlayerProp = (market: PlayerMarket) => {
    const exists = playerProps.find(p => p.player === market.player && p.type === market.type);
    if (exists) {
      setPlayerProps(playerProps.filter(p => !(p.player === market.player && p.type === market.type)));
    } else {
      setPlayerProps([...playerProps, { player: market.player, type: market.type, value: market.line, choice: 'MORE' }]);
    }
  };

  const runAnalysis = async () => {
    if (!activeMatch || !user) return;
    setIsLoading(true);
    setLoadingMsgIdx(0);
    setAiAnalysis(null);

    trackEvent(AnalyticsEvents.SEARCH_GROUNDED_ANALYSIS, {
      match_id: activeMatch.id,
      match_name: `${activeMatch.homeTeam.name} vs ${activeMatch.awayTeam.name}`,
      hunch_length: userPrediction.length,
      props_count: playerProps.length
    });

    // Cycle through loading messages faster
    const loadingInterval = setInterval(() => {
      setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 800);

    try {
      const analysis = await getAIAnalysis(activeMatch, userPrediction, playerProps);
      clearInterval(loadingInterval);
      setIsLoading(false);
      setAiAnalysis(analysis);

      const newSlip: PastSlip = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        match: activeMatch,
        userPrediction,
        playerProps,
        analysis,
        status: SlipStatus.PENDING
      };

      const updatedHistory = [newSlip, ...pastSlips];
      setPastSlips(updatedHistory);
      const storageKey = `oracle_vault_${user.username.toLowerCase()}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

    } catch (error) {
      clearInterval(loadingInterval);
      alert("Analysis failed. Check API key.");
      setIsLoading(false);
    }
  };

  const sports = [
    { type: SportType.FOOTBALL, icon: <Flame className="w-5 h-5" />, label: 'Football' },
    { type: SportType.BASKETBALL, icon: <Dribbble className="w-5 h-5" />, label: 'Basketball' },
    { type: SportType.TENNIS, icon: <CircleDot className="w-5 h-5" />, label: 'Tennis' },
  ];

  return (
    <Layout user={user} onOpenProfile={() => setShowSignUp(true)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 lg:pb-0">

        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          {user && (
            <section id="walkthrough-profile" className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleSignOut} className="text-slate-500 hover:text-red-500 transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <img src={user.avatar} alt={user.username} className="w-14 h-14 rounded-full border-2 border-green-500 bg-slate-950 p-0.5" />
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase italic leading-none">{user.username}</h3>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter italic">Secured Vault</p>
                </div>
              </div>
            </section>
          )}

          <section id="walkthrough-categories" className="bg-slate-900 rounded-2xl p-4 lg:p-5 border border-slate-800 shadow-xl overflow-x-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 lg:mb-4">Categories</h3>
            <div className="flex lg:flex-col gap-3 lg:gap-2 min-w-max lg:min-w-0">
              {sports.map((s) => (
                <button
                  key={s.type}
                  onClick={() => { setSelectedSport(s.type); setSelectedCompId(null); setSelectedTeam(null); setViewMode('active'); }}
                  className={`flex items-center gap-3 px-4 py-2 lg:p-3 rounded-xl transition-all whitespace-nowrap ${selectedSport === s.type ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-slate-800/50 lg:bg-transparent text-slate-300 hover:bg-slate-800'}`}
                >
                  {s.icon} <span className="font-semibold text-sm">{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="hidden lg:block bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Explorer</h3>
            <div className="space-y-2">
              <button onClick={() => setViewMode('active')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${viewMode === 'active' ? 'bg-slate-800 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                <LayoutGrid size={20} /> <span className="font-semibold">Lobby</span>
              </button>
              <button onClick={() => setViewMode('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${viewMode === 'dashboard' ? 'bg-slate-800 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Activity size={20} /> <span className="font-semibold">Live Dashboard</span>
              </button>
              <button onClick={() => setViewMode('fixtures')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${viewMode === 'fixtures' ? 'bg-slate-800 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Calendar size={20} /> <span className="font-semibold">Fixtures</span>
              </button>
              <button onClick={() => setViewMode('history')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${viewMode === 'history' ? 'bg-slate-800 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                <History size={20} /> <span className="font-semibold">Vault</span>
              </button>
              <button onClick={() => setViewMode('leaderboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${viewMode === 'leaderboard' ? 'bg-slate-800 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Trophy size={20} /> <span className="font-semibold">Leaderboard</span>
              </button>
              <button onClick={handleViewDailyTips} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${viewMode === 'daily_tips' ? 'bg-slate-800 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Sparkles size={20} /> <span className="font-semibold">Daily Tips</span>
              </button>
            </div>
          </section>
        </aside>

        {/* Center Content */}
        <div className="lg:col-span-6 space-y-6">
          {viewMode === 'active' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">League</label>
                  <select value={selectedCompId || ''} onChange={(e) => { setSelectedCompId(e.target.value || null); setSelectedTeam(null); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold focus:border-green-500 outline-none">
                    <option value="">All Leagues</option>
                    {availableComps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Team</label>
                  <select value={selectedTeam?.id || ''} onChange={(e) => setSelectedTeam(uniqueTeams.find(t => t.id === e.target.value) || null)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold focus:border-green-500 outline-none">
                    <option value="">All Teams</option>
                    {uniqueTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <button
                  id="walkthrough-refresh"
                  onClick={async () => {
                    try {
                      const liveMatches = await fetchLiveMatches(true);
                      if (liveMatches && liveMatches.length > 0) {
                        setMatches(liveMatches);
                      }
                    } catch (error) {
                      console.error("Error refreshing matches:", error);
                    }
                  }}
                  className="px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/20 transition-all flex items-center gap-2 font-bold"
                >
                  <Wifi size={16} /> <span className="hidden sm:inline">Live Refresh</span>
                </button>

              </div>

              <div id="walkthrough-lobby" className="grid grid-cols-1 gap-4">

                {filteredMatches.map((match, idx) => (
                  <div
                    key={match.id}
                    id={idx === 0 ? 'walkthrough-match-card' : undefined}
                    className={`group bg-slate-900 border ${activeMatch?.id === match.id ? 'border-green-500 ring-4 ring-green-500/10' : 'border-slate-800'} rounded-2xl p-6 cursor-pointer transition-all hover:border-slate-700 shadow-xl relative overflow-hidden`}
                  >
                    <div onClick={() => handleSelectMatch(match)}>
                      <div className="flex justify-between items-center mb-6 opacity-60 text-[10px] font-black uppercase tracking-tighter">
                        <span className="flex items-center gap-2">
                          {match.competition}
                          {match.status === MatchStatus.LIVE && (
                            <span className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </span>
                        <span>{match.date}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <img src={match.homeTeam.logo} className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-slate-800 bg-slate-950 p-1" />
                          <p className="font-black text-sm uppercase italic">{match.homeTeam.name}</p>
                          {match.status === MatchStatus.UPCOMING ? (
                            <p className="text-[10px] text-green-500 font-bold">{match.odds.home.toFixed(2)}</p>
                          ) : (
                            <p className="text-2xl font-black text-white mt-1">{match.result?.homeScore}</p>
                          )}
                        </div>
                        <div className="px-6 text-2xl font-black italic text-slate-800">VS</div>
                        <div className="text-center flex-1">
                          <img src={match.awayTeam.logo} className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-slate-800 bg-slate-950 p-1" />
                          <p className="font-black text-sm uppercase italic">{match.awayTeam.name}</p>
                          {match.status === MatchStatus.UPCOMING ? (
                            <p className="text-[10px] text-green-500 font-bold">{match.odds.away.toFixed(2)}</p>
                          ) : (
                            <p className="text-2xl font-black text-white mt-1">{match.result?.awayScore}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 mt-4 border-t border-slate-800/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectMatch(match); }}
                        className="flex-1 py-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-green-500 transition-all flex items-center justify-center gap-2"
                      >
                        <FileText size={12} /> SCAN
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToQuickSlip(match); }}
                        className={`flex-1 py-3 ${quickSlipMatches.find(m => m.id === match.id) ? 'bg-green-500 text-slate-950 border-green-500' : 'bg-green-500/10 border-green-500/30 text-green-500'} rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-slate-950 transition-all flex items-center justify-center gap-2`}
                      >
                        <Zap size={12} fill="currentColor" /> {quickSlipMatches.find(m => m.id === match.id) ? 'IN SLIP' : 'QUICKSLIP+'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase text-slate-100 flex items-center gap-2"><BarChart3 className="text-green-500" /> Global Pulse</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Network Activity</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[.2em] mb-2">Total Analyses</p>
                  <p className="text-4xl font-black italic text-slate-100">{globalStats.count}</p>
                  <p className="text-[9px] font-bold text-green-500 mt-2 uppercase flex items-center gap-1"><TrendingUp size={10} /> +{Math.max(1, Math.floor(globalStats.count * 0.1))} avg/day</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[.2em] mb-2">Confidence Yield</p>
                  <p className="text-4xl font-black italic text-green-500">${(globalStats.count * 42.5).toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Global Simulation</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[.2em] mb-2">Latency</p>
                  <p className="text-4xl font-black italic text-slate-100">24ms</p>
                  <p className="text-[9px] font-bold text-blue-400 mt-2 uppercase">Supabase Fast-Path</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black italic uppercase text-slate-100 tracking-tighter">Live Analysis Stream</h3>
                  <RefreshCw size={16} className="text-slate-700 animate-spin" />
                </div>

                <div className="space-y-4">
                  {globalStats.recent.length > 0 ? (
                    globalStats.recent.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800/50 rounded-2xl hover:border-slate-700 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                          <Activity size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-slate-100 uppercase italic truncate">
                              {item.data?.match?.homeTeam?.name || 'Unknown'} vs {item.data?.match?.awayTeam?.name || 'Unknown'}
                            </p>
                            <span className="text-[8px] font-black text-slate-600 uppercase tabular-nums">{item.created_at ? new Date(item.created_at).toLocaleTimeString() : '--:--'}</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-500 truncate mt-1 italic">
                            "{item.data?.prediction || 'New Analysis Found'}"
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-20 italic font-black uppercase text-sm">
                      Awaiting Global Signal...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'history' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase text-slate-100 flex items-center gap-2"><History className="text-green-500" /> Private Vault</h2>
                <button
                  onClick={syncVault}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-green-400 transition-colors"
                  title="Sync Vault"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              {pastSlips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastSlips.map(slip => (
                    <div key={slip.id} className="bg-[#f8f9fa] text-slate-950 rounded-[2rem] border-4 border-black shadow-2xl overflow-hidden flex flex-col transform hover:rotate-1 transition-transform">
                      {/* Receipt Header */}
                      <div className="p-4 border-b-2 border-dashed border-slate-300 text-center bg-white">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                          {slip.isBatch ? 'Oracle Compiled Receipt' : 'Oracle Single Receipt'}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 tabular-nums uppercase">{new Date(slip.timestamp).toLocaleString()}</p>
                      </div>

                      {/* Content Area */}
                      <div className="p-6 space-y-6 flex-1">
                        {slip.isBatch ? (
                          // BATCH RENDERING
                          slip.matches?.map((item, idx) => (
                            <div key={idx} className="space-y-3 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                              <div className="flex justify-between items-start">
                                <span className="text-[7px] font-black bg-black text-white px-2 py-0.5 rounded italic uppercase">
                                  {item.match?.competition || 'Event'}
                                </span>
                                <span className="text-[8px] font-black uppercase text-slate-400 italic">Game 0{idx + 1}</span>
                              </div>
                              <p className="text-xs font-black uppercase italic leading-tight">
                                {item.match?.homeTeam?.name || 'Unknown'} vs {item.match?.awayTeam?.name || 'Unknown'}
                              </p>

                              <div className="space-y-1.5 pl-2 border-l-2 border-green-500/20">
                                {item.analysis?.quickPicks?.slice(0, 2).map((pick, pIdx) => (
                                  <div key={pIdx} className="flex justify-between items-baseline">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[7px] font-black text-slate-400 uppercase">{pick.category}</span>
                                      <p className="text-[9px] font-black text-slate-900 uppercase italic leading-none">{pick.market}</p>
                                    </div>
                                    <span className="text-[9px] font-black text-green-600 uppercase italic">{pick.selection}</span>
                                  </div>
                                ))}
                                {(!item.analysis?.quickPicks || item.analysis.quickPicks.length === 0) && (
                                  <p className="text-[9px] font-black text-green-600 uppercase italic">{item.analysis?.suggestedPlay || 'Market Verification Active'}</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          // SINGLE RENDERING (Legacy/Fallback)
                          <div className="space-y-4">
                            <div className="border-b border-slate-200 pb-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] font-black bg-black text-white px-2 py-0.5 rounded italic uppercase">
                                  {slip.match?.competition || 'Sport Event'}
                                </span>
                                <span className="text-[7px] font-black text-slate-400 uppercase">ID: {slip.id.slice(0, 6)}</span>
                              </div>
                              <p className="text-sm font-black uppercase italic leading-tight">
                                {slip.match?.homeTeam?.name || 'Unknown'} vs {slip.match?.awayTeam?.name || 'Unknown'}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Verified Logic</p>
                              <div className="p-3 bg-white border-2 border-slate-100 rounded-xl">
                                <p className="text-[10px] font-black text-green-600 uppercase italic">
                                  {slip.analysis?.prediction || 'Standard Analysis'}
                                </p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Suggested: {slip.analysis?.suggestedPlay || 'Market Pick'}</p>
                              </div>
                            </div>

                            {slip.playerProps && slip.playerProps.length > 0 && (
                              <div className="pt-2 border-t border-dotted border-slate-200">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-2">Market Props</p>
                                <div className="space-y-1">
                                  {slip.playerProps.map((prop, pIdx) => (
                                    <div key={pIdx} className="flex justify-between text-[9px] font-bold">
                                      <span className="uppercase">{prop.player} ({prop.type})</span>
                                      <span className="text-green-600 font-black">{prop.value} {prop.choice}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Barcode Footer */}
                      <div className="px-6 py-4 bg-white border-t-2 border-dashed border-slate-200">
                        <div className="flex justify-center items-end h-4 gap-[1px] opacity-40">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div
                              key={i}
                              className="bg-black"
                              style={{ width: '1px', height: `${50 + Math.random() * 50}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                  <FileText className="mx-auto text-slate-800 mb-4" size={48} />
                  <p className="text-slate-500 font-bold uppercase italic tracking-tighter">Your vault is empty</p>
                  <p className="text-[10px] text-slate-700 uppercase mt-2">Any match you analyze will appear here</p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'leaderboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase text-slate-100 flex items-center gap-2"><Trophy className="text-green-500" /> Hall of Fame</h2>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Updated Real-Time</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50">
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Rank</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">User</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <div className="flex items-center gap-1 group relative cursor-help">
                          Win Rate <Info size={10} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-[8px] font-bold text-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-700 z-20">
                            Percentage of successful predictions across all slips.
                          </div>
                        </div>
                      </th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <div className="flex items-center gap-1 group relative cursor-help">
                          Streak <Info size={10} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-[8px] font-bold text-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-700 z-20">
                            Consecutive winning slips in the current active run.
                          </div>
                        </div>
                      </th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <div className="flex items-center gap-1 group relative cursor-help">
                          Profit <Info size={10} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-[8px] font-bold text-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-700 z-20">
                            Net gain in virtual units based on accuracy and odds.
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_LEADERBOARD.map((u, i) => (
                      <tr key={u.username} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${i === 0 ? 'bg-green-500/5' : ''}`}>
                        <td className="p-6">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic ${i === 0 ? 'bg-yellow-500 text-slate-950' : i === 1 ? 'bg-slate-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                            {u.rank}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar} className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800" />
                            <span className="font-black italic uppercase text-slate-100 tracking-tighter">{u.username}</span>
                          </div>
                        </td>
                        <td className="p-6 font-black text-green-400">{u.winRate}%</td>
                        <td className="p-6 font-black text-slate-300">
                          <span className="flex items-center gap-1">
                            <Flame size={12} className="text-orange-500" /> {u.streak}
                          </span>
                        </td>
                        <td className="p-6 font-black text-slate-100">+{u.profit} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'fixtures' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase text-slate-100 flex items-center gap-2"><Calendar className="text-green-500" /> All Fixtures</h2>
              </div>

              {sports.map(sport => {
                const sportMatches = matches.filter(m => {
                  const comp = COMPETITIONS.find(c => c.name === m.competition);
                  return comp?.sport === sport.type;
                });

                if (sportMatches.length === 0) return null;

                const matchesByLeague = sportMatches.reduce((acc, match) => {
                  const league = match.competition;
                  if (!acc[league]) acc[league] = [];
                  acc[league].push(match);
                  return acc;
                }, {} as Record<string, Match[]>);

                return (
                  <div key={sport.type} className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      {sport.icon}
                      <h3 className="text-lg font-black italic uppercase text-slate-100">{sport.label}</h3>
                    </div>

                    {(Object.entries(matchesByLeague) as [string, Match[]][]).map(([league, leagueMatches]) => (
                      <div key={league} className="space-y-3 pl-8">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{league}</h4>
                        <div className="space-y-3">
                          {leagueMatches.map(match => (
                            <div
                              key={match.id}
                              onClick={() => handleSelectMatch(match)}
                              className={`group bg-slate-900 border ${activeMatch?.id === match.id ? 'border-green-500 ring-4 ring-green-500/10' : 'border-slate-800'} rounded-xl p-4 cursor-pointer transition-all hover:border-slate-700 shadow-lg overflow-hidden relative`}
                            >
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2 opacity-60 text-[9px] font-black uppercase tracking-tighter">
                                  <span>{match.date}</span>
                                  {match.status === MatchStatus.LIVE && (
                                    <span className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                                      <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                                      LIVE
                                    </span>
                                  )}
                                  {match.status === MatchStatus.FINISHED && (
                                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[8px]">
                                      FINISHED
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 text-center">
                                  <img src={match.homeTeam.logo} className="w-10 h-10 mx-auto mb-1 rounded-full border border-slate-800 bg-slate-950 p-0.5" />
                                  <p className="font-black text-xs uppercase italic leading-tight">{match.homeTeam.name}</p>
                                  {match.status === MatchStatus.UPCOMING ? (
                                    <p className="text-[9px] text-green-500 font-bold mt-1">{match.odds.home.toFixed(2)}</p>
                                  ) : (
                                    <p className="text-lg font-black text-white mt-1">{match.result?.homeScore}</p>
                                  )}
                                </div>

                                <div className="px-3 text-sm font-black italic text-slate-700">VS</div>

                                <div className="flex-1 text-center">
                                  <img src={match.awayTeam.logo} className="w-10 h-10 mx-auto mb-1 rounded-full border border-slate-800 bg-slate-950 p-0.5" />
                                  <p className="font-black text-xs uppercase italic leading-tight">{match.awayTeam.name}</p>
                                  {match.status === MatchStatus.UPCOMING ? (
                                    <p className="text-[9px] text-green-500 font-bold mt-1">{match.odds.away.toFixed(2)}</p>
                                  ) : (
                                    <p className="text-lg font-black text-white mt-1">{match.result?.awayScore}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'daily_tips' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase text-slate-100 flex items-center gap-2"><Sparkles className="text-green-500" /> Today's Oracle</h2>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{new Date().toLocaleDateString()}</div>
              </div>

              {isGeneratingDaily ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-xl">
                  <Loader2 className="animate-spin mx-auto text-green-500 mb-4" size={48} />
                  <h3 className="text-xl font-black italic text-slate-100 uppercase tracking-tighter mb-2">Consulting the Oracle...</h3>
                  <p className="text-sm text-slate-500 font-bold"> Analyzing today's market data to generate premium insights.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {dailyPredictions.length > 0 ? (
                    dailyPredictions.map(item => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.match.competition}</span>
                          </div>
                          <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1"><Zap size={10} fill="currentColor" /> AI Verified</span>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="text-center">
                              <img src={item.match.homeTeam.logo} className="w-12 h-12 mx-auto mb-2 rounded-full border border-slate-800 bg-slate-950 p-1" />
                              <p className="font-black text-xs uppercase italic">{item.match.homeTeam.name}</p>
                            </div>
                            <div className="font-black text-xl italic text-slate-700">VS</div>
                            <div className="text-center">
                              <img src={item.match.awayTeam.logo} className="w-12 h-12 mx-auto mb-2 rounded-full border border-slate-800 bg-slate-950 p-1" />
                              <p className="font-black text-xs uppercase italic">{item.match.awayTeam.name}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="p-4 bg-slate-950 rounded-2xl border-l-4 border-green-500">
                              <p className="text-[9px] font-black text-green-500 uppercase mb-1">Expert Verdict</p>
                              <p className="text-sm font-black text-slate-100 italic leading-tight">{item.analysis.prediction}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-800/20 rounded-xl border border-slate-800">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Score</p>
                                <p className="text-lg font-black italic">{item.analysis.scoreline}</p>
                              </div>
                              <div className="p-3 bg-slate-800/20 rounded-xl border border-slate-800">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Key Players</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.analysis.likelyScorers.slice(0, 2).map((s, i) => (
                                    <span key={i} className="text-[9px] font-black text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-nowrap">{s}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-slate-800/10 rounded-2xl border border-slate-800">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Analysis</p>
                              <p className="text-[10px] text-slate-400 leading-relaxed italic whitespace-pre-wrap">"{item.analysis.reasoning}"</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                      <Sparkles className="mx-auto text-slate-800 mb-4" size={48} />
                      <p className="text-slate-500 font-bold uppercase italic tracking-tighter">No daily tips available right now.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 space-y-6">
            <BetSlip
              activeMatch={activeMatch}
              userPrediction={userPrediction}
              setUserPrediction={setUserPrediction}
              playerProps={playerProps}
              togglePlayerProp={togglePlayerProp}
              isLoading={isLoading}
              runAnalysis={runAnalysis}
              loadingMsgIdx={loadingMsgIdx}
              loadingMessages={LOADING_MESSAGES}
              aiAnalysis={aiAnalysis}
            />
          </div>
        </aside>
      </div>

      {/* Mobile Bet Slip Modal */}
      {activeMatch && (
        <div className="fixed inset-0 z-[60] lg:hidden flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full h-[85vh] sm:h-auto sm:max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom-full duration-300">
            <div className="h-1 w-12 bg-slate-700/50 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>
            <BetSlip
              activeMatch={activeMatch}
              userPrediction={userPrediction}
              setUserPrediction={setUserPrediction}
              playerProps={playerProps}
              togglePlayerProp={togglePlayerProp}
              isLoading={isLoading}
              runAnalysis={runAnalysis}
              loadingMsgIdx={loadingMsgIdx}
              loadingMessages={LOADING_MESSAGES}
              aiAnalysis={aiAnalysis}
              onClose={() => setActiveMatch(null)}
            />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showSignUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500" />
            <div className="text-center mb-10">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-green-500/10 blur-3xl rounded-full" />
                <img src={currentAvatar} alt="Avatar" className="w-28 h-28 rounded-full border-4 border-slate-800 bg-slate-950 relative z-10 mx-auto" />
                {!isUsernameTaken && (
                  <button onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))} className="absolute bottom-0 right-0 bg-slate-800 border border-slate-700 p-2.5 rounded-full text-slate-400 hover:text-green-500 z-20 shadow-lg transition-all">
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-100">{isUsernameTaken ? 'Unlock Vault' : 'New Identity'}</h2>
              <p className="text-xs font-bold text-slate-500 uppercase mt-2">{isUsernameTaken ? 'Enter PIN to Access Data' : 'Pick a Name and Locked PFP'}</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                <input type="text" value={signUpName} onChange={(e) => { setSignUpName(e.target.value); setAuthError(''); }} placeholder="Username" required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-base font-black focus:border-green-500 transition-colors uppercase italic outline-none" />
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                <input type="password" value={signUpPin} onChange={(e) => { setSignUpPin(e.target.value); setAuthError(''); }} placeholder="Security PIN (4-Digit)" required maxLength={6} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-base font-black focus:border-green-500 transition-colors outline-none" />
              </div>
              {authError && <div className="text-red-500 text-[10px] font-black uppercase text-center animate-pulse">{authError}</div>}
              <button type="submit" className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase italic tracking-tighter hover:bg-green-400 transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] mt-2">
                {isUsernameTaken ? 'Authorize' : 'Initialize'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 p-2 z-50 lg:hidden flex justify-around items-center safe-area-pb">
        <button onClick={() => setViewMode('active')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'active' ? 'text-green-500 bg-green-500/10' : 'text-slate-400'}`}>
          <LayoutGrid size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Lobby</span>
        </button>
        <button onClick={() => setViewMode('dashboard')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'dashboard' ? 'text-green-500 bg-green-500/10' : 'text-slate-400'}`}>
          <Activity size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Live</span>
        </button>
        <button onClick={() => setViewMode('fixtures')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'fixtures' ? 'text-green-500 bg-green-500/10' : 'text-slate-400'}`}>
          <Calendar size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Fixtures</span>
        </button>
        <button onClick={() => setViewMode('history')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'history' ? 'text-green-500 bg-green-500/10' : 'text-slate-400'}`}>
          <History size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Vault</span>
        </button>
        <button onClick={handleViewDailyTips} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'daily_tips' ? 'text-green-500 bg-green-500/10' : 'text-slate-400'}`}>
          <Sparkles size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Tips</span>
        </button>
        <button onClick={() => setViewMode('leaderboard')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewMode === 'leaderboard' ? 'text-green-500 bg-green-500/10' : 'text-slate-400'}`}>
          <Trophy size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Rank</span>
        </button>
      </div>

      {/* QuickSlip Floating Trigger */}
      {quickSlipMatches.length > 0 && !showQuickSlip && (
        <button
          onClick={() => setShowQuickSlip(true)}
          className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 bg-white border-4 border-black p-4 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all z-[100] group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-2 py-1 text-[10px] font-black italic">SLIP</div>
            <div className="text-slate-950 font-black italic text-xl">{quickSlipMatches.length} / 7</div>
            <Zap size={20} className="text-green-600 animate-pulse" fill="currentColor" />
          </div>
        </button>
      )}

      {/* QuickSlip Modal */}
      {showQuickSlip && (
        <QuickSlip
          matches={quickSlipMatches}
          onRemove={removeFromQuickSlip}
          onClose={() => setShowQuickSlip(false)}
          onClear={() => setQuickSlipMatches([])}
          onSaveAnalyses={(batchResults) => {
            if (!user) return;
            const consolidatedSlip: PastSlip = {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
              isBatch: true,
              matches: Object.entries(batchResults).map(([matchId, analysis]) => ({
                match: quickSlipMatches.find(m => m.id === matchId)!,
                analysis: analysis as AIAnalysis,
                playerProps: [] // Batch analysis is usually standalone without user props
              })),
              status: SlipStatus.PENDING
            };
            const updatedHistory = [consolidatedSlip, ...pastSlips];
            setPastSlips(updatedHistory);
            const storageKey = `oracle_vault_${user.username.toLowerCase()}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
          }}
        />
      )}


      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <Onboarding
          userName={user.username}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </Layout>
  );
};

export default App;
