import { describe, it, expect } from 'vitest';
import { renderStageChange, stageLabel } from '../src/commands/tickRender.js';
import { getStage } from '../src/state/stages.js';

describe('stageLabel', () => {
  it('번호 + 한국어 이름', () => {
    expect(stageLabel('smooth')).toBe('① 매끈');
    expect(stageLabel('rugged')).toBe('④ 따갑따갑');
  });
});

describe('renderStageChange compact', () => {
  it('축약 모드 = 1줄', () => {
    const lines = renderStageChange({
      stage: getStage('rugged'),
      previousStage: 'smooth',
      compact: true,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('① 매끈 → ④ 따갑따갑');
    expect(lines[0]).toContain('promptfuzz shave');
  });

  it('축약 모드 stubble은 shave 안내 없음', () => {
    const lines = renderStageChange({
      stage: getStage('stubble'),
      previousStage: 'smooth',
      compact: true,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('promptfuzz shave');
  });
});

describe('renderStageChange 기본(5줄+)', () => {
  it('구분선 + 헤더 + 멘트 포함', () => {
    const lines = renderStageChange({
      stage: getStage('rugged'),
      previousStage: 'bushy',
      compact: false,
    });
    const out = lines.join('\n');
    expect(out).toContain('━');
    expect(out).toContain('수염이 자랐어요');
    expect(out).toContain('③ 북슬북슬 → ④ 따갑따갑');
    expect(out).toContain('promptfuzz shave');
    expect(lines.length).toBeGreaterThan(5);
  });

  it('stubble은 shave 안내 줄 없음', () => {
    const lines = renderStageChange({
      stage: getStage('stubble'),
      previousStage: 'smooth',
      compact: false,
    });
    expect(lines.join('\n')).not.toContain('promptfuzz shave');
  });
});
