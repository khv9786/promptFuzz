import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { StageInfo } from '../types/index.js';
import { getStage } from '../state/stages.js';
import { visualWidth } from './duo.js';
import {
  INITIAL_SHAVE_STATE,
  reduceShave,
  requiredKeyCount,
  shavedBeard,
  SHAVE_METHODS,
  methodFromKey,
  pickMissMessage,
  randomDir,
  judgeDirection,
  keyToDir,
  ALL_DIRS,
  DIR_GLYPH,
  PLUCK_WINDOW_MS,
  type ShaveStateInternal,
  type ShaveMethod,
  type ShaveDir,
} from './shaveReducer.js';

const RULE = '━'.repeat(48);

export interface ShaveGameProps {
  currentStage: StageInfo;
  /** 완료 화면에 표시할 멘트 (마일스톤/단계별 — shave.ts가 결정). */
  completionMessage: string;
  /** 마일스톤(1/10/50/100) 축하 라벨. 없으면 박스 미표시. */
  milestone?: string | null;
  onShaved: () => void; // 마지막 진행 직후, performShave 호출 시점
  onCompleted: () => void; // done 표시 후 1초, 부모는 unmount + 전환
  onAbort: () => void; // q 또는 Ctrl+C
}

/**
 * 면도 미니게임. 흐름: 방식 선택 → 방식별 진행 → done(before/after).
 * 진행 메커닉(progress/done 판정)은 reduceShave 재사용 — 방식마다 "한 단계 진행
 * 조건"만 다르다(레이저=타이머 자동, 전기=연타, 날=방향 맞추기, 손=1초 타이밍).
 * 비대화형은 shave.ts가 ShaveGame 없이 자동 처리하므로 여기엔 TTY 흐름만.
 */
