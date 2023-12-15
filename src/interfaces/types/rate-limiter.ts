import { Count, UpdatedAt, UserId } from './strong-typed-ids';

export enum RateLimiterStrategy {
  FixedWindow = 'fixed-window',
  SlidingWindow = 'sliding-window',
  TokenBucket = 'token-bucket',
}

export enum TimeUnit {
  Minutes = 'minutes',
  Seconds = 'seconds',
}

export interface RateLimiterUserData {
  count: Count;
  updatedAt: number;
}

export interface SlidingWindowData {
  stack: Array<number>;
}

export interface BaseOptions {
  updatedAt: UpdatedAt;
  userId: UserId;
}

export interface FixedWindowConfigOptions {
  limit: number; // Number of allowed request to pass through
  timeUnit: TimeUnit;
  windowSize: number;
}

export interface SlidingWindowConfigOptions {
  limit: number;
  timeUnit: TimeUnit;
  windowSize: number;
}

export interface TokenBucketConfigOptions {
  limit: number; // Number of allowed request to pass through
  refillRate: number;
  timeUnit: TimeUnit;
}

export interface FixedWindowOptions extends FixedWindowConfigOptions, BaseOptions {}
export interface SlidingWindowOptions extends SlidingWindowConfigOptions, BaseOptions {}
export interface TokenBucketOptions extends TokenBucketConfigOptions, BaseOptions {}
