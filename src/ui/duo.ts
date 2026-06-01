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

function pad(s: string, len: number): string {
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
}

const DEV_COL = 18; // 당신 블록 고정 폭 (얼굴/수염/라벨 정렬)

/**
 * 당신(왼쪽 고정) ↔ Claude(단계별로 멀어짐) 두 캐릭터를 평문 4줄로.
 * 색은 호출자(status)가 입힌다 — 이 함수는 순수/결정적.
 * 상호작용(하트 등)은 당신 옆에 두어, "당신은 다가가려는데 Claude가 물러난" 구도.
 */
export function renderDuo(stage: StageInfo): string[] {
  const gap = ' '.repeat(CLAUDE_GAP[stage.id]);
  const dev = ['  .---.', ` ${stage.devFace}`, `  ${stage.beardArt}`, '   당신'];
  const buddy = ['.---.', buddyFacing(stage), '\\___/', 'Claude'];

  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    const left = pad(dev[i] ?? '', DEV_COL);
    const mid = i === 1 ? `  ${stage.interaction}  ` : '     ';
    out.push(left + mid + gap + (buddy[i] ?? ''));
  }
  return out;
}
