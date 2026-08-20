import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogService, type Lecture, type Professor } from '../../api/CatalogService'
import CatalogPage from './CatalogPage'

vi.mock('../../api/CatalogService', () => ({
  catalogService: {
    getLectures: vi.fn(),
    getProfessors: vi.fn(),
    updateLecture: vi.fn(),
    deleteLecture: vi.fn(),
    updateProfessor: vi.fn(),
    deleteProfessor: vi.fn(),
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

function renderCatalog() {
  return render(
    <MantineProvider>
      <CatalogPage />
    </MantineProvider>
  )
}

describe('Catalogue page', () => {
  beforeEach(() => {
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
})
