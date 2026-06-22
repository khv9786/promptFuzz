import { describe, it, expect } from 'vitest';
import { computeWeeklySummary, computeTrend, weeklyNarrative } from '../src/state/weeklySummary.js';
import type { DailyEntry } from '../src/types/index.js';
import { getLocalDateString } from '../src/state/dailyLog.js';

const NOW = new Date('2026-05-28T12:00:00');

function ds(daysAgo: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return getLocalDateString(d);
}

function entry(o: Partial<DailyEntry> & { date: string }): DailyEntry {
  return { tokensAdded: 0, peakStage: 'smooth', shaveCount: 0, stretchCount: 0, ...o };
}

describe('computeWeeklySummary', () => {
  it('빈 dailyLog → null', () => {
    expect(computeWeeklySummary({}, NOW)).toBeNull();
  });

  it('최근 7일 활동 0 → null', () => {
    const log = { [ds(30)]: entry({ date: ds(30), tokensAdded: 100_000 }) };
    expect(computeWeeklySummary(log, NOW)).toBeNull();
  });

  it('7일치 있지만 14일 미만 → trend null, 평균/면도만', () => {
    const log: Record<string, DailyEntry> = {};
    for (let i = 0; i < 5; i++) {
      log[ds(i)] = entry({ date: ds(i), tokensAdded: 60_000, peakStage: 'stubble', shaveCount: 1 });
    }
    const s = computeWeeklySummary(log, NOW);
    expect(s).not.toBeNull();
    expect(s!.avgStage).toBe('stubble');
    expect(s!.shaveCount).toBe(5);
    expect(s!.trend).toBeNull();
  });

  it('14일치 있으면 trend 계산', () => {
    const log: Record<string, DailyEntry> = {};
    // 최근 7일: 큰 값
    for (let i = 0; i < 7; i++) log[ds(i)] = entry({ date: ds(i), tokensAdded: 200_000, peakStage: 'bushy' });
    // 이전 7일: 작은 값 → up
    for (let i = 7; i < 14; i++) log[ds(i)] = entry({ date: ds(i), tokensAdded: 50_000, peakStage: 'stubble' });
    const s = computeWeeklySummary(log, NOW);
    expect(s!.trend).toBe('up');
  });
});

describe('computeTrend (30% 경계)', () => {
  it('정확히 +30% → up', () => {
    expect(computeTrend(130, 100)).toBe('up');
  });
  it('+29% → flat', () => {
    expect(computeTrend(129, 100)).toBe('flat');
  });
  it('-30% → down', () => {
    expect(computeTrend(70, 100)).toBe('down');
  });
  it('-29% → flat', () => {
    expect(computeTrend(71, 100)).toBe('flat');
  });
  it('previous=0, current>0 → up', () => {
    expect(computeTrend(100, 0)).toBe('up');
  });
  it('previous=0, current=0 → flat', () => {
    expect(computeTrend(0, 0)).toBe('flat');
  });
});

describe('weeklyNarrative (이번 주 서사)', () => {
  it('데이터 없음 → null (생략)', () => {
    expect(weeklyNarrative({}, NOW)).toBeNull();
  });

  it('면도 ≥4 → 바빴던 한 주', () => {
    const log: Record<string, DailyEntry> = {};
    for (let i = 0; i < 5; i++) {
      log[ds(i)] = entry({ date: ds(i), tokensAdded: 100_000, peakStage: 'bushy', shaveCount: 1 });
    }
    const n = weeklyNarrative(log, NOW)!;
    expect(n).toContain('바빴던');
    expect(n).toContain('5번');
  });

  it('평균 ① 매끈 → 동어반복 없이 "거의 안 자랐네요"', () => {
    const log: Record<string, DailyEntry> = {};
    for (let i = 0; i < 3; i++) {
      log[ds(i)] = entry({ date: ds(i), tokensAdded: 30_000, peakStage: 'smooth', shaveCount: 0 });
    }
    const n = weeklyNarrative(log, NOW)!;
    expect(n).toContain('조용한');
    expect(n).toContain('거의 안 자랐');
    expect(n).not.toContain('넘지 않았'); // ① 매끈은 "매끈을 넘지 않았다" 동어반복 회피
  });

  it('평균 ② 까끌까끌 → "②를 넘지 않았네요" (현행 유지)', () => {
    const log: Record<string, DailyEntry> = {};
    for (let i = 0; i < 3; i++) {
      log[ds(i)] = entry({ date: ds(i), tokensAdded: 60_000, peakStage: 'stubble', shaveCount: 0 });
    }
    const n = weeklyNarrative(log, NOW)!;
    expect(n).toContain('조용한');
    expect(n).toContain('까끌까끌');
    expect(n).toContain('넘지 않았');
  });

  it('자랐지만 면도 0 → 정리 권유 (압박 아님)', () => {
    const log: Record<string, DailyEntry> = {};
    for (let i = 0; i < 3; i++) {
      log[ds(i)] = entry({ date: ds(i), tokensAdded: 500_000, peakStage: 'bushy', shaveCount: 0 });
    }
    expect(weeklyNarrative(log, NOW)).toContain('정리해볼까요');
  });

  it('일반 (자라고 면도 1~3) → 잘 보냈어요', () => {
    const log: Record<string, DailyEntry> = {};
    for (let i = 0; i < 3; i++) {
      log[ds(i)] = entry({ date: ds(i), tokensAdded: 500_000, peakStage: 'bushy', shaveCount: 1 });
    }
    const n = weeklyNarrative(log, NOW)!;
    expect(n).toContain('잘 보냈어요');
    expect(n).toContain('3번');
  });
});
