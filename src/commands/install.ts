import { installHook } from '../hooks/manager.js';
import { ensureDir } from '../state/storage.js';
import { runOnboardingShave } from '../state/onboarding.js';
import { theme } from '../ui/theme.js';

export async function installCommand(): Promise<void> {
  await ensureDir();

  try {
    const { alreadyInstalled } = await installHook();
    if (alreadyInstalled) {
      console.log(theme.warning('이미 설치되어 있습니다. ') + theme.dim('promptfuzz status로 확인해보세요.'));
      return;
    }
    console.log(theme.success('✓ PromptFuzz가 Claude Code에 연결되었습니다.'));
    console.log(theme.dim('  ~/.claude/settings.json에 Stop hook이 추가되었습니다.'));
    console.log();
    console.log(theme.info('🔒 PromptFuzz는 외부와 통신하지 않습니다.'));
    console.log(theme.dim('   모든 데이터는 이 컴퓨터에만 저장됩니다.'));
    console.log();

    await runOnboardingShave();

    console.log('  다음 단계: ' + theme.info('promptfuzz status'));
  } catch (err) {
    console.error(theme.danger('설치 실패:'), err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
