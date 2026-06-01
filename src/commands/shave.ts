import { performShave, recordStretchCard } from '../state/index.js';
import { randomStretchCard } from '../data/stretches.js';
import { loadState } from '../state/storage.js';
import { getStage } from '../state/stages.js';
import { getCompletionMessage, milestoneLabel } from '../ui/completionMessage.js';
import { theme } from '../ui/theme.js';
import type { PromptFuzzState } from '../types/index.js';

export interface ShaveOptions {
  /** 테스트 주입용. 미지정 시 process.stdin.isTTY 사용. */
  isTTY?: boolean;
}

export async function shaveCommand(opts: ShaveOptions = {}): Promise<void> {
  const isTTY = opts.isTTY ?? Boolean((process.stdin as NodeJS.ReadStream).isTTY);
  const before = await loadState();

  if (!isTTY) {
    await runNonInteractive(before);
    return;
  }

  await runInteractive(before);
}

/**
 * 비대화형 흐름 — Ink를 import하지 않는다.
 * Claude Code hook 환경/CI에서 안전하게 동작.
 */
async function runNonInteractive(before: PromptFuzzState): Promise<void> {
  if (before.cumulativeTokens === 0) {
    console.log(theme.success('✓ 이미 매끈해요. 굳이 면도할 필요는 없지만, 스트레칭은 어때요?'));
    console.log();
  } else {
    console.log(theme.info('🪒 면도 시작...'));
    console.log(theme.dim(`  ${before.cumulativeTokens.toLocaleString()} 토큰만큼 자랐던 수염을 정리합니다.`));
    console.log();
    await performShave();
    console.log(theme.success('✓ 매끈해졌어요!'));
    console.log();
  }

  const card = randomStretchCard(before.stretchCardsShown);
  console.log(theme.bold('🧘 ' + card.title));
  console.log();
  card.steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
  console.log();
  console.log(theme.dim('  완료했어요? 다시 코딩하러 가도 좋아요.'));

  await recordStretchCard(card.id);
}

/**
 * 대화형 흐름 — Ink dynamic import. ShaveGame → StretchCard 순.
 * onAbort나 cumulativeTokens===0이면 ShaveGame은 스킵.
 */
async function runInteractive(before: PromptFuzzState): Promise<void> {
  const ink = await import('ink');
  const React = await import('react');
  const { ShaveGame } = await import('../ui/ShaveGame.js');
  const { StretchCard } = await import('../ui/StretchCard.js');

  if (before.cumulativeTokens === 0) {
    console.log(theme.success('✓ 이미 매끈해요. 굳이 면도할 필요는 없지만, 스트레칭은 어때요?'));
    console.log();
    await runStretchCardModal(ink, React, StretchCard, before.stretchCardsShown);
    return;
  }

  console.log(theme.info('🪒 면도 시작...'));
  console.log(theme.dim(`  ${before.cumulativeTokens.toLocaleString()} 토큰만큼 자랐던 수염을 정리합니다.`));
  console.log();

  // 완료 멘트는 면도 *후* 횟수(현재 history + 1)와 면도 직전 단계로 결정.
  const projectedShaveCount = before.shaveHistory.length + 1;
  const completionMessage = getCompletionMessage(projectedShaveCount, before.currentStage);

  const result = await new Promise<'completed' | 'aborted'>((resolve) => {
    const app = ink.render(
      React.createElement(ShaveGame, {
        currentStage: getStage(before.currentStage),
        completionMessage,
        milestone: milestoneLabel(projectedShaveCount),
        onShaved: () => {
          void performShave();
        },
        onCompleted: () => {
          app.unmount();
          resolve('completed');
        },
        onAbort: () => {
          app.unmount();
          resolve('aborted');
        },
      }),
    );
    void app.waitUntilExit();
  });

  if (result === 'aborted') {
    console.log(theme.warning('다음에 면도해요.'));
    return;
  }

  await runStretchCardModal(ink, React, StretchCard, before.stretchCardsShown);
}

async function runStretchCardModal(
  ink: typeof import('ink'),
  React: typeof import('react'),
  StretchCardComp: typeof import('../ui/StretchCard.js')['StretchCard'],
  shown: string[],
): Promise<void> {
  const initialCard = randomStretchCard(shown);

  await new Promise<void>((resolve) => {
    const app = ink.render(
      React.createElement(StretchCardComp, {
        initialCard,
        pickNext: () => randomStretchCard(shown),
        onComplete: (cardId: string) => {
          void recordStretchCard(cardId);
          app.unmount();
          resolve();
        },
        onAbort: () => {
          app.unmount();
          resolve();
        },
      }),
    );
    void app.waitUntilExit();
  });
}
