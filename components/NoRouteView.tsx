'use client';

import React from 'react';
import { Compass, RefreshCw, SlidersHorizontal, ArrowLeft } from 'lucide-react';

interface NoRouteViewProps {
  originName: string;
  destName: string;
  date: string;
  onModifySearch: () => void;
  onExpandBuffer: () => void;
}

export const NoRouteView: React.FC<NoRouteViewProps> = ({
  originName,
  destName,
  date,
  onModifySearch,
  onExpandBuffer,
}) => {
  return (
    <div className="p-6 rounded-2xl glass-panel border border-white/10 text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
        <Compass className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-white">
          No Feasible Connection Found
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          No direct trains or safe multi-leg connections match your parameters between <strong className="text-slate-200">{originName}</strong> and <strong className="text-slate-200">{destName}</strong> on {date}.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 text-left text-xs text-slate-300 space-y-1.5">
        <p className="font-bold text-cyan-300">Suggestions to find journeys:</p>
        <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
          <li>Check trains on an adjacent day (many weekly trains run on specific days).</li>
          <li>Reduce or increase the transfer buffer window.</li>
          <li>Try searching via a major nearby hub station (e.g. BSP, NGP, KTE, DDU).</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <button
          onClick={onExpandBuffer}
          className="w-full py-2.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold hover:bg-cyan-900 transition-colors flex items-center justify-center gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Adjust Transfer Buffer</span>
        </button>
        <button
          onClick={onModifySearch}
          className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-white/10 text-xs font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Stations / Date</span>
        </button>
      </div>
    </div>
  );
};
