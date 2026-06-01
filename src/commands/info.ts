import { stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { loadState, STATE_FILE } from '../state/storage.js';
import { isInstalled, CLAUDE_SETTINGS } from '../hooks/manager.js';
import { STAGE_ORDER, stageFromTokens } from '../state/stages.js';
import { getProfile } from '../state/profiles.js';
import { LOGO } from '../ui/logo.js';
import { theme } from '../ui/theme.js';

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;
const VERSION = '0.1.7';

function numeralFor(id: string): string {
  const i = STAGE_ORDER.indexOf(id as never);
  return NUMERAL[i] ?? '';
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

/** 환경변수 → Intl 폴백. 'unknown' 대신 실제 로케일을 보여준다. */
function resolveLocale(): string {
  const fromEnv = process.env.LANG || process.env.LC_ALL || process.env.LANGUAGE;
  if (fromEnv) return fromEnv;
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale;
    if (loc) return loc;
  } catch {
    // ignore
  }
  return 'unknown';
}

export interface InfoOptions {
  json?: boolean;
}

export async function infoCommand(opts: InfoOptions = {}): Promise<void> {
  // --json: 경로(사용자명/프로젝트명) 제외 — 공유 안전. 다른 --json과 형식 일관.
  if (opts.json) {
    const hasState = existsSync(STATE_FILE);
    const installed = await isInstalled();
    const out: Record<string, unknown> = {
      version: VERSION,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      locale: resolveLocale(),
      hookInstalled: installed,
      state: null,
    };
    if (hasState) {
      const state = await loadState();
      const profile = getProfile(state.thresholdProfile);
      const stage = stageFromTokens(state.cumulativeTokens, profile);
      const entries = Object.values(state.dailyLog);
      out.state = {
        profile: state.thresholdProfile,
        cumulativeTokens: state.cumulativeTokens,
        stage: stage.id,
        activeDays: entries.filter((e) => e.tokensAdded > 0).length,
        totalShaves: entries.reduce((s, e) => s + e.shaveCount, 0),
        totalStretches: entries.reduce((s, e) => s + e.stretchCount, 0),
      };
    }
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const lines: string[] = [];
  lines.push(theme.info(LOGO));
  lines.push('');
  lines.push(theme.bold(`PromptFuzz v${VERSION}`));
  lines.push('');

  // Environment
  lines.push(theme.info('Environment:'));
  lines.push(`  Node:        ${process.version}`);
  lines.push(`  Platform:    ${process.platform} (${process.arch})`);
  lines.push(`  Locale:      ${resolveLocale()}`);
  lines.push('');

  // State
  lines.push(theme.info('State:'));
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
    lines.push(theme.dim('  아직 상태 파일이 없어요. promptfuzz install 후 사용하면 생성됩니다.'));
  }
  lines.push('');

  // Hook
  const installed = await isInstalled();
  lines.push(theme.info('Hook:'));
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
    lines.push(theme.info('Activity (recorded days):'));
    lines.push(`  Active days:     ${activeDays}`);
    lines.push(`  Total shaves:    ${totalShaves}`);
    lines.push(`  Total stretches: ${totalStretches}`);
  }

  console.log(lines.join('\n'));
}
