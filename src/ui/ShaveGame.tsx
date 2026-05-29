import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { StageInfo } from '../types/index.js';
import { getStage } from '../state/stages.js';
import {
  INITIAL_SHAVE_STATE,
  reduceShave,
  requiredKeyCount,
  type ShaveAction,
  type ShaveStateInternal,
} from './shaveReducer.js';

const RULE = '━'.repeat(48);

export interface ShaveGameProps {
  currentStage: StageInfo;
  /** 완료 화면에 표시할 멘트 (마일스톤/단계별 — shave.ts가 결정). */
  completionMessage: string;
  onShaved: () => void; // 마지막 키 직후, performShave 호출 시점
  onCompleted: () => void; // 단계 3 표시 후 1초, 부모는 unmount + 전환
  onAbort: () => void; // q 또는 Ctrl+C
}

export function ShaveGame({
  currentStage,
  completionMessage,
  onShaved,
  onCompleted,
  onAbort,
}: ShaveGameProps): JSX.Element {
  const [state, setState] = useState<ShaveStateInternal>(INITIAL_SHAVE_STATE);
  const smooth = getStage('smooth');
  const requiredKeys = requiredKeyCount(currentStage.id);

  useInput((input, key) => {
    let action: ShaveAction;
    if ((key.ctrl && input === 'c') || input === 'q') {
      action = { type: 'quit' };
    } else if (key.leftArrow || key.rightArrow) {
      action = { type: 'arrow' };
    } else {
      action = { type: 'any-key' };
    }

    const { state: next, effect } = reduceShave(state, action, requiredKeys);
    if (effect === 'abort') {
      onAbort();
      return;
    }
    setState(next);
    if (effect === 'shaved') {
      onShaved();
      setTimeout(onCompleted, 1000);
    }
  });

  if (state.phase === 'intro') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">🪒 면도 시작</Text>
        <Text> </Text>
        <Text>    .---.</Text>
        <Text>   {currentStage.buddyFace}</Text>
        <Text>    {currentStage.beardArt}</Text>
        <Text>     당신</Text>
        <Text> </Text>
        <Text dimColor>{'"휴~ 자, 천천히 정리해볼까요"'}</Text>
        <Text> </Text>
        <Text dimColor>준비되시면 아무 키나 누르세요.</Text>
      </Box>
    );
  }

  if (state.phase === 'shaving') {
    const remaining = requiredKeys - state.progress;
    const beard = '▓'.repeat(remaining) + ' '.repeat(state.progress);
    const filled = '█'.repeat(state.progress);
    const empty = '░'.repeat(requiredKeys - state.progress);

    return (
      <Box flexDirection="column">
        <Text color="cyan">{RULE}</Text>
        <Text bold color="cyan">🪒 면도 중...</Text>
        <Text color="cyan">{RULE}</Text>
        <Text> </Text>
        <Text>    .---.</Text>
        <Text>   ( o o )</Text>
        <Text>    {`\\${beard}/`}</Text>
        <Text> </Text>
        <Text>{`[${filled}${empty}] ${state.progress}/${requiredKeys}`}</Text>
        <Text> </Text>
        <Text dimColor>← / → 키로 면도하세요.   q 로 중단</Text>
      </Box>
    );
  }

  // phase === 'done'
  return (
    <Box flexDirection="column">
      <Text> </Text>
      <Text>    .---.</Text>
      <Text color="green">   {smooth.buddyFace}</Text>
      <Text color="green">    {smooth.beardArt}</Text>
      <Text> </Text>
      <Text bold color="green">{completionMessage}</Text>
      <Text> </Text>
      <Text dimColor>→ 곧 스트레칭 카드를 띄울게요...</Text>
    </Box>
  );
}
