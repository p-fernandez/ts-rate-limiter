import assert from 'node:assert/strict';
import test, { afterEach, describe } from 'node:test';
import { setTimeout } from 'node:timers/promises';

import { RateLimiter } from '../index';
import { RateLimiterStrategy, TimeUnit, TokenBucketConfigOptions, TokenBucketOptions } from '../interfaces';

describe(`Rate Limiter Strategy: ${RateLimiterStrategy.TokenBucket}`, () => {
  let rateLimiter: RateLimiter<TokenBucketConfigOptions, TokenBucketOptions>;

  afterEach(() => {
    rateLimiter?.clear();
  });

  describe('Validation', () => {
    test('should throw an error if selecting an unexisting algorithm', () => {
      assert.throws(
        () => {
          new RateLimiter('unexistent' as RateLimiterStrategy, {
            limit: 1,
            refillRate: 1,
            timeUnit: TimeUnit.Seconds,
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
    rateLimiter = new RateLimiter(RateLimiterStrategy.TokenBucket, {} as TokenBucketConfigOptions);

    assert.strictEqual(typeof rateLimiter.clear, 'function');
    assert.strictEqual(typeof rateLimiter.limit, 'function');
    assert.deepEqual(rateLimiter.config, {});
    assert.strictEqual(rateLimiter.strategy, 'token-bucket');
  });

  test('should allow the requests as they are inside of the rate limits', async () => {
    rateLimiter = new RateLimiter<TokenBucketConfigOptions, TokenBucketOptions>(RateLimiterStrategy.TokenBucket, {
      limit: 2,
      refillRate: 2,
      timeUnit: TimeUnit.Seconds,
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
    rateLimiter = new RateLimiter<TokenBucketConfigOptions, TokenBucketOptions>(RateLimiterStrategy.TokenBucket, {
      limit: 2,
      refillRate: 2,
      timeUnit: TimeUnit.Seconds,
    });

    const userId = 'user-id-1';

    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), true);
    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(500);
    // Total count: 2 | Time passed: Less than 1 s
    assert.strictEqual(rateLimiter.limit(userId), true);

    await setTimeout(500);
    // Total count reset | Time passed: More than 1 s
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

  test('should refill properly at the expected rate', async () => {
    rateLimiter = new RateLimiter<TokenBucketConfigOptions, TokenBucketOptions>(RateLimiterStrategy.TokenBucket, {
      limit: 20,
      refillRate: 10,
      timeUnit: TimeUnit.Seconds,
    });

    const userId = 'user-id-1';

    for (let i = 0; i < 20; i++) {
      assert.strictEqual(rateLimiter.limit(userId), true);
    }
    assert.strictEqual(rateLimiter.limit(userId), false);
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(500);
    // At this point we should be able to refill refillRate tokens/second. In this case 5 tokens.
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(rateLimiter.limit(userId), true);
    }
    assert.strictEqual(rateLimiter.limit(userId), false);

    await setTimeout(300);
    // At this point we should be able to refill another handful of refillRate tokens/second. In this case 3 tokens.
    for (let i = 0; i < 3; i++) {
      assert.strictEqual(rateLimiter.limit(userId), true);
    }
    assert.strictEqual(rateLimiter.limit(userId), false);
  });
});
