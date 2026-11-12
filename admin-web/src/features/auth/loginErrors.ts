/**
 * Sign-in failures the panel decides for itself, as opposed to the ones the backend reports.
 *
 * They are typed rather than raised as bare `Error`s for the same reason the API failures are
 * (`@/api/client/apiErrors`): a caller that wants to treat "this address is not on the admin
 * team" differently from "the network is down" should be able to ask what the failure *is*,
 * not match on its wording. Deciding authorization by matching an error string is a mistake
 * this codebase has already made once.
 */

/** Base for every sign-in failure raised by the panel itself. Never thrown directly. */
export abstract class LoginError extends Error {
  protected constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/**
 * The address is not on the admin team, so no code was requested. Raised before the backend
 * is asked anything, and again before the code is exchanged — the field is editable between
 * the two steps, and `/auth/login` serves students as well.
 */
export class NotAnAdminError extends LoginError {
  constructor(message: string) {
    super(message)
  }
}

/**
 * The credentials were accepted and the session still cannot say who this is.
 *
 * Failing the sign-in is the honest outcome. An id the panel invented once reached the
 * backend as the author of a warning, so a session without a backend-issued identity is not
 * usable even though the token is valid.
 */
export class IdentityUnavailableError extends LoginError {
  constructor(message: string) {
    super(message)
  }
}
