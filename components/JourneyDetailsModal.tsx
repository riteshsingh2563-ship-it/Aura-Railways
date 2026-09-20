'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Train,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Radio,
  Bookmark,
} from 'lucide-react';
import type { JourneyOption } from '@/lib/routing-engine';

interface JourneyDetailsModalProps {
  journey: JourneyOption | null;
  onClose: () => void;
  onSave?: (journey: JourneyOption) => void;
  onTrackTrain?: (trainNumber: string, trainName?: string) => void;
  isSaved?: boolean;
}

export const JourneyDetailsModal: React.FC<JourneyDetailsModalProps> = ({
  journey,
  onClose,
  onSave,
  onTrackTrain,
  isSaved = false,
}) => {
  if (!journey) return null;

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h === 0 ? `${m}m` : `${h}h ${m}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl glass-panel border border-white/15 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">
                Journey Route Details
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {journey.type === 'direct' ? 'Direct Train' : `${journey.transfersCount} Transfer`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {journey.origin.name} → {journey.destination.name} • Total {formatMinutes(journey.totalDurationMinutes)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Route Legs */}
        <div className="p-4 overflow-y-auto space-y-6">
          {journey.legs.map((leg, index) => {
            const transfer = journey.transfers[index];
            return (
              <div key={leg.trainNumber + index} className="space-y-3">
                {/* Leg Header Card */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Train className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-sm text-slate-100">
                        Leg {index + 1}: {leg.trainNumber} {leg.trainName}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {leg.trainType}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {formatMinutes(leg.durationMinutes)}
                    </span>
                    <span>•</span>
                    <span>{leg.distanceKm} km</span>
                    <span>•</span>
                    <span>{leg.totalHalts} intermediate halts</span>
                  </div>

                  {onTrackTrain && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onTrackTrain(leg.trainNumber, leg.trainName);
                      }}
                      className="w-full mt-2 py-1.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Train className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Where is my Train? (All Halts & Live Track)</span>
                    </button>
                  )}

                  {/* Live Status if attached */}
                  {leg.liveStatus && (
                    <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>Status: {leg.liveStatus.status}</span>
                      </div>
                      <span className="font-bold text-amber-300">
                        {leg.liveStatus.delayMinutes > 0
                          ? `Delay: ${leg.liveStatus.delayMinutes} min`
                          : 'On Time'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Timeline Stop Points */}
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-cyan-400 before:to-blue-500">
                  {/* Departure Stop */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-900"></div>
                    <div>
                      <span className="text-sm font-black text-white font-mono">
                        {leg.fromStation.departureTime}
                      </span>
                      <p className="text-xs font-bold text-slate-200">
                        {leg.fromStation.name} ({leg.fromStation.code})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Departure Date: {leg.fromStation.departureDate}
                      </p>
                    </div>
                  </div>

                  {/* Arrival Stop */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-slate-900"></div>
                    <div>
                      <span className="text-sm font-black text-white font-mono">
                        {leg.toStation.arrivalTime}
                      </span>
                      <p className="text-xs font-bold text-slate-200">
                        {leg.toStation.name} ({leg.toStation.code})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Arrival Date: {leg.toStation.arrivalDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transfer Station Connection Notice (if interchange follows) */}
                {transfer && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>TRANSFER WINDOW AT {transfer.stationName}</span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          transfer.status === 'at_risk'
                            ? 'bg-red-950 text-red-300 border border-red-500'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {formatMinutes(transfer.transferGapMinutes)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Scheduled Arrival: <strong className="text-white">{transfer.scheduledArrival}</strong> • Next Departure: <strong className="text-white">{transfer.scheduledDeparture}</strong>
                    </p>

                    {transfer.riskExplanation && (
                      <div className="p-2 rounded bg-amber-950/60 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{transfer.riskExplanation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Aura Safety Window: <strong className="text-slate-200">25m buffer enforced</strong>
          </div>
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={() => onSave(journey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isSaved
                    ? 'bg-cyan-500 text-black border-cyan-400'
                    : 'bg-slate-800 text-slate-200 border-white/10 hover:bg-slate-700'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>{isSaved ? 'Saved' : 'Save Trip'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
