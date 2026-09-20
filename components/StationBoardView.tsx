'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Search,
  Train,
  Clock,
  Loader2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import type { StationLiveBoardResponse } from '@/lib/railradar';

interface StationBoardViewProps {
  onOpenWhereIsMyTrain?: (trainNumber: string, trainName?: string) => void;
}

export const StationBoardView: React.FC<StationBoardViewProps> = ({
  onOpenWhereIsMyTrain,
}) => {
  const [stationCode, setStationCode] = useState('R');
  const [filterType, setFilterType] = useState<'all' | 'arrivals' | 'departures'>('all');
  const [loading, setLoading] = useState(false);
  const [boardData, setBoardData] = useState<StationLiveBoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = async (codeToFetch?: string) => {
    const code = (codeToFetch || stationCode).trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stations/${encodeURIComponent(code)}/live`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch live station board.');
      }
      setBoardData(json.data);
    } catch (err: any) {
      setError(err.message || 'Live station board currently unavailable.');
      setBoardData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard('R');
  }, []);

  const trains = boardData?.trains || [];

  return (
    <div className="space-y-4">
      {/* Station Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchBoard();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Radio className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={stationCode}
            onChange={(e) => setStationCode(e.target.value.toUpperCase())}
            placeholder="Station Code (e.g. R, BSP, NDLS, HWH)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm font-bold uppercase tracking-wider"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Board</span>
        </button>
      </form>

      {/* Quick Hub Station Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['R', 'BSP', 'NGP', 'KTE', 'NDLS', 'HWH'].map((code) => (
          <button
            key={code}
            onClick={() => {
              setStationCode(code);
              fetchBoard(code);
            }}
            className={`px-2.5 py-1 rounded-lg border font-mono font-bold transition-colors ${
              stationCode === code
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                : 'bg-slate-900/60 text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Board Display */}
      {boardData && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-extrabold text-white">
                {boardData.station?.name || stationCode} ({boardData.station?.code || stationCode})
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Live Arrivals & Departures • Next {boardData.window || 4} Hours
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-white/10">
              {trains.length} Trains
            </span>
          </div>

          {trains.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-2xl border border-white/10 text-slate-400 text-xs">
              No trains scheduled in the next time window.
            </div>
          ) : (
            <div className="space-y-2.5">
              {trains.map((item, idx) => {
                const isDelayed = item.live?.delayMinutes > 0;
                return (
                  <div
                    key={item.train.number + idx}
                    onClick={() => onOpenWhereIsMyTrain && onOpenWhereIsMyTrain(item.train.number, item.train.name)}
                    className={`p-3 rounded-xl glass-panel border border-white/10 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 text-xs ${
                      onOpenWhereIsMyTrain ? 'cursor-pointer hover:bg-slate-800/40' : ''
                    }`}
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-cyan-300">
                          {item.train.number}
                        </span>
                        <span className="font-bold text-slate-100 truncate">
                          {item.train.name}
                        </span>
                        {onOpenWhereIsMyTrain && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 flex items-center gap-0.5">
                            <Train className="w-2.5 h-2.5" /> Track
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.train.source} → {item.train.destination}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="flex items-center justify-end gap-1.5 font-mono">
                        <span className="font-extrabold text-white text-sm">
                          {item.stop?.departure || item.stop?.arrival || '--:--'}
                        </span>
                        {item.stop?.platform && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-white/10">
                            PF {item.stop.platform}
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isDelayed
                            ? 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                            : 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
                        }`}
                      >
                        {isDelayed ? `+${item.live.delayMinutes}m` : 'On Time'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
