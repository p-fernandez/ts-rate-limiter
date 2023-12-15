import assert from 'node:assert/strict';
import test, { afterEach, describe } from 'node:test';
import { setTimeout } from 'node:timers/promises';

import { RateLimiter } from '../index';
import { FixedWindowConfigOptions, FixedWindowOptions, RateLimiterStrategy, TimeUnit } from '../interfaces';

describe(`Strategy: ${RateLimiterStrategy.FixedWindow}`, () => {
  let rateLimiter: RateLimiter<FixedWindowConfigOptions, FixedWindowOptions>;

  afterEach(() => {
    rateLimiter?.clear();
  });

  describe('Validation', () => {
    test('should throw an error if selecting an unexisting algorithm', () => {
      assert.throws(
        () => {
          new RateLimiter('unexistent' as RateLimiterStrategy, { limit: 1, timeUnit: TimeUnit.Seconds, windowSize: 1 });
        },
        {
          message: 'Strategy "unexistent" has no algorithm implemented',
          name: 'Error',
        }
      );
    });
  });

  test('should instantiate properly the rate limiter', () => {
    rateLimiter = new RateLimiter(RateLimiterStrategy.FixedWindow, {} as FixedWindowConfigOptions);

    assert.strictEqual(typeof rateLimiter.clear, 'function');
    assert.strictEqual(typeof rateLimiter.limit, 'function');
    assert.deepEqual(rateLimiter.config, {});
    assert.strictEqual(rateLimiter.strategy, 'fixed-window');
  });

  test('should allow the requests as they are inside of the rate limits', async () => {
    rateLimiter = new RateLimiter<FixedWindowConfigOptions, FixedWindowOptions>(RateLimiterStrategy.FixedWindow, {
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

  test('should allow a burst of requests in the edge of the end of the window reset', async () => {
    rateLimiter = new RateLimiter<FixedWindowConfigOptions, FixedWindowOptions>(RateLimiterStrategy.FixedWindow, {
      limit: 4,
      timeUnit: TimeUnit.Seconds,
      windowSize: 1,
    });

    const userId = 'user-id-1';

    assert.strictEqual(rateLimiter.limit(userId), true);
    await setTimeout(800);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(200);
    // Total count user1: 4 | Time passed: 1 s
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(500);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(400);
    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(100);
    assert.strictEqual(rateLimiter.limit(userId), true);
  });

  test('should disallow the requests that are not inside the rate limits', async () => {
    rateLimiter = new RateLimiter<FixedWindowConfigOptions, FixedWindowOptions>(RateLimiterStrategy.FixedWindow, {
      limit: 2,
      timeUnit: TimeUnit.Seconds,
      windowSize: 1,
    });

    const userId = 'user-id-1';

    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    await setTimeout(300);
    // Total count: 2 | Time passed: 0.3 s
    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);
    // Total count: 4 | Time passed: Less than 1 s
    await setTimeout(800);
    // Total count reset | Time passed: More than 1 s
    assert.strictEqual(rateLimiter.limit(userId), true);
    await setTimeout(200);
    assert.strictEqual(rateLimiter.limit(userId), true);
    await setTimeout(1_000);
    assert.strictEqual(rateLimiter.limit(userId), true);
  });
});
