'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Train,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Navigation,
  Loader2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import type { LiveTrainStatusResponse } from '@/lib/railradar';

interface StationStop {
  sequence: number;
  station: {
    code: string;
    name: string;
    lat?: number;
    lng?: number;
  };
  isHalt: boolean;
  platform?: string;
  arrival: string;
  departure: string;
  departureDay?: number;
  arrivalDay?: number;
  distance: number;
  speedToNextStationKmph?: number;
  coachPosition?: string;
}

interface WhereIsMyTrainModalProps {
  trainNumber: string | null;
  trainName?: string;
  onClose: () => void;
}

export const WhereIsMyTrainModal: React.FC<WhereIsMyTrainModalProps> = ({
  trainNumber,
  trainName: initialName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trainInfo, setTrainInfo] = useState<any | null>(null);
  const [routeStops, setRouteStops] = useState<StationStop[]>([]);
  const [liveData, setLiveData] = useState<LiveTrainStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [haltsOnly, setHaltsOnly] = useState(true);
  const [stationFilterQuery, setStationFilterQuery] = useState('');
  const currentStationRef = useRef<HTMLDivElement>(null);

  const fetchTrainDetails = async (isRefresh = false) => {
    if (!trainNumber) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Parallel fetch timetable & live status
      const [schedRes, liveRes] = await Promise.all([
        fetch(`/api/trains/${encodeURIComponent(trainNumber)}`),
        fetch(`/api/trains/${encodeURIComponent(trainNumber)}/live`),
      ]);

      const schedJson = await schedRes.json();
      const liveJson = await liveRes.json();

      if (schedJson.success && schedJson.data) {
        setTrainInfo(schedJson.data.train || null);
        const rawRoute = schedJson.data.route || [];
        // Normalize route stations
        const normalized = rawRoute.map((item: any) => ({
          sequence: item.sequence,
          station: {
            code: item.station?.code || item.stationCode || 'STN',
            name: item.station?.name || item.stationName || item.stationCode || 'Station',
            lat: item.station?.lat,
            lng: item.station?.lng,
          },
          isHalt: item.isHalt ?? true,
          platform: item.platform || item.stop?.platform || undefined,
          arrival: item.arrival || '--:--',
          departure: item.departure || '--:--',
          arrivalDay: item.arrivalDay || item.day || 1,
          departureDay: item.departureDay || item.day || 1,
          distance: item.distance || 0,
          speedToNextStationKmph: item.speedToNextStationKmph,
          coachPosition: item.coachPosition,
        }));
        setRouteStops(normalized);
      } else {
        throw new Error(schedJson.error || 'Failed to load train route timetable.');
      }

      if (liveJson.success && liveJson.data) {
        setLiveData(liveJson.data);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load complete train route details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (trainNumber) {
      fetchTrainDetails();
    }
  }, [trainNumber]);

  // Auto-scroll to current train position once loaded
  useEffect(() => {
    if (!loading && currentStationRef.current) {
      setTimeout(() => {
        currentStationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 400);
    }
  }, [loading, liveData]);

  if (!trainNumber) return null;

  // Filter stops: halts only vs all
  const filteredStops = routeStops.filter((stop) => {
    if (haltsOnly && !stop.isHalt) return false;
    if (stationFilterQuery.trim()) {
      const q = stationFilterQuery.toLowerCase().trim();
      return (
        stop.station.name.toLowerCase().includes(q) ||
        stop.station.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const delayMinutes = liveData?.delayMinutes || 0;
  const isDelayed = delayMinutes > 0;
  const currentSeq = liveData?.currentLocation?.sequence || -1;
  const currentStationCode = liveData?.currentLocation?.stationCode;

  // Calculate live expected time given scheduled time and delay
  const getExpectedTime = (schedTime: string, delay: number) => {
    if (!schedTime || schedTime === '--:--' || delay <= 0) return schedTime;
    const [h, m] = schedTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return schedTime;
    const total = h * 60 + m + delay;
    const expH = Math.floor((total / 60) % 24);
    const expM = total % 60;
    return `${String(expH).padStart(2, '0')}:${String(expM).padStart(2, '0')}`;
  };

  // Coach array
  const coachList: string[] = (trainInfo?.coachPosition || '')
    .split('-')
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-[92vh] flex flex-col rounded-3xl glass-panel border border-cyan-500/30 shadow-2xl overflow-hidden bg-slate-950">
        
        {/* ================= TOP HEADER BAR ================= */}
        <div className="p-4 border-b border-white/10 bg-slate-900/95 sticky top-0 z-20 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-lg text-cyan-300">
                  {trainNumber}
                </span>
                <span className="font-extrabold text-base text-white truncate">
                  {trainInfo?.name || initialName || 'Express'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wider">
                  {trainInfo?.type || 'Express'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {trainInfo?.source?.name || trainInfo?.source?.code || 'Origin'} →{' '}
                {trainInfo?.destination?.name || trainInfo?.destination?.code || 'Destination'} •{' '}
                {trainInfo?.distance ? `${trainInfo.distance} km` : ''} •{' '}
                {trainInfo?.totalHalts ? `${trainInfo.totalHalts} Halts` : ''}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => fetchTrainDetails(true)}
                disabled={refreshing}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors"
                title="Refresh Live Tracking"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Status Pill / Delay Banner */}
          {liveData && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                isDelayed
                  ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-current block animate-ping"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-current block absolute inset-0"></span>
                </div>
                <div>
                  <span className="font-bold">
                    {liveData.currentLocation
                      ? `Near ${liveData.currentLocation.stationName} (${liveData.currentLocation.stationCode})`
                      : liveData.status.toUpperCase()}
                  </span>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {liveData.nextHalt
                      ? `Next Stop: ${liveData.nextHalt.stationName} (${liveData.nextHalt.stationCode})`
                      : `Status: ${liveData.status}`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-extrabold text-sm block">
                  {isDelayed ? `+${delayMinutes}m Late` : 'On Time'}
                </span>
                <span className="text-[10px] opacity-70">
                  {liveData.lastUpdatedAt
                    ? `Live at ${new Date(liveData.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Real-time GPS'}
                </span>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={stationFilterQuery}
                onChange={(e) => setStationFilterQuery(e.target.value)}
                placeholder="Find station in route..."
                className="w-full pl-8 pr-2 py-1.5 rounded-xl glass-input text-xs font-medium placeholder-slate-500"
              />
            </div>

            <button
              onClick={() => setHaltsOnly(!haltsOnly)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap transition-colors ${
                haltsOnly
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                  : 'bg-slate-800 text-slate-400 border-white/5'
              }`}
            >
              {haltsOnly ? `Halts Only (${routeStops.filter((s) => s.isHalt).length})` : `All Stops (${routeStops.length})`}
            </button>
          </div>
        </div>

        {/* ================= COACH POSITION (IF AVAILABLE) ================= */}
        {coachList.length > 0 && (
          <div className="px-4 py-2 bg-slate-900/60 border-b border-white/5 overflow-x-auto">
            <div className="flex items-center gap-1 text-[10px] font-mono whitespace-nowrap">
              <span className="text-slate-400 mr-1 uppercase text-[9px] font-bold">Coaches:</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-200 font-bold border border-cyan-700">
                🚆 LOCO
              </span>
              {coachList.map((coach: string, i: number) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded border ${
                    coach.startsWith('A') || coach.startsWith('B')
                      ? 'bg-blue-950 text-blue-200 border-blue-800 font-bold'
                      : coach.startsWith('S')
                      ? 'bg-emerald-950 text-emerald-200 border-emerald-800 font-bold'
                      : 'bg-slate-800 text-slate-300 border-white/10'
                  }`}
                >
                  {coach}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ================= ROUTE TIMELINE TRACK ================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-0 relative divide-y divide-white/5">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">
                Loading complete station route & live GPS track...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-300 space-y-2">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
              <p>{error}</p>
            </div>
          ) : filteredStops.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No matching stations found in this route.
            </div>
          ) : (
            filteredStops.map((stop, idx) => {
              const isCurrentStation =
                currentStationCode &&
                stop.station.code.toUpperCase() === currentStationCode.toUpperCase();
              const isPassed = currentSeq > 0 && stop.sequence < currentSeq;
              const isOrigin = idx === 0;
              const isDest = idx === filteredStops.length - 1;

              return (
                <div
                  key={stop.sequence}
                  ref={isCurrentStation ? currentStationRef : null}
                  className={`relative py-3.5 px-2 rounded-2xl transition-all ${
                    isCurrentStation
                      ? 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border-2 border-cyan-400 shadow-xl shadow-cyan-900/30 my-2'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Current Train Pulsing Banner */}
                  {isCurrentStation && (
                    <div className="mb-2 p-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs flex items-center justify-between shadow-md">
                      <div className="flex items-center gap-1.5">
                        <Train className="w-4 h-4 animate-bounce" />
                        <span>TRAIN IS CURRENTLY HERE</span>
                      </div>
                      <span className="font-mono text-[11px] font-black">
                        {liveData?.currentLocation?.status?.toUpperCase() || 'STOPPED'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 text-xs">
                    {/* Left: Distance & Day */}
                    <div className="w-14 shrink-0 text-left space-y-0.5">
                      <span className="font-mono text-[11px] font-bold text-slate-400 block">
                        {stop.distance} km
                      </span>
                      {stop.departureDay && stop.departureDay > 1 && (
                        <span className="inline-block text-[9px] font-bold px-1 rounded bg-slate-800 text-slate-400 border border-white/5">
                          Day {stop.departureDay}
                        </span>
                      )}
                    </div>

                    {/* Middle: Railway Track Dot & Stem */}
                    <div className="relative flex flex-col items-center shrink-0 w-6 pt-1">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                          isCurrentStation
                            ? 'bg-cyan-400 border-white ring-4 ring-cyan-500/40'
                            : isPassed
                            ? 'bg-emerald-500 border-slate-900'
                            : isOrigin || isDest
                            ? 'bg-cyan-400 border-slate-900'
                            : stop.isHalt
                            ? 'bg-slate-700 border-white/60'
                            : 'bg-slate-800 border-slate-600 w-2 h-2'
                        }`}
                      />
                    </div>

                    {/* Center: Station Name & Platform */}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          className={`font-black text-sm ${
                            isCurrentStation
                              ? 'text-cyan-200'
                              : isPassed
                              ? 'text-slate-300'
                              : 'text-white'
                          }`}
                        >
                          {stop.station.name}
                        </span>
                        <span className="font-mono font-bold text-xs text-cyan-400">
                          {stop.station.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        {stop.platform && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-bold border border-white/10">
                            PF {stop.platform}
                          </span>
                        )}
                        {!stop.isHalt && (
                          <span className="text-[10px] text-slate-500 italic">
                            Pass-through (No Commercial Halt)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Arrival / Departure Schedule vs Live */}
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="font-mono font-extrabold text-sm text-white">
                        {isDest ? stop.arrival : stop.departure}
                      </div>

                      {/* Expected Time if Delayed */}
                      {isDelayed && (
                        <div className="font-mono text-[11px] font-bold text-amber-300">
                          Exp:{' '}
                          {getExpectedTime(
                            isDest ? stop.arrival : stop.departure,
                            delayMinutes
                          )}
                        </div>
                      )}

                      {!isOrigin && !isDest && stop.isHalt && stop.arrival !== '--:--' && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Arr: {stop.arrival}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= BOTTOM ACTION BAR ================= */}
        <div className="p-3 border-t border-white/10 bg-slate-900/95 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Passed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-500/50"></span> Train Now
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span> Upcoming
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-md shadow-cyan-600/30"
          >
            Close Tracker
          </button>
        </div>

      </div>
    </div>
  );
};
