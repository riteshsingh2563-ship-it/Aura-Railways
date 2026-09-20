'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ArrowUpDown,
  Calendar,
  Clock,
  Search,
  Train,
  Sparkles,
  Layers,
  Zap,
  SlidersHorizontal,
  Loader2,
  ChevronRight,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { StationAutocomplete, StationItem } from '@/components/StationAutocomplete';
import { JourneyCard } from '@/components/JourneyCard';
import { JourneyDetailsModal } from '@/components/JourneyDetailsModal';
import { LiveTrainTracker } from '@/components/LiveTrainTracker';
import { StationBoardView } from '@/components/StationBoardView';
import { SavedTripsView } from '@/components/SavedTripsView';
import { ProfileView } from '@/components/ProfileView';
import { AuthModal } from '@/components/AuthModal';
import { NoRouteView } from '@/components/NoRouteView';
import { ErrorView } from '@/components/ErrorView';
import { saveTrip, SavedTrip } from '@/lib/firebase';
import type { JourneyOption } from '@/lib/routing-engine';

export default function HomePage() {
  // Navigation & View Tabs
  const [currentTab, setCurrentTab] = useState<'home' | 'trips' | 'live' | 'profile'>('home');
  const [liveSubTab, setLiveSubTab] = useState<'tracker' | 'board'>('tracker');

  // User & Auth State
  const [user, setUser] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Search Parameters
  const [fromStation, setFromStation] = useState<StationItem | null>({
    code: 'R',
    name: 'Raipur Jn',
    city: 'Raipur',
  });
  const [toStation, setToStation] = useState<StationItem | null>({
    code: 'BSB',
    name: 'Varanasi Jn',
    city: 'Varanasi',
  });
  const [journeyDate, setJourneyDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // default to tomorrow
    return today.toISOString().split('T')[0];
  });
  const [departureTime, setDepartureTime] = useState<string>('');
  const [minBuffer, setMinBuffer] = useState<number>(25);
  const [preference, setPreference] = useState<string>('faster');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search Results State
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    directOptions: JourneyOption[];
    multiLegOptions: JourneyOption[];
    allOptions: JourneyOption[];
  }>({
    directOptions: [],
    multiLegOptions: [],
    allOptions: [],
  });
  const [activeResultFilter, setActiveResultFilter] = useState<'all' | 'direct' | 'multi'>('all');

  // Modals & Details
  const [selectedJourney, setSelectedJourney] = useState<JourneyOption | null>(null);
  const [savedTripIds, setSavedTripIds] = useState<Set<string>>(new Set());

  // Quick Preset Queries
  const PRESET_ROUTES = [
    { from: { code: 'R', name: 'Raipur Jn' }, to: { code: 'BSB', name: 'Varanasi Jn' }, label: 'Raipur → Varanasi (Multi-Leg)' },
    { from: { code: 'R', name: 'Raipur Jn' }, to: { code: 'BSP', name: 'Bilaspur Jn' }, label: 'Raipur → Bilaspur (Direct)' },
    { from: { code: 'MMCT', name: 'Mumbai Central' }, to: { code: 'NDLS', name: 'New Delhi' }, label: 'Mumbai → Delhi' },
    { from: { code: 'HWH', name: 'Howrah Jn' }, to: { code: 'NDLS', name: 'New Delhi' }, label: 'Howrah → Delhi' },
  ];

  // Swap From and To stations
  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  // Perform Journey Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fromStation || !toStation) {
      setSearchError('Please select both Origin and Destination stations.');
      return;
    }
    if (fromStation.code === toStation.code) {
      setSearchError('Origin and destination stations cannot be identical.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setCurrentTab('home');

    try {
      const params = new URLSearchParams({
        from: fromStation.code,
        to: toStation.code,
        date: journeyDate,
        minBuffer: minBuffer.toString(),
        preference,
        live: 'true',
      });
      if (departureTime) {
        params.append('departureTime', departureTime);
      }

      const res = await fetch(`/api/journeys/search?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to search railway journeys.');
      }

      setResults({
        directOptions: json.data.directOptions || [],
        multiLegOptions: json.data.multiLegOptions || [],
        allOptions: json.data.allOptions || [],
      });
    } catch (err: any) {
      setSearchError(err.message || 'Error occurred while contacting railway routing service.');
    } finally {
      setIsSearching(false);
    }
  };

  // Save Trip Handler
  const handleSaveTrip = async (journey: JourneyOption) => {
    const tripRecord: SavedTrip = {
      id: journey.id,
      origin: journey.origin,
      destination: journey.destination,
      journeyDate,
      totalDurationMinutes: journey.totalDurationMinutes,
      transfersCount: journey.transfersCount,
      legs: journey.legs.map((leg) => ({
        trainNumber: leg.trainNumber,
        trainName: leg.trainName,
        from: leg.fromStation.code,
        to: leg.toStation.code,
        departure: leg.fromStation.departureTime,
        arrival: leg.toStation.arrivalTime,
      })),
      savedAt: new Date().toISOString(),
    };

    await saveTrip(user?.uid || null, tripRecord);
    setSavedTripIds((prev) => new Set([...prev, journey.id]));
  };

  // Filtered Results List
  const displayedOptions =
    activeResultFilter === 'direct'
      ? results.directOptions
      : activeResultFilter === 'multi'
      ? results.multiLegOptions
      : results.allOptions;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <Navbar
        currentTab={currentTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSelectTab={(tab: any) => setCurrentTab(tab)}
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 py-4 pb-20 space-y-5">
        {/* ==================== HOME TAB ==================== */}
        {currentTab === 'home' && (
          <>
            {/* Search Planning Card */}
            <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                    <Train className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-base font-extrabold text-white">
                      Plan Railway Journey
                    </h1>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Automatic Direct & Multi-Leg Connections
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                    showAdvanced
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-slate-800/60 text-slate-400 border-white/5 hover:border-white/20'
                  }`}
                  title="Advanced Routing Preferences"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preferences</span>
                </button>
              </div>

              <form onSubmit={handleSearch} className="space-y-3.5">
                {/* From / To with Swap Button */}
                <div className="space-y-2 relative">
                  <StationAutocomplete
                    label="From Station"
                    placeholder="Enter station name or code (e.g. Raipur, R)"
                    value={fromStation}
                    onChange={(stn) => setFromStation(stn)}
                  />

                  {/* Swap Button */}
                  <div className="flex justify-end -my-1.5 pr-3 relative z-10">
                    <button
                      type="button"
                      onClick={handleSwapStations}
                      className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 shadow-md hover:scale-105 active:scale-95 transition-all"
                      title="Swap Origin and Destination"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <StationAutocomplete
                    label="To Station"
                    placeholder="Enter station name or code (e.g. Varanasi, BSB)"
                    value={toStation}
                    onChange={(stn) => setToStation(stn)}
                  />
                </div>

                {/* Date & Departure Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Journey Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        value={journeyDate}
                        onChange={(e) => setJourneyDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Departure Time
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        placeholder="Anytime"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Preferences Panel */}
                {showAdvanced && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 space-y-3 animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-semibold">
                          Minimum Transfer Buffer:
                        </span>
                        <span className="text-cyan-400 font-mono font-bold">
                          {minBuffer} Minutes
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                        {[15, 25, 45, 60].map((buf) => (
                          <button
                            key={buf}
                            type="button"
                            onClick={() => setMinBuffer(buf)}
                            className={`py-1.5 rounded-xl border font-bold transition-all ${
                              minBuffer === buf
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                                : 'bg-slate-800 text-slate-400 border-white/5'
                            }`}
                          >
                            {buf}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Optimize By:
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
                            onClick={() => setPreference(pref.id)}
                            className={`p-2 rounded-xl border text-left font-medium transition-all ${
                              preference === pref.id
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                                : 'bg-slate-800 text-slate-400 border-white/5'
                            }`}
                          >
                            {pref.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Discovering Railway Routes...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Plan Journey</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Route Preset Chips */}
              <div className="pt-4 mt-2 border-t border-white/5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Examples
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {PRESET_ROUTES.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setFromStation(preset.from);
                        setToStation(preset.to);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-slate-300 whitespace-nowrap text-[11px] font-medium transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {searchError && (
              <ErrorView message={searchError} onRetry={() => handleSearch()} />
            )}

            {/* Results Section */}
            {hasSearched && !isSearching && !searchError && (
              <div className="space-y-4">
                {/* Results Header & Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                  <div>
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Journey Options</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                        {results.allOptions.length} Found
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {fromStation?.name} ({fromStation?.code}) → {toStation?.name} ({toStation?.code}) on {journeyDate}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-white/10 text-xs">
                    <button
                      onClick={() => setActiveResultFilter('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                        activeResultFilter === 'all'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({results.allOptions.length})
                    </button>
                    <button
                      onClick={() => setActiveResultFilter('direct')}
                      className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                        activeResultFilter === 'direct'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Direct ({results.directOptions.length})
                    </button>
                    <button
                      onClick={() => setActiveResultFilter('multi')}
                      className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                        activeResultFilter === 'multi'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Multi-Leg ({results.multiLegOptions.length})
                    </button>
                  </div>
                </div>

                {/* Results Card List or No Route State */}
                {displayedOptions.length === 0 ? (
                  <NoRouteView
                    originName={fromStation?.name || 'Origin'}
                    destName={toStation?.name || 'Destination'}
                    date={journeyDate}
                    onModifySearch={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    onExpandBuffer={() => {
                      setMinBuffer(15);
                      handleSearch();
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {displayedOptions.map((journey) => (
                      <JourneyCard
                        key={journey.id}
                        journey={journey}
                        onSelect={(j) => setSelectedJourney(j)}
                        onSave={(j) => handleSaveTrip(j)}
                        isSaved={savedTripIds.has(journey.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ==================== TRIPS TAB ==================== */}
        {currentTab === 'trips' && (
          <div className="space-y-4">
            <div className="px-1">
              <h1 className="text-base font-extrabold text-white">
                Saved Trips & Favorites
              </h1>
              <p className="text-xs text-slate-400">
                Quickly replay searches or track saved railway connections.
              </p>
            </div>
            <SavedTripsView
              user={user}
              onSelectTrip={(orig, dest, d) => {
                setFromStation({ code: orig, name: orig });
                setToStation({ code: dest, name: dest });
                setJourneyDate(d);
                setCurrentTab('home');
                setTimeout(() => handleSearch(), 100);
              }}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          </div>
        )}

        {/* ==================== LIVE TAB ==================== */}
        {currentTab === 'live' && (
          <div className="space-y-4">
            {/* Live Sub-tabs */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-white/10 text-xs">
              <button
                onClick={() => setLiveSubTab('tracker')}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                  liveSubTab === 'tracker'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Train Running Status
              </button>
              <button
                onClick={() => setLiveSubTab('board')}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                  liveSubTab === 'board'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Station Live Board
              </button>
            </div>

            {liveSubTab === 'tracker' ? (
              <LiveTrainTracker />
            ) : (
              <StationBoardView />
            )}
          </div>
        )}

        {/* ==================== PROFILE TAB ==================== */}
        {currentTab === 'profile' && (
          <div className="space-y-4">
            <div className="px-1">
              <h1 className="text-base font-extrabold text-white">
                Account & Preferences
              </h1>
              <p className="text-xs text-slate-400">
                Manage your travel settings and routing engine parameters.
              </p>
            </div>
            <ProfileView
              user={user}
              onOpenAuth={() => setAuthModalOpen(true)}
              onSignOut={() => setUser(null)}
              minBuffer={minBuffer}
              onChangeMinBuffer={(b) => setMinBuffer(b)}
              preference={preference}
              onChangePreference={(p) => setPreference(p)}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab: any) => setCurrentTab(tab)}
        savedTripsCount={savedTripIds.size}
      />

      {/* Modals */}
      <JourneyDetailsModal
        journey={selectedJourney}
        onClose={() => setSelectedJourney(null)}
        onSave={(j) => handleSaveTrip(j)}
        isSaved={selectedJourney ? savedTripIds.has(selectedJourney.id) : false}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
