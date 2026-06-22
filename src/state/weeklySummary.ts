import type { BeardStage, DailyEntry } from '../types/index.js';
import { getLocalDateString } from './dailyLog.js';
import { getStage } from './stages.js';

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

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;

/**
 * 이번 주(최근 7일)를 이야기체 한 줄로 요약한다. 숫자 나열 대신 '당신의 한 주' 느낌.
 * 톤: 다정·격려·압박 없음 (CLAUDE.md). 요일별 서사는 조합이 어색해질 수 있어
 * 의도적으로 뺐다 — 평균 단계 + 면도 횟수만으로 자연스러운 문장을 만든다.
 *
 * @returns 서사 문장. 데이터 부족(최근 7일 활동 0 / 기록 없음)이면 null → 호출부가 생략.
 */
export function weeklyNarrative(
  dailyLog: Record<string, DailyEntry>,
  now: Date = new Date(),
): string | null {
  const summary = computeWeeklySummary(dailyLog, now);
  if (!summary) return null;

  const idx = STAGE_ORDER.indexOf(summary.avgStage);
  const stageLabel = `${NUMERAL[idx] ?? ''} ${getStage(summary.avgStage).nameKr}`;
  const shaves = summary.shaveCount;

  // 바쁜 주: 면도가 잦았던 한 주.
  if (shaves >= 4) {
    return `바빴던 한 주, 면도 ${shaves}번. 그만큼 열심히셨네요.`;
  }
  // 조용한 주: 수염이 크게 자라지 않음 (평균 ① 매끈 ~ ② 까끌까끌).
  if (idx <= 1) {
    return `조용한 한 주였어요. 수염도 ${stageLabel}을 넘지 않았네요.`;
  }
  // 자랐지만 아직 면도 전: 압박 아닌 가벼운 권유.
  if (shaves === 0) {
    return `이번 주는 ${stageLabel}까지 자랐어요. 한 번 정리해볼까요?`;
  }
  // 일반: 적당히 자라고 적당히 정리한 한 주.
  return `이번 주는 주로 ${stageLabel}, 면도 ${shaves}번으로 잘 보냈어요.`;
}
