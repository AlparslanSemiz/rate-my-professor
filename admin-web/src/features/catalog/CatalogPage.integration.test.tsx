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

/**
 * Widens one tab's status filter to `All`.
 *
 * The catalogue defaults to Active, which is what an operator wants and what `F-006` asked
 * for. Half the fixture is deliberately inactive - `Databases` and `Alan Turing` - so a test
 * about listing or searching has to say which state it means before it can look for one.
 *
 * @param user the session driving the page
 * @param noun which tab's filter to widen
 */
async function showAll(user: ReturnType<typeof userEvent.setup>, noun: 'lectures' | 'professors') {
  const control = screen.getByRole('combobox', { name: `Filter ${noun} by status` })
  await user.click(control)
  fireEvent.click(await screen.findByRole('option', { name: 'All', hidden: true }))
  // The dropdown stays mounted in its portal, so the box's own value is what says it took.
  await waitFor(() => expect(control).toHaveValue('All'))
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
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText('Algorithms')
    // Both states, because the point of this test is the columns rather than the filter.
    await showAll(user, 'lectures')

    // Scoped to the table: `Active` and `Inactive` are also the filter's own options, which
    // stay mounted in Mantine's portal once the dropdown has been opened.
    const table = within(screen.getByRole('table'))

    expect(await table.findByText('Algorithms')).toBeInTheDocument()
    expect(table.getByText('Winter 2026')).toBeInTheDocument()
    expect(table.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(table.getByText('Unassigned')).toBeInTheDocument()
    expect(table.getByText('Inactive')).toBeInTheDocument()
  })

  it('filters lectures by name, code, or professor', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await screen.findByText('Algorithms')
    await showAll(user, 'lectures')

    await user.type(screen.getByRole('textbox', { name: 'Search lectures' }), 'CS102')

    expect(screen.getByText('Databases')).toBeInTheDocument()
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument()
  })

  it('puts the search in the filter bar between the tabs and the table, not inside the table panel', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await screen.findByText('Algorithms')

    // `F-067`. This screen was the one with no filter bar at all: its search sat in the table
    // panel's own header, right-aligned at x=1067, where every other screen puts its search at
    // x=293. Moving it into the shell is what makes the five screens one shell.
    //
    // `F-087` then moved the bar *below* the tab strip. Above it, this screen's strip sat at
    // y=306.6 while Comments and Bug Reports had theirs at 220.6 - and the equality across
    // screens is what `F-065` was closed on. Comments already renders its filters inside the
    // tab panel; this is the same arrangement.
    //
    // The cost is unchanged and is the one `F-065` found on Comments: the control differs per
    // tab - a text box for Lectures and Professors, a lecture Select for Ratings - so the page
    // holds the open tab for the bar to follow it.
    const search = screen.getByRole('textbox', { name: 'Search lectures' })
    const tabs = screen.getByRole('tablist')
    const table = screen.getByRole('table')

    const tabsBeforeSearch = tabs.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING
    const searchBeforeTable = search.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING

    expect(tabsBeforeSearch).toBeTruthy()
    expect(searchBeforeTable).toBeTruthy()
    // And it is not back inside the table's own panel.
    expect(table.closest('.panel')?.contains(search)).toBe(false)

    // It still follows the tab rather than freezing on the first one's control.
    await user.click(screen.getByRole('tab', { name: /Ratings/ }))

    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Search lectures' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('combobox', { name: 'Filter ratings by lecture' })).toBeInTheDocument()
  })

  it('sends only the fields a lecture edit changed', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('button', { name: 'Edit CS101 - Algorithms' }))
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

    await user.click(await screen.findByRole('button', { name: 'Edit CS101 - Algorithms' }))
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

    await user.click(await screen.findByRole('button', { name: 'Delete CS101 - Algorithms' }))
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
    await showAll(user, 'professors')
    await user.type(await screen.findByLabelText('Search professors'), 'turing')

    expect(await screen.findByText('Alan Turing')).toBeInTheDocument()
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
  })

  it('shows the lectures the backend says a professor teaches', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Professors/ }))
    await showAll(user, 'professors')

    const turingRow = await screen.findByText('Alan Turing')
    expect(turingRow).toBeInTheDocument()
    expect(screen.getByText('CS101 - Algorithms')).toBeInTheDocument()
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
    await showAll(user, 'professors')
    await user.click(await screen.findByText('Alan Turing'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('textbox', { name: 'Last name' })).toHaveValue('Turing')
  })

  it('does not open the editor when a row action is pressed', async () => {
    const user = userEvent.setup()
    renderCatalog()

    // Delete has its own confirmation; the row click behind it must not also open the form.
    await user.click(await screen.findByRole('button', { name: 'Delete CS101 - Algorithms' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('textbox', { name: 'Name' })).toBeNull()
    expect(within(dialog).getByRole('button', { name: 'Delete lecture' })).toBeInTheDocument()
  })

  it('lists active lectures only until the filter is widened', async () => {
    const user = userEvent.setup()
    renderCatalog()

    // `Databases` is the fixture's inactive lecture. The screen reads `/data/lectures/all`, so
    // it is in the list the page holds; the default filter is what keeps it off the table.
    expect(await screen.findByText('Algorithms')).toBeInTheDocument()
    expect(screen.queryByText('Databases')).toBeNull()

    await user.click(screen.getByRole('combobox', { name: 'Filter lectures by status' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Inactive', hidden: true }))

    // The one that could not be reached from any screen before `F-006` was closed.
    expect(await screen.findByText('Databases')).toBeInTheDocument()
    expect(screen.queryByText('Algorithms')).toBeNull()

    await user.click(screen.getByRole('combobox', { name: 'Filter lectures by status' }))
    fireEvent.click(await screen.findByRole('option', { name: 'All', hidden: true }))

    expect(await screen.findByText('Databases')).toBeInTheDocument()
    expect(screen.getByText('Algorithms')).toBeInTheDocument()
  })

  it('counts the panel against the whole catalogue, not against the filter', async () => {
    const user = userEvent.setup()
    renderCatalog()

    // Two lectures in the fixture, one of them inactive. The tab counts what the filter shows
    // and the panel's denominator counts the catalogue - they are different questions, and the
    // denominator's own words are "in the catalogue".
    //
    // It used to be the filtered count, which read "1 of 1 in the catalogue" while the stat
    // card above it said 2. Against the live backend that was "92 of 92" under a card reading
    // 95, so the three inactive lectures looked like rows the panel had lost rather than rows
    // the filter was holding back.
    expect(await screen.findByText('1 of 2 in the catalogue')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Filter lectures by status' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Inactive', hidden: true }))

    expect(await screen.findByText('1 of 2 in the catalogue')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Filter lectures by status' }))
    fireEvent.click(await screen.findByRole('option', { name: 'All', hidden: true }))

    expect(await screen.findByText('2 of 2 in the catalogue')).toBeInTheDocument()
  })

  it('lists active professors only until the filter is widened', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Professors/ }))

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.queryByText('Alan Turing')).toBeNull()

    await user.click(screen.getByRole('combobox', { name: 'Filter professors by status' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Inactive', hidden: true }))

    expect(await screen.findByText('Alan Turing')).toBeInTheDocument()
    expect(screen.queryByText('Ada Lovelace')).toBeNull()
  })

  it('warns that switching a lecture to Inactive takes it out of the default view', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('button', { name: 'Edit CS101 - Algorithms' }))
    const dialog = await screen.findByRole('dialog')

    // The row leaves the default view rather than the panel now (`F-006`), but it is still a
    // change worth announcing, and not before the operator has actually made it.
    expect(within(dialog).queryByText(/takes the lecture out of the app/)).toBeNull()

    await user.click(within(dialog).getByLabelText('Active'))

    expect(within(dialog).getByText(/takes the lecture out of the app/)).toBeInTheDocument()
  })

  it('warns that switching a professor to Inactive takes them out of the default view', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Professors/ }))
    await user.click(await screen.findByRole('button', { name: 'Edit Ada Lovelace' }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).queryByText(/takes the professor out of the app/)).toBeNull()

    await user.click(within(dialog).getByLabelText('Active'))

    expect(within(dialog).getByText(/takes the professor out of the app/)).toBeInTheDocument()
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
    fireEvent.click(await screen.findByRole('option', { name: 'CS101 - Algorithms', hidden: true }))

    await waitFor(() =>
      expect(ratingsService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ lectureId: 'lecture-1' }),
      ),
    )
  })

  it('opens a rating in a read-only detail view when the row is pressed', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(await screen.findByRole('tab', { name: /Ratings/ }))
    await user.click(await screen.findByRole('row', { name: /^Open the rating by Alice Smith/ }))

    const dialog = await screen.findByRole('dialog')
    // Every category in full, rather than the single truncated line the cell can hold.
    expect(within(dialog).getByText('Content')).toBeInTheDocument()
    expect(within(dialog).getByText('Difficulty')).toBeInTheDocument()
    expect(within(dialog).getByText('Alice Smith')).toBeInTheDocument()
    expect(within(dialog).getByText('CS101 - Algorithms')).toBeInTheDocument()

    // A rating is someone's own assessment: the backend serves no write for one, so this view
    // offers no way to change it. Read-only is the contract, not a simplification.
    expect(within(dialog).queryByRole('textbox')).toBeNull()
    expect(within(dialog).queryByRole('button', { name: /save/i })).toBeNull()
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
