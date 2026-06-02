import { createInterface } from 'node:readline/promises';
import { theme } from '../ui/theme.js';
import type { StageInfo } from '../types/index.js';
import { stageLabel } from './tickRender.js';
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

/**
 * Claude Code 상태바(statusLine)용 한 줄 문자열. 평문(ANSI 색 없음).
 * 예: "🧔 \www/ ④ 따갑따갑 · 3.2M · 🪒 shave"
 *
 * 단계별 *당신 수염*(stage.beardArt, 순수 ASCII)을 함께 보여 상태를 시각적으로 전달.
 * (distress 이모지 대신 수염을 쓴 이유: 컨셉상 따가워하는 건 Claude이지 아빠가 아니며,
 *  톤 가이드의 "죄책감 금지"와도 맞다 — 수염은 중립적 신호.)
 * 면도 힌트(🪒 shave)는 ③ 북슬북슬 이상에서만 — status 명령의 힌트 조건과 동일.
 * 순수 함수: state를 읽지 않고 인자만으로 결정 → 단위 테스트 가능.
 */
export function formatStatusLine(cumulativeTokens: number, stage: StageInfo): string {
  const parts = [`🧔 ${stage.beardArt} ${stageLabel(stage.id)}`, formatCompactTokens(cumulativeTokens)];
  if (stage.id === 'bushy' || stage.id === 'rugged' || stage.id === 'hermit') {
    parts.push('🪒 shave');
  }
  return parts.join(' · ');
}

// ── statusline install/uninstall 명령 ──────────────────────────────────

/** 우리가 설치하는 statusLine 명령 문자열 (식별 기준). */
export const PROMPTFUZZ_STATUSLINE_COMMAND = 'promptfuzz status --line';

const OUR_STATUSLINE: StatusLineConfig = {
  type: 'command',
  command: PROMPTFUZZ_STATUSLINE_COMMAND,
  padding: 0,
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
    output.write(theme.success('✓ 이미 PromptFuzz 상태바가 설정되어 있어요.') + '\n');
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
  output.write('  🧔 \\www/ ④ 따갑따갑 · 3.2M · 🪒 shave\n');
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
