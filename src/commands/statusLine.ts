import { createInterface } from 'node:readline/promises';
import { theme } from '../ui/theme.js';
import type { StageInfo } from '../types/index.js';
import { STAGE_ORDER } from '../state/stages.js';
import { visualWidth } from '../ui/duo.js';
import {
  readSettings,
  writeSettings,
  backupSettings,
  type ClaudeSettings,
  type StatusLineConfig,
} from '../hooks/manager.js';

/**
 * 누적 토큰을 상태바용으로 압축한다.
 * 예: 3_250_000 → "3.3M", 175_000 → "175K", 0 → "0".
 */
export function formatCompactTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;

function numeralFor(id: StageInfo['id']): string {
  return NUMERAL[STAGE_ORDER.indexOf(id)] ?? '';
}

/**
 * Claude Code 상태바(statusLine)용 한 줄 문자열. 평문(ANSI 색 없음).
 *
 * **터미널 너비 적응**: columns(=COLUMNS)에 맞는 *가장 풍부한* 버전을 고른다.
 * Claude Code가 무식하게 뒤를 자르기 전에 우리가 먼저 줄여, 핵심(수염 글리프 +
 * 단계 + 🪒 면도 신호)을 끝까지 보존한다. 생략 순서: 이름 → "shave" 텍스트 → 단계명.
 *
 *   풀:   PromptFuzz 🧔 \WWW/ ⑤ 고슴도치 · 28.8M · 🪒 shave
 *   중간: 🧔 \WWW/ ⑤ 고슴도치 · 28.8M · 🪒
 *   축약: 🧔 \WWW/ ⑤ · 28.8M · 🪒
 *
 * 임계값은 하드코딩하지 않고 각 버전의 visualWidth를 columns와 직접 비교한다
 * (토큰 자릿수 변동까지 자동 반영). columns 없음/NaN/0이면 풀버전 (구버전 호환).
 * 면도 신호(🪒)는 ③ 북슬북슬 이상에서 *모든 버전*에 유지 — 절대 생략 안 함.
 * 순수 함수: state를 읽지 않고 인자만으로 결정 → 단위 테스트 가능.
 */
export function formatStatusLine(
  cumulativeTokens: number,
  stage: StageInfo,
  columns?: number,
): string {
  const hasShave = stage.id === 'bushy' || stage.id === 'rugged' || stage.id === 'hermit';
  const tokens = formatCompactTokens(cumulativeTokens);
  const num = numeralFor(stage.id);
  const beard = stage.beardArt;

  const build = (head: string, shave: string | null): string =>
    [head, tokens, ...(hasShave && shave ? [shave] : [])].join(' · ');

  const full = build(`PromptFuzz 🧔 ${beard} ${num} ${stage.nameKr}`, '🪒 shave');
  const mid = build(`🧔 ${beard} ${num} ${stage.nameKr}`, '🪒');
  const short = build(`🧔 ${beard} ${num}`, '🪒');

  if (typeof columns === 'number' && Number.isFinite(columns) && columns > 0) {
    if (visualWidth(full) <= columns) return full;
    if (visualWidth(mid) <= columns) return mid;
    return short;
  }
  return full;
}

// ── statusline install/uninstall 명령 ──────────────────────────────────

/** 우리가 설치하는 statusLine 명령 문자열 (식별 기준). */
export const PROMPTFUZZ_STATUSLINE_COMMAND = 'promptfuzz status --line';

// refreshInterval: statusLine은 리사이즈 이벤트로는 재호출되지 않는다(메시지/모드 변경만).
// 2초마다 재실행해 터미널 폭 변화 후 COLUMNS가 갱신되도록 한다 (반응형 줄바꿈의 전제).
const OUR_STATUSLINE: StatusLineConfig = {
  type: 'command',
  command: PROMPTFUZZ_STATUSLINE_COMMAND,
  padding: 0,
  refreshInterval: 2,
};

export type StatusLineKind = 'none' | 'ours' | 'other';

/** 현재 settings의 statusLine이 어떤 종류인지 분류 (순수 함수). */
export function classifyStatusLine(settings: ClaudeSettings): StatusLineKind {
  const sl = settings.statusLine;
  if (!sl || typeof sl !== 'object') return 'none';
  if (sl.command === PROMPTFUZZ_STATUSLINE_COMMAND) return 'ours';
  return 'other';
}

