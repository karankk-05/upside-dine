const DEFAULT_CROWD_DEMO_MODE = true;

export const CROWD_DEMO_LOOP_MINUTES = 10;
export const CROWD_DEMO_LOOP_MS = CROWD_DEMO_LOOP_MINUTES * 60 * 1000;
export const CROWD_DEMO_REFRESH_MS = 15000;

const SERVICE_WINDOWS = [
  { key: 'breakfast', label: 'Breakfast', start: 7.5, end: 9.5, multiplier: 0.76 },
  { key: 'lunch', label: 'Lunch', start: 12.5, end: 14.5, multiplier: 1 },
  { key: 'dinner', label: 'Dinner', start: 19.5, end: 21.5, multiplier: 0.9 },
];
const SERVICE_SHOULDER_HOURS = 0.5;
const HISTORY_START_HOUR = SERVICE_WINDOWS[0].start - SERVICE_SHOULDER_HOURS;
const HISTORY_END_HOUR =
  SERVICE_WINDOWS[SERVICE_WINDOWS.length - 1].end + SERVICE_SHOULDER_HOURS;

const MESS_PROFILES = [
  { base: 34, amplitude: 16, capacity: 108, phase: 0.02, waitBias: 1, historyBias: -2 },
  { base: 42, amplitude: 18, capacity: 132, phase: 0.21, waitBias: 2, historyBias: 3 },
  { base: 30, amplitude: 15, capacity: 94, phase: 0.39, waitBias: 1, historyBias: -4 },
  { base: 47, amplitude: 17, capacity: 148, phase: 0.58, waitBias: 3, historyBias: 5 },
  { base: 38, amplitude: 16, capacity: 120, phase: 0.77, waitBias: 2, historyBias: 1 },
];

const DAY_BIAS = [4, -3, 5, -2, 6, 2, -1];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getHourFraction = (date) =>
  date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

const toSlotLabel = (hourFraction) => {
  const wholeMinutes = Math.round(hourFraction * 60);
  const hour = Math.floor(wholeMinutes / 60);
  const minute = wholeMinutes % 60;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const isSameLocalDate = (leftDate, rightDate) =>
  leftDate.getFullYear() === rightDate.getFullYear() &&
  leftDate.getMonth() === rightDate.getMonth() &&
  leftDate.getDate() === rightDate.getDate();

const normalizeMessId = (messId) => {
  const numericMessId = Number(messId);
  return Number.isFinite(numericMessId) && numericMessId > 0 ? numericMessId : 1;
};

const hashToUnitInterval = (input) => {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) % 10000) / 10000;
};

const getMessProfile = (messId) => {
  const normalizedMessId = normalizeMessId(messId);
  const baseProfile = MESS_PROFILES[(normalizedMessId - 1) % MESS_PROFILES.length];

  return {
    ...baseProfile,
    base: baseProfile.base + ((normalizedMessId * 3) % 7) - 3,
    amplitude: baseProfile.amplitude + (normalizedMessId % 3),
    capacity: baseProfile.capacity + ((normalizedMessId - 1) % 4) * 6,
    phase: (baseProfile.phase + normalizedMessId * 0.037) % 1,
  };
};

const getLoopProgress = (nowMs = Date.now()) => (nowMs % CROWD_DEMO_LOOP_MS) / CROWD_DEMO_LOOP_MS;

const getDensityLevel = (densityPercentage) => {
  if (densityPercentage >= 70) {
    return 'high';
  }
  if (densityPercentage >= 40) {
    return 'moderate';
  }
  return 'low';
};

const getWindowPeakState = (messId, dayOffset, window) => {
  const normalizedMessId = normalizeMessId(messId);
  const center = (window.start + window.end) / 2;
  const halfWindow = (window.end - window.start) / 2;
  const seed = hashToUnitInterval(`${normalizedMessId}:${dayOffset}:${window.key}`);
  const offset = (seed - 0.5) * halfWindow * 0.9;
  const spreadSeed = hashToUnitInterval(`${normalizedMessId}:${dayOffset}:${window.key}:spread`);
  const spread = 0.55 + spreadSeed * 0.35;

  return {
    peakHour: center + offset,
    spread,
  };
};

