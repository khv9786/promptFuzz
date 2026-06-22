import type { DailyEntry } from '../types/index.js';
import type { ThresholdProfile } from '../state/profiles.js';
import { getLocalDateString } from '../state/dailyLog.js';

export type GrassLevel = 'none' | 'light' | 'medium' | 'heavy' | 'extreme' | 'future';

export const GRASS_GLYPH: Record<GrassLevel, string> = {
  none: '.',
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
  peakTokens: number; // 최고 도달일의 그날 토큰량 (동단계 tie-break 기준 겸 표시용)
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
  let peakTokens = 0;

  for (const e of entries) {
    totalShaves += e.shaveCount;
    totalStretches += e.stretchCount;

    // 매끈(smooth)은 "도달"로 치지 않는다 — 활동 없는 날이 peak로 잡히면 안 됨.
    if (e.peakStage === 'smooth') continue;

    const rank = STAGE_RANK[e.peakStage];
    const curRank = peakDate === null ? -1 : STAGE_RANK[peakStage];
    // 더 높은 단계 우선. 같은 단계면 그날 토큰이 더 많은 날(= 더 심했던 날)로 갱신.
    if (rank > curRank || (rank === curRank && e.tokensAdded > peakTokens)) {
      peakStage = e.peakStage;
      peakDate = e.date;
      peakTokens = e.tokensAdded;
    }
  }

  return { profile: profileId, days, totalShaves, totalStretches, peakStage, peakDate, peakTokens, entries };
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

// ── 잔디 격자 레이아웃 (정렬의 단일 출처) ────────────────────────────
// 정렬 깨짐 방지: 격자 영역은 1칸 폭 ASCII만 쓴다. 한글 요일(2칸)·'전'/'이번주'(CJK)와
// 데이터 셀(1칸)의 폭 불일치가 v0.1.0의 세로 정렬을 깨뜨렸다. (string-width 의존성 없이 해결.)

/** 요일 헤더 — 월요일 시작, 각 1칸 ASCII (mondayIndex와 일치). */
export const GRID_DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** 셀 사이 간격. 헤더와 데이터 행이 공유해 칸 폭을 맞춘다. */
export const GRID_CELL_SEP = '  ';

/** 주차 라벨: 가장 오래된 주 = "(weekNum-1)w", 이번주(weekNum=1) = "now". */
export function weekLabel(weekNum: number): string {
  return weekNum > 1 ? `${weekNum - 1}w` : 'now';
}

/**
 * 라벨 영역 — 항상 7칸 폭 ASCII (`  ` + 3칸 좌측정렬 + `  `).
 * 빈 문자열이면 헤더용 공백 영역.
 */
export function gridLabelField(label: string): string {
  return `  ${label.padEnd(3)}  `;
}

/** 격자 헤더 행 (색 없는 순수 문자열). */
export function gridHeaderLine(): string {
  return gridLabelField('') + GRID_DAY_HEADERS.join(GRID_CELL_SEP);
}
