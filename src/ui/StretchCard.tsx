import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { StretchCard as StretchCardData } from '../types/index.js';
import { classifyStretchKey } from './stretchCardKey.js';

export interface StretchCardProps {
  initialCard: StretchCardData;
  pickNext: () => StretchCardData;            // s 키 — 다른 카드 (Enter 전까지 기록 안 함)
  onComplete: (cardId: string) => void;       // Enter
  onAbort: () => void;                         // q 또는 Ctrl+C
}

export function StretchCard({ initialCard, pickNext, onComplete, onAbort }: StretchCardProps): JSX.Element {
  const [card, setCard] = useState(initialCard);
  const [remaining, setRemaining] = useState(initialCard.durationSeconds);

  // 카드가 바뀌면 카운트다운 리셋.
  useEffect(() => {
    setRemaining(card.durationSeconds);
  }, [card.id, card.durationSeconds]);

  // 1초마다 감소, 0에서 멈춤 (자동 종료 X).
  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [card.id]);

  useInput((input, key) => {
    const action = classifyStretchKey(input, key);
    if (action === 'abort') {
      onAbort();
      return;
    }
    if (action === 'complete') {
      onComplete(card.id);
      return;
    }
    if (action === 'swap') {
      setCard(pickNext());
    }
  });

  const total = card.durationSeconds;
  const elapsed = total - remaining;
  const filledCount = total > 0 ? Math.floor((elapsed / total) * 12) : 12;
  const bar = '█'.repeat(filledCount) + '░'.repeat(Math.max(0, 12 - filledCount));
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const timeUp = remaining === 0;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={2}>
      <Text bold>🧘 {card.title}</Text>
      <Text> </Text>
      {card.steps.map((step, i) => (
        <Text key={i}>  {i + 1}. {step}</Text>
      ))}
      <Text> </Text>
      {timeUp ? (
        <Text color="green">✓ 시간 됐어요! 충분하셨다면 [Enter]</Text>
      ) : (
        <Text>{`⏱  ${mins}:${secs}  [${bar}]`}</Text>
      )}
      <Text> </Text>
      <Text dimColor>[Enter] 완료    [s] 다른 카드    [q] 닫기</Text>
    </Box>
  );
}
