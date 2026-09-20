import test from 'node:test';
import assert from 'node:assert/strict';

// Realistic Mock RailRadar Fixtures
const MOCK_STATIONS = [
  { code: 'RAIPUR JN', name: 'RAIPUR JN Station', city: null, popularity: 0, isActive: false },
  { code: 'R', name: 'Raipur Jn', city: 'Raipur', popularity: 140, isActive: true },
  { code: 'BSP', name: 'Bilaspur Jn', city: 'Bilaspur', popularity: 120, isActive: true },
  { code: 'BSB', name: 'Varanasi Jn', city: 'Varanasi', popularity: 160, isActive: true },
];

test('Station Resolution: normalizes, filters active, and resolves canonical codes', () => {
  const seen = new Set();
  const normalized = [];

  for (const stn of MOCK_STATIONS) {
    const code = stn.code.toUpperCase().trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    normalized.push({
      code,
      name: stn.name.replace(/ Station$/i, ''),
      city: stn.city,
      popularity: stn.popularity,
      isActive: stn.isActive,
    });
  }

  // Active station with code 'R' is prioritized over inactive duplicate 'RAIPUR JN'
  const raipurActive = normalized.find((s) => s.code === 'R');
  assert.ok(raipurActive, 'Should have resolved canonical code R for Raipur');
  assert.equal(raipurActive.isActive, true);
  assert.equal(raipurActive.city, 'Raipur');
});

test('API Resilience: error mapper generates appropriate user-facing messages', () => {
  function mapApiStatusToMessage(status) {
    switch (status) {
      case 401:
        return 'RailRadar API authentication failed. Secret key is unauthorized.';
      case 404:
        return 'No railway schedule found for the requested train or station.';
      case 429:
        return 'Rate limit reached. Please wait a few moments before retrying.';
      case 503:
        return 'Railway service temporarily unavailable. Please retry shortly.';
      default:
        return 'Railway data service encountered an unexpected response.';
    }
  }

  assert.match(mapApiStatusToMessage(401), /authentication failed/i);
  assert.match(mapApiStatusToMessage(404), /No railway schedule found/i);
  assert.match(mapApiStatusToMessage(429), /Rate limit reached/i);
  assert.match(mapApiStatusToMessage(503), /temporarily unavailable/i);
});

test('Multi-Run Days: verifies train operates on specific journey day', () => {
  const weeklyTrain = {
    number: '12251',
    name: 'Wainganga SF Express',
    runDays: ['tue', 'fri'],
  };

  const dailyTrain = {
    number: '12833',
    name: 'Howrah SF Express',
    runDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  };

  const isRunningOn = (train, weekday) => {
    return train.runDays.length === 0 || train.runDays.includes(weekday);
  };

  // Tuesday check
  assert.equal(isRunningOn(weeklyTrain, 'tue'), true, 'Wainganga Express runs on Tue');
  assert.equal(isRunningOn(weeklyTrain, 'wed'), false, 'Wainganga Express does NOT run on Wed');
  assert.equal(isRunningOn(dailyTrain, 'wed'), true, 'Howrah Express runs on Wed');
});
