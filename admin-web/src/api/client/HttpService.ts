import type { ApiClient } from './ApiClient'

/**
 * Base for every service that talks to the backend.
 *
 * Nineteen services each declared the same field and the same constructor to hold the client
 * they were handed. That is not a design — it is what TypeScript makes you write here, since
 * `erasableSyntaxOnly` is on in `tsconfig.app.json` and parameter properties
 * (`constructor(private readonly client: ApiClient)`) are therefore not available. Writing it
 * once means a service file is only the requests it makes.
 *
 * `protected` rather than `private`: the subclass is the whole point.
 */
export abstract class HttpService {
  protected readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }
}
