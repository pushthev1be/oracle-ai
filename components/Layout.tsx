
import React from 'react';
import { LayoutGrid, TrendingUp, Trophy, ShieldCheck, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user?: UserProfile | null;
  onOpenProfile?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onOpenProfile }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">
            Oracle<span className="text-green-500">Odds</span> AI
          </h1>
        </div>
        
        <nav className="hidden lg:flex items-center gap-8">
          <button className="text-sm font-medium hover:text-green-500 transition-colors flex items-center gap-2">
            <LayoutGrid size={18} /> Lobby
          </button>
          <button className="text-sm font-medium hover:text-green-500 transition-colors flex items-center gap-2">
            <Trophy size={18} /> Jackpots
          </button>
          <button className="text-sm font-medium hover:text-green-500 transition-colors flex items-center gap-2">
            <ShieldCheck size={18} /> VIP Tips
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <button 
              onClick={onOpenProfile}
              className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:border-green-500/50 transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-100 leading-none uppercase italic">{user.username}</p>
                <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest mt-0.5">Verified Oracle</p>
              </div>
              <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-slate-600 bg-slate-900" />
            </button>
          ) : (
            <>
              <button className="px-4 py-2 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors text-sm font-bold">
                Login
              </button>
              <button 
                onClick={onOpenProfile}
                className="px-5 py-2 rounded-full bg-green-500 text-slate-950 font-bold hover:bg-green-400 transition-colors shadow-lg text-sm"
              >
                Join Now
              </button>
            </>
          )}
        </div>
      </header>
      
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 p-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <TrendingUp size={20} />
            <p className="text-sm">© 2024 Oracle Odds AI. Gamble responsibly.</p>
          </div>
          <div className="flex gap-6 text-xs font-medium text-slate-400">
            <a href="#" className="hover:text-green-500">Terms</a>
            <a href="#" className="hover:text-green-500">Privacy</a>
            <a href="#" className="hover:text-green-500">Support</a>
            <a href="#" className="hover:text-green-500">Responsible Gaming</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
