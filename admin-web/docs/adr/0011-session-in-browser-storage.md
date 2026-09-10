# 0011 — The session lives in browser storage, with the XSS surface that implies

**Status:** Accepted
**Date:** 2026-09-09 *(recorded; the decision predates this folder)*

> Written as a defence, like [0010](0010-admin-email-list-in-the-bundle.md). It
> describes a cost the project has knowingly accepted and says what would remove it.

## Decision

The opaque bearer token and the signed-in account are stored in `localStorage`
under `token` and `user`, read back on load, and validated with a `zod` schema
before they are trusted. The token is sent as `Authorization: Bearer …`.

## Context

The backend issues an opaque token from `POST /auth/login` and expects it on the
`Authorization` header. Something in the browser has to hold it across a reload, and
every option for *where* has a different failure mode.

**The threat this is about is precise:** any JavaScript executing on the panel's
origin can read `localStorage`. If an attacker gets script execution — a cross-site
scripting hole, or a compromised dependency — the token is readable and exfiltrable,
and it is a *live admin session*. That is the honest statement of the risk, and it is
not reduced by calling the storage key something else.

## Alternatives considered

**An `httpOnly` cookie.** The correct answer to this threat, and the only one that
removes it: script cannot read an `httpOnly` cookie at all. Rejected because it is
not a frontend decision. A cookie is sent automatically on every request to the
origin, which reintroduces CSRF — so it needs `SameSite`, a CSRF token or an
origin check, all issued and validated by the backend. The backend authenticates on
a bearer header and has no CSRF story. Adopting cookies in the panel alone would
produce a session that does not authenticate.

**`sessionStorage` instead.** Marginal, and it fails the requirement. It is readable
by exactly the same script; all it changes is that the session dies when the tab
closes — which is precisely the reload-survival the panel needs, and whose absence
was `F-002`.

**Keep the token in memory only.** Genuinely narrows the window: nothing survives a
reload, so a token stolen after one is not there to steal. Rejected on what it costs
the operator — every refresh, every deep link and every crash of the tab becomes a
new login, and the login is a code sent by mail with a rate limit of three attempts
per address in fifteen minutes. It converts a rare risk into constant friction.

**A refresh-token pair with a short-lived access token.** The usual mitigation, and
it needs backend support that does not exist: `/auth/login` issues one opaque token
with no refresh endpoint and no expiry the panel can read.

## Rationale

Given a bearer-token backend with no refresh flow and no CSRF handling, `localStorage`
is the only option that both survives a reload and authenticates. The decision is
therefore about **reducing the chance of script execution**, since the consequence of
it cannot be reduced from here.

What actually reduces it, in this codebase:

- **No XSS sink exists.** `grep` for `dangerouslySetInnerHTML`, `innerHTML` and
  `eval(` across `src/` returns nothing. All operator-supplied and student-supplied
  text — comment bodies, warning messages, bug report descriptions, audit metadata —
  is rendered as React children and escaped by default.
- **The stored session is validated, not trusted.** `readStoredSession` parses it
  against a `zod` schema and clears the whole session if anything is off, including a
  non-boolean under `isSuperAdmin`. The schema `refine`s rather than `.trim()`s, so
  it never silently rewrites a stored value.
- **A `401` clears both keys**, so a revoked token does not linger.
- **The served app sets `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`**
  in the production nginx config.
- **The GitLab API token is not here at all.** Issue creation lives on the backend
  precisely because a token that reaches the browser is a leaked token — the same
  reasoning, applied where there *was* a choice.

## Consequences

**Accepted, explicitly.** An XSS hole in this panel is a full admin-session
compromise, not a defacement. Nothing in the frontend changes that; only an
`httpOnly` cookie would, and it needs backend work.

**There is no Content-Security-Policy.** `nosniff` and `DENY` are set; a CSP is not.
It is the cheapest remaining mitigation — it would blunt an injected inline script
even if one existed — and it is a change to `docker/nginx.prod.conf.template`, not to
the app. This record is where that gap is on file.

**The token has no expiry the panel can see.** It holds the token until the backend
refuses it. A `401` is the only signal, and it is handled centrally in `ApiClient`.

**An unreachable backend deliberately does not end the session.** A rejected origin
and a downed host are the same `TypeError` to `fetch`, so treating a network failure
as a `401` would sign the operator out every time the VPN dropped. This is a
documented decision with its own test — and it means a session outlives a backend
that is merely unreachable, which is intended.

**Reversing this is a joint change.** Moving to cookies requires the backend to issue
them, validate CSRF, and keep bearer support for the Android client during the
overlap. It is not a frontend refactor and should not be attempted as one.

## Sources

`src/context/authSessionStorage.ts`; `src/api/client/ApiClient.ts`;
`docker/nginx.prod.conf.template`; `CHANGELOG.md` — refactor step 4 (`zod`);
`docs/testfindings.md` `F-002`.
