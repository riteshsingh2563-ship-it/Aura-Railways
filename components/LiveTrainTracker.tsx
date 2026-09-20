'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import type { LiveTrainStatusResponse, TrainLookupResult } from '@/lib/railradar';

export const LiveTrainTracker: React.FC = () => {
  const [trainQuery, setTrainQuery] = useState('12833');
  const [selectedTrainNumber, setSelectedTrainNumber] = useState('12833');
  const [suggestions, setSuggestions] = useState<TrainLookupResult[]>([]);
  const [isSearchingTrains, setIsSearchingTrains] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<LiveTrainStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search for train names and numbers
  useEffect(() => {
    if (!showDropdown || trainQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingTrains(true);
      try {
        const res = await fetch(`/api/trains/search?q=${encodeURIComponent(trainQuery.trim())}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSuggestions(json.data);
        }
      } catch (err) {
        console.error('Train search error:', err);
      } finally {
        setIsSearchingTrains(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [trainQuery, showDropdown]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLiveStatus = async (trainNumToFetch?: string) => {
    const num = (trainNumToFetch || selectedTrainNumber || trainQuery).trim();
    if (!num) return;

    // If query is pure letters and not resolved to digits yet, pick first suggestion if available
    let resolvedNum = num;
    if (!/^\d+$/.test(num) && suggestions.length > 0) {
      resolvedNum = suggestions[0].number;
      setSelectedTrainNumber(resolvedNum);
      setTrainQuery(`${suggestions[0].name} (${suggestions[0].number})`);
    }

    setLoading(true);
    setError(null);
    setShowDropdown(false);

    try {
      const res = await fetch(`/api/trains/${encodeURIComponent(resolvedNum)}/live`);
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

  const handleSelectSuggestion = (train: TrainLookupResult) => {
    setSelectedTrainNumber(train.number);
    setTrainQuery(`${train.name} (${train.number})`);
    setShowDropdown(false);
    fetchLiveStatus(train.number);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar with Train Name Autocomplete */}
      <div className="relative" ref={dropdownRef}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLiveStatus();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Train className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trainQuery}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setTrainQuery(e.target.value);
                setShowDropdown(true);
                // If user typed exact digits
                if (/^\d{4,5}$/.test(e.target.value.trim())) {
                  setSelectedTrainNumber(e.target.value.trim());
                }
              }}
              placeholder="Type Train Name or Number (e.g. Rajdhani, Vande, 12833)"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl glass-input text-sm font-medium"
            />
            {isSearchingTrains && (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
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

        {/* Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl glass-panel border border-cyan-500/30 shadow-2xl divide-y divide-white/5">
            {suggestions.map((t) => (
              <button
                key={t.number}
                type="button"
                onClick={() => handleSelectSuggestion(t)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-cyan-950/50 flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-cyan-300 text-xs px-1.5 py-0.5 rounded bg-slate-800 border border-white/10">
                      {t.number}
                    </span>
                    <span className="font-bold text-slate-100 text-xs group-hover:text-cyan-200 truncate">
                      {t.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {t.sourceName || t.source} → {t.destName || t.dest}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                  {t.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Example Train Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'Rajdhani (12951)', num: '12951' },
          { label: 'Vande Bharat (22416)', num: '22416' },
          { label: 'Gitanjali (12860)', num: '12860' },
          { label: 'Howrah SF (12833)', num: '12833' },
        ].map((item) => (
          <button
            key={item.num}
            type="button"
            onClick={() => {
              setTrainQuery(item.label);
              setSelectedTrainNumber(item.num);
              fetchLiveStatus(item.num);
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-slate-300 whitespace-nowrap text-[11px] font-medium transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Status Result */}
      {liveData && (
        <div className="rounded-2xl glass-panel p-4 border border-white/10 space-y-4 animate-in fade-in duration-200">
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
