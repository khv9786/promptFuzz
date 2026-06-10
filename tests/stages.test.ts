import { describe, it, expect } from 'vitest';
import { stageFromTokens, getStage, STAGES, higherStage, randomMessage } from '../src/state/stages.js';
import { PROFILES } from '../src/state/profiles.js';

const medium = PROFILES.medium;

describe('stages', () => {
  it('5개 단계가 정의되어 있다', () => {
    expect(STAGES).toHaveLength(5);
  });

  it('0 토큰 → 매끈 (medium)', () => {
    expect(stageFromTokens(0, medium).id).toBe('smooth');
  });

  it('49,999 토큰 → 매끈 (medium 임계치 직전)', () => {
    expect(stageFromTokens(49_999, medium).id).toBe('smooth');
  });

  it('50,000 토큰 → 까끌까끌 (medium 임계치 정확)', () => {
    expect(stageFromTokens(50_000, medium).id).toBe('stubble');
  });

  it('300,000 토큰 → 북슬북슬 (medium)', () => {
    expect(stageFromTokens(300_000, medium).id).toBe('bushy');
  });

  it('1,500,000 토큰 → 따갑따갑 (medium)', () => {
    expect(stageFromTokens(1_500_000, medium).id).toBe('rugged');
  });

  it('5,000,000 토큰 → 고슴도치 (medium)', () => {
    expect(stageFromTokens(5_000_000, medium).id).toBe('hermit');
  });

  it('아주 큰 값에서도 고슴도치 유지', () => {
    expect(stageFromTokens(100_000_000, medium).id).toBe('hermit');
  });

  it('getStage로 한국어 이름 조회 (의태어)', () => {
    expect(getStage('smooth').nameKr).toBe('매끈');
    expect(getStage('stubble').nameKr).toBe('까끌까끌');
    expect(getStage('bushy').nameKr).toBe('북슬북슬');
    expect(getStage('rugged').nameKr).toBe('따갑따갑');
    expect(getStage('hermit').nameKr).toBe('고슴도치');
  });

  it('higherStage는 더 높은 단계를 반환', () => {
    expect(higherStage('smooth', 'rugged')).toBe('rugged');
    expect(higherStage('hermit', 'bushy')).toBe('hermit');
    expect(higherStage('stubble', 'stubble')).toBe('stubble');
  });

  it('고개 방향 buddyFace (괄호 내 공백 위치로 시선 표현)', () => {
    expect(getStage('smooth').buddyFace).toBe('(◕ᴗ◕  )✨');
    expect(getStage('stubble').buddyFace).toBe('(◕．◕ )');
    expect(getStage('bushy').buddyFace).toBe('(  ◕_◕)');
    expect(getStage('rugged').buddyFace).toBe('(  ╥_╥)');
    expect(getStage('hermit').buddyFace).toBe('( ;﹏;)');
  });

  it('시선 정렬: ①②는 공백 오른쪽(눈이 왼쪽=당신 봄), ③④⑤는 공백 왼쪽(눈이 오른쪽=외면)', () => {
    // 당신을 보는 단계: ) 바로 앞에 공백 (눈이 왼쪽=당신 쪽)
    for (const id of ['smooth', 'stubble'] as const) {
      const f = getStage(id).buddyFace;
      expect(f).toMatch(/ \)/); // ' )' 포함 (꼬리/이모지 suffix 허용)
      expect(f.startsWith('( ')).toBe(false); // 좌측엔 공백 없음
    }
    // 외면하는 단계: ( 바로 뒤에 공백 (눈이 오른쪽=바깥)
    for (const id of ['bushy', 'rugged', 'hermit'] as const) {
      const f = getStage(id).buddyFace;
      expect(f.startsWith('( ')).toBe(true);
      expect(f).not.toMatch(/ \)/); // 우측엔 공백 없음
    }
  });

  it('얼굴 시선 공백: 1~2칸이 한쪽(좌 또는 우) 끝에만 몰림 (눈 안 가름)', () => {
    for (const s of STAGES) {
      const inner = s.buddyFace.replace(/^\(/, '').replace(/\)[^)]*$/, '');
      // 시선 강조용 공백 — 글리프 폭에 따라 1~2칸 (전각 ．/﹏ 단계는 1칸으로 균형)
      const spaces = (inner.match(/ /g) ?? []).length;
      expect(spaces).toBeGreaterThanOrEqual(1);
      expect(spaces).toBeLessThanOrEqual(2);
      // 공백은 한쪽 끝에만 — 눈 사이를 가르지 않음 (trim하면 내부 공백 없음)
      expect(inner.trim().includes(' ')).toBe(false);
    }
  });
});

