import React, { useState } from 'react';
import { X, Zap, Loader2, CheckCircle2, AlertCircle, ShoppingCart, Trash2 } from 'lucide-react';
import { Match, AIAnalysis } from '../types';
import { getAIAnalysis } from '../services/geminiService';
import { trackEvent, AnalyticsEvents } from '../services/analyticsService';

interface QuickSlipProps {
    matches: Match[];
    onRemove: (id: string) => void;
    onClose: () => void;
    onClear: () => void;
    onSaveAnalyses: (results: Record<string, AIAnalysis>) => void;
}

export const QuickSlip: React.FC<QuickSlipProps> = ({ matches, onRemove, onClose, onClear, onSaveAnalyses }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyses, setAnalyses] = useState<Record<string, AIAnalysis>>({});
    const [isPremium, setIsPremium] = useState(false); // Simulated state for paid feature

    const handleAnalyzeAll = async () => {
        setIsAnalyzing(true);
        trackEvent(AnalyticsEvents.QUICKSLIP_BATCH_ANALYSIS, { match_count: matches.length });
        const newAnalyses: Record<string, AIAnalysis> = {};

        try {
            // Process matches sequentially with a delay to avoid rate limits (429)
            for (const match of matches) {
                // If we already have a result, skip (prevents double-requests)
                if (analyses[match.id] && analyses[match.id].prediction !== "Oracle Hub Connection Issue") continue;

                try {
                    const result = await getAIAnalysis(match, "Provide a quick high-confidence betting stat/pick for this match.", []);
                    newAnalyses[match.id] = result;
                    // Update state incrementally so user sees progress
                    setAnalyses(prev => ({ ...prev, [match.id]: result }));
                } catch (matchError) {
                    console.error(`Analysis failed for match ${match.id}:`, matchError);
                    // Result will be the error object returned by geminiService catch block if not handled here
                }

                // Increase delay to 8s to stay under tight API quotas (especially for batch processing with multiple keys)
                const jitter = Math.floor(Math.random() * 2000);
                await new Promise(resolve => setTimeout(resolve, 8000 + jitter));
            }
            onSaveAnalyses(newAnalyses);
            trackEvent(AnalyticsEvents.QUICKSLIP_BATCH_ANALYSIS_SUCCESS, { match_count: matches.length });
        } catch (error) {
            console.error("QuickSlip Analysis Failed:", error);
            trackEvent(AnalyticsEvents.QUICKSLIP_BATCH_ANALYSIS_FAILURE, { match_count: matches.length, error: error.message });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (matches.length === 0) {
        return (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                <div className="bg-white text-slate-950 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl border-4 border-black border-double">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                    <h2 className="font-black italic uppercase tracking-tighter text-2xl mb-2">Slip Empty</h2>
                    <p className="text-xs font-bold text-slate-500 mb-6">Add up to 7 games from the lobby to build your QuickSlip receipt.</p>
                    <button onClick={onClose} className="w-full py-4 bg-black text-white font-black rounded-xl uppercase italic">Return to Lobby</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto">
            <div className="bg-[#f8f9fa] text-slate-950 rounded-[2rem] shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col border-4 border-black m-auto">

                {/* Header Style (Betting Slip look) */}
                <div className="bg-white border-b-4 border-black p-6 text-center">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10" /> {/* Spacer */}
                        <div className="border-4 border-black px-4 py-1">
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic">QUICKSLIP</h1>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={onClear} className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 border border-red-500/20 px-2 py-1 rounded-md bg-red-50">
                                <Trash2 size={12} /> CLEAR ALL
                            </button>
                            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors ml-auto">
                                <X size={24} className="text-black" />
                            </button>
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Official Oracle Receipt • High Intensity Analysis</p>
                </div>

                {/* Match List */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar-light">
                    {matches.map((match, idx) => (
                        <div key={match.id} className="relative group border-b-2 border-slate-200 pb-6 last:border-b-0">
                            <button
                                onClick={() => onRemove(match.id)}
                                className="absolute -top-1 -right-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-200 z-10"
                                title="Remove from slip"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>

                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[8px] font-black bg-black text-white px-2 py-0.5 rounded italic uppercase">EVENT 00{idx + 1}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{match.competition}</span>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <div className="text-left flex-1">
                                    <p className="text-sm font-black uppercase italic leading-none">{match.homeTeam.name}</p>
                                    <span className="text-[9px] font-bold text-slate-400">HOME</span>
                                </div>
                                <div className="px-4 text-[10px] font-black italic text-slate-300">VS</div>
                                <div className="text-right flex-1">
                                    <p className="text-sm font-black uppercase italic leading-none">{match.awayTeam.name}</p>
                                    <span className="text-[9px] font-bold text-slate-400">AWAY</span>
                                </div>
                            </div>

                            {/* Recommendation Area */}
                            <div className={`mt-2 p-3 rounded-xl border-2 transition-all ${analyses[match.id] ? 'bg-white border-slate-200' : 'bg-slate-50 border-dashed border-slate-300'}`}>
                                {analyses[match.id] ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Oracle QuickPicks</p>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[8px] font-bold text-green-600 uppercase">Verified</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {analyses[match.id].quickPicks && analyses[match.id].quickPicks!.length > 0 ? (
                                                analyses[match.id].quickPicks!.map((pick, pIdx) => (
                                                    <div key={pIdx} className="flex flex-col gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[7px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                                                                    {pick.category}
                                                                </span>
                                                                <span className="text-[9px] font-black text-slate-800 uppercase italic">
                                                                    {pick.market}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[8px] font-black text-slate-400">{pick.confidence}%</span>
                                                                <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-green-500 rounded-full"
                                                                        style={{ width: `${pick.confidence}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] font-black text-green-600 uppercase italic pl-2 border-l-2 border-green-500/30">
                                                            {pick.selection}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[10px] font-black text-green-600 uppercase italic">
                                                        {analyses[match.id].suggestedPlay}
                                                    </p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase italic">General Recommendation</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Narrative Signals (Superstitions) */}
                                        {analyses[match.id].narrativeSignals && analyses[match.id].narrativeSignals!.length > 0 && (
                                            <div className="pt-2 border-t border-slate-100">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                    <Zap size={8} fill="currentColor" /> Narrative Signals
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {analyses[match.id].narrativeSignals!.map((signal, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className={`text-[8px] font-black border-2 px-2 py-0.5 rounded-full uppercase italic flex items-center gap-1 ${signal.impact === 'positive' ? 'bg-green-50 border-green-200 text-green-600' :
                                                                signal.impact === 'negative' ? 'bg-red-50 border-red-200 text-red-600' :
                                                                    'bg-slate-50 border-slate-200 text-slate-500'
                                                                }`}
                                                            title={signal.description}
                                                        >
                                                            {signal.impact === 'positive' && '⚡'}
                                                            {signal.impact === 'negative' && '⚠️'}
                                                            {signal.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[9px] font-bold text-slate-400 italic text-center uppercase">Awaiting Deep Scan Intelligence...</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer / Barcode Area */}
                <div className="bg-white border-t-4 border-black p-6 space-y-4">
                    <div className="flex justify-between items-end border-b-2 border-dotted border-slate-300 pb-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Selections</p>
                            <p className="text-2xl font-black italic leading-none">{matches.length} / 7</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Analysis Level</p>
                            <p className="text-xl font-black italic text-green-600 leading-none">ULTRA-FAST</p>
                        </div>
                    </div>

                    <button
                        onClick={handleAnalyzeAll}
                        disabled={isAnalyzing}
                        className="w-full py-5 bg-black text-white font-black rounded-2xl uppercase italic tracking-tighter hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl disabled:bg-slate-400"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                RUNNING BATCH SCAN...
                            </>
                        ) : (
                            <>
                                <Zap size={20} fill="currentColor" />
                                ANALYZE ENTIRE SLIP
                            </>
                        )}
                    </button>

                    {/* Barcode Visual */}
                    <div className="pt-2">
                        <div className="flex justify-center items-end h-8 gap-[1px]">
                            {Array.from({ length: 40 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-black transition-all"
                                    style={{
                                        width: `${Math.random() * 3 + 1}px`,
                                        height: `${40 + Math.random() * 60}%`,
                                        opacity: Math.random() > 0.1 ? 1 : 0.2
                                    }}
                                />
                            ))}
                        </div>
                        <p className="text-center text-[7px] font-black mt-2 tracking-[0.5em] text-slate-400 uppercase">
                            ORACLE-ID-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal Styles Injection */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar-light::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}} />
        </div>
    );
};
