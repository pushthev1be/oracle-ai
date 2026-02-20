import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Trophy,
  X,
  ArrowRight,
  Zap,
  Lock,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  userName: string;
}

interface Step {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      id: 1,
      title: 'CONSULT THE ORACLE',
      subtitle: `Welcome Interface, ${userName}`,
      description: 'You have entered the Oracle network. Our AI engine consumes live data from ESPN and PrizePicks to find market inefficiencies.',
      icon: <Sparkles className="w-16 h-16 text-green-500" />,
      highlights: [
        'Real-time ESPN data integration',
        'PrizePicks market depth analysis',
        'Expert sports ground truth'
      ]
    },
    {
      id: 2,
      title: 'FLASH INTELLIGENCE',
      subtitle: 'Gemini 2.0 Flash Engine',
      description: 'Run 90-second deep scans on any match. Our AI cross-references injury reports, team form, and social sentiment.',
      icon: <Zap className="w-16 h-16 text-green-500" />,
      highlights: [
        '90-second deep analysis scans',
        'Search-grounded verification',
        'Exact scoreline simulations'
      ]
    },
    {
      id: 3,
      title: 'THE VAULT',
      subtitle: 'Secure Your Intel',
      description: 'Lock in your hunches and track your performance. Every prediction you make is stored in your private, local-first vault.',
      icon: <Lock className="w-16 h-16 text-green-500" />,
      highlights: [
        'Encrypted local persistence',
        'Performance tracking metrics',
        'Global Leaderboard ranking'
      ]
    }
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(
      `oracle_onboarding_completed_${userName}`,
      'true'
    );
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl max-w-xl w-full relative overflow-hidden flex flex-col items-center p-10 text-center border-t-4 border-t-green-500">

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />

        <button
          onClick={completeOnboarding}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="relative z-10 bg-slate-950 p-6 rounded-full border border-slate-800 shadow-xl">
            {step.icon}
          </div>
        </div>

        <div className="space-y-4 mb-10 w-full">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] text-green-500 uppercase mb-2">{step.subtitle}</p>
            <h2 className="text-3xl font-black italic text-slate-100 uppercase tracking-tighter leading-none">{step.title}</h2>
          </div>
          <p className="text-sm font-bold text-slate-400 leading-relaxed italic px-4">
            "{step.description}"
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 w-full mb-10 text-left">
          {step.highlights.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-green-500/50 transition-all">
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              <span className="text-[11px] font-black uppercase italic text-slate-300 group-hover:text-slate-100 transition-colors">{item}</span>
            </div>
          ))}
        </div>

        <div className="w-full space-y-6">
          <div className="flex justify-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 transition-all duration-300 rounded-full ${idx === currentStep ? 'w-10 bg-green-500' : 'w-2 bg-slate-800'}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase italic tracking-tighter hover:bg-green-400 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
          >
            {currentStep === steps.length - 1 ? 'Unlock System' : 'Acknowledge Data'}
            <ArrowRight size={20} />
          </button>

          <button
            onClick={completeOnboarding}
            className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
          >
            Skip Initialization Sequence
          </button>
        </div>
      </div>
    </div>
  );
};

