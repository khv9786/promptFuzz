import type { BeardStage, PromptFuzzState } from '../types/index.js';
import { getLocalDateString } from './dailyLog.js';
import { computeTrend, type Trend } from './weeklySummary.js';
import { stageFromTokens } from './stages.js';
import { getProfile } from './profiles.js';

export interface HeaviestShave {
  tokensAtShave: number;
  stage: BeardStage; // 현재 프로필 기준 역산
  at: string;
}

export interface StatsResult {
  days: number;
  activeDays: number;
  totalTokens: number;
  dailyAverage: number;
  peakDay: { date: string; tokens: number } | null;
  totalShaves: number;
  avgShaveIntervalDays: number | null;
  heaviestShave: HeaviestShave | null;
  totalStretches: number;
  completionRate: number | null; // stretch / shave
  mostSeenCard: { id: string; count: number } | null;
  tokenTrend: Trend | null;
  shaveTrend: Trend | null;
}

function recentDates(days: number, now: Date): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(getLocalDateString(d));
  }
  return out;
}

export function computeStats(
  state: PromptFuzzState,
  days: number,
  now: Date = new Date(),
): StatsResult {
  const dates = recentDates(days, now);
  const entries = dates.map((d) => state.dailyLog[d]).filter((e): e is NonNullable<typeof e> => Boolean(e));

  const activeDays = entries.filter((e) => e.tokensAdded > 0).length;
  const totalTokens = entries.reduce((s, e) => s + e.tokensAdded, 0);
  const dailyAverage = activeDays > 0 ? Math.round(totalTokens / activeDays) : 0;

  let peakDay: { date: string; tokens: number } | null = null;
  for (const e of entries) {
    if (e.tokensAdded > 0 && (!peakDay || e.tokensAdded > peakDay.tokens)) {
      peakDay = { date: e.date, tokens: e.tokensAdded };
    }
  }

  const totalShaves = entries.reduce((s, e) => s + e.shaveCount, 0);
  const avgShaveIntervalDays = totalShaves > 0 ? Math.round((days / totalShaves) * 10) / 10 : null;

  // 가장 무거운 면도: shaveHistory의 tokensAtShave 최대. 단계는 현재 프로필로 역산.
  let heaviestShave: HeaviestShave | null = null;
  const profile = getProfile(state.thresholdProfile);
  for (const rec of state.shaveHistory) {
    if (!heaviestShave || rec.tokensAtShave > heaviestShave.tokensAtShave) {
      heaviestShave = {
        tokensAtShave: rec.tokensAtShave,
        stage: stageFromTokens(rec.tokensAtShave, profile).id,
        at: rec.at,
      };
    }
  }

  const totalStretches = entries.reduce((s, e) => s + e.stretchCount, 0);
  const completionRate = totalShaves > 0 ? Math.round((totalStretches / totalShaves) * 100) : null;

  // 가장 자주 본 카드: stretchCardsShown 빈도. 동률이면 먼저 등장한 것.
  let mostSeenCard: { id: string; count: number } | null = null;
  const counts = new Map<string, number>();
  for (const id of state.stretchCardsShown) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    if (!mostSeenCard || count > mostSeenCard.count) {
      mostSeenCard = { id, count };
    }
  }

  // 추세: 최근 7일 vs 그 이전 7일.
  const tokenTrend = trendOver(state, now, (e) => e.tokensAdded);
  const shaveTrend = trendOver(state, now, (e) => e.shaveCount);

  return {
    days,
    activeDays,
    totalTokens,
    dailyAverage,
    peakDay,
    totalShaves,
    avgShaveIntervalDays,
    heaviestShave,
    totalStretches,
    completionRate,
    mostSeenCard,
    tokenTrend,
    shaveTrend,
  };
}

function trendOver(
  state: PromptFuzzState,
  now: Date,
  pick: (e: { tokensAdded: number; shaveCount: number }) => number,
): Trend | null {
  const sumRange = (from: number, to: number) => {
    let total = 0;
    let hasData = false;
    for (let i = from; i <= to; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const e = state.dailyLog[getLocalDateString(d)];
      if (e) {
        total += pick(e);
        hasData = true;
      }
    }
    return { total, hasData };
  };
  const cur = sumRange(0, 6);
  const prev = sumRange(7, 13);
  if (!prev.hasData) return null;
  return computeTrend(cur.total, prev.total);
}
