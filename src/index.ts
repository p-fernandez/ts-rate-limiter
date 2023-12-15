import { AlgorithmApi, getAlgorithm } from './algorithms';
import { RateLimiterStrategy, UserId } from './interfaces';

export class RateLimiter<TConfig, TOptions> {
  private algorithm: AlgorithmApi<TOptions>;

  private state: Map<UserId, unknown>;

  constructor(
    readonly strategy: RateLimiterStrategy,
    readonly config: TConfig
  ) {
    this.algorithm = getAlgorithm<TOptions>(this.strategy);
    this.state = new Map();
  }

  private buildOptions(userId: UserId): TOptions {
    const now = Date.now();

    return {
      ...this.config,
      updatedAt: now,
      userId,
    } as TOptions;
  }

  clear(): void {
    this.algorithm.clear();
  }

  limit(userId: UserId): boolean {
    const options = this.buildOptions(userId);
    const { limit } = this.algorithm;

    return limit(options);
  }
}
