/**
 * Aura Railways — Firebase & Auth Client Layer
 * 
 * Supports:
 * - Guest mode (zero barrier to search)
 * - Firebase Auth (Google Sign-In & Email/Password)
 * - Firestore data operations for users/{uid}/*
 * - Automatic localStorage sync fallback for local/offline dev
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'aura-railways.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'aura-railways',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'aura-railways.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Safe client-side initialization
if (typeof window !== 'undefined') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization note (using local storage fallback if needed):', err);
  }
}

export { auth, db };

// Data types
export interface SavedTrip {
  id: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  journeyDate: string;
  totalDurationMinutes: number;
  transfersCount: number;
  legs: Array<{
    trainNumber: string;
    trainName: string;
    from: string;
    to: string;
    departure: string;
    arrival: string;
  }>;
  savedAt: string;
}

export interface FavoriteItem {
  id: string;
  type: 'station' | 'train';
  code: string;
  name: string;
  detail?: string;
  savedAt: string;
}

export interface JourneyAlert {
  id: string;
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  date: string;
  alertType: 'delay' | 'platform' | 'status';
  createdAt: string;
}

// Local storage keys for guest/offline resilience
const LS_TRIPS_KEY = 'aura_saved_trips';
const LS_FAVORITES_KEY = 'aura_favorites';
const LS_ALERTS_KEY = 'aura_alerts';

function getLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

// User-scoped saved trips
export async function saveTrip(userId: string | null, trip: SavedTrip): Promise<void> {
  // Always update local cache
  const existing = getLocal<SavedTrip>(LS_TRIPS_KEY).filter((t) => t.id !== trip.id);
  setLocal(LS_TRIPS_KEY, [trip, ...existing]);

  // If signed into Firestore, sync to users/{uid}/savedTrips
  if (userId && db) {
    try {
      const tripRef = doc(db, 'users', userId, 'savedTrips', trip.id);
      await setDoc(tripRef, trip);
    } catch (err) {
      console.warn('Firestore saveTrip notice (cached locally):', err);
    }
  }
}

export async function getSavedTrips(userId: string | null): Promise<SavedTrip[]> {
  if (userId && db) {
    try {
      const tripsRef = collection(db, 'users', userId, 'savedTrips');
      const q = query(tripsRef, orderBy('savedAt', 'desc'));
      const snap = await getDocs(q);
      const trips: SavedTrip[] = [];
      snap.forEach((docSnap) => trips.push(docSnap.data() as SavedTrip));
      if (trips.length > 0) return trips;
    } catch (err) {
      console.warn('Firestore getSavedTrips notice (falling back to local):', err);
    }
  }
  return getLocal<SavedTrip>(LS_TRIPS_KEY);
}

export async function removeSavedTrip(userId: string | null, tripId: string): Promise<void> {
  const updated = getLocal<SavedTrip>(LS_TRIPS_KEY).filter((t) => t.id !== tripId);
  setLocal(LS_TRIPS_KEY, updated);

  if (userId && db) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'savedTrips', tripId));
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }
  }
}

// Favorites
export async function toggleFavorite(userId: string | null, item: FavoriteItem): Promise<boolean> {
  const list = getLocal<FavoriteItem>(LS_FAVORITES_KEY);
  const exists = list.some((f) => f.id === item.id);
  let updated: FavoriteItem[];

  if (exists) {
    updated = list.filter((f) => f.id !== item.id);
    if (userId && db) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'favorites', item.id));
      } catch {}
    }
  } else {
    updated = [item, ...list];
    if (userId && db) {
      try {
        await setDoc(doc(db, 'users', userId, 'favorites', item.id), item);
      } catch {}
    }
  }

  setLocal(LS_FAVORITES_KEY, updated);
  return !exists;
}

export async function getFavorites(userId: string | null): Promise<FavoriteItem[]> {
  if (userId && db) {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'favorites'));
      const items: FavoriteItem[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as FavoriteItem));
      if (items.length > 0) return items;
    } catch {}
  }
  return getLocal<FavoriteItem>(LS_FAVORITES_KEY);
}

// Alerts
export async function saveAlert(userId: string | null, alert: JourneyAlert): Promise<void> {
  const existing = getLocal<JourneyAlert>(LS_ALERTS_KEY).filter((a) => a.id !== alert.id);
  setLocal(LS_ALERTS_KEY, [alert, ...existing]);

  if (userId && db) {
    try {
      await setDoc(doc(db, 'users', userId, 'alerts', alert.id), alert);
    } catch {}
  }
}

export async function getAlerts(userId: string | null): Promise<JourneyAlert[]> {
  if (userId && db) {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'alerts'));
      const alerts: JourneyAlert[] = [];
      snap.forEach((docSnap) => alerts.push(docSnap.data() as JourneyAlert));
      if (alerts.length > 0) return alerts;
    } catch {}
  }
  return getLocal<JourneyAlert>(LS_ALERTS_KEY);
}

export async function removeAlert(userId: string | null, alertId: string): Promise<void> {
  const updated = getLocal<JourneyAlert>(LS_ALERTS_KEY).filter((a) => a.id !== alertId);
  setLocal(LS_ALERTS_KEY, updated);

  if (userId && db) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'alerts', alertId));
    } catch {}
  }
}