export interface StatuslineOptions {
  yes?: boolean;
  isTTY?: boolean;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

export async function statuslineInstall(opts: StatuslineOptions = {}): Promise<void> {
  const output = opts.output ?? process.stdout;
  const input = opts.input ?? process.stdin;
  const isTTY = opts.isTTY ?? Boolean((process.stdin as NodeJS.ReadStream).isTTY);

  const settings = await readSettings();
  const kind = classifyStatusLine(settings);

  if (kind === 'ours') {
    // 우리 것이지만 옵션이 옛 버전(refreshInterval 누락 등)이면 최신으로 갱신.
    // command가 같아 손상 위험 없으므로 백업 없이 덮어써도 안전.
    const cur = settings.statusLine;
    const upToDate = cur?.refreshInterval === OUR_STATUSLINE.refreshInterval && cur?.padding === OUR_STATUSLINE.padding;
    if (upToDate) {
      output.write(theme.success('✓ 이미 PromptFuzz 상태바가 최신 설정이에요.') + '\n');
      return;
    }
    await writeSettings({ ...settings, statusLine: { ...OUR_STATUSLINE } });
    output.write(theme.success('✓ PromptFuzz 상태바를 최신으로 갱신했어요.') + '\n');
    output.write(theme.dim('  터미널 너비가 바뀌면 자동으로 맞춰집니다 (2초 주기 새로고침).') + '\n');
    return;
  }

  if (kind === 'other') {
    // 비파괴: 남의 statusLine은 확인 없이 안 덮어씀.
    const existing = settings.statusLine?.command ?? '(알 수 없음)';
    if (!isTTY && !opts.yes) {
      output.write('이미 다른 statusLine 설정이 있습니다.\n');
      output.write('덮어쓰려면 --yes를 사용하세요 (기존 설정은 백업됩니다).\n');
      process.exitCode = 1;
      return;
    }
    if (isTTY && !opts.yes) {
      output.write('\n' + theme.warning('⚠️ 이미 statusLine 설정이 있습니다:') + '\n\n');
      output.write(`  command: ${existing}\n\n`);
      output.write('PromptFuzz 수염으로 덮어쓰시겠어요?\n');
      output.write(theme.dim('기존 설정은 ~/.claude/settings.json.promptfuzz.bak에 백업됩니다.') + ' [y/N]: ');
      const rl = createInterface({ input, output });
      let answer: string;
      try {
        answer = (await rl.question('')).trim().toLowerCase();
      } finally {
        rl.close();
      }
      if (answer !== 'y' && answer !== 'yes') {
        output.write('취소되었습니다.\n');
        return;
      }
    }
    // 덮어쓰기 전 백업.
    await backupSettings();
  }

  await writeSettings({ ...settings, statusLine: { ...OUR_STATUSLINE } });

  output.write(theme.success('✓ Claude Code 상태바에 수염을 추가했습니다.') + '\n');
  output.write(theme.dim('  Claude Code를 재시작하면 하단에 표시됩니다:') + '\n\n');
  output.write('  PromptFuzz 🧔 \\www/ ④ 따갑따갑 · 3.2M · 🪒 shave\n');
}

export async function statuslineUninstall(opts: StatuslineOptions = {}): Promise<void> {
  const output = opts.output ?? process.stdout;
  const settings = await readSettings();
  const kind = classifyStatusLine(settings);

  if (kind === 'none') {
    output.write('설정된 statusLine이 없습니다.\n');
    return;
  }
  if (kind === 'other') {
    output.write('PromptFuzz statusLine이 아닙니다. 건드리지 않았어요.\n');
    return;
  }

  // 우리 것 → 백업 후 제거.
  await backupSettings();
  const next: ClaudeSettings = { ...settings };
  delete next.statusLine;
  await writeSettings(next);

  output.write(theme.success('✓ 상태바에서 PromptFuzz 수염을 제거했습니다.') + '\n');
}

export async function statuslineShow(opts: StatuslineOptions = {}): Promise<void> {
  const output = opts.output ?? process.stdout;
  const settings = await readSettings();
  const kind = classifyStatusLine(settings);

  if (kind === 'ours') {
    output.write(`현재 statusLine: ${PROMPTFUZZ_STATUSLINE_COMMAND} (PromptFuzz)\n`);
  } else if (kind === 'other') {
    output.write(`현재 statusLine: ${settings.statusLine?.command ?? '(알 수 없음)'} (PromptFuzz 아님)\n`);
  } else {
    output.write('현재 statusLine: 설정되지 않음\n');
  }
  output.write('\n' + theme.dim('설치: ') + theme.info('promptfuzz statusline install') + '\n');
}
