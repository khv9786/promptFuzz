import { uninstallHook } from '../hooks/manager.js';
import { theme } from '../ui/theme.js';

export async function uninstallCommand(): Promise<void> {
  try {
    const { removed } = await uninstallHook();
    if (removed) {
      console.log(theme.success('✓ PromptFuzz hook이 제거되었습니다.'));
      console.log(theme.dim('  ~/.promptfuzz/는 그대로 두었습니다. 완전 삭제하려면 직접 지워주세요.'));
    } else {
      console.log(theme.warning('설치된 hook이 없습니다.'));
    }
  } catch (err) {
    console.error(theme.danger('제거 실패:'), err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
