import { describe, it, expect } from 'vitest';
import { getCompletionMessage, stageCompletionMessage, milestoneLabel } from '../src/ui/completionMessage.js';

describe('getCompletionMessage 마일스톤', () => {
  it('1번째 → 첫 면도 멘트', () => {
    expect(getCompletionMessage(1, 'bushy')).toContain('첫 면도');
  });
  it('10번째 → 베테랑', () => {
    expect(getCompletionMessage(10, 'bushy')).toContain('10번째');
  });
  it('50번째 → 헌신', () => {
    expect(getCompletionMessage(50, 'rugged')).toContain('50번째');
  });
  it('100번째 → 전설', () => {
    expect(getCompletionMessage(100, 'hermit')).toContain('100번째');
  });

  it('마일스톤이 단계 멘트보다 우선 (1번째 hermit이어도 첫 면도)', () => {
    const msg = getCompletionMessage(1, 'hermit');
    expect(msg).toContain('첫 면도');
    expect(msg).not.toContain('살아나');
  });
});

describe('getCompletionMessage fallback (단계별)', () => {
  it('11번째(비마일스톤) → 단계별 멘트', () => {
    expect(getCompletionMessage(11, 'hermit')).toBe(stageCompletionMessage('hermit'));
    expect(getCompletionMessage(11, 'rugged')).toBe(stageCompletionMessage('rugged'));
  });

  it('51번째 → 단계 멘트 (마일스톤 아님)', () => {
    expect(getCompletionMessage(51, 'stubble')).toBe(stageCompletionMessage('stubble'));
  });

  it('shaveCount=0 (이론상) → fallback', () => {
    expect(getCompletionMessage(0, 'bushy')).toBe(stageCompletionMessage('bushy'));
  });
});

describe('stageCompletionMessage', () => {
  it('stubble → 부지런 멘트', () => {
    expect(stageCompletionMessage('stubble')).toContain('부지런');
  });
  it('rugged → 수고 멘트', () => {
    expect(stageCompletionMessage('rugged')).toContain('수고');
  });
  it('hermit → 살아나 멘트', () => {
    expect(stageCompletionMessage('hermit')).toContain('살아나');
  });
  it('smooth/bushy → 기본 시원 멘트', () => {
    expect(stageCompletionMessage('smooth')).toContain('시원');
    expect(stageCompletionMessage('bushy')).toContain('시원');
  });
});

describe('milestoneLabel (축하 박스 표시 판단)', () => {
  it('마일스톤(1/10/50/100) → 라벨 반환', () => {
    expect(milestoneLabel(1)).toContain('첫 면도');
    expect(milestoneLabel(10)).toContain('10번째');
    expect(milestoneLabel(50)).toContain('50번째');
    expect(milestoneLabel(100)).toContain('100번째');
  });
  it('비마일스톤 → null', () => {
    expect(milestoneLabel(0)).toBeNull();
    expect(milestoneLabel(2)).toBeNull();
    expect(milestoneLabel(11)).toBeNull();
    expect(milestoneLabel(99)).toBeNull();
  });
});
