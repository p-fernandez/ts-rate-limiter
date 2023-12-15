import assert from 'node:assert/strict';
import test, { afterEach, describe } from 'node:test';
import { setTimeout } from 'node:timers/promises';

import { RateLimiter } from '../index';
import { RateLimiterStrategy, SlidingWindowConfigOptions, SlidingWindowOptions, TimeUnit } from '../interfaces';

describe(`Rate Limiter Strategy: ${RateLimiterStrategy.SlidingWindow}`, () => {
  let rateLimiter: RateLimiter<SlidingWindowConfigOptions, SlidingWindowOptions>;

  afterEach(() => {
    rateLimiter?.clear();
  });

  describe('Validation', () => {
    test('should throw an error if selecting an unexisting algorithm', () => {
      assert.throws(
        () => {
          new RateLimiter('unexistent' as RateLimiterStrategy, {
            limit: 1,
            timeUnit: TimeUnit.Seconds,
            windowSize: 1,
          });
        },
        {
          message: 'Strategy "unexistent" has no algorithm implemented',
          name: 'Error',
        }
      );
    });
  });

  test('should instantiate properly the rate limiter', () => {
    rateLimiter = new RateLimiter(RateLimiterStrategy.SlidingWindow, {} as SlidingWindowConfigOptions);

    assert.strictEqual(typeof rateLimiter.clear, 'function');
    assert.strictEqual(typeof rateLimiter.limit, 'function');
    assert.deepEqual(rateLimiter.config, {});
    assert.strictEqual(rateLimiter.strategy, 'sliding-window');
  });

  test('should allow the requests as they are inside of the rate limits', async () => {
    rateLimiter = new RateLimiter<SlidingWindowConfigOptions, SlidingWindowOptions>(RateLimiterStrategy.SlidingWindow, {
      limit: 2,
      timeUnit: TimeUnit.Seconds,
      windowSize: 1,
    });

    const userId = 'user-id-1';
    const userId2 = 'user-id-2';

    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId2), true);
    await setTimeout(500);
    // Total count user1: 1 | Time passed: 0.5 s
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId2), true);
    // Total count user1: 2 | Time passed: more than 0.5 s less than 1 s
    await setTimeout(500);
    // Total count user1 reset | Time passed: more than 1 s
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId2), true);
    await setTimeout(500);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId2), true);
  });

  test('should disallow the requests that are not inside the rate limits', async () => {
    rateLimiter = new RateLimiter<SlidingWindowConfigOptions, SlidingWindowOptions>(RateLimiterStrategy.SlidingWindow, {
      limit: 2,
      timeUnit: TimeUnit.Seconds,
      windowSize: 1,
    });

    const userId = 'user-id-1';

    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(500);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(500);
    // Old requests expired | Time passed: More than 1 s
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);

    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(1_000);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(1_000);
    assert.strictEqual(rateLimiter.limit(userId), true);
  });

  test('should allow requests based on the window size properly', async () => {
    rateLimiter = new RateLimiter<SlidingWindowConfigOptions, SlidingWindowOptions>(RateLimiterStrategy.SlidingWindow, {
      limit: 20,
      timeUnit: TimeUnit.Seconds,
      windowSize: 1,
    });

    const userId = 'user-id-1';

    for (let i = 0; i < 10; i++) {
      assert.strictEqual(rateLimiter.limit(userId), true);
    }

    await setTimeout(500);
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(rateLimiter.limit(userId), true);
    }

    await setTimeout(100);
    for (let i = 0; i < 4; i++) {
      assert.strictEqual(rateLimiter.limit(userId), true);
    }

    await setTimeout(100);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(300);
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(rateLimiter.limit(userId), true);
    }
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(400);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(100);
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(rateLimiter.limit(userId), true);
    }
    assert.strictEqual(rateLimiter.limit(userId), false);
  });
});
