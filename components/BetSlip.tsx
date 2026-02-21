import React from 'react';
import { Loader2, Zap, PlusCircle, Check, Target, Activity, Database, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import { Match, MatchStatus, AIAnalysis, PlayerProp, PlayerMarket } from '../types';

interface BetSlipProps {
    activeMatch: Match | null;
    userPrediction: string;
    setUserPrediction: (val: string) => void;
    playerProps: PlayerProp[];
    togglePlayerProp: (market: PlayerMarket) => void;
    isLoading: boolean;
    runAnalysis: () => void;
    loadingMsgIdx: number;
    loadingMessages: string[];
    aiAnalysis: AIAnalysis | null;
    onClose?: () => void; // For mobile modal
}

export const BetSlip: React.FC<BetSlipProps> = ({
    activeMatch,
    userPrediction,
    setUserPrediction,
    playerProps,
    togglePlayerProp,
    isLoading,
    runAnalysis,
    loadingMsgIdx,
    loadingMessages,
    aiAnalysis,
    onClose
}) => {
    if (!activeMatch) {
        return (
            <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 text-center shadow-2xl h-full flex flex-col justify-center">
                <Target size={48} className="mx-auto mb-6 text-slate-700 opacity-30" />
                <h4 className="font-black italic text-slate-100 mb-2 uppercase tracking-tighter">Pick a Target</h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">Select a match to start building your AI-verified slip.</p>
            </div>
        );
    }

    return (
        <div id="walkthrough-betslip" className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] lg:max-h-none overflow-y-auto">
            <div className="bg-green-500 p-4 text-slate-950 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <h4 className="font-black italic uppercase tracking-tighter">BET SLIP</h4>
                <div className="flex items-center gap-3">
                    <Zap size={18} fill="currentColor" />
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full lg:hidden">
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
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

                <div className="relative">
                    <textarea
                        id="walkthrough-hunch"
                        value={userPrediction}
                        onChange={(e) => setUserPrediction(e.target.value.slice(0, 1000))}
                        placeholder="Personal notes/hunch (e.g. key injuries, weather)..."
                        className={`w-full h-24 bg-slate-950 border ${userPrediction.length > 800 ? 'border-orange-500' : 'border-slate-800'} rounded-xl p-3 text-base focus:border-green-500 outline-none placeholder:text-slate-600 transition-all`}
                    />
                    {userPrediction.length > 500 && (
                        <div className={`absolute bottom-2 right-2 text-[8px] font-black ${userPrediction.length > 900 ? 'text-orange-500' : 'text-slate-600'}`}>
                            {userPrediction.length}/1000
                        </div>
                    )}
                </div>


                <button
                    id="walkthrough-analyze"
                    onClick={runAnalysis}
                    disabled={isLoading}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl uppercase italic tracking-tighter shadow-xl transition-all relative overflow-hidden group"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            <span>DECRYPTING DATA...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <span>ANALYZE SELECTIONS</span>
                        </div>
                    )}
                </button>

                {isLoading && (
                    <div className="space-y-3 p-4 bg-slate-950 border border-green-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                                <Activity size={12} className="text-green-500 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-100 uppercase tracking-[0.2em]">Oracle Scanner</span>
                            </div>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
                                <span className="text-[7px] font-black text-green-500 italic uppercase">Sync Active</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {[
                                { label: 'ESPN LIVE FEED', icon: <Database size={10} />, stage: 0 },
                                { label: 'PRIZEPICKS API', icon: <Search size={10} />, stage: 1 },
                                { label: 'SENTIMENT MATRIX', icon: <Target size={10} />, stage: 2 },
                                { label: 'GEMINI REASONING', icon: <Zap size={10} />, stage: 3 },
                                { label: 'VAULT VERIFICATION', icon: <ShieldCheck size={10} />, stage: 4 }
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className={`flex items-center gap-2 transition-colors duration-300 ${loadingMsgIdx >= s.stage ? 'text-green-500' : 'text-slate-600'}`}>
                                        {s.icon}
                                        <span className="text-[8px] font-black uppercase tracking-tighter italic">{s.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {loadingMsgIdx > s.stage ? (
                                            <Check size={8} className="text-green-500" />
                                        ) : loadingMsgIdx === s.stage ? (
                                            <span className="text-[7px] font-bold text-slate-300 animate-pulse uppercase">Scanning...</span>
                                        ) : (
                                            <div className="w-1 h-1 bg-slate-800 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-800">
                            <p className="text-[10px] text-slate-400 font-bold italic text-center animate-pulse">
                                "{loadingMessages[loadingMsgIdx]}"
                            </p>
                        </div>
                    </div>
                )}

                {aiAnalysis && (
                    <div className="pt-6 space-y-4 border-t border-slate-800 animate-in slide-in-from-bottom-2 duration-300 pb-4">
                        <div className="p-4 bg-slate-950 rounded-2xl border-l-4 border-green-500">
                            <p className="text-[9px] font-black text-green-500 uppercase mb-1">Expert Verdict</p>
                            <p className="text-sm font-black text-slate-100 italic leading-tight">{aiAnalysis.prediction}</p>
                        </div>

                        {/* Narrative Signals (Superstitions) */}
                        {aiAnalysis.narrativeSignals && aiAnalysis.narrativeSignals.length > 0 && (
                            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <Zap size={10} className="text-orange-500" fill="currentColor" />
                                    Narrative Signals
                                </p>
                                <div className="space-y-3">
                                    {aiAnalysis.narrativeSignals.map((signal, sIdx) => (
                                        <div key={sIdx} className="flex gap-3">
                                            <div className={`mt-0.5 shrink-0 ${signal.impact === 'positive' ? 'text-green-500' :
                                                signal.impact === 'negative' ? 'text-red-500' :
                                                    'text-slate-500'
                                                }`}>
                                                {signal.impact === 'positive' ? <Zap size={14} fill="currentColor" /> :
                                                    signal.impact === 'negative' ? <AlertCircle size={14} /> :
                                                        <Activity size={14} />}
                                            </div>
                                            <div>
                                                <p className={`text-[10px] font-black uppercase italic ${signal.impact === 'positive' ? 'text-green-500' :
                                                    signal.impact === 'negative' ? 'text-red-500' :
                                                        'text-slate-100'
                                                    }`}>
                                                    {signal.label}
                                                </p>
                                                <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{signal.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                            <p className="text-[10px] text-slate-400 leading-relaxed italic whitespace-pre-wrap">"{aiAnalysis.reasoning}"</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
