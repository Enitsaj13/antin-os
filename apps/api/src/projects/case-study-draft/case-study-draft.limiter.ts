import { Injectable } from '@nestjs/common';
import type { WindowLimit } from './case-study-draft.config';

export type LimitResult = 'allowed' | 'rate-limit' | 'usage-limit';

type WindowCounter = {
  count: number;
  resetAt: number;
};

@Injectable()
export class CaseStudyDraftLimiter {
  private rateCounter?: WindowCounter;
  private usageCounter?: WindowCounter;

  consume(rateLimit: WindowLimit, usageLimit: WindowLimit): LimitResult {
    const now = Date.now();

    this.rateCounter = this.consumeCounter(this.rateCounter, rateLimit, now);

    if (this.rateCounter.count > rateLimit.max) {
      return 'rate-limit';
    }

    this.usageCounter = this.consumeCounter(this.usageCounter, usageLimit, now);

    if (this.usageCounter.count > usageLimit.max) {
      return 'usage-limit';
    }

    return 'allowed';
  }

  private consumeCounter(
    counter: WindowCounter | undefined,
    limit: WindowLimit,
    now: number,
  ): WindowCounter {
    if (!counter || counter.resetAt <= now) {
      return {
        count: 1,
        resetAt: now + limit.windowSeconds * 1000,
      };
    }

    return {
      ...counter,
      count: counter.count + 1,
    };
  }
}
