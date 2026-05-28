import chalk from 'chalk';
import { installHook } from '../hooks/manager.js';
import { ensureDir } from '../state/storage.js';

export async function installCommand(): Promise<void> {
  await ensureDir();

  try {
    const { alreadyInstalled } = await installHook();
    if (alreadyInstalled) {
      console.log(chalk.yellow('이미 설치되어 있습니다. ') + chalk.dim('promptfuzz status로 확인해보세요.'));
      return;
    }
    console.log(chalk.green('✓ PromptFuzz가 Claude Code에 연결되었습니다.'));
    console.log(chalk.dim('  ~/.claude/settings.json에 Stop hook이 추가되었습니다.'));
    console.log();
    console.log('  다음 단계: ' + chalk.cyan('promptfuzz status'));
  } catch (err) {
    console.error(chalk.red('설치 실패:'), err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
