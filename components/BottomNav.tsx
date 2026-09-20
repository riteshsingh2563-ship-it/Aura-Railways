'use client';

import React from 'react';
import { Search, Compass, Radio, User, Bookmark } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  savedTripsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  savedTripsCount = 0,
}) => {
  const tabs = [
    { id: 'home', label: 'Search', icon: Search },
    { id: 'trips', label: 'Trips', icon: Bookmark, badge: savedTripsCount > 0 ? savedTripsCount : null },
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="sticky bottom-0 z-40 w-full px-3 py-2 glass-panel border-t border-white/10 backdrop-blur-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center relative py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-cyan-500 text-black text-[9px] font-bold px-1 rounded-full min-w-3.5 text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium ${isActive ? 'font-semibold text-cyan-300' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
