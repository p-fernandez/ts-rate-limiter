import { Count, Maybe, RateLimiterUserData, TokenBucketOptions, UserId } from '../../interfaces';

const requestStore: Map<UserId, RateLimiterUserData> = new Map<UserId, RateLimiterUserData>();

const updateUserData = (userId: UserId, count: Count, updatedAt: number): void => {
  requestStore.set(userId, { count, updatedAt });
};

const getUserData = (userId: UserId): Maybe<RateLimiterUserData> => {
  return requestStore.get(userId);
};

const startBucket = (userId: UserId, limit: number): void => {
  updateUserData(userId, limit - 1, Date.now());
};

const refillBucket = (userId: UserId, refillRate: number, limit: number): void => {
  const now = Date.now();

  const userData = getUserData(userId);
  if (!userData) {
    throw new Error('User ${userId} is missing');
  }

  const { count, updatedAt } = userData;
  const elapsed = now - updatedAt;
  const refillTokens = Math.floor((elapsed * refillRate) / 1000);

  if (refillTokens > 0) {
    const bucketTokens = Math.min(limit, count + refillTokens);
    // We only update the timestamp when refilling
    updateUserData(userId, bucketTokens, now);
  }

  return;
};

const chargeBucket = (userId: UserId): boolean => {
  const userData = getUserData(userId);
  if (!userData) {
    throw new Error('User ${userId} is missing');
  }

  const { count, updatedAt } = userData;

  if (count > 0) {
    updateUserData(userId, count - 1, updatedAt);

    return true;
  }

  return false;
};

const validate = (options: TokenBucketOptions): void => {
  const { refillRate } = options;

  if (!refillRate) {
    throw new Error('Missing refill rate');
  }
};

export const tokenBucket = (options: TokenBucketOptions): boolean => {
  validate(options);

  const { limit, refillRate, userId } = options;

  const userData = getUserData(userId);
  if (!userData) {
    startBucket(userId, limit);

    return true;
  }

  refillBucket(userId, refillRate, limit);

  return chargeBucket(userId);
};

export const clear = (): void => {
  requestStore.clear();
};
