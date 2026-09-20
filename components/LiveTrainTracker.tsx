'use client';

import React, { useState } from 'react';
import {
  Train,
  Search,
  Radio,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import type { LiveTrainStatusResponse } from '@/lib/railradar';

export const LiveTrainTracker: React.FC = () => {
  const [trainNumber, setTrainNumber] = useState('12833');
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<LiveTrainStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNum = trainNumber.trim();
    if (!cleanNum) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/trains/${encodeURIComponent(cleanNum)}/live`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch live train status.');
      }
      setLiveData(json.data);
    } catch (err: any) {
      setError(err.message || 'Live tracking currently unavailable for this train.');
      setLiveData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={fetchLiveStatus} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Train className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={trainNumber}
            onChange={(e) => setTrainNumber(e.target.value)}
            placeholder="Enter Train Number (e.g. 12833, 12951)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Track</span>
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Status Result */}
      {liveData && (
        <div className="rounded-2xl glass-panel p-4 border border-white/10 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white">
                  {liveData.trainNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {liveData.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {liveData.trainName}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  liveData.delayMinutes > 15
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : liveData.delayMinutes > 0
                    ? 'bg-yellow-950/80 text-yellow-300 border-yellow-500/30'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {liveData.delayMinutes > 0
                  ? `Delayed ${liveData.delayMinutes}m`
                  : 'Running on Time'}
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Updated: {new Date(liveData.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Current / Next Halt Info */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Previous Halt
              </span>
              <p className="font-bold text-slate-200 truncate">
                {liveData.previousHalt?.stationName || 'Starting Station'}
              </p>
              <p className="text-[11px] text-cyan-400 font-mono">
                {liveData.previousHalt?.stationCode || ''}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Next Halt
              </span>
              <p className="font-bold text-slate-200 truncate">
                {liveData.nextHalt?.stationName || 'Destination'}
              </p>
              <p className="text-[11px] text-cyan-400 font-mono">
                {liveData.nextHalt?.stationCode || ''}
              </p>
            </div>
          </div>

          {/* Current Location Highlight */}
          {liveData.currentLocation && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold text-slate-200">
                    Near {liveData.currentLocation.stationName}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Status: {liveData.currentLocation.status} • {liveData.currentLocation.distanceFromOriginKm} km travelled
                  </p>
                </div>
              </div>
              <div className="text-right font-mono text-[11px] text-cyan-300">
                Live GPS
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
