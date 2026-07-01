import type { ApiClient } from './ApiClient'

/**
 * Base class for services that either call a real backend (when ApiClient
 * is configured) or fall back to a local repository. Subclasses only
 * provide the two branches; the decision of which one to run lives here.
 */
export abstract class RemoteBackedService {
  protected readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  protected execute<T>(remote: () => Promise<T>, local: () => Promise<T>): Promise<T> {
    return this.client.isConfigured ? remote() : local()
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
