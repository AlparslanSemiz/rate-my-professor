import { MantineProvider } from '@mantine/core'
import { withQueryClient } from '@/test/queryClient'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogService, type Lecture, type Professor, ratingsService, type Rating } from '@/api/catalog'
import CatalogPage from './CatalogPage'

// Lectures, professors and ratings are one package now, so they are one mock.
vi.mock('@/api/catalog', () => ({
  catalogService: {
    getLectures: vi.fn(),
    getProfessors: vi.fn(),
    updateLecture: vi.fn(),
    deleteLecture: vi.fn(),
    updateProfessor: vi.fn(),
    deleteProfessor: vi.fn(),
  },
  ratingsService: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}))

const lectures: Lecture[] = [
  {
    id: 'lecture-1',
    name: 'Algorithms',
    code: 'CS101',
    semesterYear: 2026,
    semesterSeason: 'WINTER',
    active: true,
    lectureType: 'LECTURE_AND_EXERCISE',
    professors: [{ id: 'prof-1', firstName: 'Ada', lastName: 'Lovelace', active: true }],
    commentCount: 12,
    ratingCount: 30,
  },
  {
    id: 'lecture-2',
    name: 'Databases',
    code: 'CS102',
    semesterYear: 2026,
    semesterSeason: 'SUMMER',
    active: false,
    lectureType: 'LECTURE_ONLY',
    professors: [],
    commentCount: 3,
    ratingCount: 7,
  },
]

const professors: Professor[] = [
  { id: 'prof-1', firstName: 'Ada', lastName: 'Lovelace', active: true, averageRating: 4.2, ratingCount: 30, lectureIds: ['lecture-1'] },
  // The backend sends 0 rather than null for a professor nobody has rated.
  { id: 'prof-2', firstName: 'Alan', lastName: 'Turing', active: false, averageRating: 0, ratingCount: 0, lectureIds: [] },
]

const ratings: Rating[] = [
  {
    id: 'rating-1',
    lectureId: 'lecture-1',
    authorName: 'Alice Smith',
    createdAt: '2026-06-01T10:00:00Z',
    scores: { CONTENT: 5, DIFFICULTY: 3 },
  },
]

function renderCatalog() {
  return render(<MantineProvider>{withQueryClient(<CatalogPage />)}</MantineProvider>)
}

