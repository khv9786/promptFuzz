import chalk from 'chalk';
import { loadState } from '../state/storage.js';
import { computeStats } from '../state/stats.js';
import { getStage, STAGE_ORDER } from '../state/stages.js';
import { trendArrow } from '../state/weeklySummary.js';
import { STRETCH_CARDS } from '../data/stretches.js';

const MAX_DAYS = 90;
const DEFAULT_DAYS = 90;
const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;

function numeralFor(id: string): string {
  const i = STAGE_ORDER.indexOf(id as never);
  return NUMERAL[i] ?? '';
}

function cardTitle(id: string): string {
  return STRETCH_CARDS.find((c) => c.id === id)?.title ?? id;
}

export interface StatsOptions {
  days?: string | number;
  json?: boolean;
}

export async function statsCommand(opts: StatsOptions = {}): Promise<void> {
  const state = await loadState();

  let days = DEFAULT_DAYS;
  if (opts.days !== undefined) {
    const n = typeof opts.days === 'number' ? opts.days : parseInt(String(opts.days), 10);
    if (Number.isFinite(n) && n > 0) days = Math.min(MAX_DAYS, Math.floor(n));
  }

  const stats = computeStats(state, days);

  if (opts.json) {
    console.log(JSON.stringify({ ...stats }, null, 2));
    return;
  }

  const hasActivity = Object.keys(state.dailyLog).length > 0;
  if (!hasActivity) {
    console.log(chalk.bold('📊 PromptFuzz 통계'));
    console.log();
    console.log(chalk.dim('아직 데이터가 없어요. Claude Code를 사용하면 자동으로 기록됩니다.'));
    return;
  }

  const lines: string[] = [];
  lines.push(chalk.bold(`📊 PromptFuzz 통계 (최근 ${days}일)`));
  lines.push('');

  lines.push(chalk.cyan('활동:'));
  lines.push(`  활성 일수:        ${stats.activeDays} / ${days}`);
  lines.push(`  총 사용 토큰:     ${stats.totalTokens.toLocaleString()}`);
  lines.push(`  일 평균:          ~${stats.dailyAverage.toLocaleString()}`);
  if (stats.peakDay) {
    lines.push(`  최고 일:          ${stats.peakDay.tokens.toLocaleString()} (${stats.peakDay.date})`);
  }
  lines.push('');

  lines.push(chalk.cyan('면도:'));
  if (stats.totalShaves === 0) {
    lines.push(chalk.dim('  아직 면도 기록이 없어요. promptfuzz shave 한 번 어떠세요?'));
  } else {
    lines.push(`  총 면도:          ${stats.totalShaves}회`);
    if (stats.avgShaveIntervalDays !== null) {
      lines.push(`  평균 간격:        ${stats.avgShaveIntervalDays}일`);
    }
    if (stats.heaviestShave) {
      const h = stats.heaviestShave;
      const date = h.at.slice(0, 10);
      lines.push(
        `  가장 무거운 면도: ${numeralFor(h.stage)} ${getStage(h.stage).nameKr} ` +
          `(${h.tokensAtShave.toLocaleString()} 토큰, ${date})`
      );
    }
  }
  lines.push('');

  lines.push(chalk.cyan('스트레칭:'));
  lines.push(`  완료:             ${stats.totalStretches}회`);
  if (stats.completionRate !== null) {
    lines.push(`  완료율:           ${stats.completionRate}% (면도 대비)`);
  }
  if (stats.mostSeenCard) {
    lines.push(`  가장 자주 본 카드: ${cardTitle(stats.mostSeenCard.id)} (${stats.mostSeenCard.count}회)`);
  }
  lines.push('');

  if (stats.tokenTrend || stats.shaveTrend) {
    lines.push(chalk.cyan('추세 (지난 7일 vs 그 전 7일):'));
    if (stats.tokenTrend) {
      lines.push(`  토큰 사용량:      ${trendArrow(stats.tokenTrend)}`);
    }
    if (stats.shaveTrend) {
      lines.push(`  면도 빈도:        ${trendArrow(stats.shaveTrend)}`);
    }
  } else {
    lines.push(chalk.dim('추세는 14일치 데이터가 모이면 보여드려요.'));
  }

  console.log(lines.join('\n'));
}
