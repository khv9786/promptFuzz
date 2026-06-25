import { describe, it, expect } from 'vitest';
import { STRETCH_CARDS, randomStretchCard } from '../src/data/stretches.js';

describe('STRETCH_CARDS', () => {
  it('총 11장', () => {
    expect(STRETCH_CARDS).toHaveLength(11);
  });

  it('새 6장 id가 존재', () => {
    const ids = STRETCH_CARDS.map((c) => c.id);
    for (const id of ['calf', 'hip', 'ankle', 'breathing', 'eye-distance', 'chest-open']) {
      expect(ids).toContain(id);
    }
  });

  it('기존 5장 id가 보존됨', () => {
    const ids = STRETCH_CARDS.map((c) => c.id);
    for (const id of ['turtle-neck', 'lower-back', 'wrist', 'shoulder', 'eye']) {
      expect(ids).toContain(id);
    }
  });

  it('모든 카드 durationSeconds > 0, step 1개 이상', () => {
    for (const c of STRETCH_CARDS) {
      expect(c.durationSeconds).toBeGreaterThan(0);
      expect(c.steps.length).toBeGreaterThan(0);
      expect(c.title.length).toBeGreaterThan(0);
    }
  });

  it('id 중복 없음', () => {
    const ids = STRETCH_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('randomStretchCard', () => {
  it('shown에 없는 카드를 우선 선택', () => {
    const shown = STRETCH_CARDS.slice(0, 10).map((c) => c.id);
    // 11장 중 10장을 봤으면 남은 1장(마지막)이 선택돼야 함
    const card = randomStretchCard(shown);
    expect(card.id).toBe(STRETCH_CARDS[10]!.id);
  });

  it('전부 봤으면 fallback (전체 풀에서 선택, 에러 없음)', () => {
    const allShown = STRETCH_CARDS.map((c) => c.id);
    const card = randomStretchCard(allShown);
    expect(STRETCH_CARDS.map((c) => c.id)).toContain(card.id);
  });

  it('shown 비었으면 어떤 카드든 반환', () => {
    const card = randomStretchCard([]);
    expect(card).toBeDefined();
    expect(card.id).toBeTruthy();
  });

  it("'s' 넘기기 — 현재 카드(exclude에 포함)는 다시 안 나온다", () => {
    // pickNext가 [...shown, 현재id]로 호출 → 현재 카드 제외 보장
    for (let i = 0; i < 30; i++) {
      expect(randomStretchCard(['wrist']).id).not.toBe('wrist');
    }
  });

  it('전부 봤어도 현재 카드(exclude 마지막)는 다시 안 나온다 (fallback)', () => {
    const all = STRETCH_CARDS.map((c) => c.id); // 마지막 = chest-open (= 현재 카드 가정)
    for (let i = 0; i < 30; i++) {
      expect(randomStretchCard(all).id).not.toBe(all[all.length - 1]);
    }
  });
});
