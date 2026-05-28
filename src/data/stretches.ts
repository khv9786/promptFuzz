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
];

export function randomStretchCard(exclude: string[] = []): StretchCard {
  const available = STRETCH_CARDS.filter((c) => !exclude.includes(c.id));
  const pool = available.length > 0 ? available : STRETCH_CARDS;
  const card = pool[Math.floor(Math.random() * pool.length)];
  return card!;
}
