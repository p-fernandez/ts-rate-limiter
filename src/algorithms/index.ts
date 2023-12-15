import { RateLimiterStrategy } from '../interfaces/types';
import { fixedWindow, clear as fixedWindowClear } from './fixed-window';
import { slidingWindow, clear as slidingWindowClear } from './sliding-window';
import { tokenBucket, clear as tokenBucketClear } from './token-bucket';

export interface AlgorithmApi<TOptions> {
  clear(): void;
  limit(options: TOptions): boolean;
}

export type IAlgorithm<TOptions> = {
  [key in RateLimiterStrategy]: AlgorithmApi<TOptions>;
};

const algorithms = {
  [RateLimiterStrategy.FixedWindow]: {
    clear: fixedWindowClear,
    limit: fixedWindow,
  },
  [RateLimiterStrategy.SlidingWindow]: {
    clear: slidingWindowClear,
    limit: slidingWindow,
  },
  [RateLimiterStrategy.TokenBucket]: {
    clear: tokenBucketClear,
    limit: tokenBucket,
  },
};

export const getAlgorithm = <TOptions>(strategy: RateLimiterStrategy): AlgorithmApi<TOptions> => {
  const algorithm = algorithms[strategy];

  if (!algorithm) {
    throw new Error(`Strategy "${strategy}" has no algorithm implemented`);
  }

  return algorithm as AlgorithmApi<TOptions>;
};
