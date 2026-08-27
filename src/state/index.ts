import { loadState, saveState } from './storage.js';
import { scanAllSessions } from '../parser/index.js';
import { parseJsonlFile } from '../parser/jsonl-stream.js';
import { stageFromTokens } from './stages.js';
import { getProfile } from './profiles.js';
import {
  updateDailyTokens,
  recordDailyShave,
  recordDailyStretch,
  pruneOldEntries,
} from './dailyLog.js';
import type { BeardStage, PromptFuzzState, StageInfo } from '../types/index.js';
import type { HookInput } from '../parser/hookInput.js';

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
 *
 * @param hookInput Stop hook stdin에서 읽은 session_id/transcript_path. 있으면 현재
 *   세션 누적 토큰도 함께 갱신한다.
 */
export async function tick(hookInput: HookInput | null = null): Promise<TickResult> {
  const state = await loadState();
  const previousStage = state.currentStage;
  const profile = getProfile(state.thresholdProfile);

  const { totalDelta, updatedOffsets } = await scanAllSessions(state.lastJsonlOffset);

  const newCumulative = state.cumulativeTokens + totalDelta.total;
  const stage = stageFromTokens(newCumulative, profile);

  let updated: PromptFuzzState = {
    ...state,
    cumulativeTokens: newCumulative,
    lastJsonlOffset: updatedOffsets,
    currentStage: stage.id,
  };

  // 그날 활동 기록 (토큰 증가가 있을 때만) + 오래된 entry 정리.
  updated = updateDailyTokens(updated, totalDelta.total, stage.id);
  updated = { ...updated, dailyLog: pruneOldEntries(updated.dailyLog) };
  updated = await updateCurrentSession(updated, hookInput);

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
  let updated: PromptFuzzState = {
    ...state,
    cumulativeTokens: 0,
    currentStage: 'smooth',
    shaveHistory: [
      ...state.shaveHistory,
      { at: new Date().toISOString(), tokensAtShave: state.cumulativeTokens },
    ].slice(-30),
  };
  updated = recordDailyShave(updated);
  await saveState(updated);
  return updated;
}

export async function recordStretchCard(cardId: string): Promise<void> {
  const state = await loadState();
  const shown = [...state.stretchCardsShown, cardId].slice(-10);
  const updated = recordDailyStretch({ ...state, stretchCardsShown: shown });
  await saveState(updated);
}

/**
 * hookInput 기준으로 현재 세션 누적 토큰을 갱신. session_id가 바뀌면 처음부터 다시 센다.
 * 파일 접근 실패는 무시 — 세션 트래킹은 부가 정보라 렌더링을 막으면 안 됨.
 */
export async function updateCurrentSession(
  state: PromptFuzzState,
  hookInput: HookInput | null,
): Promise<PromptFuzzState> {
  if (!hookInput) return state;

  const prev = state.currentSession;
  const isNewSession = !prev || prev.id !== hookInput.sessionId;
  const offset = isNewSession ? 0 : prev.offset;
  const baseTokens = isNewSession ? 0 : prev.tokens;

  try {
    const { delta, newOffset } = await parseJsonlFile(hookInput.transcriptPath, offset);
    return {
      ...state,
      currentSession: {
        id: hookInput.sessionId,
        transcriptPath: hookInput.transcriptPath,
        tokens: baseTokens + delta.total,
        offset: newOffset,
      },
    };
  } catch {
    return state;
  }
}

export async function getCurrentState(): Promise<{
  state: PromptFuzzState;
  stage: StageInfo;
}> {
  const state = await loadState();
  const profile = getProfile(state.thresholdProfile);
  return { state, stage: stageFromTokens(state.cumulativeTokens, profile) };
}

/**
 * status 조회 횟수를 1 증가시키고 새 값을 반환.
 * 교육 멘트는 이 값(1부터)으로 결정한다.
 */
export async function incrementStatusView(): Promise<number> {
  const state = await loadState();
  const next = (state.statusViewCount ?? 0) + 1;
  await saveState({ ...state, statusViewCount: next });
  return next;
}
