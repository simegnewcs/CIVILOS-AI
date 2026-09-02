import { NextRequest, NextResponse } from "next/server";

// ─── Server-singleton state (survives across requests in the same process) ────

/** In-process image cache: cacheKey → ArrayBuffer + content-type */
const imageCache = new Map<string, { buf: ArrayBuffer; ct: string }>();
const MAX_CACHE = 200; // keep up to 200 images in memory (~200 MB worst-case)

/** In-flight promises: cacheKey → promise that resolves to the cached entry */
const inFlight = new Map<string, Promise<{ buf: ArrayBuffer; ct: string } | null>>();

/**
 * Simple serial queue – only 1 upstream Pollinations request runs at a time.
 * Any additional concurrent requests wait in the queue and run one-by-one.
 * This is the key mechanism that prevents 429 bursts.
 */
class SerialQueue {
  private running = false;
  private queue: Array<() => void> = [];

  /** Acquire the queue slot. Returns a release function. */
  acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const tryRun = () => {
        if (!this.running) {
          this.running = true;
          resolve(() => {
            this.running = false;
            const next = this.queue.shift();
            if (next) next();
          });
        } else {
          this.queue.push(tryRun);
        }
      };
      tryRun();
    });
  }
}

// Module-level singleton — shared across all concurrent requests in this process
const pollinationsQueue = new SerialQueue();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function evictIfFull() {
  if (imageCache.size >= MAX_CACHE) {
    // Evict the oldest entry
    const firstKey = imageCache.keys().next().value;
    if (firstKey !== undefined) imageCache.delete(firstKey);
  }
}

async function fetchFromPollinations(
  prompt: string,
  width: string,
  height: string,
  seed: string
): Promise<{ buf: ArrayBuffer; ct: string } | null> {
  const upstream = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  const MAX_UPSTREAM_RETRIES = 4;
  let delay = 5000;

  for (let attempt = 0; attempt <= MAX_UPSTREAM_RETRIES; attempt++) {
    try {
      const res = await fetch(upstream, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "image/*,*/*;q=0.8",
          Referer: "https://pollinations.ai/",
        },
        signal: AbortSignal.timeout(90_000),
      });

      if (res.status === 429 || res.status === 503) {
        if (attempt < MAX_UPSTREAM_RETRIES) {
          // Honour Retry-After if present
          const retryAfter = res.headers.get("Retry-After");
          const wait = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
          delay = Math.min(delay * 1.5, 30_000);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        return null;
      }

      if (!res.ok) return null;

      const ct = res.headers.get("content-type") ?? "image/jpeg";
      const buf = await res.arrayBuffer();
      return { buf, ct };
    } catch {
      if (attempt < MAX_UPSTREAM_RETRIES) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 1.5, 30_000);
      }
    }
  }
  return null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * Server-side proxy for image.pollinations.ai
 *
 * Features:
 *  - In-process image cache (avoids duplicate upstream calls for the same prompt/seed)
 *  - Request coalescing (concurrent requests for the same key share one fetch)
 *  - Serial upstream queue (max 1 request at a time → no more 429 bursts)
 *  - Exponential back-off with Retry-After support inside the queue
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");
  const width = searchParams.get("width") ?? "1024";
  const height = searchParams.get("height") ?? "768";
  const seed = searchParams.get("seed") ?? "0";

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const cacheKey = `${prompt}::${width}x${height}::${seed}`;

  // 1. Cache hit — return immediately without touching the queue
  const cached = imageCache.get(cacheKey);
  if (cached) {
    return new NextResponse(cached.buf, {
      status: 200,
      headers: {
        "Content-Type": cached.ct,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Cache": "HIT",
      },
    });
  }

  // 2. Coalesce: if there is already an in-flight fetch for this key, await it
  const existing = inFlight.get(cacheKey);
  if (existing) {
    const result = await existing;
    if (!result) return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
    return new NextResponse(result.buf, {
      status: 200,
      headers: {
        "Content-Type": result.ct,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Cache": "COALESCED",
      },
    });
  }

  // 3. Enqueue — acquire the serial slot, then fetch
  const promise = (async () => {
    const release = await pollinationsQueue.acquire();
    try {
      // Check cache again after acquiring the slot (another request may have populated it)
      const hot = imageCache.get(cacheKey);
      if (hot) return hot;

      const result = await fetchFromPollinations(prompt, width, height, seed);
      if (result) {
        evictIfFull();
        imageCache.set(cacheKey, result);
      }
      return result;
    } finally {
      release();
      inFlight.delete(cacheKey);
    }
  })();

  inFlight.set(cacheKey, promise);

  const result = await promise;
  if (!result) {
    return NextResponse.json({ error: "Upstream failed after retries" }, { status: 502 });
  }

  return new NextResponse(result.buf, {
    status: 200,
    headers: {
      "Content-Type": result.ct,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Cache": "MISS",
    },
  });
}
