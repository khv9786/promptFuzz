import type { BeardStage, DailyEntry } from '../types/index.js';
import { getLocalDateString } from './dailyLog.js';

export type Trend = 'up' | 'down' | 'flat';

export interface WeeklySummary {
  avgStage: BeardStage;
  shaveCount: number;
  trend: Trend | null; // 14일 미만이면 null
}

const STAGE_ORDER: BeardStage[] = ['smooth', 'stubble', 'bushy', 'rugged', 'hermit'];

function dateNDaysAgo(now: Date, n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return getLocalDateString(d);
}

/**
 * 최근 7일 dailyLog 요약. 데이터 부족 시 null 반환.
 *
 * - dailyLog 비어있거나 최근 7일 내 활동 0 → null
 * - 7일치는 있지만 14일 미만 → trend는 null, 평균/면도만
 */
export function computeWeeklySummary(
  dailyLog: Record<string, DailyEntry>,
  now: Date = new Date(),
): WeeklySummary | null {
  const keys = Object.keys(dailyLog);
  if (keys.length === 0) return null;

  // 최근 7일 (오늘 포함 0~6일 전)
  const last7: DailyEntry[] = [];
  for (let i = 0; i < 7; i++) {
    const d = dateNDaysAgo(now, i);
    const e = dailyLog[d];
    if (e) last7.push(e);
  }

  const active7 = last7.filter((e) => e.tokensAdded > 0);
  if (active7.length === 0) return null;

  // 평균 단계: 활동한 날의 peakStage 인덱스 평균을 반올림.
  const avgIdx = Math.round(
    active7.reduce((s, e) => s + STAGE_ORDER.indexOf(e.peakStage), 0) / active7.length,
  );
  const avgStage = STAGE_ORDER[Math.max(0, Math.min(STAGE_ORDER.length - 1, avgIdx))]!;

  const shaveCount = last7.reduce((s, e) => s + e.shaveCount, 0);

  // 추세: 최근 7일 tokensAdded 합 vs 그 이전 7일(7~13일 전).
  const prev7Tokens = sumTokens(dailyLog, now, 7, 13);
  const has14 = prev7Tokens.daysWithData > 0;
  let trend: Trend | null = null;
  if (has14) {
    const cur = last7.reduce((s, e) => s + e.tokensAdded, 0);
    const prev = prev7Tokens.total;
    trend = computeTrend(cur, prev);
  }

  return { avgStage, shaveCount, trend };
}

function sumTokens(
  dailyLog: Record<string, DailyEntry>,
  now: Date,
  fromDaysAgo: number,
  toDaysAgo: number,
): { total: number; daysWithData: number } {
  let total = 0;
  let daysWithData = 0;
  for (let i = fromDaysAgo; i <= toDaysAgo; i++) {
    const e = dailyLog[dateNDaysAgo(now, i)];
    if (e) {
      total += e.tokensAdded;
      if (e.tokensAdded > 0) daysWithData++;
    }
  }
  return { total, daysWithData };
}

/** 30% 이상 증가 up, 30% 이상 감소 down, 그 사이 flat. */
export function computeTrend(current: number, previous: number): Trend {
  if (previous === 0) return current > 0 ? 'up' : 'flat';
  const ratio = (current - previous) / previous;
  if (ratio >= 0.3) return 'up';
  if (ratio <= -0.3) return 'down';
  return 'flat';
}

export function trendArrow(trend: Trend): string {
  return trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
}
