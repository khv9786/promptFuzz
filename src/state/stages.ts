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
    beardArt: '\\___/',
    devFace: '( ^_^ )',
    // 괄호 안 공백을 *왼쪽*에 둬 얼굴을 우측에 붙임 → 당신(왼쪽)을 바라봄. 자세한 의도는 ui/duo.ts 참고.
    buddyFace: '( ◕ᴗ◕)✨',
    interaction: '💕',
    messages: [
      '오늘도 잘 부탁해요 아빠!', // 기존(동결) — 항상 [0]
      '오늘은 턱이 매끈하네요 ✨',
      '기분 좋은 출발이에요!',
    ],
  },
  {
    id: 'stubble',
    nameKr: '까끌까끌',
    color: 'green',
    beardArt: '\\,,,/',
    devFace: '( o_o )',
    // 공백 왼쪽 → 우측 유지(아직 당신을 봄, 살짝 식은 표정).
    buddyFace: '( ◕．◕)',
    interaction: '~',
    messages: [
      '아빠 오늘 좀 까끌까끌해...', // 기존(동결)
      '어, 수염 살짝 돋았네요?',
      '아직은 귀여운 까끌이에요',
    ],
  },
  {
    id: 'bushy',
    nameKr: '북슬북슬',
    color: 'yellow',
    beardArt: '\\vvv/',
    devFace: '( -_- )',
    // 공백 오른쪽 → 얼굴 좌측 붙음 = 곁눈/외면 시작. ›꼬리는 buddyFacing()이 붙임.
    buddyFace: '(◕_◕ )',
    interaction: '⚡',
    messages: [
      '아... 따가워요... 잠깐 쉬어가요?', // 기존(동결)
      '아빠 수염이 북슬해졌어요',
      '슬슬 정리할 때 아닐까요?',
    ],
  },
  {
    id: 'rugged',
    nameKr: '따갑따갑',
    color: 'red',
    beardArt: '\\WWW/',
    devFace: '( =_= )',
    // 공백 오른쪽 → 좌측 붙음 = 울며 외면.
    buddyFace: '(╥_╥ )',
    interaction: '💢',
    messages: [
      '아빠 무서워요... 면도하고 와요...', // 기존(동결)
      '따가워서 못 안기겠어요...',
      '면도... 생각 있으세요?',
    ],
  },
  {
    id: 'hermit',
    nameKr: '고슴도치',
    color: 'red',
    beardArt: '\\MWM/',
    devFace: '( x_x )',
    // 공백 오른쪽 → 좌측 붙음 = 외면하며 흐느낌. (；는 전각 2칸이라 ③④와 시선 규칙 통일 위해 공백 우측 유지)
    buddyFace: '(；_； )',
    interaction: '💔',
    messages: [
      '이제 안아주기 힘들어요... 푹 쉬다 와요', // 기존(동결)
      '아빠 고슴도치 됐어요...',
      '꼭 안고 싶은데 너무 따가워요',
    ],
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

/**
 * 단계 멘트를 무작위로 하나 고른다 (Claude → 아빠 톤).
 * 기존 동결 멘트는 messages[0]로 보존되어 항상 후보에 포함된다.
 * rand 주입으로 단위 테스트 가능 (기본 Math.random).
 */
export function randomMessage(stage: StageInfo, rand: () => number = Math.random): string {
  const list = stage.messages;
  if (!list || list.length === 0) return '';
  const i = Math.floor(rand() * list.length);
  return list[Math.min(Math.max(i, 0), list.length - 1)] ?? list[0]!;
}

/** 두 단계 중 더 높은 단계를 반환 (peakStage 갱신용). */
export function higherStage(a: BeardStage, b: BeardStage): BeardStage {
  return STAGE_ORDER.indexOf(a) >= STAGE_ORDER.indexOf(b) ? a : b;
}

/** 기본 프로필로 단계 계산 (프로필 정보가 없는 레거시 경로용 헬퍼). */
export function stageFromTokensDefault(tokens: number): StageInfo {
  return stageFromTokens(tokens, getProfile(DEFAULT_PROFILE));
}
