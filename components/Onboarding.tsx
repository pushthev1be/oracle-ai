import React, { useState, useLayoutEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  Target,
  Wifi,
  LayoutGrid,
  User as UserIcon,
  MessageSquare,
  Activity,
  ChevronRight,
  X,
  Trophy,
  ShieldAlert,
  Search,
  RefreshCw
} from 'lucide-react';
import { trackEvent, AnalyticsEvents } from '../services/analyticsService';

interface OnboardingProps {
  onComplete: () => void;
  userName: string;
}

interface Step {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userName }) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 is the welcome screen
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: Step[] = [
    {
      id: 'profile',
      targetId: 'walkthrough-profile',
      title: 'IDENTITY SECURED',
      description: 'Your profile and private vault are initialized. All your betting history is stored locally and encrypted.',
      icon: <UserIcon className="text-green-500" />
    },
    {
      id: 'categories',
      targetId: 'walkthrough-categories',
      title: 'SECTOR ANALYSIS',
      description: 'Switch between Football, Basketball, and Tennis. each sector has specialized AI models.',
      icon: <LayoutGrid className="text-green-500" />
    },
    {
      id: 'match_selection',
      targetId: 'walkthrough-match-card',
      title: 'TARGET SELECTION',
      description: 'Tap on any match card to open the analysis interface. This initializes the connection for that specific sporting event.',
      icon: <Target className="text-green-500" />
    },
    {
      id: 'hunch',
      targetId: 'walkthrough-hunch',
      title: 'HUMAN INTEL',
      description: 'Input your "hunch" or reasoning here. Your local context directly influences the AI reasoning—it uses your notes to look for specific evidence during the search grounding phase.',
      icon: <MessageSquare className="text-green-500" />
    },
    {
      id: 'analyze',
      targetId: 'walkthrough-analyze',
      title: 'DEEP SCAN SEQUENCING',
      description: 'When you trigger the analysis, the status will show real-time processing. Because the AI is scraping injury reports, social sentiment, and live stats, this deep scan can take up to a minute.',
      icon: <Activity className="text-green-500" />
    },
    {
      id: 'betslip',
      targetId: 'walkthrough-betslip',
      title: 'GEMINI COMMLINK',
      description: 'The final report appears in the Bet Slip. The AI cross-references your hunch with market data to provide a verified verdict.',
      icon: <Zap className="text-green-500" />
    }
  ];

  const updateTargetRect = () => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const el = document.getElementById(steps[currentStep].targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    } else {
      setTargetRect(null);
    }
  };

  useLayoutEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED);
      onComplete();
    }
  };

  const skip = () => {
    trackEvent(AnalyticsEvents.ONBOARDING_SKIPPED, { step_at_skip: currentStep });
    onComplete();
  };

  // Welcome Screen
  if (currentStep === -1) {
    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-500">
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl max-w-xl w-full relative overflow-hidden flex flex-col items-center p-10 text-center border-t-4 border-t-green-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative mb-8 bg-slate-950 p-6 rounded-full border border-slate-800 shadow-xl">
            <Sparkles className="w-16 h-16 text-green-500 animate-pulse" />
          </div>
          <div className="space-y-4 mb-8">
            <p className="text-[10px] font-black tracking-[0.3em] text-green-500 uppercase">SYSTEM INITIALIZED</p>
            <h2 className="text-3xl font-black italic text-slate-100 uppercase tracking-tighter leading-none">Welcome, {userName}</h2>
            <p className="text-sm font-bold text-slate-400 italic">"The Oracle is ready to analyze. Let's walk through the interface modules."</p>
          </div>
          <button onClick={() => setCurrentStep(0)} className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase italic tracking-tighter hover:bg-green-400 transition-all flex items-center justify-center gap-3">
            Begin Walkthrough <ArrowRight size={20} />
          </button>
          <button onClick={skip} className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-slate-300 transition-colors">Skip Initialization</button>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];

  // SVG Mask for Spotlight
  const maskPath = targetRect
    ? `M 0 0 h ${window.innerWidth} v ${window.innerHeight} h -${window.innerWidth} Z M ${targetRect.left - 8} ${targetRect.top - 8} h ${targetRect.width + 16} v ${targetRect.height + 16} h -${targetRect.width + 16} Z`
    : `M 0 0 h ${window.innerWidth} v ${window.innerHeight} h -${window.innerWidth} Z`;

  // Tooltip positioning
  const tooltipStyle: React.CSSProperties = targetRect ? {
    position: 'fixed',
    top: targetRect.bottom + 20 > window.innerHeight - 300 ? Math.max(20, targetRect.top - 220) : targetRect.bottom + 20,
    left: Math.min(Math.max(20, targetRect.left + targetRect.width / 2 - 160), window.innerWidth - 340),
  } : {};

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {/* Dimmed Background with Spotlight */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto cursor-default transition-all duration-500">
        <path
          d={maskPath}
          fillRule="evenodd"
          fill="rgba(2, 6, 23, 0.85)"
          className="transition-all duration-500"
        />
      </svg>

      {/* Tooltip Card */}
      <div
        style={tooltipStyle}
        className="w-[320px] bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-[0_0_50px_rgba(34,197,94,0.15)] pointer-events-auto animate-in zoom-in-95 duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            {step.icon}
          </div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{currentStep + 1} / {steps.length}</div>
        </div>

        <h3 className="text-xl font-black italic text-slate-100 uppercase tracking-tighter mb-2">{step.title}</h3>
        <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6 italic">"{step.description}"</p>

        <div className="flex gap-3">
          <button
            onClick={skip}
            className="flex-1 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            DISMISS
          </button>
          <button
            onClick={handleNext}
            className="flex-[2] py-3 bg-green-500 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-green-400 transition-all flex items-center justify-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'FINALIZE' : 'NEXT'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
