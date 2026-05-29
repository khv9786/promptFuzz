export interface QuietHours {
  start: number; // 0-23
  end: number; // 0-23
}

export function isValidQuietHours(v: unknown): v is QuietHours | null {
  if (v === null) return true;
  if (typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.start === 'number' &&
    typeof o.end === 'number' &&
    Number.isInteger(o.start) &&
    Number.isInteger(o.end) &&
    o.start >= 0 &&
    o.start <= 23 &&
    o.end >= 0 &&
    o.end <= 23
  );
}

/**
 * "23-07" 같은 문자열을 파싱. "off"는 null. 잘못된 형식은 undefined(거부).
 */
export function parseQuietHours(raw: string): QuietHours | null | undefined {
  const s = raw.trim().toLowerCase();
  if (s === 'off') return null;
  const m = s.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return undefined;
  const start = parseInt(m[1]!, 10);
  const end = parseInt(m[2]!, 10);
  if (start < 0 || start > 23 || end < 0 || end > 23) return undefined;
  if (start === end) return undefined; // 0시간 범위는 의미 없음
  return { start, end };
}

/**
 * 주어진 시각(hour 0-23)이 quiet 범위 안인지.
 * start > end면 자정 넘는 범위 (예: 23-07 = 23,0,1,...,6).
 * 경계: start 포함, end 제외.
 */
export function isQuietNow(quiet: QuietHours | null, hour: number): boolean {
  if (!quiet) return false;
  const { start, end } = quiet;
  if (start < end) {
    return hour >= start && hour < end;
  }
  // 자정 넘김.
  return hour >= start || hour < end;
}

export function formatQuietHours(quiet: QuietHours | null): string {
  if (!quiet) return 'off';
  return `${String(quiet.start).padStart(2, '0')}-${String(quiet.end).padStart(2, '0')}`;
}
