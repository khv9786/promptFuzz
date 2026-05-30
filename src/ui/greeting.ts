/**
 * 시간대별 인사 (Claude → 아빠 톤). content-blind — *시계(hour)만* 읽으며
 * 모델/메시지 내용은 일절 보지 않는다.
 *
 * 아침(5~10) · 낮(11~16, 인사 생략) · 저녁(17~22) · 새벽/밤(23~4).
 * @param hour 0~23 (보통 new Date().getHours())
 */
export function timeOfDayGreeting(hour: number): string | null {
  if (hour >= 5 && hour < 11) return '좋은 아침이에요!';
  if (hour >= 17 && hour < 23) return '오늘도 고생 많았어요';
  if (hour >= 23 || hour < 5) return '이 시간까지...? 무리하지 마요';
  return null; // 낮(11~16): 기본 인사 생략
}
