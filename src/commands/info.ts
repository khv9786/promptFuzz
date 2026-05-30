import { stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import chalk from 'chalk';
import { loadState, STATE_FILE } from '../state/storage.js';
import { isInstalled, CLAUDE_SETTINGS } from '../hooks/manager.js';
import { STAGE_ORDER, stageFromTokens } from '../state/stages.js';
import { getProfile } from '../state/profiles.js';

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;
const VERSION = '0.1.2';

function numeralFor(id: string): string {
  const i = STAGE_ORDER.indexOf(id as never);
  return NUMERAL[i] ?? '';
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

export async function infoCommand(): Promise<void> {
  const lines: string[] = [];
  lines.push(chalk.bold(`PromptFuzz v${VERSION}`));
  lines.push('');

  // Environment
  lines.push(chalk.cyan('Environment:'));
  lines.push(`  Node:        ${process.version}`);
  lines.push(`  Platform:    ${process.platform} (${process.arch})`);
  lines.push(`  Locale:      ${process.env.LANG ?? process.env.LC_ALL ?? 'unknown'}`);
  lines.push('');

  // State
  lines.push(chalk.cyan('State:'));
  if (existsSync(STATE_FILE)) {
    const state = await loadState();
    const profile = getProfile(state.thresholdProfile);
    const stage = stageFromTokens(state.cumulativeTokens, profile);
    let size = 0;
    try {
      size = (await stat(STATE_FILE)).size;
    } catch {
      // ignore
    }
    const dates = Object.keys(state.dailyLog).sort();
    const lastUpdate = dates.length > 0 ? dates[dates.length - 1] : '-';
    lines.push(`  Path:        ${STATE_FILE}`);
    lines.push(`  Size:        ${fmtBytes(size)}`);
    lines.push(`  Profile:     ${state.thresholdProfile}`);
    lines.push(`  Cumulative:  ${state.cumulativeTokens.toLocaleString()} tokens`);
    lines.push(`  Stage:       ${numeralFor(stage.id)} ${stage.nameKr}`);
    lines.push(`  Last log:    ${lastUpdate}`);
  } else {
    lines.push(chalk.dim('  아직 상태 파일이 없어요. promptfuzz install 후 사용하면 생성됩니다.'));
  }
  lines.push('');

  // Hook
  const installed = await isInstalled();
  lines.push(chalk.cyan('Hook:'));
  lines.push(`  Installed:   ${installed ? 'yes' : 'no'}`);
  lines.push(`  Path:        ${CLAUDE_SETTINGS}`);
  lines.push('');

  // Activity
  if (existsSync(STATE_FILE)) {
    const state = await loadState();
    const entries = Object.values(state.dailyLog);
    const activeDays = entries.filter((e) => e.tokensAdded > 0).length;
    const totalShaves = entries.reduce((s, e) => s + e.shaveCount, 0);
    const totalStretches = entries.reduce((s, e) => s + e.stretchCount, 0);
    lines.push(chalk.cyan('Activity (recorded days):'));
    lines.push(`  Active days:     ${activeDays}`);
    lines.push(`  Total shaves:    ${totalShaves}`);
    lines.push(`  Total stretches: ${totalStretches}`);
  }

  console.log(lines.join('\n'));
}
