'use client';

import React from 'react';
import {
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Share2,
  ChevronRight,
  Train,
  Zap,
} from 'lucide-react';
import type { JourneyOption } from '@/lib/routing-engine';

interface JourneyCardProps {
  journey: JourneyOption;
  onSelect: (journey: JourneyOption) => void;
  onSave?: (journey: JourneyOption) => void;
  isSaved?: boolean;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({
  journey,
  onSelect,
  onSave,
  isSaved = false,
}) => {
  const isDirect = journey.type === 'direct';
  const leg1 = journey.legs[0];
  const leg2 = journey.legs[1];
  const transfer = journey.transfers[0];

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const isAtRisk = journey.badges.includes('Connection at Risk') || transfer?.status === 'at_risk';

  return (
    <div
      className={`relative rounded-2xl glass-panel glass-panel-hover p-4 border transition-all duration-200 ${
        isAtRisk
          ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/10 via-slate-900/80 to-slate-900/80'
          : 'border-white/10 hover:border-cyan-500/30'
      }`}
    >
      {/* Top Header: Badges & Duration */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center flex-wrap gap-1.5">
          {isDirect ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Direct Train
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              {journey.transfersCount} Interchange
            </span>
          )}

          {journey.badges.map((badge) => {
            if (badge === 'Direct' || badge === '1 Transfer') return null;
            if (badge === 'Connection at Risk') {
              return (
                <span
                  key={badge}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse"
                >
                  <AlertTriangle className="w-3 h-3" /> {badge}
                </span>
              );
            }
            if (badge === 'Fastest Journey') {
              return (
                <span
                  key={badge}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-950/80 text-sky-300 border border-sky-500/30 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-sky-400" /> Fastest
                </span>
              );
            }
            return (
              <span
                key={badge}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5"
              >
                {badge}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-slate-300 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formatMinutes(journey.totalDurationMinutes)}</span>
        </div>
      </div>

      {/* Main Timeline Card */}
      {isDirect ? (
        /* Direct Train Presentation */
        <div className="space-y-3 py-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                {leg1.fromStation.departureTime}
              </span>
              <p className="text-xs font-bold text-slate-300 mt-0.5">
                {journey.origin.name} ({journey.origin.code})
              </p>
            </div>

            <div className="flex-1 px-4 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-medium">
                {leg1.totalHalts > 0 ? `${leg1.totalHalts} halts` : 'Non-stop'}
              </span>
              <div className="w-full flex items-center gap-1 my-1">
                <div className="w-2 h-2 rounded-full border border-cyan-400 bg-slate-900 shrink-0"></div>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 -ml-1 shrink-0" />
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                #{leg1.trainNumber}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xl font-black tracking-tight text-white">
                {leg1.toStation.arrivalTime}
              </span>
              <p className="text-xs font-bold text-slate-300 mt-0.5">
                {journey.destination.name} ({journey.destination.code})
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
            <span className="truncate pr-2 font-medium">
              {leg1.trainName} ({leg1.trainType})
            </span>
            {leg1.fromStation.departureDate !== leg1.toStation.arrivalDate && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium whitespace-nowrap">
                +1 Day
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Multi-Leg Timeline Presentation */
        <div className="py-2 space-y-3">
          {/* Leg 1 Summary */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-white">
                  {leg1.fromStation.departureTime}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {journey.origin.name} ({journey.origin.code})
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Train 1: <span className="text-slate-200 font-semibold">{leg1.trainNumber} {leg1.trainName}</span> ({formatMinutes(leg1.durationMinutes)})
              </p>
            </div>
          </div>

          {/* Interchange Connecting Node */}
          <div className="relative pl-6 py-2 border-l-2 border-dashed border-cyan-500/40 ml-3 space-y-1.5">
            <div className="absolute -left-[7px] top-3 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900"></div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                  Interchange at {transfer.stationName} ({transfer.stationCode})
                </p>
                <p className="text-[11px] text-slate-400">
                  Arr: {transfer.scheduledArrival} → Dep: {transfer.scheduledDeparture}
                </p>
              </div>

              {/* Transfer Buffer Badge */}
              <div
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  transfer.status === 'at_risk' || transfer.status === 'missed'
                    ? 'bg-red-950/90 text-red-300 border-red-500/40'
                    : transfer.status === 'tight'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {formatMinutes(transfer.transferGapMinutes)} Transfer
              </div>
            </div>

            {/* Risk Explanation if delay eroded buffer */}
            {transfer.riskExplanation && (
              <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[11px] text-amber-200 font-medium flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{transfer.riskExplanation}</span>
              </div>
            )}
          </div>

          {/* Leg 2 Summary & Destination */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 font-medium">
                Train 2: <span className="text-slate-200 font-semibold">{leg2.trainNumber} {leg2.trainName}</span> ({formatMinutes(leg2.durationMinutes)})
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-white">
                  {leg2.toStation.arrivalTime}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {journey.destination.name} ({journey.destination.code})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Action Footer */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
        <button
          onClick={() => onSelect(journey)}
          className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>View Detailed Route</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {onSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(journey);
            }}
            className={`p-2 rounded-xl border transition-colors ${
              isSaved
                ? 'bg-cyan-500 text-black border-cyan-400'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-white/10'
            }`}
            title={isSaved ? 'Trip Saved' : 'Save Trip'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
};
