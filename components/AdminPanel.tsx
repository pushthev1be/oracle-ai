
import React, { useState, useEffect } from 'react';
import { Users, Trash2, Shield, Calendar, Search, X, UserCheck, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface AdminPanelProps {
    onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [identities, setIdentities] = useState<Record<string, UserProfile>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const loadIdentities = () => {
        const reg = localStorage.getItem('oracle_global_registry');
        if (reg) {
            setIdentities(JSON.parse(reg));
        }
    };

    useEffect(() => {
        loadIdentities();
    }, []);

    const deleteIdentity = (username: string) => {
        if (confirm(`ARE YOU SURE? This will permanently delete the identity "${username}" and all associated local data.`)) {
            const newIdentities = { ...identities };
            delete newIdentities[username.toLowerCase()];
            localStorage.setItem('oracle_global_registry', JSON.stringify(newIdentities));

            // Also clean up onboarding status
            localStorage.removeItem(`oracle_onboarding_completed_${username}`);

            setIdentities(newIdentities);
        }
    };

    const filteredUsers = (Object.values(identities) as UserProfile[]).filter((u: UserProfile) =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-[3rem] shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden relative border-t-4 border-t-red-500">

                {/* Background Aura */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                            <ShieldAlert size={24} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-[0.3em] text-red-500 uppercase">Privileged Access</p>
                            <h2 className="text-3xl font-black italic text-slate-100 uppercase tracking-tighter">Identity Terminal</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Stats & Search */}
                <div className="p-8 pb-4 flex flex-col md:flex-row gap-6 items-center border-b border-slate-800 shrink-0">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Query Identity Database..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:border-red-500 transition-all outline-none text-slate-100"
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center min-w-[120px]">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Identities</p>
                            <p className="text-xl font-black italic text-slate-100">{Object.keys(identities).length}</p>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center min-w-[120px]">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">System Status</p>
                            <p className="text-xl font-black italic text-green-500">OPTIMAL</p>
                        </div>
                    </div>
                </div>

                {/* Identity List */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {filteredUsers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <Users size={64} className="mb-4" />
                            <p className="font-black italic uppercase tracking-widest">No Identities Match Query</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredUsers.map((user: UserProfile) => (
                                <div key={user.username} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex items-center justify-between group hover:border-red-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <img src={user.avatar} className="w-12 h-12 rounded-xl border border-slate-800" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-slate-100 italic uppercase leading-none">{user.username}</h4>
                                                {user.username.toLowerCase() === 'admin' && <UserCheck size={12} className="text-blue-500" />}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 opacity-40">
                                                <Calendar size={10} />
                                                <span className="text-[9px] font-bold">Joined: {new Date(user.joinedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteIdentity(user.username)}
                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-950/50 border-t border-slate-800 text-center shrink-0">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                        Oracle Encryption Layer Active • Local Identity System Management
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}} />
        </div>
    );
};