describe('Catalogue page', () => {
  beforeEach(() => {
    vi.mocked(ratingsService.list).mockResolvedValue({ ratings, nextCursor: null })
    vi.mocked(ratingsService.delete).mockResolvedValue({ success: true, message: 'Deleted' })
    vi.mocked(catalogService.getLectures).mockResolvedValue(lectures)
    vi.mocked(catalogService.getProfessors).mockResolvedValue(professors)
    vi.mocked(catalogService.updateLecture).mockResolvedValue({ success: true, message: 'Updated' })
    vi.mocked(catalogService.deleteLecture).mockResolvedValue({ success: true, message: 'Deleted' })
    vi.mocked(catalogService.updateProfessor).mockResolvedValue({ success: true, message: 'Updated' })
    vi.mocked(catalogService.deleteProfessor).mockResolvedValue({ success: true, message: 'Deleted' })
  })

  it('lists lectures with their term, staff and activity', async () => {
    renderCatalog()

    expect(await screen.findByText('Algorithms')).toBeInTheDocument()
    expect(screen.getByText('Winter 2026')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('filters lectures by name, code, or professor', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await screen.findByText('Algorithms')

    await user.type(screen.getByRole('textbox', { name: 'Search lectures' }), 'CS102')

    expect(screen.getByText('Databases')).toBeInTheDocument()
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument()
  })

  it('sends only the fields a lecture edit changed', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('button', { name: 'Edit CS101 — Algorithms' }))
    const dialog = await screen.findByRole('dialog')
    const nameInput = within(dialog).getByRole('textbox', { name: 'Name' })
    await user.clear(nameInput)
    await user.type(nameInput, 'Advanced Algorithms')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(catalogService.updateLecture).toHaveBeenCalledWith('lecture-1', {
        name: 'Advanced Algorithms',
      })
    })
  })

  it('keeps the editor open and shows the reason when a save is refused', async () => {
    vi.mocked(catalogService.updateLecture).mockRejectedValueOnce(new Error('Code already in use'))
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('button', { name: 'Edit CS101 — Algorithms' }))
    const dialog = await screen.findByRole('dialog')
    const nameInput = within(dialog).getByRole('textbox', { name: 'Name' })
    await user.clear(nameInput)
    await user.type(nameInput, 'Advanced Algorithms')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    // The modal has to stay: closing over a refused change would tell the operator it landed.
    expect(await within(dialog).findByText('Code already in use')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Advanced Algorithms')
  })

  it('warns that deleting a lecture takes its content with it', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('button', { name: 'Delete CS101 — Algorithms' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(/Its comments, answers and ratings go with it/)
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Delete lecture' }))

    await waitFor(() => expect(catalogService.deleteLecture).toHaveBeenCalledWith('lecture-1'))
  })

  it('filters professors by name', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Professors/ }))
    await user.type(await screen.findByLabelText('Search professors'), 'turing')

    expect(await screen.findByText('Alan Turing')).toBeInTheDocument()
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
  })

  it('shows the lectures the backend says a professor teaches', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Professors/ }))

    const turingRow = await screen.findByText('Alan Turing')
    expect(turingRow).toBeInTheDocument()
    expect(screen.getByText('CS101 — Algorithms')).toBeInTheDocument()
    expect(screen.getByText('None assigned')).toBeInTheDocument()
    expect(screen.getByText('4.2')).toBeInTheDocument()
  })

  it('leaves the professor status alone unless it is explicitly picked', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Professors/ }))
    await user.click(await screen.findByRole('button', { name: 'Edit Ada Lovelace' }))

    const dialog = await screen.findByRole('dialog')
    const lastName = within(dialog).getByRole('textbox', { name: 'Last name' })
    await user.clear(lastName)
    await user.type(lastName, 'Byron')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(catalogService.updateProfessor).toHaveBeenCalledWith('prof-1', { lastName: 'Byron' })
    })
  })

  it('opens the lecture editor when the row itself is pressed', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByText('Algorithms'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Algorithms')
  })

  it('opens the professor editor when the row itself is pressed', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Professors/ }))
    await user.click(await screen.findByText('Alan Turing'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('textbox', { name: 'Last name' })).toHaveValue('Turing')
  })

  it('does not open the editor when a row action is pressed', async () => {
    const user = userEvent.setup()
    renderCatalog()

    // Delete has its own confirmation; the row click behind it must not also open the form.
    await user.click(await screen.findByRole('button', { name: 'Delete CS101 — Algorithms' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('textbox', { name: 'Name' })).toBeNull()
    expect(within(dialog).getByRole('button', { name: 'Delete lecture' })).toBeInTheDocument()
  })

  it('warns that switching a lecture to Inactive hides it from the panel', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('button', { name: 'Edit CS101 — Algorithms' }))
    const dialog = await screen.findByRole('dialog')

    // The reads return active records only, so the warning must not be there until the
    // operator actually closes the door.
    expect(within(dialog).queryByText(/removes the lecture from this panel/)).toBeNull()

    await user.click(within(dialog).getByLabelText('Active'))

    expect(within(dialog).getByText(/removes the lecture from this panel/)).toBeInTheDocument()
  })

  it('warns that switching a professor to Inactive hides them from the panel', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Professors/ }))
    await user.click(await screen.findByRole('button', { name: 'Edit Ada Lovelace' }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).queryByText(/removes the professor from this panel/)).toBeNull()

    await user.click(within(dialog).getByLabelText('Active'))

    expect(within(dialog).getByText(/removes the professor from this panel/)).toBeInTheDocument()
  })

  it('shows a load error and retries', async () => {
    vi.mocked(catalogService.getLectures)
      .mockRejectedValueOnce(new Error('Catalogue unavailable'))
      .mockResolvedValue(lectures)
    const user = userEvent.setup()
    renderCatalog()

    expect(await screen.findByText('Catalogue unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Algorithms')).toBeInTheDocument()
  })
  it('lists ratings and filters them by lecture', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Ratings/ }))

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Content 5 · Difficulty 3')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Filter ratings by lecture' }))
    fireEvent.click(await screen.findByRole('option', { name: 'CS101 — Algorithms', hidden: true }))

    await waitFor(() =>
      expect(ratingsService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ lectureId: 'lecture-1' }),
      ),
    )
  })

  it('removes a rating and re-reads the list', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Ratings/ }))
    await user.click(await screen.findByRole('button', { name: 'Delete rating by Alice Smith' }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete rating' }))

    await waitFor(() => expect(ratingsService.delete).toHaveBeenCalledWith('rating-1'))
    // What is left is what the backend serves, not what the screen removed from its own list.
    await waitFor(() => expect(ratingsService.list).toHaveBeenCalledTimes(2))
  })

})
