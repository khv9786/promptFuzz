import { loadState, saveState } from './storage.js';
import { scanAllSessions } from '../parser/index.js';
import { stageFromTokens } from './stages.js';
import type { BeardStage, PromptFuzzState, StageInfo } from '../types/index.js';

export interface TickResult {
  state: PromptFuzzState;
  stage: StageInfo;
  stageChanged: boolean;
  previousStage: BeardStage;
  newTokens: number;
}

/**
 * Hook이 호출하는 핵심 갱신 함수.
 * JSONL을 스캔해 새 토큰을 합산하고, 단계 변화를 감지한다.
 */
export async function tick(): Promise<TickResult> {
  const state = await loadState();
  const previousStage = state.currentStage;

  const { totalDelta, updatedOffsets } = await scanAllSessions(state.lastJsonlOffset);

  const newCumulative = state.cumulativeTokens + totalDelta.total;
  const stage = stageFromTokens(newCumulative);

  const updated: PromptFuzzState = {
    ...state,
    cumulativeTokens: newCumulative,
    lastJsonlOffset: updatedOffsets,
    currentStage: stage.id,
  };

  await saveState(updated);

  return {
    state: updated,
    stage,
    stageChanged: stage.id !== previousStage,
    previousStage,
    newTokens: totalDelta.total,
  };
}

/**
 * 면도 — 카운터를 0으로 리셋하고 이력에 기록한다.
 * JSONL offset은 유지 (이미 읽은 내용을 다시 읽지 않기 위해).
 */
export async function performShave(): Promise<PromptFuzzState> {
  const state = await loadState();
  const updated: PromptFuzzState = {
    ...state,
    cumulativeTokens: 0,
    currentStage: 'smooth',
    shaveHistory: [
      ...state.shaveHistory,
      { at: new Date().toISOString(), tokensAtShave: state.cumulativeTokens },
    ].slice(-30),
  };
  await saveState(updated);
  return updated;
}

export async function recordStretchCard(cardId: string): Promise<void> {
  const state = await loadState();
  const shown = [...state.stretchCardsShown, cardId].slice(-10);
  await saveState({ ...state, stretchCardsShown: shown });
}

export async function getCurrentState(): Promise<{
  state: PromptFuzzState;
  stage: StageInfo;
}> {
  const state = await loadState();
  return { state, stage: stageFromTokens(state.cumulativeTokens) };
}
