import chalk from 'chalk';
import { installHook } from '../hooks/manager.js';
import { ensureDir } from '../state/storage.js';
import { runOnboardingShave } from '../state/onboarding.js';

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
    console.log('🔒 PromptFuzz는 외부와 통신하지 않습니다.');
    console.log(chalk.dim('   모든 데이터는 이 컴퓨터에만 저장됩니다.'));
    console.log();

    await runOnboardingShave();

    console.log('  다음 단계: ' + chalk.cyan('promptfuzz status'));
  } catch (err) {
    console.error(chalk.red('설치 실패:'), err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
