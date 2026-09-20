'use client';

import React from 'react';
import Image from 'next/image';
import { User as UserIcon, Shield, Radio } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  user: any | null;
  onOpenAuth: () => void;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  user,
  onOpenAuth,
  onSelectTab,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full px-4 py-3 glass-panel border-b border-white/10 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Brand Mark & Title */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/20 shadow-md group-hover:border-cyan-400 transition-colors">
            <Image
              src="/brand/aura_logo.png"
              alt="Aura Railways"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-base bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                AURA
              </span>
              <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-800/60">
                RAILWAYS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
              Multi-Leg Journey Engine
            </p>
          </div>
        </button>

        {/* Live Network Pill & Account Button */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            RailRadar Live
          </div>

          <button
            onClick={() => {
              if (user) {
                onSelectTab('profile');
              } else {
                onOpenAuth();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs text-slate-200 transition-colors"
          >
            <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[80px] truncate font-medium">
              {user ? (user.displayName || user.email?.split('@')[0] || 'Account') : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
