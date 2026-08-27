export interface HookInput {
  sessionId: string;
  transcriptPath: string;
  /** statusLine hook의 context_window 필드에서 계산. 없으면 null (Stop hook엔 이 필드가 없음). */
  contextRemainingPercent: number | null;
}

/**
 * Stop/statusLine hook이 stdin으로 넘기는 JSON에서 필요한 필드만 추출.
 * TTY(사람이 직접 실행)면 stdin에 hook JSON이 없으므로 즉시 null.
 *
 * @param timeoutMs stdin이 예상대로 닫히지 않는 경우의 안전장치. statusLine은 2초마다
 *   재호출되므로 여기서 멈추면 상태바 전체가 죽는다 — 짧게 두고 실패 시 null.
 */
export async function readHookInput(
  stdin: NodeJS.ReadStream,
  timeoutMs = 200,
): Promise<HookInput | null> {
  if (stdin.isTTY) return null;

  let raw: string;
  try {
    raw = await readAll(stdin, timeoutMs);
  } catch {
    return null;
  }
  if (!raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sessionId = parsed.session_id;
    const transcriptPath = parsed.transcript_path;
    if (typeof sessionId !== 'string' || typeof transcriptPath !== 'string') return null;
    return {
      sessionId,
      transcriptPath,
      contextRemainingPercent: extractContextRemainingPercent(parsed.context_window),
    };
  } catch {
    return null;
  }
}

/**
 * context_window.remaining_percentage를 우선 쓰고, 없으면 used_percentage로 역산.
 * 필드명은 리서치 기반 추정이라 실측 전까지는 방어적으로 — 형태가 다르면 조용히 null.
 */
function extractContextRemainingPercent(contextWindow: unknown): number | null {
  if (!contextWindow || typeof contextWindow !== 'object') return null;
  const cw = contextWindow as Record<string, unknown>;

  if (typeof cw.remaining_percentage === 'number' && Number.isFinite(cw.remaining_percentage)) {
    return clampPercent(cw.remaining_percentage);
  }
  if (typeof cw.used_percentage === 'number' && Number.isFinite(cw.used_percentage)) {
    return clampPercent(100 - cw.used_percentage);
  }
  return null;
}

function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function readAll(stream: NodeJS.ReadStream, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    const timer = setTimeout(() => {
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onError);
      reject(new Error('stdin read timeout'));
    }, timeoutMs);

    const onData = (chunk: string): void => { data += chunk; };
    const onEnd = (): void => { clearTimeout(timer); resolve(data); };
    const onError = (err: Error): void => { clearTimeout(timer); reject(err); };

    stream.setEncoding('utf-8');
    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);
  });
}
