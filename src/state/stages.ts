import type { BeardStage, StageInfo } from '../types/index.js';

export const STAGES: StageInfo[] = [
  {
    id: 'smooth',
    nameKr: '매끈',
    threshold: 0,
    color: 'green',
    beardArt: '\\_‿_/',
    buddyFace: '(◕ᴗ◕)',
    interaction: '💕',
    message: '오늘도 잘 부탁해요 아빠!',
  },
  {
    id: 'stubble',
    nameKr: '까칠',
    threshold: 10_000,
    color: 'green',
    beardArt: '\\.\'.\'./',
    buddyFace: '(•_• )',
    interaction: '~',
    message: '아빠 오늘 좀 까끌까끌해...',
  },
  {
    id: 'bushy',
    nameKr: '더부룩',
    threshold: 50_000,
    color: 'yellow',
    beardArt: '\\▒▒▒/',
    buddyFace: '(>﹏<)',
    interaction: '⚡',
    message: '아... 따가워요... 잠깐 쉬어가요?',
  },
  {
    id: 'rugged',
    nameKr: '산적',
    threshold: 200_000,
    color: 'red',
    beardArt: '\\▓▓▓/',
    buddyFace: '(╥﹏╥)',
    interaction: '💢',
    message: '아빠 무서워요... 면도하고 와요...',
  },
  {
    id: 'hermit',
    nameKr: '헤르미트',
    threshold: 500_000,
    color: 'red',
    beardArt: '\\███/',
    buddyFace: '(;﹏;)',
    interaction: '💔',
    message: '이제 안아주기 힘들어요... 푹 쉬다 와요',
  },
];

export function stageFromTokens(tokens: number): StageInfo {
  let current = STAGES[0]!;
  for (const stage of STAGES) {
    if (tokens >= stage.threshold) {
      current = stage;
    } else {
      break;
    }
  }
  return current;
}

export function getStage(id: BeardStage): StageInfo {
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}
