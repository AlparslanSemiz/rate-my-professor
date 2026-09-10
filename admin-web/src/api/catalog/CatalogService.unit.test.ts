import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from '@/api/client/ApiClient'
import { CatalogService } from './CatalogService'
import { jsonResponse, TEST_API_BASE_URL } from '@/test/http'

const fetchMock = vi.fn()

function createService() {
  return new CatalogService(new ApiClient(TEST_API_BASE_URL))
}

describe('CatalogService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('loads lectures with their assigned professors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      lectures: [
        {
          id: 'lecture-1',
          name: 'Algorithms',
          code: 'CS101',
          semesterYear: 2026,
          semesterSeason: 'WINTER',
          active: true,
          professors: [{ id: 'prof-1', firstName: 'Ada', lastName: 'Lovelace' }],
          commentCount: 12,
          ratingCount: 30,
        },
      ],
    }))

    await expect(createService().getLectures()).resolves.toMatchObject([
      { id: 'lecture-1', code: 'CS101', professors: [{ id: 'prof-1' }] },
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/data/lectures/all`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('reads professors from the singular catalogue path, active or not', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      professors: [
        { id: 'prof-1', firstName: 'Ada', lastName: 'Lovelace', averageRating: 4.2, ratingCount: 30 },
      ],
    }))

    await expect(createService().getProfessors()).resolves.toMatchObject([{ id: 'prof-1' }])
    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/data/professor/all`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('replaces a lecture assignment wholesale', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated lecture successfully' }))

    await createService().updateLecture('lecture-1', { professorIds: [], active: false })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${TEST_API_BASE_URL}/data/lectures/lecture-1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ professorIds: [], active: false })
  })

  it('edits and removes a professor under the singular path', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated professor successfully' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Deleted professor successfully' }))
    const service = createService()

    await service.updateProfessor('prof-1', { lastName: 'Byron' })
    await service.deleteProfessor('prof-1')

    const [patchUrl, patchInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(patchUrl).toBe(`${TEST_API_BASE_URL}/data/professor/prof-1`)
    expect(JSON.parse(patchInit.body as string)).toEqual({ lastName: 'Byron' })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${TEST_API_BASE_URL}/data/professor/prof-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('surfaces backend errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Lecture not found' }, 404))

    await expect(createService().deleteLecture('missing')).rejects.toThrow('Lecture not found')
  })
})
