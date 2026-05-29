import type { BeardStage, DailyEntry, PromptFuzzState } from '../types/index.js';
import { higherStage } from './stages.js';

/** 로컬 시간 기준 YYYY-MM-DD. */
export function getLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createEmptyDailyEntry(date: string): DailyEntry {
  return { date, tokensAdded: 0, peakStage: 'smooth', shaveCount: 0, stretchCount: 0 };
}

function entryFor(log: Record<string, DailyEntry>, date: string): DailyEntry {
  return log[date] ?? createEmptyDailyEntry(date);
}

/**
 * 오늘 entry에 새 토큰을 누적하고 peakStage를 상승만 갱신.
 * 면도와 무관 — tokensAdded는 그날 자란 총량.
 */
export function updateDailyTokens(
  state: PromptFuzzState,
  newTokens: number,
  currentStage: BeardStage,
  now: Date = new Date(),
): PromptFuzzState {
  if (newTokens <= 0) return state;
  const date = getLocalDateString(now);
  const prev = entryFor(state.dailyLog, date);
  const updated: DailyEntry = {
    ...prev,
    tokensAdded: prev.tokensAdded + newTokens,
    peakStage: higherStage(prev.peakStage, currentStage),
  };
  return { ...state, dailyLog: { ...state.dailyLog, [date]: updated } };
}

export function recordDailyShave(state: PromptFuzzState, now: Date = new Date()): PromptFuzzState {
  const date = getLocalDateString(now);
  const prev = entryFor(state.dailyLog, date);
  const updated: DailyEntry = { ...prev, shaveCount: prev.shaveCount + 1 };
  return { ...state, dailyLog: { ...state.dailyLog, [date]: updated } };
}

export function recordDailyStretch(state: PromptFuzzState, now: Date = new Date()): PromptFuzzState {
  const date = getLocalDateString(now);
  const prev = entryFor(state.dailyLog, date);
  const updated: DailyEntry = { ...prev, stretchCount: prev.stretchCount + 1 };
  return { ...state, dailyLog: { ...state.dailyLog, [date]: updated } };
}

/** retentionDays(기본 90)보다 오래된 entry 제거. */
export function pruneOldEntries(
  dailyLog: Record<string, DailyEntry>,
  retentionDays = 90,
  now: Date = new Date(),
): Record<string, DailyEntry> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = getLocalDateString(cutoff);

  const pruned: Record<string, DailyEntry> = {};
  for (const [date, entry] of Object.entries(dailyLog)) {
    if (date >= cutoffStr) pruned[date] = entry;
  }
  return pruned;
}
