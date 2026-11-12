import { ContractError, HTTP_STATUS, RefusedError, responseErrorFor, type ResponseError } from './apiErrors'

/** The envelope every endpoint in this API wraps its answer in. */
export interface BasicResponse {
  message: string
  success: boolean
}

/** Exported so tests can assert the message without repeating the string. */
export const EMPTY_RESPONSE_MESSAGE = 'The server returned an empty response.'

const INVALID_RESPONSE_MESSAGE = 'The server returned an invalid JSON response.'
const REFUSED_MESSAGE = 'The server refused the request.'
const RETRY_AFTER_HEADER = 'Retry-After'

function hasErrorMessage(body: unknown): body is { message: string } {
  if (!body || typeof body !== 'object' || !('message' in body)) return false
  return typeof body.message === 'string' && body.message.trim().length > 0
}

function readReason(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('reason' in body)) return null
  return typeof body.reason === 'string' && body.reason.trim() ? body.reason : null
}

/** A 2xx body that reports `success: false` — the request was served but refused. */
function isRefusal(body: unknown): boolean {
  if (!body || typeof body !== 'object' || !('success' in body)) return false
  return body.success === false
}

/**
 * How long the backend asked us to wait, in seconds. `Retry-After` may also be an HTTP date;
 * the admin API only ever sends the delta form, so anything else is treated as absent rather
 * than guessed at.
 */
function readRetryAfter(response: Response): number | null {
  const header = response.headers.get(RETRY_AFTER_HEADER)
  if (!header) return null
  const seconds = Number.parseInt(header, 10)
  return Number.isFinite(seconds) ? seconds : null
}

/**
 * Reads a list out of a response body.
 *
 * Without this the services call `.map` straight on a field that may not be there, and the
 * resulting `TypeError` surfaces to the operator as though it were the backend's own
 * explanation.
 *
 * Only the field's arrayness is checked — the element type is asserted, not verified, so a
 * renamed field *inside* an element still passes here. That gap is what `docs/adr/0008`
 * makes the generated schema responsible for.
 *
 * @param body the parsed response body
 * @param key the field expected to hold the list
 * @param context the request, for the message — e.g. `GET /users`
 * @returns the list, as a fresh reference owned by the caller
 * @throws {ContractError} when `key` is absent or is not an array
 */
export function expectArray<T>(body: unknown, key: string, context: string): T[] {
  const value = (body as Record<string, unknown> | null | undefined)?.[key]
  if (!Array.isArray(value)) {
    throw new ContractError(
      `${context} did not return a "${key}" list. The response did not match what this panel expects.`,
    )
  }
  return value as T[]
}

/**
 * Turns a `Response` into either the payload or a typed failure.
 *
 * This is the only place in the panel that reads an HTTP status. Everything downstream
 * catches a named error instead — see `./apiErrors`.
 */
export class ApiResponseParser {
  /**
   * @param response the response as `fetch` returned it
   * @param path the request path, used in the fallback message when the body explains nothing
   * @returns the parsed body, or `undefined` for `204 No Content`
   * @throws {ResponseError} when the backend answered with a failing status
   * @throws {RefusedError} when a 2xx body reported `success: false`
   * @throws {ContractError} when the body was empty or was not JSON
   */
  async parse<T>(response: Response, path: string): Promise<T> {
    if (!response.ok) {
      throw await this.toResponseError(response, path)
    }

    return this.parseSuccessResponse<T>(response)
  }

  private async parseSuccessResponse<T>(response: Response): Promise<T> {
    if (response.status === HTTP_STATUS.noContent) return undefined as T

    const text = await response.text()
    if (!text) {
      throw new ContractError(EMPTY_RESPONSE_MESSAGE)
    }

    const body = this.parseJson(text)

    // Every response in this API carries `success`. A 2xx that reports `success: false` is a
    // refusal the operator has to be told about, not a write that quietly did nothing.
    if (isRefusal(body)) {
      throw new RefusedError(
        response.status,
        hasErrorMessage(body) ? body.message : REFUSED_MESSAGE,
        readReason(body),
      )
    }

    return body as T
  }

  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text)
    } catch (cause: unknown) {
      // The `SyntaxError` names a character offset in a body the operator cannot see, so it
      // is carried as `cause` for the console rather than shown.
      throw new ContractError(INVALID_RESPONSE_MESSAGE, null, cause)
    }
  }

  private async toResponseError(response: Response, path: string): Promise<ResponseError> {
    const fallback = `Request to ${path} failed with status ${response.status}`
    const retryAfter = readRetryAfter(response)
    try {
      const body: unknown = await response.json()
      const message = hasErrorMessage(body) ? body.message : fallback
      return responseErrorFor(response.status, message, readReason(body), retryAfter)
    } catch {
      // Body was not JSON; fall through to the generic message.
      return responseErrorFor(response.status, fallback, null, retryAfter)
    }
  }
}