const getWindowSignal = (hourFraction, messId, dayOffset, window) => {
  const { peakHour, spread } = getWindowPeakState(messId, dayOffset, window);
  const leftSpan = Math.max(peakHour - window.start, 0.3);
  const rightSpan = Math.max(window.end - peakHour, 0.3);

  if (
    hourFraction < window.start - SERVICE_SHOULDER_HOURS ||
    hourFraction > window.end + SERVICE_SHOULDER_HOURS
  ) {
    return 0;
  }

  if (hourFraction >= window.start && hourFraction <= window.end) {
    const span = hourFraction <= peakHour ? leftSpan : rightSpan;
    const normalizedDistance = Math.min(Math.abs(hourFraction - peakHour) / span, 1);
    const asymmetricCurve = Math.pow(1 - normalizedDistance, spread);
    return 0.26 + asymmetricCurve * 0.74;
  }

  if (hourFraction < window.start) {
    const shoulderProgress =
      (hourFraction - (window.start - SERVICE_SHOULDER_HOURS)) / SERVICE_SHOULDER_HOURS;
    return 0.04 + shoulderProgress * 0.16;
  }

  const shoulderProgress =
    window.end + SERVICE_SHOULDER_HOURS - hourFraction;
  return 0.04 + (shoulderProgress / SERVICE_SHOULDER_HOURS) * 0.16;
};

const getScenarioWave = (loopProgress, phase) => {
  const shiftedProgress = loopProgress + phase;
  const primaryWave = Math.sin(shiftedProgress * Math.PI * 2 - Math.PI / 2);
  const secondaryWave = Math.sin(shiftedProgress * Math.PI * 4 + 0.8) * 0.35;
  return primaryWave * 0.78 + secondaryWave * 0.22;
};

const getServiceActivity = (hourFraction, messId, dayOffset = 0) => {
  return SERVICE_WINDOWS.reduce(
    (bestMatch, window) => {
      const signal = getWindowSignal(hourFraction, messId, dayOffset, window);
      if (signal > bestMatch.signal) {
        return { signal, window };
      }
      return bestMatch;
    },
    { signal: 0, window: null }
  );
};

const isInWindowRange = (hourFraction, window) =>
  hourFraction >= window.start - SERVICE_SHOULDER_HOURS &&
  hourFraction <= window.end + SERVICE_SHOULDER_HOURS;

const isWithinAnyServiceRange = (hourFraction) =>
  SERVICE_WINDOWS.some((window) => isInWindowRange(hourFraction, window));

const isWithinDinnerRange = (hourFraction) => isInWindowRange(hourFraction, SERVICE_WINDOWS[2]);

const getHistoryStepMinutes = (hourFraction, isToday) => {
  if (isToday && isWithinDinnerRange(hourFraction)) {
    return 10;
  }
  if (isWithinAnyServiceRange(hourFraction)) {
    return 15;
  }
  return 30;
};

const createRecordedAt = (baseDate, hourFraction) => {
  const hour = Math.floor(hourFraction);
  const minute = Math.round((hourFraction - hour) * 60);

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    minute,
    0,
    0
  ).toISOString();
};

const buildHistoryTimePoints = (baseDate, currentNow = new Date()) => {
  const todaySelected = isSameLocalDate(baseDate, currentNow);
  const cutoffHour = todaySelected
    ? Math.min(getHourFraction(currentNow), HISTORY_END_HOUR)
    : HISTORY_END_HOUR;

  if (cutoffHour < HISTORY_START_HOUR) {
    return [];
  }

  const timePoints = [];
  let cursor = HISTORY_START_HOUR;

  while (cursor <= cutoffHour + 0.0001) {
    timePoints.push(Number(cursor.toFixed(4)));
    cursor += getHistoryStepMinutes(cursor, todaySelected) / 60;
  }

  const roundedCutoff = Number(cutoffHour.toFixed(4));
  if (timePoints[timePoints.length - 1] !== roundedCutoff) {
    timePoints.push(roundedCutoff);
  }

  return [...new Set(timePoints)];
};

const getScenarioLabel = (loopProgress, serviceActivity) => {
  if (!serviceActivity.window || serviceActivity.signal <= 0) {
    return 'Mess closed';
  }

  if (serviceActivity.signal < 0.2) {
    return `${serviceActivity.window.label} shoulder traffic`;
  }
  if (loopProgress < 0.25) {
    return `${serviceActivity.window.label} queue build-up`;
  }
  if (loopProgress < 0.7) {
    return `${serviceActivity.window.label} peak service`;
  }
  return `${serviceActivity.window.label} dispersal`;
};

