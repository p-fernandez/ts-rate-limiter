// TODO: REVIEW

import {
  Count,
  FixedWindowOptions,
  RateLimiterStrategy,
  RateLimiterUserData,
  TimeUnit,
  UserId,
} from '../../interfaces';

const requestStore: Map<UserId, RateLimiterUserData> = new Map<UserId, RateLimiterUserData>();

const updateUserData = (userId: UserId, count: Count, updatedAt: number): void => {
  requestStore.set(userId, { count, updatedAt });
};

const restart = (userId: UserId, updatedAt: number): boolean => {
  updateUserData(userId, 1, updatedAt);

  return true;
};

const checkFixedWindow = (updatedAt: number, endOfWindow: number): boolean => {
  return updatedAt > endOfWindow;
};

const calculateNewWindowEnd = (time: number, windowSize: number, timeUnit: TimeUnit): number => {
  const multiplier = timeUnit === TimeUnit.Seconds ? 1 : 60;
  const windowTime = time + windowSize * 1_000 * multiplier;

  return windowTime;
};

export const clear = (): void => {
  requestStore.clear();
};

export const fixedWindow = (options: FixedWindowOptions): boolean => {
  const { limit, timeUnit, updatedAt, userId, windowSize } = options;

  if (!limit) {
    throw new Error(`Strategy "${RateLimiterStrategy.FixedWindow}" does not have configured the rate limit`);
  }

  const userData = requestStore.get(userId);

  if (!userData) {
    return restart(userId, calculateNewWindowEnd(updatedAt, windowSize, timeUnit));
  }

  const isFixedWindowOver = checkFixedWindow(updatedAt, userData.updatedAt);

  if (isFixedWindowOver) {
    return restart(userId, calculateNewWindowEnd(userData.updatedAt, windowSize, timeUnit));
  }

  if (userData.count < limit) {
    updateUserData(userId, userData.count + 1, userData.updatedAt);
    return true;
  }

  return false;
};
