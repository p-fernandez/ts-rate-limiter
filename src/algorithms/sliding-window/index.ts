import { SlidingWindowData, SlidingWindowOptions, TimeUnit, UserId } from '../../interfaces';

const requestStore: Map<UserId, SlidingWindowData> = new Map<UserId, SlidingWindowData>();

const updateUserData = (userId: UserId, stack: Array<number>): void => {
  requestStore.set(userId, { stack });
};

const startUserMap = (userId: UserId): void => {
  const stack = [Date.now()];
  updateUserData(userId, stack);
};

const validate = (options: SlidingWindowOptions): void => {
  const { limit, timeUnit, windowSize } = options;

  if (!limit) {
    throw new Error('Missing limit');
  }

  if (!timeUnit) {
    throw new Error('Missing time unit');
  }

  if (!windowSize) {
    throw new Error('Missing window size');
  }
};

const calculateWindowTimeInMs = (timeUnit: TimeUnit, windowSize: number): number => {
  if (timeUnit === TimeUnit.Seconds) {
    return windowSize * 1_000;
  }

  if (timeUnit === TimeUnit.Minutes) {
    return windowSize * 60 * 1_000;
  }

  throw new Error(`Wrong time unit ${timeUnit}`);
};

export const clear = (): void => {
  requestStore.clear();
};

export const slidingWindow = (options: SlidingWindowOptions): boolean => {
  validate(options);

  const { limit, timeUnit, userId, windowSize } = options;

  const userData = requestStore.get(userId);
  if (!userData) {
    startUserMap(userId);
    return true;
  }

  const { stack } = userData;
  const now = Date.now();

  const windowTimeInMs = calculateWindowTimeInMs(timeUnit, windowSize);

  while (stack.length > 0) {
    const [el] = stack;
    if (el < now - windowTimeInMs) {
      stack.shift();
    }

    break;
  }

  if (stack.length < limit) {
    stack.push(now);
    updateUserData(userId, stack);

    return true;
  }

  return false;
};
