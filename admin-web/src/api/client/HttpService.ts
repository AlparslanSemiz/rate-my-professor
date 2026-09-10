import type { HttpTransport } from './httpTransport'

/**
 * Base for every service that talks to the backend, holding the one thing they all need.
 *
 * Nineteen services each declared the same field and the same constructor to hold the client
 * they were handed. That is not a design — it is what TypeScript makes you write here, since
 * `erasableSyntaxOnly` is on in `tsconfig.app.json` and parameter properties
 * (`constructor(private readonly client: HttpTransport)`) are therefore not available.
 * Writing it once means a service file is only the requests it makes.
 *
 * What is held is `HttpTransport`, not `ApiClient`. The client also owns the session, so
 * handing it over whole let any service call `setToken(null)` and sign the operator out —
 * a capability none of them has any use for. `protected` rather than `private`, because the
 * subclass is the whole point.
 */
export abstract class HttpService {
  protected readonly client: HttpTransport

  constructor(client: HttpTransport) {
    this.client = client
  }
}
