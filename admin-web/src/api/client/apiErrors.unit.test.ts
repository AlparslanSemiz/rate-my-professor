import { describe, expect, it } from 'vitest'
import {
  ApiError,
  BadRequestError,
  ConflictError,
  ContractError,
  ForbiddenError,
  HTTP_STATUS,
  NetworkError,
  NotFoundError,
  RateLimitedError,
  RefusedError,
  responseErrorFor,
  ResponseError,
  UnauthorizedError,
} from './apiErrors'

describe('responseErrorFor', () => {
  it.each([
    [HTTP_STATUS.badRequest, BadRequestError],
    [HTTP_STATUS.unauthorized, UnauthorizedError],
    [HTTP_STATUS.forbidden, ForbiddenError],
    [HTTP_STATUS.notFound, NotFoundError],
    [HTTP_STATUS.conflict, ConflictError],
    [HTTP_STATUS.tooManyRequests, RateLimitedError],
  ])('maps %i to its named type', (status, type) => {
    const error = responseErrorFor(status, 'Refused')

    expect(error).toBeInstanceOf(type)
    expect(error.status).toBe(status)
    expect(error.message).toBe('Refused')
  })

  it('falls back to a plain ResponseError for a status the panel does not name', () => {
    const error = responseErrorFor(418, 'I am a teapot')

    expect(error).toBeInstanceOf(ResponseError)
    expect(error).not.toBeInstanceOf(BadRequestError)
    expect(error.status).toBe(418)
  })

  it('carries the machine-readable refusal code a 409 arrives with', () => {
    const error = responseErrorFor(HTTP_STATUS.conflict, 'Refused', 'VALUE_CHANGED')

    expect(error.reason).toBe('VALUE_CHANGED')
  })

  it('leaves reason null when the endpoint named none', () => {
    expect(responseErrorFor(HTTP_STATUS.notFound, 'Gone').reason).toBeNull()
  })

  it('keeps Retry-After on the one status that documents it', () => {
    const error = responseErrorFor(HTTP_STATUS.tooManyRequests, 'Too many', null, 60)

    expect((error as RateLimitedError).retryAfterSeconds).toBe(60)
  })
})

describe('transient', () => {
  it('is true only where repeating the request could plausibly work', () => {
    // An unreachable host may come back; a 5xx is the backend's own failure and may pass.
    expect(new NetworkError('Unreachable').transient).toBe(true)
    expect(responseErrorFor(500, 'Boom').transient).toBe(true)
    expect(responseErrorFor(503, 'Unavailable').transient).toBe(true)
  })

  it('is false for anything a retry cannot change', () => {
    // Every 4xx is the request itself being wrong, and a body the panel cannot read stays
    // unreadable. The latter used to arrive as `status: 0` and was retried twice for nothing.
    expect(responseErrorFor(HTTP_STATUS.notFound, 'Gone').transient).toBe(false)
    expect(responseErrorFor(HTTP_STATUS.conflict, 'Refused').transient).toBe(false)
    expect(new ContractError('Not the shape we expect').transient).toBe(false)
  })

  it('is false for a 2xx that reported success: false, despite the status', () => {
    expect(new RefusedError(200, 'Admins cannot be blocked.').transient).toBe(false)
  })
})

describe('the hierarchy', () => {
  it('lets a caller catch every API failure as one type', () => {
    const failures = [
      new NetworkError('Unreachable'),
      new ContractError('Bad shape'),
      responseErrorFor(HTTP_STATUS.forbidden, 'No'),
      new RefusedError(200, 'Refused'),
    ]

    expect(failures.every((failure) => failure instanceof ApiError)).toBe(true)
  })

  it('names itself, so a console line says which failure it was', () => {
    expect(new NetworkError('Unreachable').name).toBe('NetworkError')
    expect(responseErrorFor(HTTP_STATUS.conflict, 'Refused').name).toBe('ConflictError')
  })

  it('keeps the original failure as cause rather than discarding it', () => {
    const cause = new TypeError('Failed to fetch')

    expect(new NetworkError('Unreachable', cause).cause).toBe(cause)
  })
})
