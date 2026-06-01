import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PassThrough } from 'node:stream';
import type { ClaudeSettings } from '../src/hooks/manager.js';

// manager의 settings I/O를 메모리로 모킹 (실제 ~/.claude 안 건드림).
const hoisted = vi.hoisted(() => ({
  settings: { current: {} as ClaudeSettings },
  backupCount: { value: 0 },
}));

vi.mock('../src/hooks/manager.js', () => ({
  readSettings: vi.fn(async () => hoisted.settings.current),
  writeSettings: vi.fn(async (s: ClaudeSettings) => {
    hoisted.settings.current = s;
  }),
  backupSettings: vi.fn(async () => {
    hoisted.backupCount.value += 1;
  }),
  CLAUDE_SETTINGS: '/fake/.claude/settings.json',
}));

import {
  classifyStatusLine,
  statuslineInstall,
  statuslineUninstall,
  PROMPTFUZZ_STATUSLINE_COMMAND,
} from '../src/commands/statusLine.js';

function makeIO() {
  const output = new PassThrough();
  let buf = '';
  output.on('data', (c) => (buf += c.toString()));
  return { output, getOut: () => buf };
}

const ours = { type: 'command', command: PROMPTFUZZ_STATUSLINE_COMMAND, padding: 0 };
const other = { type: 'command', command: 'starship init' };

describe('classifyStatusLine', () => {
  it('없음/우리것/남의것 분류', () => {
    expect(classifyStatusLine({})).toBe('none');
    expect(classifyStatusLine({ statusLine: ours })).toBe('ours');
    expect(classifyStatusLine({ statusLine: other })).toBe('other');
  });
});

describe('statuslineInstall', () => {
  beforeEach(() => {
    hoisted.settings.current = {};
    hoisted.backupCount.value = 0;
    process.exitCode = 0;
  });

  it('기존 없음 → 추가', async () => {
    const { output, getOut } = makeIO();
    await statuslineInstall({ isTTY: false, output });
    expect(hoisted.settings.current.statusLine?.command).toBe(PROMPTFUZZ_STATUSLINE_COMMAND);
    expect(getOut()).toContain('상태바에 수염을 추가');
    expect(hoisted.backupCount.value).toBe(0); // 신규는 백업 불필요
  });

  it('우리 것 이미 있음 → 스킵 (변경 X)', async () => {
    hoisted.settings.current = { statusLine: { ...ours } };
    const { output, getOut } = makeIO();
    await statuslineInstall({ isTTY: false, output });
    expect(getOut()).toContain('이미 PromptFuzz 상태바');
  });

  it('남의 것 + 비대화형 (--yes 없음) → 거부 (exit 1), 보존', async () => {
    hoisted.settings.current = { statusLine: { ...other } };
    const { output, getOut } = makeIO();
    await statuslineInstall({ isTTY: false, output });
    expect(process.exitCode).toBe(1);
    expect(hoisted.settings.current.statusLine?.command).toBe('starship init');
    expect(getOut()).toContain('--yes');
  });

  it('남의 것 + 비대화형 --yes → 백업 후 덮어쓰기', async () => {
    hoisted.settings.current = { statusLine: { ...other } };
    const { output } = makeIO();
    await statuslineInstall({ isTTY: false, yes: true, output });
    expect(hoisted.backupCount.value).toBe(1);
    expect(hoisted.settings.current.statusLine?.command).toBe(PROMPTFUZZ_STATUSLINE_COMMAND);
  });

  it('남의 것 + 대화형 거부(n) → 보존, 백업 안 함', async () => {
    hoisted.settings.current = { statusLine: { ...other } };
    const { output } = makeIO();
    const input = new PassThrough();
    const p = statuslineInstall({ isTTY: true, input, output });
    await new Promise((r) => setTimeout(r, 20));
    input.write('n\n');
    await p;
    expect(hoisted.settings.current.statusLine?.command).toBe('starship init');
    expect(hoisted.backupCount.value).toBe(0);
  });

  it('남의 것 + 대화형 승낙(y) → 백업 후 덮어쓰기', async () => {
    hoisted.settings.current = { statusLine: { ...other } };
    const { output } = makeIO();
    const input = new PassThrough();
    const p = statuslineInstall({ isTTY: true, input, output });
    await new Promise((r) => setTimeout(r, 20));
    input.write('y\n');
    await p;
    expect(hoisted.backupCount.value).toBe(1);
    expect(hoisted.settings.current.statusLine?.command).toBe(PROMPTFUZZ_STATUSLINE_COMMAND);
  });

  it('다른 설정(hooks 등)은 보존', async () => {
    hoisted.settings.current = { hooks: { Stop: [{ hooks: [{ command: 'x' }] }] } };
    const { output } = makeIO();
    await statuslineInstall({ isTTY: false, output });
    expect(hoisted.settings.current.hooks).toBeDefined();
    expect(hoisted.settings.current.statusLine?.command).toBe(PROMPTFUZZ_STATUSLINE_COMMAND);
  });
});

describe('statuslineUninstall', () => {
  beforeEach(() => {
    hoisted.settings.current = {};
    hoisted.backupCount.value = 0;
  });

  it('우리 것 → 제거 + 백업', async () => {
    hoisted.settings.current = { statusLine: { ...ours }, hooks: { Stop: [] } };
    const { output, getOut } = makeIO();
    await statuslineUninstall({ output });
    expect(hoisted.settings.current.statusLine).toBeUndefined();
    expect(hoisted.settings.current.hooks).toBeDefined(); // 다른 설정 보존
    expect(hoisted.backupCount.value).toBe(1);
    expect(getOut()).toContain('제거');
  });

  it('남의 것 → 보존 (안 건드림)', async () => {
    hoisted.settings.current = { statusLine: { ...other } };
    const { output, getOut } = makeIO();
    await statuslineUninstall({ output });
    expect(hoisted.settings.current.statusLine?.command).toBe('starship init');
    expect(getOut()).toContain('PromptFuzz statusLine이 아닙니다');
  });

  it('없음 → 안내', async () => {
    hoisted.settings.current = {};
    const { output, getOut } = makeIO();
    await statuslineUninstall({ output });
    expect(getOut()).toContain('설정된 statusLine이 없습니다');
  });
});
