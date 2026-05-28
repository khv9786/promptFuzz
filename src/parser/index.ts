import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { parseJsonlFile } from './jsonl-stream.js';
import type { UsageDelta } from '../types/index.js';

export const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

export interface ScanResult {
  totalDelta: UsageDelta;
  updatedOffsets: Record<string, number>;
}

/**
 * Claude Code 프로젝트 디렉토리 전체를 스캔해
 * 모든 JSONL 파일의 새 토큰을 합산한다.
 *
 * @param previousOffsets - 파일별로 마지막에 읽은 위치 (state.json에서)
 */
export async function scanAllSessions(
  previousOffsets: Record<string, number> = {}
): Promise<ScanResult> {
  if (!existsSync(CLAUDE_PROJECTS_DIR)) {
    return {
      totalDelta: { inputTokens: 0, outputTokens: 0, total: 0 },
      updatedOffsets: previousOffsets,
    };
  }

  const jsonlFiles = await findJsonlFiles(CLAUDE_PROJECTS_DIR);
  const updatedOffsets: Record<string, number> = { ...previousOffsets };
  let totalInput = 0;
  let totalOutput = 0;

  for (const file of jsonlFiles) {
    const lastOffset = previousOffsets[file] ?? 0;
    let currentSize = 0;
    try {
      currentSize = (await stat(file)).size;
    } catch {
      continue;
    }

    if (currentSize <= lastOffset) continue;

    try {
      const { delta, newOffset } = await parseJsonlFile(file, lastOffset);
      totalInput += delta.inputTokens;
      totalOutput += delta.outputTokens;
      updatedOffsets[file] = newOffset;
    } catch {
      continue;
    }
  }

  return {
    totalDelta: {
      inputTokens: totalInput,
      outputTokens: totalOutput,
      total: totalInput + totalOutput,
    },
    updatedOffsets,
  };
}

async function findJsonlFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...await findJsonlFiles(full));
      } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        results.push(full);
      }
    }
  } catch {
    // 권한 등 문제 시 조용히 스킵
  }
  return results;
}
