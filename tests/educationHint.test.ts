import { describe, it, expect } from 'vitest';
import { educationHint } from '../src/ui/educationHint.js';

describe('educationHint', () => {
  it('1~5번째는 멘트 반환', () => {
    for (let i = 1; i <= 5; i++) {
      expect(educationHint(i)).not.toBeNull();
      expect(educationHint(i)).toContain('💡');
    }
  });

  it('6번째부터 null', () => {
    expect(educationHint(6)).toBeNull();
    expect(educationHint(100)).toBeNull();
  });

  it('각 회차 멘트가 서로 다름', () => {
    const msgs = [1, 2, 3, 4, 5].map((i) => educationHint(i));
    expect(new Set(msgs).size).toBe(5);
  });

  it('0이나 음수는 null', () => {
    expect(educationHint(0)).toBeNull();
    expect(educationHint(-1)).toBeNull();
  });
});
