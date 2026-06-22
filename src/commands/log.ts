import { loadState } from '../state/storage.js';
import { getProfile } from '../state/profiles.js';
import { getStage } from '../state/stages.js';
import { theme } from '../ui/theme.js';
import {
  summarize,
  grassLevel,
  GRASS_GLYPH,
  listDates,
  gridHeaderLine,
  gridLabelField,
  weekLabel,
  GRID_CELL_SEP,
  type GrassLevel,
} from './logView.js';
import { formatCompactTokens } from './statusLine.js';
import { getLocalDateString } from '../state/dailyLog.js';
import type { DailyEntry } from '../types/index.js';

const MAX_DAYS = 90;
const DEFAULT_DAYS = 30;

export interface LogOptions {
  days?: string | number;
  json?: boolean;
}

export async function logCommand(opts: LogOptions = {}): Promise<void> {
  const state = await loadState();
  const profile = getProfile(state.thresholdProfile);

  let days = DEFAULT_DAYS;
  if (opts.days !== undefined) {
    const n = typeof opts.days === 'number' ? opts.days : parseInt(String(opts.days), 10);
    if (Number.isFinite(n) && n > 0) days = Math.min(MAX_DAYS, Math.floor(n));
  }

  const hasAny = Object.keys(state.dailyLog).length > 0;

  if (opts.json) {
    const summary = summarize(state.dailyLog, days, state.thresholdProfile);
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (!hasAny) {
    console.log(theme.bold('📅 PromptFuzz log'));
    console.log();
    console.log(theme.dim('아직 활동 기록이 없어요. 코딩을 시작하면 여기에 잔디가 자라요 🌱'));
    return;
  }

  const summary = summarize(state.dailyLog, days, state.thresholdProfile);
  const todayStr = getLocalDateString(new Date());
  const dates = listDates(days);

  const lines: string[] = [];
  lines.push(theme.bold(`📅 PromptFuzz log — 최근 ${days}일`));
  lines.push('');
  lines.push(theme.dim(gridHeaderLine()));

  // 주 단위 행으로 분할. 첫 날의 요일에 맞춰 앞쪽 공백 채움.
  const cells = dates.map((d) => {
    if (d > todayStr) return { glyph: GRASS_GLYPH.future, level: 'future' as GrassLevel };
    const entry = state.dailyLog[d];
    const level = entry ? grassLevel(entry.tokensAdded, profile) : 'none';
    return { glyph: GRASS_GLYPH[level], level };
  });

  const firstDow = mondayIndex(new Date(dates[0] + 'T00:00:00'));
  const padded: Array<{ glyph: string; level: GrassLevel } | null> = [
    ...Array(firstDow).fill(null),
    ...cells,
  ];

  let weekNum = Math.ceil(padded.length / 7);
  for (let i = 0; i < padded.length; i += 7) {
    const week = padded.slice(i, i + 7);
    // 각 셀은 1칸 폭(글리프 또는 공백). GRID_CELL_SEP로 이어 헤더 칸과 정확히 맞춘다.
    const cells = week.map((c) => (c === null ? ' ' : colorize(c.glyph, c.level)));
    lines.push(theme.dim(gridLabelField(weekLabel(weekNum))) + cells.join(GRID_CELL_SEP));
    weekNum--;
  }

  lines.push('');
  lines.push(
    theme.dim('활동:  ') +
      `${GRASS_GLYPH.none} 없음  ` +
      colorize(GRASS_GLYPH.light, 'light') + ' 가벼움  ' +
      colorize(GRASS_GLYPH.medium, 'medium') + ' 보통  ' +
      colorize(GRASS_GLYPH.heavy, 'heavy') + ' 활발  ' +
      colorize(GRASS_GLYPH.extreme, 'extreme') + ' 무거움'
  );
  lines.push(
    `🪒 면도: ${theme.bold(String(summary.totalShaves))}회   🧘 스트레칭: ${theme.bold(String(summary.totalStretches))}회`
  );
  if (summary.peakDate) {
    const idx = ['smooth', 'stubble', 'bushy', 'rugged', 'hermit'].indexOf(summary.peakStage);
    const numeral = ['①', '②', '③', '④', '⑤'][idx] ?? '';
    const peakTokenStr = summary.peakTokens > 0 ? ` · ${formatCompactTokens(summary.peakTokens)} 토큰` : '';
    lines.push(
      theme.dim('최고 도달: ') + `${numeral} ${getStage(summary.peakStage).nameKr} ` +
        theme.dim(`(${summary.peakDate}${peakTokenStr})`)
    );
  }

  console.log(lines.join('\n'));
}

function colorize(glyph: string, level: GrassLevel): string {
  switch (level) {
    case 'none':
      return theme.dim(glyph);
    case 'light':
      return theme.success(glyph);
    case 'medium':
      return theme.warning(glyph);
    case 'heavy':
      return theme.danger(glyph);
    case 'extreme':
      return theme.critical(glyph);
    default:
      return theme.dim(glyph);
  }
}

/** 월=0 ... 일=6. */
function mondayIndex(d: Date): number {
  const js = d.getDay(); // 일=0 ... 토=6
  return (js + 6) % 7;
}

// 미사용 import 방지용 (DailyEntry는 타입 참조로만 사용)
export type { DailyEntry };