const buildLiveSnapshot = (messId, nowMs) => {
  const profile = getMessProfile(messId);
  const now = new Date(nowMs);
  const hourFraction = getHourFraction(now);
  const loopProgress = getLoopProgress(nowMs);
  const scenarioWave = getScenarioWave(loopProgress, profile.phase);
  const microVariation = Math.sin((loopProgress + profile.phase) * Math.PI * 6) * 2;
  const serviceActivity = getServiceActivity(hourFraction, messId, 0);
  const dynamicIntensity = 0.58 + ((scenarioWave + 1) / 2) * 0.42;

  let densityPercentage = 0;
  if (serviceActivity.signal > 0 && serviceActivity.window) {
    const activeWindowLoad =
      26 + profile.base * 0.58 + profile.amplitude * dynamicIntensity + microVariation;
    densityPercentage = clamp(
      Math.round(
        activeWindowLoad * serviceActivity.signal * serviceActivity.window.multiplier
      ),
      0,
      92
    );
  }

  const personCount =
    densityPercentage > 0
      ? Math.max(1, Math.round((profile.capacity * densityPercentage) / 100))
      : 0;
  const estimatedWaitMinutes = clamp(
    densityPercentage <= 0
      ? 0
      : Math.round((densityPercentage - 10) / 6 + profile.waitBias),
    0,
    20
  );

  return {
    density_percentage: densityPercentage,
    density_level: getDensityLevel(densityPercentage),
    person_count: personCount,
    estimated_wait_minutes: estimatedWaitMinutes,
    loop_progress: loopProgress,
    scenario_label: getScenarioLabel(loopProgress, serviceActivity),
  };
};

const gaussian = (hour, center, spread) => {
  const normalizedDistance = (hour - center) / spread;
  return Math.exp(-(normalizedDistance * normalizedDistance) / 2);
};

const parseDateInput = (date) => {
  const [year, month, day] = String(date || '')
    .split('-')
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
};

const getHistoryDensity = (messId, hour, dayOffset) => {
  const profile = getMessProfile(messId);
  const serviceActivity = getServiceActivity(hour, messId, dayOffset);

  if (!serviceActivity.window || serviceActivity.signal <= 0) {
    return 0;
  }

  const { peakHour, spread } = getWindowPeakState(messId, dayOffset, serviceActivity.window);
  const mealRushCurve =
    0.56 +
    0.44 * gaussian(hour, peakHour, spread);
  const hourVariation =
    Math.sin((hour / 24) * Math.PI * 2 + profile.phase * Math.PI * 2 + dayOffset * 0.7) * 4;
  const dayVariation = DAY_BIAS[dayOffset % DAY_BIAS.length];
  const activeWindowLoad =
    24 + profile.base * 0.56 + profile.historyBias + dayVariation + hourVariation;

  return clamp(
    Math.round(
      activeWindowLoad *
        serviceActivity.signal *
        mealRushCurve *
        serviceActivity.window.multiplier
    ),
    0,
    95
  );
};

const formatHour = (hour) => {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const suffix = normalizedHour >= 12 ? 'PM' : 'AM';
  const displayHour = normalizedHour % 12 || 12;
  return `${displayHour}:00 ${suffix}`;
};

export function isCrowdDemoEnabled() {
  if (typeof window === 'undefined') {
    return DEFAULT_CROWD_DEMO_MODE;
  }

  const savedOverride = window.localStorage.getItem('crowd_demo_mode');
  if (savedOverride === 'off') {
    return false;
  }
  if (savedOverride === 'on') {
    return true;
  }

  return DEFAULT_CROWD_DEMO_MODE;
}

export function getDemoLiveCrowdDensity(messId, nowMs = Date.now()) {
  const currentSnapshot = buildLiveSnapshot(messId, nowMs);
  const futureSnapshot = buildLiveSnapshot(messId, nowMs + 45000);
  const densityDelta = futureSnapshot.density_percentage - currentSnapshot.density_percentage;
  const trendDirection =
    densityDelta > 1.5 ? 'up' : densityDelta < -1.5 ? 'down' : 'stable';

  return {
    mess_id: normalizeMessId(messId),
    ...currentSnapshot,
    trend_direction: trendDirection,
    timestamp: new Date(nowMs).toISOString(),
    feed_url: null,
    demo_mode: true,
    source: 'demo',
  };
}

