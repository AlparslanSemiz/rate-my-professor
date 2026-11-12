/**
 * Runtime checks for invariants this codebase is responsible for, as opposed to conditions
 * the backend or the operator can produce.
 *
 * The distinction matters because the two need opposite handling. A refused request is a
 * typed `ApiError` and is shown to the operator; a broken invariant means the panel has a
 * bug, and its message describes our own code — so it belongs in the console, which is where
 * `getErrorMessage` already routes anything it does not recognise as explainable.
 */

/** Thrown when an invariant does not hold. Never caught to recover — only to report. */
export class AssertionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssertionError'
  }
}

/**
 * Fails when `condition` is falsy, and narrows it for the compiler when it is not.
 *
 * @param condition the invariant that must hold
 * @param message what is wrong, written for whoever reads the console — not for an operator
 * @throws {AssertionError} when `condition` is falsy
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new AssertionError(message)
}

/**
 * The unreachable branch of an exhaustive dispatch.
 *
 * Its value is mostly at compile time: a union that grows produces a type error here before
 * anything runs. The throw is what happens when a value arrives that the types promised could
 * not — a backend enum the panel has not been taught, for instance.
 *
 * @param value the value the compiler has narrowed to `never`
 * @param context what was being decided, for the message
 * @throws {AssertionError} always
 */
export function assertNever(value: never, context: string): never {
  throw new AssertionError(`${context}: unhandled value ${JSON.stringify(value)}`)
}
