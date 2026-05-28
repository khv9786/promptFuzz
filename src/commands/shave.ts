import chalk from 'chalk';
import { performShave, recordStretchCard } from '../state/index.js';
import { randomStretchCard } from '../data/stretches.js';
import { loadState } from '../state/storage.js';

/**
 * v1 스켈레톤 구현. 인터랙티브 미니게임은 src/ui/ShaveGame.tsx에서 통합 예정.
 * 현재는 일관된 흐름만 검증한다: 면도 → 스트레칭 카드 → 리셋 안내.
 */
export async function shaveCommand(): Promise<void> {
  const before = await loadState();
  if (before.cumulativeTokens === 0) {
    console.log(chalk.green('✓ 이미 매끈해요. 굳이 면도할 필요는 없지만, 스트레칭은 어때요?'));
    console.log();
  } else {
    console.log(chalk.cyan('🪒 면도 시작...'));
    console.log(chalk.dim(`  ${before.cumulativeTokens.toLocaleString()} 토큰만큼 자랐던 수염을 정리합니다.`));
    console.log();
    await performShave();
    console.log(chalk.green('✓ 매끈해졌어요!'));
    console.log();
  }

  const card = randomStretchCard(before.stretchCardsShown);
  console.log(chalk.bold('🧘 ' + card.title));
  console.log();
  card.steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
  console.log();
  console.log(chalk.dim('  완료했어요? 다시 코딩하러 가도 좋아요.'));

  await recordStretchCard(card.id);
}
