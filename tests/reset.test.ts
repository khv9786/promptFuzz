import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PassThrough } from 'node:stream';
import { join } from 'node:path';
import { homedir } from 'node:os';

const hoisted = vi.hoisted(() => ({
  rmCalls: [] as string[],
  uninstallCalled: { value: false },
  dirExists: { value: true },
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    rm: vi.fn(async (path: string) => {
      hoisted.rmCalls.push(String(path));
    }),
  };
});

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => hoisted.dirExists.value),
  };
});

vi.mock('../src/hooks/manager.js', () => ({
  uninstallHook: vi.fn(async () => {
    hoisted.uninstallCalled.value = true;
    return { removed: true };
  }),
}));

import { resetCommand } from '../src/commands/reset.js';

const PROMPTFUZZ_DIR = join(homedir(), '.promptfuzz');

function makeIO() {
  const output = new PassThrough();
  let buf = '';
  output.on('data', (c) => (buf += c.toString()));
  return { output, getOut: () => buf };
}

describe('resetCommand', () => {
  beforeEach(() => {
    hoisted.rmCalls = [];
    hoisted.uninstallCalled.value = false;
    hoisted.dirExists.value = true;
    process.exitCode = 0;
  });

  afterEach(() => {
    process.exitCode = 0;
  });

  it('확인 거부(n) → 데이터 보존, rm/uninstall 미호출', async () => {
    const { output, getOut } = makeIO();
    const input = new PassThrough();
    const p = resetCommand({ isTTY: true, input, output });
    // 프롬프트가 질문을 던질 시간을 준 뒤 'n' 입력
    await new Promise((r) => setTimeout(r, 20));
    input.write('n\n');
    await p;

    expect(hoisted.rmCalls).toHaveLength(0);
    expect(hoisted.uninstallCalled.value).toBe(false);
    expect(getOut()).toContain('취소되었습니다');
  });

  it('확인 승낙(y) → 데이터 삭제 + hook 제거', async () => {
    const { output } = makeIO();
    const input = new PassThrough();
    const p = resetCommand({ isTTY: true, input, output });
    await new Promise((r) => setTimeout(r, 20));
    input.write('y\n');
    await p;

    expect(hoisted.uninstallCalled.value).toBe(true);
    expect(hoisted.rmCalls).toHaveLength(1);
    expect(hoisted.rmCalls[0]).toBe(PROMPTFUZZ_DIR);
  });

  it('비대화형 + --yes 없음 → 거부 (exit 1), 삭제 안 함', async () => {
    const { output, getOut } = makeIO();
    await resetCommand({ isTTY: false, output });
    expect(process.exitCode).toBe(1);
    expect(hoisted.rmCalls).toHaveLength(0);
    expect(getOut()).toContain('대화형 환경이 아닙니다');
  });

  it('비대화형 + --yes → 확인 없이 삭제', async () => {
    const { output } = makeIO();
    await resetCommand({ isTTY: false, yes: true, output });
    expect(hoisted.uninstallCalled.value).toBe(true);
    expect(hoisted.rmCalls[0]).toBe(PROMPTFUZZ_DIR);
  });

  it('~/.promptfuzz 없을 때도 에러 없이 동작 (hook만 제거)', async () => {
    hoisted.dirExists.value = false;
    const { output, getOut } = makeIO();
    await resetCommand({ isTTY: false, yes: true, output });
    expect(hoisted.uninstallCalled.value).toBe(true);
    expect(hoisted.rmCalls).toHaveLength(0); // 디렉토리 없으니 rm 안 함
    expect(getOut()).toContain('초기화 완료');
  });
});
