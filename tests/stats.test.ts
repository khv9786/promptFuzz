import { describe, it, expect } from 'vitest';
import { computeStats } from '../src/state/stats.js';
import { getLocalDateString } from '../src/state/dailyLog.js';
import type { DailyEntry, PromptFuzzState, ShaveRecord } from '../src/types/index.js';

const NOW = new Date('2026-05-28T12:00:00');

function ds(daysAgo: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return getLocalDateString(d);
}

function entry(o: Partial<DailyEntry> & { date: string }): DailyEntry {
  return { tokensAdded: 0, peakStage: 'smooth', shaveCount: 0, stretchCount: 0, ...o };
}

function baseState(o: Partial<PromptFuzzState> = {}): PromptFuzzState {
  return {
    version: '1.0',
    installedAt: '2026-05-01T00:00:00Z',
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

describe('computeStats', () => {
  it('빈 dailyLog → 0 집계, 안전', () => {
    const s = computeStats(baseState(), 90, NOW);
    expect(s.activeDays).toBe(0);
    expect(s.totalTokens).toBe(0);
    expect(s.dailyAverage).toBe(0); // 0으로 나누기 방어
    expect(s.peakDay).toBeNull();
    expect(s.totalShaves).toBe(0);
    expect(s.avgShaveIntervalDays).toBeNull();
    expect(s.completionRate).toBeNull();
    expect(s.mostSeenCard).toBeNull();
  });

  it('정상 데이터 집계', () => {
    const dailyLog: Record<string, DailyEntry> = {
      [ds(1)]: entry({ date: ds(1), tokensAdded: 100_000, shaveCount: 1, stretchCount: 1, peakStage: 'bushy' }),
      [ds(2)]: entry({ date: ds(2), tokensAdded: 300_000, shaveCount: 1, stretchCount: 0, peakStage: 'rugged' }),
    };
    const shaveHistory: ShaveRecord[] = [
      { at: '2026-05-26T10:00:00Z', tokensAtShave: 100_000 },
      { at: '2026-05-27T10:00:00Z', tokensAtShave: 1_600_000 },
    ];
    const s = computeStats(
      baseState({ dailyLog, shaveHistory, stretchCardsShown: ['wrist', 'wrist', 'eye'] }),
      90,
      NOW,
    );
    expect(s.activeDays).toBe(2);
    expect(s.totalTokens).toBe(400_000);
    expect(s.dailyAverage).toBe(200_000);
    expect(s.peakDay).toEqual({ date: ds(2), tokens: 300_000 });
    expect(s.totalShaves).toBe(2);
    expect(s.totalStretches).toBe(1);
    expect(s.completionRate).toBe(50); // 1/2
    // 가장 무거운 면도: 1.6M → medium 기준 rugged
    expect(s.heaviestShave?.tokensAtShave).toBe(1_600_000);
    expect(s.heaviestShave?.stage).toBe('rugged');
    // 가장 자주 본 카드: wrist (2회)
    expect(s.mostSeenCard).toEqual({ id: 'wrist', count: 2 });
  });

  it('면도 0회 → 면도 관련 null', () => {
    const dailyLog = { [ds(1)]: entry({ date: ds(1), tokensAdded: 50_000 }) };
    const s = computeStats(baseState({ dailyLog }), 90, NOW);
    expect(s.totalShaves).toBe(0);
    expect(s.avgShaveIntervalDays).toBeNull();
    expect(s.heaviestShave).toBeNull();
    expect(s.completionRate).toBeNull();
  });

  it('추세: 14일 미만이면 null', () => {
    const dailyLog = { [ds(1)]: entry({ date: ds(1), tokensAdded: 50_000, shaveCount: 1 }) };
    const s = computeStats(baseState({ dailyLog }), 90, NOW);
    expect(s.tokenTrend).toBeNull();
    expect(s.shaveTrend).toBeNull();
  });

  it('추세: 최근 7일 > 이전 7일 → up', () => {
    const dailyLog: Record<string, DailyEntry> = {};
    for (let i = 0; i < 7; i++) dailyLog[ds(i)] = entry({ date: ds(i), tokensAdded: 200_000, shaveCount: 2 });
    for (let i = 7; i < 14; i++) dailyLog[ds(i)] = entry({ date: ds(i), tokensAdded: 50_000, shaveCount: 1 });
    const s = computeStats(baseState({ dailyLog }), 90, NOW);
    expect(s.tokenTrend).toBe('up');
    expect(s.shaveTrend).toBe('up');
  });
});