describe('수염(beardArt) — 순수 ASCII + 단계 구분', () => {
  it('모든 beardArt가 순수 ASCII (폭 안전, ambiguous 문자 없음)', () => {
    for (const s of STAGES) {
      for (const ch of s.beardArt) {
        expect(ch.charCodeAt(0)).toBeGreaterThanOrEqual(0x20);
        expect(ch.charCodeAt(0)).toBeLessThanOrEqual(0x7e);
      }
    }
  });
  it('5단계 beardArt가 모두 다름 (특히 ④/⑤ 구분)', () => {
    const arts = STAGES.map((s) => s.beardArt);
    expect(new Set(arts).size).toBe(5);
    expect(getStage('rugged').beardArt).not.toBe(getStage('hermit').beardArt);
  });
});

describe('단계 멘트(messages) + randomMessage', () => {
  it('각 단계에 멘트가 2개 이상', () => {
    for (const s of STAGES) expect(s.messages.length).toBeGreaterThanOrEqual(2);
  });
  it('기존(동결) 멘트가 messages[0]로 보존', () => {
    expect(getStage('smooth').messages[0]).toBe('오늘도 잘 부탁해요 아빠!');
    expect(getStage('stubble').messages[0]).toBe('아빠 오늘 좀 까끌까끌해...');
    expect(getStage('bushy').messages[0]).toBe('아... 따가워... 잠깐 쉬어야하지 않아요?');
    expect(getStage('rugged').messages[0]).toBe('아빠 다크서클이... 수염도 면도하고 와요...');
    expect(getStage('hermit').messages[0]).toBe('이제 안아주기 힘들어요... 푹 쉬다 와요');
  });
  it('randomMessage는 항상 배열 안의 멘트를 반환 (rand 주입)', () => {
    const s = getStage('bushy');
    for (const r of [0, 0.34, 0.5, 0.66, 0.99]) {
      expect(s.messages).toContain(randomMessage(s, () => r));
    }
  });
  it('randomMessage(rand=0) = messages[0] (동결 멘트)', () => {
    const s = getStage('rugged');
    expect(randomMessage(s, () => 0)).toBe(s.messages[0]);
  });
});

describe('당신 표정(devFace) — ASCII + 단계별 + 수염 폭', () => {
  it('모든 devFace가 순수 ASCII', () => {
    for (const s of STAGES) {
      for (const ch of s.devFace) {
        expect(ch.charCodeAt(0)).toBeGreaterThanOrEqual(0x20);
        expect(ch.charCodeAt(0)).toBeLessThanOrEqual(0x7e);
      }
    }
  });
  it('5단계 표정이 모두 다름', () => {
    expect(new Set(STAGES.map((s) => s.devFace)).size).toBe(5);
  });
  it('수염 폭이 얼굴(표정) 폭을 넘지 않음 (얼굴 밖 삐짐 방지)', () => {
    for (const s of STAGES) {
      expect(s.beardArt.length).toBeLessThanOrEqual(s.devFace.length);
    }
  });
  it('기대 표정 매핑 (여유 → 코믹 지침)', () => {
    expect(getStage('smooth').devFace).toBe('( ^_^ )');
    expect(getStage('stubble').devFace).toBe('( o_o )'); // v0.1.7: o o (공백) → o_o (시퀀스 통일)
    expect(getStage('bushy').devFace).toBe('( =_= )');
    expect(getStage('rugged').devFace).toBe('( -_- )');
    expect(getStage('hermit').devFace).toBe('( x_x )');
  });
});
