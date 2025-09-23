interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  consecutiveSuccesses: number;
}

export class CircuitBreaker {
  private readonly options: CircuitBreakerOptions;
  private state: CircuitBreakerState;
  private readonly name: string;

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minuto
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 segundos
      ...options,
    };

    this.state = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      consecutiveSuccesses: 0,
    };
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.shouldRejectRequest()) {
      throw new Error(`[${this.name}] Circuit breaker is OPEN. Request rejected.`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldRejectRequest(): boolean {
    const now = Date.now();

    if (this.state.state === 'OPEN') {
      if (now >= this.state.nextAttemptTime) {
        this.state.state = 'HALF_OPEN';
        this.state.consecutiveSuccesses = 0;
        console.log(`[${this.name}] Circuit breaker transitioning to HALF_OPEN`);
        return false;
      }
      return true;
    }

    return false;
  }

  private onSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.consecutiveSuccesses++;
      if (this.state.consecutiveSuccesses >= 3) {
        this.reset();
        console.log(`[${this.name}] Circuit breaker reset to CLOSED after successful recoveries`);
      }
    } else {
      this.reset();
    }
  }

  private onFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.state === 'HALF_OPEN') {
      this.openCircuit();
    } else if (this.state.failureCount >= this.options.failureThreshold) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state.state = 'OPEN';
    this.state.nextAttemptTime = Date.now() + this.options.resetTimeout;
    console.warn(`[${this.name}] Circuit breaker OPENED after ${this.state.failureCount} failures`);
  }

  private reset(): void {
    this.state = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      consecutiveSuccesses: 0,
    };
  }

  getStatus() {
    return {
      state: this.state.state,
      failureCount: this.state.failureCount,
      nextAttemptTime: this.state.nextAttemptTime,
      isOpen: this.state.state === 'OPEN',
    };
  }
}

export class ExponentialBackoff {
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly maxRetries: number;
  private readonly jitter: boolean;

  constructor(
    baseDelay = 1000,
    maxDelay = 30000,
    maxRetries = 5,
    jitter = true
  ) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.maxRetries = maxRetries;
    this.jitter = jitter;
  }

  async execute<T>(fn: () => Promise<T>, name = 'operation'): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.maxRetries) {
          console.error(`[${name}] Max retries (${this.maxRetries}) exceeded`);
          throw lastError;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`[${name}] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );

    if (!this.jitter) {
      return exponentialDelay;
    }

    // Añadir jitter para evitar thundering herd
    const jitterRange = exponentialDelay * 0.2;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;

    return Math.max(0, exponentialDelay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instancias globales para compartir entre módulos
export const authCircuitBreaker = new CircuitBreaker('auth-api', {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 segundos
  monitoringPeriod: 5000, // 5 segundos
});

export const leadsCircuitBreaker = new CircuitBreaker('leads-api', {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minuto
  monitoringPeriod: 10000, // 10 segundos
});

export const authBackoff = new ExponentialBackoff(500, 10000, 3, true);
export const apiBackoff = new ExponentialBackoff(1000, 15000, 5, true);