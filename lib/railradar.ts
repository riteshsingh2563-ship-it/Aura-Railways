/**
 * Aura Railways — RailRadar Secure Server-Side Client
 * 
 * CRITICAL SECURITY:
 * - This file is executed ONLY in the server runtime (Node.js/Next.js server).
 * - Never import this file in client components ('use client').
 * - The RAILRADAR_API_KEY is read strictly from process.env.
 */

const RAILRADAR_BASE_URL = process.env.RAILRADAR_BASE_URL || 'https://api.railradar.in/v1';

function getApiKey(): string {
  const key = process.env.RAILRADAR_API_KEY;
  if (!key) {
    throw new Error('CRITICAL CONFIG ERROR: RAILRADAR_API_KEY is not defined in environment variables.');
  }
  return key;
}

// In-memory TTL cache to minimize RailRadar API consumption
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlSeconds: number): void {
  // Prune cache if it grows too large (> 1000 items)
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// Low-level fetch wrapper with error mapping and timeouts
export async function fetchRailRadar<T>(endpoint: string, options: {
  ttlSeconds?: number;
  timeoutMs?: number;
} = {}): Promise<T> {
  const { ttlSeconds = 0, timeoutMs = 12000 } = options;
  const cacheKey = `rr:${endpoint}`;

  if (ttlSeconds > 0) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  const apiKey = getApiKey();
  const url = `${RAILRADAR_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'AuraRailways/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      throw new Error('RailRadar API authentication failed (401). Check RAILRADAR_API_KEY.');
    }
    if (res.status === 404) {
      throw new Error(`RailRadar resource not found (404) at ${endpoint}.`);
    }
    if (res.status === 429) {
      throw new Error('RailRadar rate limit reached (429). Please retry momentarily.');
    }
    if (res.status >= 500) {
      throw new Error(`RailRadar service error (${res.status}). Provider temporarily unavailable.`);
    }

    const json = await res.json();
    const data = json.data !== undefined ? json.data : json;

    if (ttlSeconds > 0) {
      setCached(cacheKey, data, ttlSeconds);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`RailRadar API request timed out after ${timeoutMs}ms.`);
    }
    throw err;
  }
}

// Domain API methods

export interface StationLookupResult {
  code: string;
  name: string;
  city?: string | null;
  state?: string | null;
  popularity?: number;
  isActive?: boolean;
}

export async function searchStations(query: string): Promise<StationLookupResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  // Cache station searches for 24 hours (86400s)
  const endpoint = `/lookup/search/stations?q=${encodeURIComponent(cleanQ)}`;
  const rawList = await fetchRailRadar<StationLookupResult[]>(endpoint, { ttlSeconds: 86400 });

  if (!Array.isArray(rawList)) return [];

  // Prioritize active stations, filter duplicates by code
  const seen = new Set<string>();
  const normalized: StationLookupResult[] = [];

  for (const stn of rawList) {
    const code = (stn.code || '').toUpperCase().trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    normalized.push({
      code,
      name: (stn.name || code).replace(/ Station$/i, ''),
      city: stn.city || null,
      popularity: stn.popularity ?? 0,
      isActive: stn.isActive ?? true,
    });
  }

  // Sort: active first, then by popularity or exact code match
  normalized.sort((a, b) => {
    if (a.code === cleanQ.toUpperCase()) return -1;
    if (b.code === cleanQ.toUpperCase()) return 1;
    return (b.popularity || 0) - (a.popularity || 0);
  });

  return normalized;
}

export interface BetweenTrainsResponse {
  from: { code: string; name: string };
  to: { code: string; name: string };
  trains: Array<{
    train: {
      number: string;
      name: string;
      type: string;
      runDays: string[];
      runningDaysBitmap?: number;
    };
    from: {
      code: string;
      name: string;
      city?: string;
      departure: string;
      day: number;
      sequence: number;
    };
    to: {
      code: string;
      name: string;
      city?: string;
      arrival: string;
      day: number;
      sequence: number;
    };
    distance: number;
    duration: number; // in minutes
    totalHaltsBetween: number;
  }>;
}

export async function getTrainsBetweenStations(
  fromStation: string,
  toStation: string
): Promise<BetweenTrainsResponse> {
  const from = fromStation.toUpperCase().trim();
  const to = toStation.toUpperCase().trim();

  // Cache direct schedule between stations for 12 hours (43200s)
  const endpoint = `/trains/between/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
  return fetchRailRadar<BetweenTrainsResponse>(endpoint, { ttlSeconds: 43200 });
}

export interface TrainScheduleResponse {
  train: {
    number: string;
    name: string;
    type: string;
    category?: string;
    source: { code: string; name: string };
    destination: { code: string; name: string };
    runDays: string[];
    distance: number;
    duration: number;
    totalHalts: number;
  };
  route: Array<{
    stationCode: string;
    stationName: string;
    arrival: string;
    departure: string;
    day: number;
    distance: number;
    isHalt: boolean;
    platform?: string;
    sequence: number;
  }>;
}

export async function getTrainSchedule(trainNumber: string): Promise<TrainScheduleResponse> {
  const num = trainNumber.trim();
  const endpoint = `/trains/${encodeURIComponent(num)}`;
  // Cache timetable for 12 hours
  return fetchRailRadar<TrainScheduleResponse>(endpoint, { ttlSeconds: 43200 });
}

export interface LiveTrainStatusResponse {
  trainNumber: string;
  trainName: string;
  startDate?: string;
  lastUpdatedAt: string;
  status: string; // 'running', 'departed', 'arrived', etc.
  isLive: boolean;
  trackingMode?: string;
  delayMinutes: number;
  previousHalt?: {
    stationCode: string;
    stationName: string;
    sequence: number;
    distance: number;
  };
  nextHalt?: {
    stationCode: string;
    stationName: string;
    sequence: number;
    distance: number;
  };
  currentLocation?: {
    stationCode: string;
    stationName: string;
    sequence: number;
    status: string;
    isHalt: boolean;
    distanceFromOriginKm: number;
    segmentProgress?: number;
    delayMinutes: number;
  };
}

export async function getLiveTrainStatus(
  trainNumber: string,
  date?: string
): Promise<LiveTrainStatusResponse> {
  const num = trainNumber.trim();
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const endpoint = `/trains/${encodeURIComponent(num)}/live${query}`;
  // Cache live status for max 60 seconds to keep fresh
  return fetchRailRadar<LiveTrainStatusResponse>(endpoint, { ttlSeconds: 60 });
}

export interface StationLiveBoardResponse {
  station: { code: string; name: string };
  window: number;
  count: number;
  trains: Array<{
    train: {
      number: string;
      name: string;
      type: string;
      source: string;
      destination: string;
      runDays: string[];
    };
    stop: {
      sequence: number;
      arrival: string;
      departure: string;
      day: number;
      distance: number;
      isHalt: boolean;
      platform?: string;
    };
    live: {
      type: 'upcoming' | 'arrived' | 'departed' | 'running';
      startDate: string;
      expectedArrivalTime?: string;
      expectedDepartureTime?: string;
      delayMinutes: number;
    };
  }>;
}

export async function getStationLiveBoard(stationCode: string): Promise<StationLiveBoardResponse> {
  const code = stationCode.toUpperCase().trim();
  const endpoint = `/stations/${encodeURIComponent(code)}/live`;
  // Cache live station board for 90 seconds
  return fetchRailRadar<StationLiveBoardResponse>(endpoint, { ttlSeconds: 90 });
}
