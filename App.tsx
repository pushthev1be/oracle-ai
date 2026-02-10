
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import { SportType, Match, PlayerProp, AIAnalysis, PastSlip, PlayerMarket, SlipStatus, MatchStatus, DashboardStats, LeaderboardUser, UserProfile, NewsPost, PlatformType, Team } from './types';
import { COMPETITIONS, MOCK_MATCHES, MOCK_LEADERBOARD, MOCK_NEWS } from './constants';
import { 
  ChevronRight, Search, Dribbble, Flame, CircleDot, Loader2, Target, Sparkles, 
  ArrowRightCircle, Clock, ExternalLink, Trophy, UserPlus, Trash2, History, 
  FileText, Users, Zap, ArrowUp, ArrowDown, LayoutDashboard, CheckCircle2, 
  XCircle, TrendingUp, Wallet, Award, Medal, User as UserIcon, RefreshCw, LogOut,
  Newspaper, Twitter, Share2, MessageSquare, Heart, Music, LayoutGrid, Lock, Filter,
  PlusCircle, MinusCircle, Check, Radio, Info, Calendar, Wifi
} from 'lucide-react';
import { getAIAnalysis } from './services/geminiService';
import { fetchLiveMatches } from './services/liveDataService';

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
  const [viewMode, setViewMode] = useState<'active' | 'history' | 'dashboard' | 'leaderboard' | 'news' | 'fixtures'>('active');
  const [pastSlips, setPastSlips] = useState<PastSlip[]>([]);
  
  // User Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpPin, setSignUpPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(Math.random().toString(36).substring(7));

  // Dynamic Status Cycling Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prevMatches => prevMatches.map(match => {
        // Simple logic to cycle some matches
        if (match.status === MatchStatus.UPCOMING && Math.random() > 0.98) {
          return { ...match, status: MatchStatus.LIVE, date: 'Live Now', result: { homeScore: 0, awayScore: 0, scorers: [], playerStats: {} } };
        }
        if (match.status === MatchStatus.LIVE && Math.random() > 0.98) {
          return { ...match, status: MatchStatus.FINISHED, date: 'Full Time' };
        }
        // Update scores for live matches
        if (match.status === MatchStatus.LIVE && Math.random() > 0.95) {
          const homeGoal = Math.random() > 0.5;
          return {
            ...match,
            result: {
              ...match.result!,
              homeScore: match.result!.homeScore + (homeGoal ? 1 : 0),
              awayScore: match.result!.awayScore + (homeGoal ? 0 : 1)
            }
          };
        }
        return match;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Identity Helpers
  const getGlobalRegistry = (): Record<string, UserProfile> => {
    const reg = localStorage.getItem('oracle_global_registry');
    return reg ? JSON.parse(reg) : {};
  };

  const isUsernameTaken = useMemo(() => {
    const registry = getGlobalRegistry();
    return !!registry[signUpName.trim().toLowerCase()];
  }, [signUpName]);

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
      setUser(JSON.parse(savedUser));
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
  useEffect(() => {
    if (user) {
      const storageKey = `oracle_vault_${user.username.toLowerCase()}`;
      const savedSlips = localStorage.getItem(storageKey);
      if (savedSlips) {
        try {
          setPastSlips(JSON.parse(savedSlips));
        } catch (e) {
          setPastSlips([]);
        }
      } else {
        setPastSlips([]);
      }
    }
  }, [user]);

  // Auth Handling
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const name = signUpName.trim();
    const nameLower = name.toLowerCase();
    const registry = getGlobalRegistry();

    if (isUsernameTaken) {
      const existingUser = registry[nameLower];
      if (existingUser.pin === signUpPin) {
        localStorage.setItem('oracle_user', JSON.stringify(existingUser));
        setUser(existingUser);
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
      setShowSignUp(false);
      setSignUpName('');
      setSignUpPin('');
    }
  };

  const handleSignOut = () => {
    if (confirm("Sign out of the Oracle network?")) {
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          {user && (
            <section className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl overflow-hidden relative group">
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

          <section className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Categories</h3>
            <div className="space-y-2">
              {sports.map((s) => (
                <button
                  key={s.type}
                  onClick={() => { setSelectedSport(s.type); setSelectedCompId(null); setSelectedTeam(null); setViewMode('active'); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedSport === s.type ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'hover:bg-slate-800 text-slate-300'}`}
                >
                  {s.icon} <span className="font-semibold">{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Explorer</h3>
            <div className="space-y-2">
              <button onClick={() => setViewMode('active')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${viewMode === 'active' ? 'bg-slate-800 text-green-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                <LayoutGrid size={20} /> <span className="font-semibold">Lobby</span>
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
                  <select value={selectedCompId || ''} onChange={(e) => { setSelectedCompId(e.target.value || null); setSelectedTeam(null); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-green-500 outline-none">
                    <option value="">All Leagues</option>
                    {availableComps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Team</label>
                  <select value={selectedTeam?.id || ''} onChange={(e) => setSelectedTeam(uniqueTeams.find(t => t.id === e.target.value) || null)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-green-500 outline-none">
                    <option value="">All Teams</option>
                    {uniqueTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      const liveMatches = await fetchLiveMatches();
                      if (liveMatches && liveMatches.length > 0) {
                        setMatches(liveMatches);
                      }
                    } catch (error) {
                      console.error("Error refreshing matches:", error);
                    }
                  }}
                  className="px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/20 transition-all flex items-center gap-2 font-bold"
                >
                  <Wifi size={16} /> <span className="hidden sm:inline">Live</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredMatches.map(match => (
                  <div key={match.id} onClick={() => handleSelectMatch(match)} className={`group bg-slate-900 border ${activeMatch?.id === match.id ? 'border-green-500 ring-4 ring-green-500/10' : 'border-slate-800'} rounded-2xl p-6 cursor-pointer transition-all hover:border-slate-700 shadow-xl relative overflow-hidden`}>
                    <div className="flex justify-between items-center mb-6 opacity-60 text-[10px] font-black uppercase tracking-tighter">
                      <span className="flex items-center gap-2">
                        {match.competition}
                        {match.status === MatchStatus.LIVE && (
                          <span className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            LIVE
                          </span>
                        )}
                        {match.status === MatchStatus.FINISHED && (
                          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                            FINISHED
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
                ))}
              </div>
            </div>
          )}

          {viewMode === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black italic uppercase text-slate-100 flex items-center gap-2"><History className="text-green-500" /> Private Vault</h2>
              {pastSlips.length > 0 ? (
                pastSlips.map(slip => (
                  <div key={slip.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-black text-slate-100 uppercase italic">{slip.match.homeTeam.name} vs {slip.match.awayTeam.name}</span>
                      <span className="text-[10px] font-black text-slate-500">{new Date(slip.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-black text-green-400 italic">Prediction: {slip.analysis.prediction}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                  <FileText className="mx-auto text-slate-800 mb-4" size={48} />
                  <p className="text-slate-500 font-bold uppercase italic tracking-tighter">Your vault is empty</p>
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
        </div>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-28 space-y-6">
            {activeMatch ? (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="bg-green-500 p-4 text-slate-950 flex items-center justify-between">
                  <h4 className="font-black italic uppercase tracking-tighter">BET SLIP</h4>
                  <Zap size={18} fill="currentColor" />
                </div>
                
                <div className="p-5 space-y-6">
                  {/* Status Info */}
                  {activeMatch.status !== MatchStatus.UPCOMING && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase">{activeMatch.homeTeam.name}</p>
                        <p className="text-xl font-black">{activeMatch.result?.homeScore}</p>
                      </div>
                      <div className="text-slate-800 font-black text-sm italic">SCORE</div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase">{activeMatch.awayTeam.name}</p>
                        <p className="text-xl font-black">{activeMatch.result?.awayScore}</p>
                      </div>
                    </div>
                  )}

                  {/* Outcome Odds */}
                  {activeMatch.status === MatchStatus.UPCOMING && (
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Outcome Selection</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl hover:border-green-500 text-center transition-all group">
                          <span className="block text-[8px] font-black text-slate-500 mb-1">1</span>
                          <span className="block text-xs font-black text-slate-100 group-hover:text-green-500">{activeMatch.odds.home.toFixed(2)}</span>
                        </button>
                        <button className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl hover:border-green-500 text-center transition-all group">
                          <span className="block text-[8px] font-black text-slate-500 mb-1">X</span>
                          <span className="block text-xs font-black text-slate-100 group-hover:text-green-500">{activeMatch.odds.draw?.toFixed(2) || '2.50'}</span>
                        </button>
                        <button className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl hover:border-green-500 text-center transition-all group">
                          <span className="block text-[8px] font-black text-slate-500 mb-1">2</span>
                          <span className="block text-xs font-black text-slate-100 group-hover:text-green-500">{activeMatch.odds.away.toFixed(2)}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Player Props */}
                  {activeMatch.playerMarkets && activeMatch.playerMarkets.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Player Props</p>
                      <div className="space-y-2">
                        {activeMatch.playerMarkets.map((market, idx) => (
                          <div key={idx} onClick={() => togglePlayerProp(market)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${playerProps.find(p => p.player === market.player) ? 'bg-green-500/10 border-green-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                            <div className="flex items-center gap-3">
                              <img src={market.playerImage} className="w-8 h-8 rounded-full border border-slate-800" />
                              <div>
                                <p className="text-[10px] font-black text-slate-100 leading-none">{market.player}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">{market.type} {market.line}</p>
                              </div>
                            </div>
                            {playerProps.find(p => p.player === market.player) ? <Check size={14} className="text-green-500" /> : <PlusCircle size={14} className="text-slate-600" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea value={userPrediction} onChange={(e) => setUserPrediction(e.target.value)} placeholder="Personal notes/hunch..." className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:border-green-500 outline-none" />
                  
                  <button onClick={runAnalysis} disabled={isLoading} className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl uppercase italic tracking-tighter shadow-xl transition-all">
                    {isLoading ? <div className="flex flex-col items-center"><Loader2 className="animate-spin mb-1" size={16} /><span className="text-[8px]">{LOADING_MESSAGES[loadingMsgIdx]}</span></div> : 'ANALYZE SELECTIONS'}
                  </button>

                  {aiAnalysis && (
                    <div className="pt-6 space-y-4 border-t border-slate-800 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="p-4 bg-slate-950 rounded-2xl border-l-4 border-green-500">
                        <p className="text-[9px] font-black text-green-500 uppercase mb-1">Expert Verdict</p>
                        <p className="text-sm font-black text-slate-100 italic leading-tight">{aiAnalysis.prediction}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-800/20 rounded-xl border border-slate-800">
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Score</p>
                          <p className="text-lg font-black italic">{aiAnalysis.scoreline}</p>
                        </div>
                        <div className="p-3 bg-slate-800/20 rounded-xl border border-slate-800">
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Best Bet</p>
                          <p className="text-[10px] font-black text-green-400 uppercase italic mt-1">{aiAnalysis.suggestedPlay}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Scorers</p>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.likelyScorers.map((s, i) => (
                            <span key={i} className="text-[10px] font-black text-slate-100 bg-slate-800 px-2 py-1 rounded-lg"># {s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-800/10 rounded-2xl border border-slate-800">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Reasoning</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">"{aiAnalysis.reasoning}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 text-center shadow-2xl">
                <Target size={48} className="mx-auto mb-6 text-slate-700 opacity-30" />
                <h4 className="font-black italic text-slate-100 mb-2 uppercase tracking-tighter">Pick a Target</h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">Select a match to start building your AI-verified slip.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

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
                   <input type="text" value={signUpName} onChange={(e) => { setSignUpName(e.target.value); setAuthError(''); }} placeholder="Username" required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-sm font-black focus:border-green-500 transition-colors uppercase italic outline-none" />
                </div>
                <div className="relative">
                   <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                   <input type="password" value={signUpPin} onChange={(e) => { setSignUpPin(e.target.value); setAuthError(''); }} placeholder="Security PIN (4-Digit)" required maxLength={6} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-sm font-black focus:border-green-500 transition-colors outline-none" />
                </div>
                {authError && <div className="text-red-500 text-[10px] font-black uppercase text-center animate-pulse">{authError}</div>}
                <button type="submit" className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase italic tracking-tighter hover:bg-green-400 transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] mt-2">
                  {isUsernameTaken ? 'Authorize' : 'Initialize'}
                </button>
             </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