export function getDemoCrowdHistory(messId, date) {
  const normalizedMessId = normalizeMessId(messId);
  const baseDate = parseDateInput(date);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfBaseDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  ).getTime();
  const dayOffset = Math.max(
    0,
    Math.round((startOfToday - startOfBaseDate) / (24 * 60 * 60 * 1000))
  );
  const profile = getMessProfile(normalizedMessId);
  const historyTimePoints = buildHistoryTimePoints(baseDate, today);

  return historyTimePoints.map((timePoint) => {
    const densityPercentage = getHistoryDensity(normalizedMessId, timePoint, dayOffset);
    const estimatedCount =
      densityPercentage > 0
        ? Math.max(1, Math.round((profile.capacity * densityPercentage) / 100))
        : 0;
    const estimatedWaitMinutes = clamp(
      densityPercentage <= 0
        ? 0
        : Math.round((densityPercentage - 12) / 6 + profile.waitBias),
      0,
      22
    );
    const recordedAt = createRecordedAt(baseDate, timePoint);

    return {
      id: Number(`${normalizedMessId}${dayOffset}${Math.round(timePoint * 60)}`),
      mess_id: normalizedMessId,
      density_percentage: densityPercentage,
      estimated_count: estimatedCount,
      density_level: getDensityLevel(densityPercentage),
      estimated_wait_minutes: estimatedWaitMinutes,
      recorded_at: recordedAt,
      demo_mode: true,
      source: 'demo',
    };
  });
}

export function getDemoWeekHistory(messId, referenceDate = new Date()) {
  return Array.from({ length: 7 }, (_, dayOffset) => {
    const day = new Date(referenceDate);
    day.setDate(referenceDate.getDate() - dayOffset);
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
      day.getDate()
    ).padStart(2, '0')}`;
    return getDemoCrowdHistory(messId, dateKey);
  }).flat();
}

export function getDemoCrowdRecommendation(messId) {
  const weekHistory = getDemoWeekHistory(messId);
  const entriesByDay = weekHistory.reduce((dayMap, entry) => {
    const dayKey = entry.recorded_at.slice(0, 10);
    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, []);
    }
    dayMap.get(dayKey).push(entry);
    return dayMap;
  }, new Map());

  const bestTimes = SERVICE_WINDOWS.map((window) => {
    const candidateStarts = [];
    for (let start = window.start; start <= window.end - 1 / 3 + 0.0001; start += 1 / 6) {
      candidateStarts.push(Number(start.toFixed(4)));
    }

    const rankedCandidates = candidateStarts
      .map((slotStart) => {
        const slotEnd = slotStart + 1 / 3;
        let totalDensity = 0;
        let totalPeople = 0;
        let count = 0;

        entriesByDay.forEach((entries) => {
          const slotEntries = entries.filter((entry) => {
            const entryDate = new Date(entry.recorded_at);
            const hourFraction = getHourFraction(entryDate);
            return hourFraction >= slotStart && hourFraction < slotEnd;
          });

          if (!slotEntries.length) {
            return;
          }

          const densityAverage =
            slotEntries.reduce((sum, entry) => sum + entry.density_percentage, 0) /
            slotEntries.length;
          const peopleAverage =
            slotEntries.reduce((sum, entry) => sum + (entry.estimated_count || 0), 0) /
            slotEntries.length;

          totalDensity += densityAverage;
          totalPeople += peopleAverage;
          count += 1;
        });

        if (!count) {
          return null;
        }

        return {
          meal_key: window.key,
          meal_label: window.label,
          start: slotStart,
          avg_density: totalDensity / count,
          avg_people: totalPeople / count,
          time_range: `${toSlotLabel(slotStart)} - ${toSlotLabel(slotEnd)}`,
        };
      })
      .filter(Boolean)
      .sort((left, right) => {
        if (left.avg_density !== right.avg_density) {
          return left.avg_density - right.avg_density;
        }
        return left.avg_people - right.avg_people;
      });

    return rankedCandidates[0] || null;
  }).filter(Boolean);

  const recommendation =
    bestTimes.length === SERVICE_WINDOWS.length
      ? 'Based on the last 7 days, these are the lightest 20-minute slots for each meal.'
      : 'Demo recommendations will appear once enough simulated data is available.';

  return {
    mess_id: normalizeMessId(messId),
    recommendation,
    best_times: bestTimes.map((slot) => ({
      meal_key: slot.meal_key,
      meal_label: slot.meal_label,
      hour: slot.start,
      time_range: slot.time_range,
      avg_people: Math.round(slot.avg_people),
      avg_density: Math.round(slot.avg_density),
    })),
    demo_mode: true,
    source: 'demo',
  };
}
