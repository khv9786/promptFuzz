import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import type { UsageDelta } from '../types/index.js';

interface ParseResult {
  delta: UsageDelta;
  newOffset: number;
}

/**
 * JSONL 파일을 라인 단위로 스트리밍하며 usage 필드만 추출한다.
 * 프롬프트/응답 본문은 메모리에 올리지 않는다 (보안 원칙).
 *
 * @param filePath - JSONL 파일 경로
 * @param fromOffset - 마지막으로 읽은 바이트 오프셋 (증분 파싱용)
 */
export async function parseJsonlFile(
  filePath: string,
  fromOffset: number = 0
): Promise<ParseResult> {
  let inputTokens = 0;
  let outputTokens = 0;
  let bytesRead = fromOffset;

  const stream = createReadStream(filePath, {
    encoding: 'utf-8',
    start: fromOffset,
  });

  const rl = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    bytesRead += Buffer.byteLength(line, 'utf-8') + 1;
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);
      const usage = extractUsage(entry);
      if (usage) {
        inputTokens += usage.input;
        outputTokens += usage.output;
      }
    } catch {
      continue;
    }
  }

  return {
    delta: {
      inputTokens,
      outputTokens,
      total: inputTokens + outputTokens,
    },
    newOffset: bytesRead,
  };
}

/**
 * JSONL 한 엔트리에서 usage 정보만 추출.
 * Claude Code의 JSONL 포맷은 entry.message.usage 형태로 토큰 정보를 담는다.
 */
function extractUsage(entry: unknown): { input: number; output: number } | null {
  if (!entry || typeof entry !== 'object') return null;
  const obj = entry as Record<string, unknown>;

  const message = obj.message;
  if (!message || typeof message !== 'object') return null;
  const msg = message as Record<string, unknown>;

  const usage = msg.usage;
  if (!usage || typeof usage !== 'object') return null;
  const u = usage as Record<string, unknown>;

  const input = toNumber(u.input_tokens) + toNumber(u.cache_creation_input_tokens) + toNumber(u.cache_read_input_tokens);
  const output = toNumber(u.output_tokens);

  if (input === 0 && output === 0) return null;
  return { input, output };
}

function toNumber(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}
