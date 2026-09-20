'use client';

import React from 'react';
import {
  User,
  Shield,
  Sliders,
  LogOut,
  Sparkles,
  Info,
  Layers,
  Clock,
} from 'lucide-react';
import Image from 'next/image';

interface ProfileViewProps {
  user: any | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  minBuffer: number;
  onChangeMinBuffer: (val: number) => void;
  preference: string;
  onChangePreference: (pref: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onOpenAuth,
  onSignOut,
  minBuffer,
  onChangeMinBuffer,
  preference,
  onChangePreference,
}) => {
  return (
    <div className="space-y-4">
      {/* Account Profile Card */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
            {user ? (
              user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {user ? user.displayName || 'Aura Passenger' : 'Guest Passenger'}
            </h3>
            <p className="text-xs text-slate-400">
              {user ? user.email : 'Local Guest Mode (Search & Route Planning Active)'}
            </p>
          </div>
        </div>

        {!user ? (
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-slate-300 space-y-2">
            <p>
              You can search all trains, live status, and calculate multi-leg journeys freely without logging in.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
            >
              Sign In / Create Account
            </button>
          </div>
        ) : (
          <button
            onClick={onSignOut}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-red-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Engine & Transfer Preferences */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Routing Engine Parameters
          </h4>
        </div>

        {/* Minimum Transfer Buffer Selector */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Minimum Safe Transfer Buffer:</span>
            <span className="font-bold text-cyan-400 font-mono">{minBuffer} Minutes</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {[15, 25, 45, 60].map((buf) => (
              <button
                key={buf}
                type="button"
                onClick={() => onChangeMinBuffer(buf)}
                className={`py-2 rounded-xl border font-bold transition-all ${
                  minBuffer === buf
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                {buf}m
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Aura automatically rejects any interchange connections with less than {minBuffer} minutes buffer time to prevent missed transfers.
          </p>
        </div>

        {/* Default Preference Priority */}
        <div className="space-y-1.5 pt-3 border-t border-white/5">
          <label className="block text-xs font-medium text-slate-300">
            Optimization Priority:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'faster', label: 'Faster Total Journey' },
              { id: 'fewer-transfers', label: 'Fewer Transfers' },
              { id: 'less-waiting', label: 'Less Station Waiting' },
              { id: 'early-arrival', label: 'Earliest Arrival' },
            ].map((pref) => (
              <button
                key={pref.id}
                type="button"
                onClick={() => onChangePreference(pref.id)}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  preference === pref.id
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500'
                    : 'bg-slate-800/80 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                {pref.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* App Architecture & Data Privacy Notice */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Security & API Protection</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          RailRadar API credentials are protected server-side with zero exposure to client bundles. User data is partitioned by UID in Firestore Security Rules.
        </p>
      </div>
    </div>
  );
};
