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
 * 고개 방향 = 친밀도. 시선은 두 신호가 함께 만든다:
 *   (1) 괄호 *내부* 공백 위치 (stages.buddyFace가 정함) —
 *       ①② 공백 오른쪽 `(◕ᴗ◕ )` → 눈이 왼쪽 = 당신(왼쪽)을 봄,
 *       ③④⑤ 공백 왼쪽 `( ◕_◕)` → 눈이 오른쪽 = 바깥을 봄(외면).
 *   (2) 시선 꼬리 `›` — 외면 단계(③④⑤)에만 얼굴 뒤에 붙인다.
 * 머리(.---.)·몸(\___/)은 고정이고 괄호 안 공백만 좌우로 옮기므로,
 * "몸 회전"이 아니라 *고개만* 돌린 느낌이 된다. (얼굴 총 폭은 불변)
 */
export function buddyFacing(stage: StageInfo): string {
  const turned = stage.id === 'bushy' || stage.id === 'rugged' || stage.id === 'hermit';
  return turned ? `${stage.buddyFace}›` : stage.buddyFace;
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
const MID = ' '.repeat(6); // 당신↔Claude 고정 간격 — 순수 ASCII(가변폭 글리프 없음)

/**
 * 당신(왼쪽 고정) ↔ Claude(단계별로 멀어짐) 두 캐릭터를 평문 4줄로.
 * 색은 호출자(status)가 입힌다 — 이 함수는 순수/결정적.
 *
 * 정렬: dev 블록을 시각 폭 DEV_VW로 맞추고, 그 뒤엔 MID(고정 ASCII 간격)+거리(gap)만
 * 둬서 Claude 머리/얼굴/몸/라벨이 *모든 줄에서 같은 열*에서 시작한다.
 * 상호작용 글리프(하트 등)는 이모지라 터미널마다 폭이 달라(특히 레거시 cmd) Claude
 * *앞*에 두면 얼굴 줄만 밀린다 → *얼굴 줄 맨 끝*(Claude 뒤)에 붙여 Claude 앞을
 * 순수 ASCII로 고정한다. (귀여움은 유지, 정렬만 안정화)
 */
export function renderDuo(stage: StageInfo): string[] {
  const gap = ' '.repeat(CLAUDE_GAP[stage.id]);
  const dev = ['  .---.', ` ${stage.devFace}`, `  ${stage.beardArt}`, '   당신'];
  const buddy = ['.---.', buddyFacing(stage), '\\___/', 'Claude'];

  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    const left = padVisual(dev[i] ?? '', DEV_VW);
    // 상호작용(하트)은 얼굴 줄에만, Claude *뒤*에. (앞에 두면 이모지 폭 때문에 정렬이 깨짐)
    const tail = i === 1 ? ` ${stage.interaction}` : '';
    out.push(left + MID + gap + (buddy[i] ?? '') + tail);
  }
  return out;
}
