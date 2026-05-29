import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  createEmptyDailyEntry,
  updateDailyTokens,
  recordDailyShave,
  recordDailyStretch,
  pruneOldEntries,
} from '../src/state/dailyLog.js';
import type { PromptFuzzState } from '../src/types/index.js';

function baseState(o: Partial<PromptFuzzState> = {}): PromptFuzzState {
  return {
    version: '1.0',
    installedAt: '2026-05-28T00:00:00Z',
    cumulativeTokens: 0,
    lastJsonlOffset: {},
    currentStage: 'smooth',
    shaveHistory: [],
    stretchCardsShown: [],
    onboardingShaveDone: true,
    thresholdProfile: 'medium',
    dailyLog: {},
    statusViewCount: 0,
    quietHours: null,
    ...o,
  };
}

const day = new Date('2026-05-28T10:00:00');

describe('getLocalDateString', () => {
  it('YYYY-MM-DD 로컬 형식', () => {
    expect(getLocalDateString(new Date('2026-01-05T09:00:00'))).toBe('2026-01-05');
  });
});

describe('createEmptyDailyEntry', () => {
  it('0으로 초기화된 entry', () => {
    const e = createEmptyDailyEntry('2026-05-28');
    expect(e).toEqual({
      date: '2026-05-28',
      tokensAdded: 0,
      peakStage: 'smooth',
      shaveCount: 0,
      stretchCount: 0,
    });
  });
});

describe('updateDailyTokens', () => {
  it('tokensAdded 누적', () => {
    let s = baseState();
    s = updateDailyTokens(s, 1000, 'stubble', day);
    s = updateDailyTokens(s, 500, 'stubble', day);
    expect(s.dailyLog['2026-05-28']!.tokensAdded).toBe(1500);
  });

  it('peakStage는 상승만 (하락 무시)', () => {
    let s = baseState();
    s = updateDailyTokens(s, 1000, 'rugged', day);
    s = updateDailyTokens(s, 1000, 'stubble', day); // 더 낮은 단계
    expect(s.dailyLog['2026-05-28']!.peakStage).toBe('rugged');
  });

  it('newTokens가 0 이하면 state 무변경', () => {
    const s = baseState();
    const r = updateDailyTokens(s, 0, 'stubble', day);
    expect(r).toBe(s);
    expect(Object.keys(r.dailyLog)).toHaveLength(0);
  });
});

describe('recordDailyShave / recordDailyStretch', () => {
  it('shaveCount +1', () => {
    let s = baseState();
    s = recordDailyShave(s, day);
    s = recordDailyShave(s, day);
    expect(s.dailyLog['2026-05-28']!.shaveCount).toBe(2);
  });

  it('stretchCount +1', () => {
    let s = baseState();
    s = recordDailyStretch(s, day);
    expect(s.dailyLog['2026-05-28']!.stretchCount).toBe(1);
  });
});

describe('pruneOldEntries', () => {
  it('90일 초과 entry 제거', () => {
    const now = new Date('2026-05-28T00:00:00');
    const log = {
      '2026-05-28': createEmptyDailyEntry('2026-05-28'), // 오늘
      '2026-03-01': createEmptyDailyEntry('2026-03-01'), // 88일 전 → 유지
      '2026-01-01': createEmptyDailyEntry('2026-01-01'), // 147일 전 → 제거
    };
    const pruned = pruneOldEntries(log, 90, now);
    expect(pruned['2026-05-28']).toBeDefined();
    expect(pruned['2026-03-01']).toBeDefined();
    expect(pruned['2026-01-01']).toBeUndefined();
  });

  it('빈 로그 → 빈 결과', () => {
    expect(pruneOldEntries({}, 90, day)).toEqual({});
  });
});
