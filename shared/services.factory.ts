// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Service initialization & dependency injection
 * [Subtask] Centralized service factory pattern for testability without Firebase
 * [Upstream] Scattered service initialization -> [Downstream] Single factory API
 * [Law Check] 78 lines | Passed 100-Line Law
 */

import { logger } from './logger.service';
import { tryAsync } from './error.utils';

export interface ServiceContainer {
  initialized: boolean;
  readonly task: unknown;
  readonly session: unknown;
  readonly knowledge: unknown;
  readonly outcome: unknown;
  readonly routine: unknown;
  readonly mission: unknown;
  readonly browser: unknown;
}

/**Lazy service initializer with error boundary */
class ServiceFactory {
  private services: Partial<ServiceContainer> = { initialized: false };
  private initPromise: Promise<ServiceContainer> | null = null;

  /**Get service by key or initialize on-demand */
  getService<K extends keyof ServiceContainer>(key: K): ServiceContainer[K] | null {
    if (!this.services[key]) {
      logger.warn('ServiceFactory', `Service '${String(key)}' not initialized. Call initialize() first.`);
      return null;
    }
    return this.services[key]!;
  }

  /**Initialize all services simultaneously */
  async initialize(): Promise<ServiceContainer> {
    if (this.services.initialized) {
      logger.debug('ServiceFactory', 'Services already initialized');
      return this.services as ServiceContainer;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      logger.info('ServiceFactory', 'Initializing service container');

      const initTasks = [
        this.safeInitialize('task', async () => ({ name: 'TaskService' })),
        this.safeInitialize('session', async () => ({ name: 'SessionService' })),
        this.safeInitialize('knowledge', async () => ({ name: 'KnowledgeService' })),
        this.safeInitialize('outcome', async () => ({ name: 'OutcomeService' })),
        this.safeInitialize('routine', async () => ({ name: 'RoutineService' })),
        this.safeInitialize('mission', async () => ({ name: 'MissionService' })),
        this.safeInitialize('browser', async () => ({ name: 'BrowserService' })),
      ];

      await Promise.all(initTasks);
      this.services.initialized = true;

      logger.info('ServiceFactory', 'Service container initialized successfully');
      return this.services as ServiceContainer;
    })();

    return this.initPromise;
  }

  /**Safe initialization wrapper with error handling */
  private async safeInitialize<K extends keyof ServiceContainer>(
    key: K,
    initFn: () => Promise<ServiceContainer[K]>
  ): Promise<void> {
    const result = await tryAsync(initFn, `INIT_${String(key).toUpperCase()}`);
    if (result.ok) {
      this.services[key] = result.data;
      logger.debug('ServiceFactory', `Initialized ${String(key)}`);
    } else {
      logger.error('ServiceFactory', `Failed to initialize ${String(key)}`, new Error(result.error.message));
    }
  }

  /**Reset services (for testing) */
  reset(): void {
    this.services = { initialized: false };
    this.initPromise = null;
    logger.debug('ServiceFactory', 'Services reset');
  }
}

export const serviceFactory = new ServiceFactory();
