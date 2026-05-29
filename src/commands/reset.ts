import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';
import { uninstallHook } from '../hooks/manager.js';
import { PROMPTFUZZ_DIR } from '../state/storage.js';

export interface ResetOptions {
  yes?: boolean;
  /** 테스트 주입용. 미지정 시 process.stdin.isTTY. */
  isTTY?: boolean;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

/**
 * ~/.promptfuzz/ 가 진짜 홈 하위의 그 경로인지 검증.
 * 다른 디렉토리를 실수로 삭제하지 않도록 하는 안전 가드.
 */
function isSafePromptfuzzDir(dir: string): boolean {
  const resolved = resolve(dir);
  const expected = resolve(join(homedir(), '.promptfuzz'));
  if (resolved !== expected) return false;
  // 홈 디렉토리 자체나 루트를 가리키지 않는지 추가 확인.
  const home = resolve(homedir());
  if (resolved === home) return false;
  if (!resolved.startsWith(home + sep)) return false;
  return true;
}

export async function resetCommand(opts: ResetOptions = {}): Promise<void> {
  const output = opts.output ?? process.stdout;
  const input = opts.input ?? process.stdin;
  const isTTY = opts.isTTY ?? Boolean((process.stdin as NodeJS.ReadStream).isTTY);

  // 비대화형 + --yes 아님 → 기본 거부.
  if (!isTTY && !opts.yes) {
    output.write('대화형 환경이 아닙니다.\n');
    output.write('의도적으로 진행하려면 --yes 플래그를 사용하세요.\n');
    process.exitCode = 1;
    return;
  }

  // 대화형 확인 (--yes면 생략).
  if (!opts.yes) {
    output.write('\n');
    output.write(chalk.yellow('⚠ PromptFuzz의 모든 데이터를 영구히 삭제합니다:') + '\n\n');
    output.write('  • ~/.promptfuzz/ (누적 토큰, 면도 이력, dailyLog, 프로필)\n');
    output.write('  • Claude Code Stop hook 제거 (settings.json 복원)\n\n');
    output.write(chalk.dim('이 작업은 되돌릴 수 없습니다.') + '\n');

    const rl = createInterface({ input, output });
    let answer: string;
    try {
      answer = (await rl.question('계속하시겠어요? [y/N]: ')).trim().toLowerCase();
    } finally {
      rl.close();
    }
    if (answer !== 'y' && answer !== 'yes') {
      output.write('취소되었습니다.\n');
      return;
    }
  }

  try {
    // 1. hook 제거 (settings.json 복원은 uninstallHook이 안전 처리).
    await uninstallHook();

    // 2. ~/.promptfuzz/ 통째 삭제 — 경로 가드 통과 시에만.
    if (isSafePromptfuzzDir(PROMPTFUZZ_DIR)) {
      if (existsSync(PROMPTFUZZ_DIR)) {
        await rm(PROMPTFUZZ_DIR, { recursive: true, force: true });
      }
    } else {
      output.write(chalk.red('경로 안전 검증 실패 — 삭제를 건너뜁니다.') + '\n');
      process.exitCode = 1;
      return;
    }

    output.write('\n' + chalk.green('✓ 초기화 완료.') + '\n\n');
    output.write('다시 시작하려면 ' + chalk.cyan('promptfuzz install') + '.\n');
  } catch (err) {
    output.write(chalk.red('초기화 실패: ') + (err instanceof Error ? err.message : String(err)) + '\n');
    process.exitCode = 1;
  }
}
