/**
 * Every way a request to the backend can fail, as a type rather than as a number.
 *
 * There used to be one `ApiError` carrying a `status`, and `status: 0` stood in for three
 * unrelated failures — an unreachable host, a body that was not JSON, and a response whose
 * shape the panel did not recognise. Callers then had to ask `error.status === 409`, which
 * put a decision about what a number means into six files across four layers. Naming the
 * failures instead means a caller says what it is handling, and `ApiResponseParser` is the
 * only place that reads a status at all.
 */

/**
 * The statuses this panel gives its own meaning to. Anything not listed here is still a
 * perfectly good `ResponseError`; these are the ones some caller acts on differently.
 */
export const HTTP_STATUS = {
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  tooManyRequests: 429,
  /** The floor of the 5xx range: at or above this, the failure is the backend's and may pass. */
  serverError: 500,
} as const

/**
 * Base for every failure raised by the API layer. Never thrown directly — catch this to mean
 * "the request failed for a reason the backend or the network produced", and one of the
 * subclasses to mean something specific.
 */
export abstract class ApiError extends Error {
  /**
   * The machine-readable `reason` a refusal carried, where the endpoint documents one — the
   * audit revert answers `409` with `VALUE_CHANGED`, `WINDOW_EXPIRED` and the like. `null`
   * when the failure carried no such code.
   */
  readonly reason: string | null

  /**
   * Whether repeating the request could plausibly succeed. Read by the query client's retry
   * predicate, so that the decision lives on the failure rather than in a status comparison
   * at the call site.
   */
  abstract readonly transient: boolean

  protected constructor(message: string, reason: string | null = null, cause?: unknown) {
    super(message, { cause })
    this.name = new.target.name
    this.reason = reason
  }
}

/**
 * The request never reached the backend, or the backend refused the origin.
 *
 * A rejected origin and an unreachable host are the same `TypeError` to `fetch` — the browser
 * refuses to say which — so these cannot be told apart and are one type.
 */
export class NetworkError extends ApiError {
  readonly transient = true

  constructor(message: string, cause?: unknown) {
    super(message, null, cause)
  }
}

/**
 * The backend answered, and the answer was not something this panel can read: a body that is
 * not JSON, an empty body where one was required, or a payload missing a field the panel
 * relies on.
 *
 * Deliberately not transient. Under the old single-error design this arrived as `status: 0`,
 * which the retry predicate read as "not a 4xx" and therefore retried twice — two extra
 * round-trips that could not possibly succeed, delaying the message the operator needs.
 */
export class ContractError extends ApiError {
  readonly transient = false

  constructor(message: string, reason: string | null = null, cause?: unknown) {
    super(message, reason, cause)
  }
}

/**
 * The backend answered with a status. Subclasses name the ones the panel acts on.
 *
 * This is the one place in the codebase that turns a status number into a meaning: at or
 * above `HTTP_STATUS.serverError` the failure is the backend's own and may pass on a retry;
 * below it, the request itself was wrong and repeating it changes nothing.
 */
export class ResponseError extends ApiError {
  readonly status: number

  constructor(status: number, message: string, reason: string | null = null, cause?: unknown) {
    super(message, reason, cause)
    this.status = status
  }

  /** At or above `serverError` the failure is the backend's own, and may not repeat. */
  get transient(): boolean {
    return this.status >= HTTP_STATUS.serverError
  }
}

/** `400` — the panel sent something the backend would not accept. */
export class BadRequestError extends ResponseError {
  constructor(message: string, reason: string | null = null, cause?: unknown) {
    super(HTTP_STATUS.badRequest, message, reason, cause)
  }
}

/** `401` — the token is missing, expired or revoked. Ends the session. */
export class UnauthorizedError extends ResponseError {
  constructor(message: string, reason: string | null = null, cause?: unknown) {
    super(HTTP_STATUS.unauthorized, message, reason, cause)
  }
}

/** `403` — the account is real and signed in, and is not allowed to do this. */
export class ForbiddenError extends ResponseError {
  constructor(message: string, reason: string | null = null, cause?: unknown) {
    super(HTTP_STATUS.forbidden, message, reason, cause)
  }
}

/** `404` — no such record. Sometimes the truth rather than a failure; see `useUserProfile`. */
export class NotFoundError extends ResponseError {
  constructor(message: string, reason: string | null = null, cause?: unknown) {
    super(HTTP_STATUS.notFound, message, reason, cause)
  }
}

/**
 * `409` — the backend understood and refused, and says why in `reason`. The audit revert is
 * the endpoint that uses this most: `VALUE_CHANGED`, `WINDOW_EXPIRED`, `ALREADY_REVERTED`.
 */
export class ConflictError extends ResponseError {
  constructor(message: string, reason: string | null = null, cause?: unknown) {
    super(HTTP_STATUS.conflict, message, reason, cause)
  }
}

/**
 * `429` — too many requests. Login codes are capped at 3 per address and 20 per IP per
 * quarter hour, so this is reachable in ordinary use and needs its own wording.
 */
export class RateLimitedError extends ResponseError {
  /** Seconds the backend asked us to wait, from `Retry-After`; `null` when it did not say. */
  readonly retryAfterSeconds: number | null

  constructor(
    message: string,
    retryAfterSeconds: number | null = null,
    reason: string | null = null,
    cause?: unknown,
  ) {
    super(HTTP_STATUS.tooManyRequests, message, reason, cause)
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/**
 * A `2xx` whose body reported `success: false` — the request was served and refused.
 *
 * Kept apart from the statuses above because the distinction is real: the backend chose to
 * answer successfully and decline in the payload, so a retry is pointless even though the
 * status is in the success range.
 */
export class RefusedError extends ResponseError {
  /** Never, regardless of the status: the backend chose to serve this refusal. */
  override get transient(): boolean {
    return false
  }
}

/**
 * The status-to-type table. Written as data rather than as a `switch` so that it reads as
 * what it is: the one mapping in the codebase from a number on the wire to a meaning. Adding
 * a status the panel treats specially is a subclass and a row, and nothing else changes.
 */
const RESPONSE_ERRORS: Record<
  number,
  (message: string, reason: string | null, retryAfterSeconds: number | null) => ResponseError
> = {
  [HTTP_STATUS.badRequest]: (message, reason) => new BadRequestError(message, reason),
  [HTTP_STATUS.unauthorized]: (message, reason) => new UnauthorizedError(message, reason),
  [HTTP_STATUS.forbidden]: (message, reason) => new ForbiddenError(message, reason),
  [HTTP_STATUS.notFound]: (message, reason) => new NotFoundError(message, reason),
  [HTTP_STATUS.conflict]: (message, reason) => new ConflictError(message, reason),
  [HTTP_STATUS.tooManyRequests]: (message, reason, retryAfterSeconds) =>
    new RateLimitedError(message, retryAfterSeconds, reason),
}

/**
 * Builds the most specific error for a status the backend answered with.
 *
 * @param status the status the backend answered with
 * @param message the message to show, already resolved from the body or from a fallback
 * @param reason the machine-readable refusal code, where the endpoint carried one
 * @param retryAfterSeconds the parsed `Retry-After` header; meaningful for `429` only
 * @returns the matching `ResponseError` subclass, or a plain `ResponseError` for a status
 *          the panel does not treat specially
 */
export function responseErrorFor(
  status: number,
  message: string,
  reason: string | null = null,
  retryAfterSeconds: number | null = null,
): ResponseError {
  const build = RESPONSE_ERRORS[status]
  return build
    ? build(message, reason, retryAfterSeconds)
    : new ResponseError(status, message, reason)
}
