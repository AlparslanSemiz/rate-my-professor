export interface BasicResponse {
  message: string
  success: boolean
}

export class ApiError extends Error {
  readonly status: number
  readonly reason: string | null

  constructor(status: number, message: string, reason: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.reason = reason
  }
}

export const EMPTY_RESPONSE_MESSAGE = 'The server returned an empty response.'

const INVALID_RESPONSE_MESSAGE = 'The server returned an invalid JSON response.'
const REFUSED_MESSAGE = 'The server refused the request.'

function hasErrorMessage(body: unknown): body is { message: string } {
  if (!body || typeof body !== 'object' || !('message' in body)) return false
  return typeof body.message === 'string' && body.message.trim().length > 0
}

function readReason(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('reason' in body)) return null
  return typeof body.reason === 'string' && body.reason.trim() ? body.reason : null
}

function isRefusal(body: unknown): boolean {
  if (!body || typeof body !== 'object' || !('success' in body)) return false
  return body.success === false
}

export function expectArray<T>(body: unknown, key: string, context: string): T[] {
  const value = (body as Record<string, unknown> | null | undefined)?.[key]
  if (!Array.isArray(value)) {
    throw new ApiError(
      0,
      `${context} did not return a "${key}" list. The response did not match what this panel expects.`,
    )
  }
  return value as T[]
}

export class ApiResponseParser {
  async parse<T>(response: Response, path: string): Promise<T> {
    if (!response.ok) {
      throw await this.toApiError(response, path)
    }

    return this.parseSuccessResponse<T>(response)
  }

  private async parseSuccessResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T

    const text = await response.text()
    if (!text) {
      throw new ApiError(response.status, EMPTY_RESPONSE_MESSAGE)
    }

    const body = this.parseJson(text, response.status)

    if (isRefusal(body)) {
      throw new ApiError(
        response.status,
        hasErrorMessage(body) ? body.message : REFUSED_MESSAGE,
        readReason(body),
      )
    }

    return body as T
  }

  private parseJson(text: string, status: number): unknown {
    try {
      return JSON.parse(text)
    } catch {
      throw new ApiError(status, INVALID_RESPONSE_MESSAGE)
    }
  }

  private async toApiError(response: Response, path: string): Promise<ApiError> {
    const fallback = `Request to ${path} failed with status ${response.status}`
    try {
      const body: unknown = await response.json()
      const message = hasErrorMessage(body) ? body.message : fallback
      return new ApiError(response.status, message, readReason(body))
    } catch {
      return new ApiError(response.status, fallback)
    }
  }
}