export function ShaveGame({
  currentStage,
  completionMessage,
  milestone,
  onShaved,
  onCompleted,
  onAbort,
}: ShaveGameProps): JSX.Element {
  const [method, setMethod] = useState<ShaveMethod | null>(null); // null = 선택 화면
  const [state, setState] = useState<ShaveStateInternal>(INITIAL_SHAVE_STATE);
  const [target, setTarget] = useState<ShaveDir | null>(null); // 날/손 현재 목표 방향
  const [miss, setMiss] = useState<string | null>(null); // 따끔 메시지 (날/손)
  const [pluckRound, setPluckRound] = useState(0); // 손뽑기 1초 타이머 재시작 트리거

  const smooth = getStage('smooth');
  const requiredKeys = requiredKeyCount(currentStage.id);

  // 한 단계 진행 — 전기 연타/날 hit/손 hit/레이저 자동 1틱 공통.
  function step(): void {
    const { state: next, effect } = reduceShave(state, { type: 'arrow' }, requiredKeys);
    setMiss(null);
    setState(next);
    if (effect === 'shaved') {
      onShaved();
      setTimeout(onCompleted, 1000);
      return;
    }
    // 다음 목표 방향 (날/손 모두 상하좌우 사방). 레이저/전기는 목표 없음.
    if (method === 'blade' || method === 'pluck') {
      setTarget(randomDir(ALL_DIRS));
      if (method === 'pluck') setPluckRound((r) => r + 1); // 새 목표 → 1초 타이머 재시작
    }
  }

  // 틀림(또는 손뽑기 시간초과) — 한 칸 깎이고(게이지 빨강) *새 방향*을 다시 제시.
  function registerMiss(): void {
    setMiss(pickMissMessage());
    setState((s) => ({ ...s, progress: Math.max(0, s.progress - 1) })); // 한 칸 감소(0 바닥)
    setTarget(randomDir(ALL_DIRS));
    if (method === 'pluck') setPluckRound((r) => r + 1);
  }

  useInput((input, key) => {
    if ((key.ctrl && input === 'c') || input === 'q') {
      onAbort();
      return;
    }

    // 방식 선택 화면.
    if (method === null) {
      const m = methodFromKey(input);
      if (!m) return;
      setMethod(m);
      setState({ phase: 'shaving', progress: 0 });
      setMiss(null);
      if (m === 'blade' || m === 'pluck') {
        setTarget(randomDir(ALL_DIRS));
        if (m === 'pluck') setPluckRound((r) => r + 1);
      } else {
        setTarget(null);
      }
      return;
    }

    if (state.phase !== 'shaving') return;

    if (method === 'laser') return; // 자동 — 입력 무시(q만 위에서 처리)
    if (method === 'electric') {
      if (key.leftArrow || key.rightArrow) step();
      return;
    }
    // 날 면도기 / 손으로 뽑기 — 방향 판정.
    const pressed = keyToDir(key);
    if (pressed === null) return; // 방향키 외 무시
    if (target && judgeDirection(target, pressed) === 'hit') step();
    else registerMiss();
  });

  // 레이저: 진행 단계마다 타이머로 자동 1틱 (총 ~5초). progress 변화로 다음 틱 재예약.
  useEffect(() => {
    if (method !== 'laser' || state.phase !== 'shaving') return;
    const stepMs = Math.max(150, Math.floor(5000 / requiredKeys));
    const id = setTimeout(() => step(), stepMs);
    return () => clearTimeout(id);
    // step은 매 렌더 새로 만들어지며, progress/phase 변화 시 최신 step으로 재예약된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, state.phase, state.progress]);

  // 손으로 뽑기: 목표마다 1초 제한. 초과하면 따끔 + *새 방향* 제시(타이머 재시작).
  useEffect(() => {
    if (method !== 'pluck' || state.phase !== 'shaving') return;
    const id = setTimeout(() => registerMiss(), PLUCK_WINDOW_MS); // 시간초과 = 틀림과 동일 처리
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, state.phase, state.progress, pluckRound]);

  // ── 렌더 ──────────────────────────────────────────────────────────────

  // 1) 방식 선택
  if (method === null) {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">🪒 어떻게 면도할까요?</Text>
        <Text> </Text>
        {SHAVE_METHODS.map((m, i) => (
          <Text key={m.id}>{`  ${i + 1}) ${m.emoji} ${m.label}  — ${m.desc}`}</Text>
        ))}
        <Text> </Text>
        <Text dimColor>{'[1-4] 선택  ·  [q] 취소'}</Text>
      </Box>
    );
  }

  // 2) 면도 중 (방식별 프롬프트)
  if (state.phase === 'shaving') {
    const beard = shavedBeard(currentStage.beardArt, state.progress, requiredKeys);
    const filled = '█'.repeat(state.progress);
    const empty = '░'.repeat(requiredKeys - state.progress);
    const info = SHAVE_METHODS.find((m) => m.id === method)!;

    let prompt: string;
    if (method === 'laser') prompt = '⚡ 레이저 가동 중 — 가만히 계세요!';
    else if (method === 'electric') prompt = '← / → 키를 연타하세요!';
    else if (method === 'blade') prompt = `이 방향키를 누르세요:  [ ${target ? DIR_GLYPH[target] : '?'} ]`;
    else prompt = `1초 안에 누르세요!  [ ${target ? DIR_GLYPH[target] : '?'} ]`;

    return (
      <Box flexDirection="column">
        <Text color="cyan">{RULE}</Text>
        <Text bold color="cyan">{`🪒 면도 중... — ${info.emoji} ${info.label}`}</Text>
        <Text color="cyan">{RULE}</Text>
        <Text> </Text>
        <Text>    .---.</Text>
        <Text>{`   ${currentStage.devFace}`}</Text>
        <Text>{`    ${beard}`}</Text>
        <Text> </Text>
        <Text color={miss ? 'red' : undefined}>{`[${filled}${empty}] ${state.progress}/${requiredKeys}`}</Text>
        <Text> </Text>
        <Text bold>{prompt}</Text>
        <Text color="yellow">{miss ?? ' '}</Text>
        <Text> </Text>
        <Text dimColor>q 로 중단</Text>
      </Box>
    );
  }

  // 3) done — before/after 대비 + 마일스톤 박스 (기존 유지)
  const milestoneBody = milestone ? `  ${milestone}  축하해요!` : '';
  const milestoneRule = '  +' + '-'.repeat(visualWidth(milestoneBody));
  return (
    <Box flexDirection="column">
      <Text> </Text>
      <Text dimColor>  면도 전</Text>
      <Text>{`    ${currentStage.devFace}  ${currentStage.beardArt}`}</Text>
      <Text dimColor>{'      🪒  슥-삭...'}</Text>
      <Text color="green">  면도 후</Text>
      <Text color="green">{`    ${smooth.devFace}  ${smooth.beardArt} ✨`}</Text>
      <Text> </Text>
      <Text bold color="green">{completionMessage}</Text>
      {milestone ? (
        <>
          <Text> </Text>
          <Text color="yellow">{milestoneRule}</Text>
          <Text color="yellow">{`  |${milestoneBody}`}</Text>
          <Text color="yellow">{milestoneRule}</Text>
        </>
      ) : null}
      <Text> </Text>
      <Text dimColor>→ 곧 스트레칭 카드를 띄울게요...</Text>
    </Box>
  );
}
