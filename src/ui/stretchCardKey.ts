/**
 * StretchCard의 키 분류를 순수 함수로 추출.
 * Enter / s / q / 그 외 키를 의미 단위로 매핑한다.
 */

export type StretchKeyAction = 'complete' | 'swap' | 'abort' | 'noop';

export interface KeyFlags {
  return?: boolean;
  ctrl?: boolean;
}

export function classifyStretchKey(input: string, key: KeyFlags = {}): StretchKeyAction {
  if ((key.ctrl && input === 'c') || input === 'q') return 'abort';
  if (key.return) return 'complete';
  if (input === 's') return 'swap';
  return 'noop';
}
