import type { StretchCard } from '../types/index.js';

export const STRETCH_CARDS: StretchCard[] = [
  {
    id: 'turtle-neck',
    title: '거북목 스트레칭 (30초)',
    durationSeconds: 30,
    steps: [
      '어깨를 천천히 뒤로 5번 돌리기',
      '턱을 가슴으로 천천히 당기기',
      '좌우로 천천히 고개 돌리기',
    ],
  },
  {
    id: 'lower-back',
    title: '허리 스트레칭 (45초)',
    durationSeconds: 45,
    steps: [
      '의자에 앉은 채로 양손을 머리 뒤로',
      '천천히 좌우로 상체 비틀기 (각 5회)',
      '일어서서 허리 뒤로 살짝 젖히기',
    ],
  },
  {
    id: 'wrist',
    title: '손목 스트레칭 (30초)',
    durationSeconds: 30,
    steps: [
      '손바닥을 펴고 손가락을 반대 손으로 당기기',
      '주먹을 쥐고 손목 좌우로 천천히 돌리기',
      '양손을 깍지 끼고 앞으로 쭉 뻗기',
    ],
  },
  {
    id: 'shoulder',
    title: '어깨 스트레칭 (40초)',
    durationSeconds: 40,
    steps: [
      '오른팔을 가슴 앞으로 가로질러 왼손으로 당기기',
      '반대쪽도 동일하게 (각 15초)',
      '양어깨를 귀까지 들어올렸다 천천히 내리기 5회',
    ],
  },
  {
    id: 'eye',
    title: '눈 스트레칭 (20초)',
    durationSeconds: 20,
    steps: [
      '눈을 꼭 감았다 크게 뜨기 5번',
      '먼 곳을 20초간 응시 (창밖 추천)',
      '눈을 천천히 시계방향/반시계방향 돌리기',
    ],
  },
  {
    id: 'calf',
    title: '종아리 풀기',
    durationSeconds: 30,
    steps: [
      '발끝을 위로 5초 천천히 당기기',
      '발끝을 아래로 5초 천천히 펴기',
      '양 발 각 5회 반복',
    ],
  },
  {
    id: 'hip',
    title: '골반/엉덩이 풀기',
    durationSeconds: 45,
    steps: [
      '앉은 자세에서 한쪽 발목을 반대쪽 무릎 위에',
      '상체를 천천히 앞으로 숙이기',
      '15초 유지 후 반대쪽',
    ],
  },
  {
    id: 'ankle',
    title: '발목 회전',
    durationSeconds: 30,
    steps: [
      '한 발을 들고 발목을 시계방향으로 5회',
      '반시계방향으로 5회',
      '반대쪽 발도 동일하게',
    ],
  },
  {
    id: 'breathing',
    title: '깊은 호흡',
    durationSeconds: 30,
    steps: [
      '4초 들이쉬기',
      '4초 멈추기',
      '6초 천천히 내쉬기 — 3회 반복',
    ],
  },
  {
    id: 'eye-distance',
    title: '20-20-20 시선 멀리',
    durationSeconds: 20,
    steps: [
      '6m(20피트) 떨어진 곳을 응시',
      '20초간 천천히 시선 이동',
      '눈의 긴장이 풀리는 것을 느끼기',
    ],
  },
  {
    id: 'chest-open',
    title: '흉곽 열기',
    durationSeconds: 30,
    steps: [
      '두 손을 머리 뒤로 깍지 끼기',
      '팔꿈치를 뒤로 천천히 당기기',
      '가슴이 열리는 느낌으로 10초 × 3회',
    ],
  },
];

/**
 * exclude에 없는 카드 중 하나를 무작위로 고른다.
 * exclude가 모든 카드를 덮어 후보가 비면(전부 본 경우) 다시 풀지만,
 * exclude의 *마지막* id(= 가장 최근/현재 보고 있는 카드)만은 피한다 —
 * 's'로 카드를 넘길 때 같은 카드가 다시 떠 "안 넘어가는" 현상 방지.
 */
export function randomStretchCard(exclude: string[] = []): StretchCard {
  let pool = STRETCH_CARDS.filter((c) => !exclude.includes(c.id));
  if (pool.length === 0) {
    const last = exclude[exclude.length - 1];
    pool = STRETCH_CARDS.filter((c) => c.id !== last);
    if (pool.length === 0) pool = STRETCH_CARDS; // 카드가 1개뿐인 비현실적 경우
  }
  return pool[Math.floor(Math.random() * pool.length)]!;
}
