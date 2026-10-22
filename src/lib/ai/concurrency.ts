/**
 * Concurrency limiter queue to prevent VPS CPU / memory spikes.
 * Enforces a strict limit on simultaneous AI requests (default: 2).
 */
export class ConcurrencyLimiter {
  private maxConcurrency: number;
  private runningCount: number = 0;
  private queue: Array<() => void> = [];

  constructor(maxConcurrency: number = 2) {
    this.maxConcurrency = Math.max(1, maxConcurrency);
  }

  public get activeCount(): number {
    return this.runningCount;
  }

  public get pendingCount(): number {
    return this.queue.length;
  }

  public setMaxConcurrency(limit: number): void {
    this.maxConcurrency = Math.max(1, limit);
    this.processQueue();
  }

  /**
   * Execute an async function within the concurrency limit.
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.runningCount < this.maxConcurrency) {
      this.runningCount++;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.runningCount++;
        resolve();
      });
    });
  }

  private release(): void {
    this.runningCount = Math.max(0, this.runningCount - 1);
    this.processQueue();
  }

  private processQueue(): void {
    while (this.runningCount < this.maxConcurrency && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }
}

// Global shared limiter for AI requests across the application
const globalLimit = parseInt(process.env.AI_MAX_CONCURRENCY || '2', 10) || 2;
export const globalAILimiter = new ConcurrencyLimiter(globalLimit);
