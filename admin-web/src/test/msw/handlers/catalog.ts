import { http } from 'msw'
import type { Lecture, LectureUpdate, Professor, ProfessorUpdate } from '@/api/catalog'
import { apiUrl } from '../apiUrl'
import { db } from '../db'
import { failure, ok, paginate } from '../envelope'

/**
 * The catalogue: lectures, professors and ratings.
 *
 * This slice existed nowhere until the call-surface sweep needed it. Eight of the panel's
 * forty-two endpoints had no handler at all, which `onUnhandledRequest: 'error'` turns into a
 * failed test the moment anything asks for them — and, in the browser worker, into a request
 * that falls through `onUnhandledRequest: 'bypass'` to the real network. ADR 0009's
 * slice-by-slice rule is met the same way the moderation slice met it: the **transport** moves
 * here, while `CatalogPage.integration.test.tsx` still replaces its service module, which stays
 * a recorded gap in `docs/testplan.md` §6.4.
 */

const NOT_FOUND_MESSAGE = 'No such record'

/**
 * `Lecture.professors` and `Professor.lectureIds` are `readonly`, so an edit replaces the
 * record rather than assigning into it. That is not a workaround: the panel's own types say
 * these collections are not written through, and a handler that mutated them would be
 * modelling a backend the type system says does not exist.
 */
function replace<T extends { id: string }>(list: T[], updated: T): void {
  list[list.findIndex((item) => item.id === updated.id)] = updated
}

/**
 * The active-only reads and the admin reads, kept apart because the backend keeps them apart.
 *
 * `GET /data/lectures` and `GET /data/professor` filter to `active = true` - that is what they
 * are for, since the app must not offer a retired lecture - while `/all` serves both. Until
 * 2026-09-10 this file served **everything** from both, which made `F-006`'s one-way door
 * impossible to reproduce: a lecture switched to Inactive stayed on screen, so the panel's own
 * warning that it would vanish was never once true in a test.
 */
const lectureHandlers = [
  http.get(apiUrl('/data/lectures/all'), () => ok({ lectures: db.lectures })),

  http.get(apiUrl('/data/lectures'), () =>
    ok({ lectures: db.lectures.filter((lecture) => lecture.active) }),
  ),

  http.patch(apiUrl('/data/lectures/:id'), async ({ params, request }) => {
    const lecture = db.lectures.find((candidate) => candidate.id === params.id)
    if (!lecture) return failure(404, NOT_FOUND_MESSAGE)

    const update = (await request.json()) as LectureUpdate
    const { professorIds, ...scalars } = update
    const next: Lecture = {
      ...lecture,
      ...scalars,
      // The assignment is replaced wholesale, which is what `LectureUpdate` documents: an
      // empty array clears it rather than meaning "unchanged".
      professors:
        professorIds === undefined
          ? lecture.professors
          : db.professors.filter((professor) => professorIds.includes(professor.id)),
    }
    replace(db.lectures, next)
    return ok({}, 'Updated')
  }),

  http.delete(apiUrl('/data/lectures/:id'), ({ params }) => {
    const index = db.lectures.findIndex((candidate) => candidate.id === params.id)
    if (index === -1) return failure(404, NOT_FOUND_MESSAGE)
    db.lectures.splice(index, 1)
    // The backend cascades: a lecture takes its ratings with it. A handler that left them
    // behind would let a test assert a delete that only half happened.
    db.ratings = db.ratings.filter((rating) => rating.lectureId !== params.id)
    return ok({}, 'Deleted')
  }),
]

const professorHandlers = [
  http.get(apiUrl('/data/professor/all'), () => ok({ professors: db.professors })),

  http.get(apiUrl('/data/professor'), () =>
    ok({ professors: db.professors.filter((professor) => professor.active) }),
  ),

  http.patch(apiUrl('/data/professor/:id'), async ({ params, request }) => {
    const professor = db.professors.find((candidate) => candidate.id === params.id)
    if (!professor) return failure(404, NOT_FOUND_MESSAGE)

    const update = (await request.json()) as ProfessorUpdate
    const { lectureIds, ...scalars } = update
    const next: Professor = {
      ...professor,
      ...scalars,
      lectureIds: lectureIds === undefined ? professor.lectureIds : [...lectureIds],
    }
    replace(db.professors, next)
    return ok({}, 'Updated')
  }),

  http.delete(apiUrl('/data/professor/:id'), ({ params }) => {
    const index = db.professors.findIndex((candidate) => candidate.id === params.id)
    if (index === -1) return failure(404, NOT_FOUND_MESSAGE)
    db.professors.splice(index, 1)
    // Deleting a professor leaves the lectures standing and drops only the assignment, which
    // is the one place the two deletions genuinely differ.
    db.lectures = db.lectures.map((lecture) => ({
      ...lecture,
      professors: lecture.professors.filter((ref) => ref.id !== params.id),
    }))
    return ok({}, 'Deleted')
  }),
]

const ratingHandlers = [
  http.get(apiUrl('/ratings'), ({ request }) => {
    const url = new URL(request.url)
    const lectureId = url.searchParams.get('lectureId')
    const matching = lectureId
      ? db.ratings.filter((rating) => rating.lectureId === lectureId)
      : db.ratings

    const page = paginate(matching, url, (rating) => rating.id)
    if (!page) return failure(400, 'A cursor requires a limit')
    return ok({ ratings: page.items, nextCursor: page.nextCursor })
  }),

  http.delete(apiUrl('/ratings/:id'), ({ params }) => {
    const index = db.ratings.findIndex((candidate) => candidate.id === params.id)
    if (index === -1) return failure(404, NOT_FOUND_MESSAGE)
    db.ratings.splice(index, 1)
    return ok({}, 'Deleted')
  }),
]

export const catalogHandlers = [...lectureHandlers, ...professorHandlers, ...ratingHandlers]
