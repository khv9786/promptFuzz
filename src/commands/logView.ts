import type { DailyEntry } from '../types/index.js';
import type { ThresholdProfile } from '../state/profiles.js';
import { getLocalDateString } from '../state/dailyLog.js';

export type GrassLevel = 'none' | 'light' | 'medium' | 'heavy' | 'extreme' | 'future';

export const GRASS_GLYPH: Record<GrassLevel, string> = {
  none: '·',
  light: '░',
  medium: '▒',
  heavy: '▓',
  extreme: '█',
  future: '-',
};

/**
 * 그날 tokensAdded를 현재 프로필 임계치에 비례해 잔디 레벨로 변환.
 * future는 호출자가 날짜 비교로 직접 지정.
 */
export function grassLevel(tokensAdded: number, profile: ThresholdProfile): GrassLevel {
  if (tokensAdded <= 0) return 'none';
  const t = profile.thresholds;
  if (tokensAdded < t.stubble) return 'light';
  if (tokensAdded < t.bushy) return 'medium';
  if (tokensAdded < t.rugged) return 'heavy';
  return 'extreme';
}

export interface LogSummary {
  profile: string;
  days: number;
  totalShaves: number;
  totalStretches: number;
  peakStage: DailyEntry['peakStage'];
  peakDate: string | null;
  entries: DailyEntry[];
}

const STAGE_RANK: Record<DailyEntry['peakStage'], number> = {
  smooth: 0,
  stubble: 1,
  bushy: 2,
  rugged: 3,
  hermit: 4,
};

/**
 * 최근 N일치 요약을 계산. dailyLog에서 범위 내 entry만 추려 집계.
 */
export function summarize(
  dailyLog: Record<string, DailyEntry>,
  days: number,
  profileId: string,
  now: Date = new Date(),
): LogSummary {
  const dates = listDates(days, now);
  const entries: DailyEntry[] = dates.map(
    (d) => dailyLog[d] ?? { date: d, tokensAdded: 0, peakStage: 'smooth', shaveCount: 0, stretchCount: 0 },
  );

  let totalShaves = 0;
  let totalStretches = 0;
  let peakStage: DailyEntry['peakStage'] = 'smooth';
  let peakDate: string | null = null;

  for (const e of entries) {
    totalShaves += e.shaveCount;
    totalStretches += e.stretchCount;
    if (STAGE_RANK[e.peakStage] > STAGE_RANK[peakStage]) {
      peakStage = e.peakStage;
      peakDate = e.date;
    }
  }

  return { profile: profileId, days, totalShaves, totalStretches, peakStage, peakDate, entries };
}

/** now 기준 과거 days일의 날짜 문자열 배열 (오래된 것부터). */
export function listDates(days: number, now: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(getLocalDateString(d));
  }
  return out;
}
