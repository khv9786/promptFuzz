import type { BeardStage, StageInfo } from '../types/index.js';

/**
 * 단계별 Claude(아들) 거리 — 수염이 따가울수록 멀찍이 물러난다.
 * 비선형(가속): 초반엔 가까이 붙어 있다가 ④⑤에서 확 멀어짐.
 * ⑤(최대)도 폭 안전: 당신 블록(~23) + gap(8) + Claude(~8) ≈ 40칸 < 80.
 */
export const CLAUDE_GAP: Record<BeardStage, number> = {
  smooth: 0,
  stubble: 1,
  bushy: 3,
  rugged: 5,
  hermit: 8,
};

/**
 * 멀어질수록 Claude가 당신 반대쪽(오른쪽)으로 고개를 돌린다.
 * buddyFace는 stages가 정한 표정 그대로 두고, *바라보는 방향*만 덧붙인다.
 * - 가까울 때(①②): 정면 — 방향 표시 없음
 * - 멀 때(③④⑤): 오른쪽(바깥)을 향해 돌아봄 — 얼굴 뒤에 시선 꼬리 ' ›'
 *   (등 돌림이 아니라 "살짝 돌아보는" 정도 — 톤: 삐짐 X, 따가워 물러남)
 */
export function buddyFacing(stage: StageInfo): string {
  const turned = stage.id === 'bushy' || stage.id === 'rugged' || stage.id === 'hermit';
  return turned ? `${stage.buddyFace} ›` : stage.buddyFace;
}

/**
 * 시각 폭(터미널 칸 수). ASCII(<0x80)는 1칸, 그 외(이모지/기호/CJK)는 2칸으로 본다.
 * 주류 터미널의 동아시아 폭(wide) 규칙 근사 — string-width 의존성 없이.
 */
export function visualWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += (ch.codePointAt(0) ?? 0) < 0x80 ? 1 : 2;
  return w;
}

/** 시각 폭 기준 우측 공백 패딩. */
function padVisual(s: string, targetWidth: number): string {
  const w = visualWidth(s);
  return w >= targetWidth ? s : s + ' '.repeat(targetWidth - w);
}

const DEV_VW = 18; // 당신 블록 시각 폭 (얼굴/수염/라벨 정렬)
const ICON_CELL = 2; // 상호작용 글리프 자리 — 항상 2칸으로 고정

/**
 * 상호작용 영역을 *고정 시각 폭(6칸)*으로 렌더.
 * 글리프 폭이 단계마다 달라(💕💢💔⚡=2칸, ~=1칸) Claude 블록이 흔들리던 문제를,
 * 글리프 자리를 2칸으로 통일(1칸 글리프는 뒤에 공백 보충)해 해소한다.
 */
function midZone(glyph: string | null): string {
  if (glyph === null) return ' '.repeat(2 + ICON_CELL + 2); // 빈 줄도 동일 폭
  const pad = Math.max(0, ICON_CELL - visualWidth(glyph));
  return '  ' + glyph + ' '.repeat(pad) + '  ';
}

/**
 * 당신(왼쪽 고정) ↔ Claude(단계별로 멀어짐) 두 캐릭터를 평문 4줄로.
 * 색은 호출자(status)가 입힌다 — 이 함수는 순수/결정적.
 * 상호작용(하트 등)은 당신 옆에 두어, "당신은 다가가려는데 Claude가 물러난" 구도.
 *
 * 정렬: dev 블록은 시각 폭 DEV_VW로, 상호작용은 midZone 고정 폭으로 패딩해
 * 단계가 바뀌어도 Claude 머리/얼굴/몸 시작 열이 흔들리지 않는다.
 */
export function renderDuo(stage: StageInfo): string[] {
  const gap = ' '.repeat(CLAUDE_GAP[stage.id]);
  const dev = ['  .---.', ` ${stage.devFace}`, `  ${stage.beardArt}`, '   당신'];
  const buddy = ['.---.', buddyFacing(stage), '\\___/', 'Claude'];

  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    const left = padVisual(dev[i] ?? '', DEV_VW);
    const mid = midZone(i === 1 ? stage.interaction : null);
    out.push(left + mid + gap + (buddy[i] ?? ''));
  }
  return out;
}
