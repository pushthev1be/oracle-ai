import React, { useState } from 'react';
import {
  ChevronRight,
  Target,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  X,
  Check,
  ArrowRight
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  userName: string;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  color: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userName }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSkipped, setIsSkipped] = useState(false);

  const steps: Step[] = [
    {
      id: 1,
      title: 'Welcome to Oracle Odds AI',
      description: `Hey ${userName}, ready to master sports predictions?`,
      icon: <Sparkles className="w-16 h-16 text-blue-500" />,
      details: [
        'AI-powered betting analysis for Football, Basketball & Tennis',
        'Real-time data from ESPN',
        'Track your predictions and compete with others'
      ],
      color: 'blue'
    },
    {
      id: 2,
      title: 'Get AI Analysis',
      description: 'Select any match to get detailed predictions from Google Gemini AI',
      icon: <Target className="w-16 h-16 text-purple-500" />,
      details: [
        '📊 Predicted scores and likely scorers',
        '📈 Statistical analysis and confidence levels',
        '💡 Strategic betting recommendations',
        '⚡ Instant insights within seconds'
      ],
      color: 'purple'
    },
    {
      id: 3,
      title: 'Player Props Analysis',
      description: 'Analyze specific player performance metrics for guaranteed profit angles',
      icon: <TrendingUp className="w-16 h-16 text-green-500" />,
      details: [
        '🎯 Get AI predictions for specific players',
        '📋 Goals, assists, rebounds, and custom markets',
        '🔍 Line value and edge detection',
        '💰 Find hidden arbitrage opportunities'
      ],
      color: 'green'
    },
    {
      id: 4,
      title: 'Build Your Slip',
      description: 'Combine multiple predictions into one powerful bet slip',
      icon: <Check className="w-16 h-16 text-blue-500" />,
      details: [
        '✅ Add multiple predictions to your slip',
        '📊 View combined odds and potential winnings',
        '💾 Save slips for future reference',
        '📈 Track your history and performance'
      ],
      color: 'blue'
    },
    {
      id: 5,
      title: 'Compete & Leaderboard',
      description: 'Climb the ranks and prove your betting prowess',
      icon: <Trophy className="w-16 h-16 text-amber-500" />,
      details: [
        '🏆 Real-time leaderboard rankings',
        '📊 Track win rate and total profit',
        '🎖️ Earn badges and achievements',
        '👥 Compare performance with top predictors'
      ],
      color: 'amber'
    },
    {
      id: 6,
      title: 'Daily Tips & Community',
      description: 'Get curated daily picks and stay informed with news',
      icon: <Users className="w-16 h-16 text-pink-500" />,
      details: [
        '📰 Daily expert predictions curated for you',
        '🔔 Breaking sports news and updates',
        '💬 Engage with the prediction community',
        '📢 Share your best picks and insights'
      ],
      color: 'pink'
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

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(
      `oracle_onboarding_completed_${userName}`,
      'true'
    );
    onComplete();
  };

  const handleSkip = () => {
    setIsSkipped(true);
    completeOnboarding();
  };

  const colorClasses: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    green: 'from-green-50 to-green-100 border-green-200',
    amber: 'from-amber-50 to-amber-100 border-amber-200',
    pink: 'from-pink-50 to-pink-100 border-pink-200'
  };

  const buttonColorClasses: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    pink: 'bg-pink-600 hover:bg-pink-700'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br ${colorClasses[step.color]} rounded-lg shadow-2xl border-2 max-w-2xl w-full p-8 animate-fadeIn`}>
        {/* Close Button */}
        <div className="flex justify-between items-start mb-6">
          <div />
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 transition"
            title="Skip onboarding"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {step.icon}
        </div>

        {/* Title and Description */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            {step.title}
          </h2>
          <p className="text-gray-600 text-lg">
            {step.description}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-8 bg-white bg-opacity-60 rounded-lg p-6">
          {step.details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`text-${step.color}-600 font-bold flex-shrink-0 mt-1`}>✓</div>
              <p className="text-gray-700">{detail}</p>
            </div>
          ))}
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep
                  ? `w-8 bg-${step.color}-600`
                  : idx < currentStep
                  ? 'w-2 bg-gray-400'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          <div className="text-center text-gray-600 font-medium py-3">
            {currentStep + 1} / {steps.length}
          </div>

          <button
            onClick={handleNext}
            className={`px-6 py-3 rounded-lg ${buttonColorClasses[step.color]} text-white font-medium flex items-center gap-2 hover:shadow-lg transition`}
          >
            {currentStep === steps.length - 1 ? (
              <>
                Get Started <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Next <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Skip Link */}
        {currentStep !== steps.length - 1 && (
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 text-sm transition"
            >
              Skip tour
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
