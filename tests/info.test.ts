import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PromptFuzzState } from '../src/types/index.js';

const hoisted = vi.hoisted(() => ({
  state: { current: null as PromptFuzzState | null },
  stateExists: { value: true },
  installed: { value: true },
}));

vi.mock('../src/state/storage.js', () => ({
  ensureDir: vi.fn(async () => {}),
  loadState: vi.fn(async () => hoisted.state.current!),
  saveState: vi.fn(async () => {}),
  PROMPTFUZZ_DIR: '/fake/.promptfuzz',
  STATE_FILE: '/fake/.promptfuzz/state.json',
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, existsSync: vi.fn(() => hoisted.stateExists.value) };
});

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, stat: vi.fn(async () => ({ size: 7400 })) };
});

vi.mock('../src/hooks/manager.js', () => ({
  isInstalled: vi.fn(async () => hoisted.installed.value),
  CLAUDE_SETTINGS: '/fake/.claude/settings.json',
}));

import { infoCommand } from '../src/commands/info.js';

function baseState(o: Partial<PromptFuzzState> = {}): PromptFuzzState {
  return {
    version: '1.0',
    installedAt: '2026-05-01T00:00:00Z',
    cumulativeTokens: 1_234_567,
    lastJsonlOffset: {},
    currentStage: 'bushy',
    shaveHistory: [],
    stretchCardsShown: [],
    onboardingShaveDone: true,
    thresholdProfile: 'medium',
    dailyLog: {
      '2026-05-20': { date: '2026-05-20', tokensAdded: 100_000, peakStage: 'bushy', shaveCount: 2, stretchCount: 1 },
    },
    statusViewCount: 0,
    quietHours: null,
    ...o,
  };
}

describe('infoCommand', () => {
  let logs: string[];
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      logs.push(a.map(String).join(' '));
    });
    hoisted.state.current = baseState();
    hoisted.stateExists.value = true;
    hoisted.installed.value = true;
  });

  afterEach(() => spy.mockRestore());

  it('모든 섹션 출력', async () => {
    await infoCommand();
    const out = logs.join('\n');
    expect(out).toContain('PromptFuzz v0.1.11');
    expect(out).toContain('Environment:');
    expect(out).toContain('Node:');
    expect(out).toContain('State:');
    expect(out).toContain('medium');
    expect(out).toContain('1,234,567');
    expect(out).toContain('Hook:');
    expect(out).toContain('Installed:   yes');
    expect(out).toContain('Activity');
  });

  it('hook 미설치 → Installed: no', async () => {
    hoisted.installed.value = false;
    await infoCommand();
    expect(logs.join('\n')).toContain('Installed:   no');
  });

  it('Locale은 unknown이 아니라 실제 로케일 (Intl 폴백)', async () => {
    await infoCommand();
    const out = logs.join('\n');
    const localeLine = out.split('\n').find((l) => l.includes('Locale:'))!;
    expect(localeLine).not.toContain('unknown'); // Intl 폴백으로 항상 값이 있음
  });

  it('--json: 구조화 출력 + 경로 미포함 (공유 안전)', async () => {
    await infoCommand({ json: true });
    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.version).toBeTruthy();
    expect(parsed.node).toBe(process.version);
    expect(parsed.hookInstalled).toBe(true);
    expect(parsed.state.profile).toBe('medium');
    expect(parsed.state.cumulativeTokens).toBe(1_234_567);
    // 경로 노출 금지: 어떤 값에도 절대경로 흔적 없어야
    const raw = logs.join('\n');
    expect(raw).not.toContain('/');
    expect(raw).not.toContain('\\\\');
    expect(raw.toLowerCase()).not.toContain('path');
  });

  it('state 없음 → 안내 메시지', async () => {
    hoisted.stateExists.value = false;
    await infoCommand();
    const out = logs.join('\n');
    expect(out).toContain('아직 상태 파일이 없어요');
  });
});
