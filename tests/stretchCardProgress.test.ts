import { describe, it, expect } from 'vitest';
import { computeProgressBar } from '../src/ui/stretchCardProgress.js';

describe('computeProgressBar', () => {
  it('정상 케이스: total=30, remaining=15, width=12 → filled=6, empty=6', () => {
    const r = computeProgressBar({ totalSeconds: 30, remainingSeconds: 15, barWidth: 12 });
    expect(r.filled).toBe(6);
    expect(r.empty).toBe(6);
    expect(r.bar).toBe('██████░░░░░░');
    expect(r.isOverdue).toBe(false);
  });

  it('시간 다 됐을 때: total=30, remaining=0 → filled=12, empty=0, isOverdue=true', () => {
    const r = computeProgressBar({ totalSeconds: 30, remainingSeconds: 0, barWidth: 12 });
    expect(r.filled).toBe(12);
    expect(r.empty).toBe(0);
    expect(r.bar).toBe('████████████');
    expect(r.isOverdue).toBe(true);
  });

  it('회귀 케이스: 음수 remaining → 크래시 없이 안전, isOverdue=true', () => {
    const r = computeProgressBar({ totalSeconds: 30, remainingSeconds: -5, barWidth: 12 });
    // 본 핫픽스의 진짜 회귀 가드: '█'.repeat(음수) 호출이 일어나면 안 됨.
    expect(() => r.bar).not.toThrow();
    expect(r.filled).toBe(12);
    expect(r.empty).toBe(0);
    expect(r.isOverdue).toBe(true);
  });

  it('시작 시점: total=30, remaining=30 → filled=0, empty=12', () => {
    const r = computeProgressBar({ totalSeconds: 30, remainingSeconds: 30, barWidth: 12 });
    expect(r.filled).toBe(0);
    expect(r.empty).toBe(12);
    expect(r.bar).toBe('░░░░░░░░░░░░');
    expect(r.isOverdue).toBe(false);
  });

  it('s 키 회귀 시나리오: total=15, remaining=25 → 안전 클램프 (음수 elapsed 차단)', () => {
    const r = computeProgressBar({ totalSeconds: 15, remainingSeconds: 25, barWidth: 12 });
    // remaining > total이면 clamp 후 elapsed = 0 → filled = 0
    expect(r.filled).toBe(0);
    expect(r.empty).toBe(12);
    expect(r.isOverdue).toBe(false);
  });

  it('엣지: totalSeconds=0 → isOverdue=true, 완전히 찬 바', () => {
    const r = computeProgressBar({ totalSeconds: 0, remainingSeconds: 0, barWidth: 12 });
    expect(r.filled).toBe(12);
    expect(r.bar).toBe('████████████');
    expect(r.isOverdue).toBe(true);
  });

  it('엣지: barWidth=0 → 빈 바 (출력 무해)', () => {
    const r = computeProgressBar({ totalSeconds: 30, remainingSeconds: 10, barWidth: 0 });
    expect(r.filled).toBe(0);
    expect(r.empty).toBe(0);
    expect(r.bar).toBe('');
  });

  it('엣지: totalSeconds가 음수 → 안전한 기본값 (완전히 찬 바)', () => {
    const r = computeProgressBar({ totalSeconds: -10, remainingSeconds: 5, barWidth: 12 });
    expect(r.filled).toBe(12);
    expect(r.bar.length).toBe(12);
    expect(r.isOverdue).toBe(true);
  });

  it('극단: remaining이 매우 음수 (-100) + total=15 → 크래시 없이 isOverdue=true', () => {
    const r = computeProgressBar({ totalSeconds: 15, remainingSeconds: -100, barWidth: 12 });
    expect(() => r.bar).not.toThrow();
    expect(r.filled).toBe(12);
    expect(r.empty).toBe(0);
    expect(r.isOverdue).toBe(true);
  });
});
