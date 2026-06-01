import { describe, it, expect } from 'vitest';
import { CLAUDE_GAP, buddyFacing, renderDuo } from '../src/ui/duo.js';
import { getStage, STAGE_ORDER } from '../src/state/stages.js';

describe('CLAUDE_GAP (거리두기)', () => {
  it('단계가 올라갈수록 거리가 멀어진다 (단조 증가)', () => {
    let prev = -1;
    for (const id of STAGE_ORDER) {
      const gap = CLAUDE_GAP[id];
      expect(gap).toBeGreaterThanOrEqual(prev);
      prev = gap;
    }
  });

  it('매끈은 가장 가깝고(0), 고슴도치는 가장 멀다', () => {
    expect(CLAUDE_GAP.smooth).toBe(0);
    expect(CLAUDE_GAP.hermit).toBeGreaterThan(CLAUDE_GAP.rugged);
  });
});

describe('buddyFacing (고개 돌림)', () => {
  it('가까운 단계(①②)는 정면 — 시선 꼬리 없음', () => {
    expect(buddyFacing(getStage('smooth'))).not.toContain('›');
    expect(buddyFacing(getStage('stubble'))).not.toContain('›');
  });

  it('먼 단계(③④⑤)는 돌아봄 — 시선 꼬리 포함', () => {
    expect(buddyFacing(getStage('bushy'))).toContain('›');
    expect(buddyFacing(getStage('rugged'))).toContain('›');
    expect(buddyFacing(getStage('hermit'))).toContain('›');
  });

  it('buddyFace 표정 자체는 보존', () => {
    expect(buddyFacing(getStage('hermit'))).toContain(getStage('hermit').buddyFace);
  });
});

describe('renderDuo', () => {
  it('항상 4줄 (머리/얼굴/몸/라벨)', () => {
    for (const id of STAGE_ORDER) {
      expect(renderDuo(getStage(id))).toHaveLength(4);
    }
  });

  it('당신/Claude 라벨이 마지막 줄에 함께', () => {
    const last = renderDuo(getStage('rugged'))[3]!;
    expect(last).toContain('당신');
    expect(last).toContain('Claude');
  });

  it('모든 단계가 터미널 폭 80 안 (들여쓰기 2 포함)', () => {
    for (const id of STAGE_ORDER) {
      const maxw = Math.max(...renderDuo(getStage(id)).map((l) => ('  ' + l).length));
      expect(maxw).toBeLessThan(80);
    }
  });

  it('단계가 멀수록 Claude 블록이 더 오른쪽으로 밀린다', () => {
    // gap이 커질수록 얼굴 줄이 길어짐 (Claude가 밀려나므로)
    const smoothLen = renderDuo(getStage('smooth'))[1]!.length;
    const hermitLen = renderDuo(getStage('hermit'))[1]!.length;
    expect(hermitLen).toBeGreaterThan(smoothLen);
  });
});
