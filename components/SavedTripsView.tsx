'use client';

import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Trash2,
  Calendar,
  Clock,
  ArrowRight,
  Train,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import {
  getSavedTrips,
  removeSavedTrip,
  getFavorites,
  getAlerts,
  SavedTrip,
  FavoriteItem,
  JourneyAlert,
} from '@/lib/firebase';

interface SavedTripsViewProps {
  user: any | null;
  onSelectTrip: (originCode: string, destCode: string, date: string) => void;
  onOpenAuth: () => void;
}

export const SavedTripsView: React.FC<SavedTripsViewProps> = ({
  user,
  onSelectTrip,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'trips' | 'favorites' | 'alerts'>('trips');
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [alerts, setAlerts] = useState<JourneyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [savedT, favs, alrts] = await Promise.all([
        getSavedTrips(user?.uid || null),
        getFavorites(user?.uid || null),
        getAlerts(user?.uid || null),
      ]);
      setTrips(savedT);
      setFavorites(favs);
      setAlerts(alrts);
    } catch (e) {
      console.warn('Failed to load user records:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    await removeSavedTrip(user?.uid || null, id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-white/5 text-xs">
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'trips'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Saved Journeys ({trips.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'favorites'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Favorites ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'alerts'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Alerts ({alerts.length})
        </button>
      </div>

      {!user && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-xs flex items-center justify-between">
          <span className="text-slate-300">
            Currently in guest storage mode. Sign in to sync across devices.
          </span>
          <button
            onClick={onOpenAuth}
            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
          >
            Sync Account
          </button>
        </div>
      )}

      {/* Trips List */}
      {activeTab === 'trips' && (
        <div className="space-y-3">
          {trips.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-2xl border border-white/10 text-slate-400 text-xs space-y-2">
              <Bookmark className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-semibold text-slate-300">No saved journeys yet.</p>
              <p className="text-[11px]">
                Search for any journey and click the bookmark icon to save it here for fast repeat planning.
              </p>
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-cyan-500/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">
                        {trip.origin.name} ({trip.origin.code})
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-black text-sm text-white">
                        {trip.destination.name} ({trip.destination.code})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Journey Date: {trip.journeyDate} • {trip.transfersCount === 0 ? 'Direct Train' : `${trip.transfersCount} Transfer`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Saved on {new Date(trip.savedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onSelectTrip(trip.origin.code, trip.destination.code, trip.journeyDate)}
                    className="px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold hover:bg-cyan-900 transition-colors"
                  >
                    Plan Again
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Favorites List */}
      {activeTab === 'favorites' && (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-2xl border border-white/10 text-slate-400 text-xs">
              No favorite stations or trains saved yet.
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                className="p-3 rounded-xl glass-panel border border-white/10 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Train className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="font-bold text-slate-200">{fav.name}</p>
                    <p className="text-[11px] text-slate-400">{fav.code}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5 uppercase">
                  {fav.type}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Alerts List */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-2xl border border-white/10 text-slate-400 text-xs space-y-1">
              <Bell className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-semibold text-slate-300">No active alerts.</p>
              <p className="text-[11px]">
                Create alerts to be notified about live train delays and connection risks.
              </p>
            </div>
          ) : (
            alerts.map((alrt) => (
              <div
                key={alrt.id}
                className="p-3.5 rounded-xl glass-panel border border-white/10 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Train {alrt.trainNumber} ({alrt.trainName})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] uppercase font-bold">
                    {alrt.alertType} Alert
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {alrt.fromStation} → {alrt.toStation} on {alrt.date}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
