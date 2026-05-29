import type { BeardStage, StageInfo } from '../types/index.js';
import type { ThresholdProfile } from './profiles.js';
import { getProfile, DEFAULT_PROFILE } from './profiles.js';

/**
 * 단계 표시 정보. 임계치(threshold)는 프로필로 분리됐으므로 여기엔 없다.
 * 멘트/표정/색상/한국어 이름은 프로필과 무관하게 고정.
 */
export const STAGES: StageInfo[] = [
  {
    id: 'smooth',
    nameKr: '매끈',
    color: 'green',
    beardArt: '\\_‿_/',
    buddyFace: '(◕ᴗ◕)✨',
    interaction: '💕',
    message: '오늘도 잘 부탁해요 아빠!',
  },
  {
    id: 'stubble',
    nameKr: '까끌까끌',
    color: 'green',
    beardArt: '\\.\'.\'./',
    buddyFace: '(•_• )?',
    interaction: '~',
    message: '아빠 오늘 좀 까끌까끌해...',
  },
  {
    id: 'bushy',
    nameKr: '북슬북슬',
    color: 'yellow',
    beardArt: '\\▒▒▒/',
    buddyFace: '(>﹏<;)',
    interaction: '⚡',
    message: '아... 따가워요... 잠깐 쉬어가요?',
  },
  {
    id: 'rugged',
    nameKr: '따갑따갑',
    color: 'red',
    beardArt: '\\▓▓▓/',
    buddyFace: '(╥﹏╥)💧',
    interaction: '💢',
    message: '아빠 무서워요... 면도하고 와요...',
  },
  {
    id: 'hermit',
    nameKr: '고슴도치',
    color: 'red',
    beardArt: '\\███/',
    buddyFace: '(;﹏;)🆘',
    interaction: '💔',
    message: '이제 안아주기 힘들어요... 푹 쉬다 와요',
  },
];

/** STAGES의 단계 순서 인덱스. peakStage 비교 등에 사용. */
export const STAGE_ORDER: BeardStage[] = STAGES.map((s) => s.id);

/**
 * 누적 토큰 + 프로필로 현재 단계를 계산한다.
 * 프로필은 필수 인자 — 호출처가 state.thresholdProfile을 명시 전달하게 강제.
 */
export function stageFromTokens(tokens: number, profile: ThresholdProfile): StageInfo {
  const t = profile.thresholds;
  // 높은 단계부터 검사.
  if (tokens >= t.hermit) return getStage('hermit');
  if (tokens >= t.rugged) return getStage('rugged');
  if (tokens >= t.bushy) return getStage('bushy');
  if (tokens >= t.stubble) return getStage('stubble');
  return getStage('smooth');
}

export function getStage(id: BeardStage): StageInfo {
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}

/** 두 단계 중 더 높은 단계를 반환 (peakStage 갱신용). */
export function higherStage(a: BeardStage, b: BeardStage): BeardStage {
  return STAGE_ORDER.indexOf(a) >= STAGE_ORDER.indexOf(b) ? a : b;
}

/** 기본 프로필로 단계 계산 (프로필 정보가 없는 레거시 경로용 헬퍼). */
export function stageFromTokensDefault(tokens: number): StageInfo {
  return stageFromTokens(tokens, getProfile(DEFAULT_PROFILE));
}
