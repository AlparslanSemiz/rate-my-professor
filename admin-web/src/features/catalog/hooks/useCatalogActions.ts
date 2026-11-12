import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  catalogService,
  type LectureUpdate,
  type ProfessorUpdate,
} from '@/api/catalog'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { catalogKeys } from './catalogKeys'

/**
 * The writes the catalogue screen can make.
 *
 * All four re-read **both** lists, not just the one that was written: a lecture edit
 * reassigns professors and a professor edit reassigns lectures, so either write changes what
 * the other tab shows. Deleting a lecture takes its ratings too, so the ratings list goes
 * with them.
 */
export function useCatalogActions() {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(
    () => queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
    [queryClient],
  )

  const updateLecture = useMutation({
    mutationFn: ({ id, update }: { id: string; update: LectureUpdate }) =>
      catalogService.updateLecture(id, update),
    onSuccess: invalidateAll,
  })

  const deleteLecture = useMutation({
    mutationFn: (id: string) => catalogService.deleteLecture(id),
    onSuccess: invalidateAll,
  })

  const updateProfessor = useMutation({
    mutationFn: ({ id, update }: { id: string; update: ProfessorUpdate }) =>
      catalogService.updateProfessor(id, update),
    onSuccess: invalidateAll,
  })

  const deleteProfessor = useMutation({
    mutationFn: (id: string) => catalogService.deleteProfessor(id),
    onSuccess: invalidateAll,
  })

  const failure =
    updateLecture.error ?? deleteLecture.error ?? updateProfessor.error ?? deleteProfessor.error

  const messageFor = () => {
    if (updateLecture.error)
      return getErrorMessage(updateLecture.error, 'The lecture could not be saved.')
    if (deleteLecture.error)
      return getErrorMessage(deleteLecture.error, 'The lecture could not be deleted.')
    if (updateProfessor.error)
      return getErrorMessage(updateProfessor.error, 'The professor could not be saved.')
    return getErrorMessage(deleteProfessor.error, 'The professor could not be deleted.')
  }

  return {
    mutating:
      updateLecture.isPending ||
      deleteLecture.isPending ||
      updateProfessor.isPending ||
      deleteProfessor.isPending,
    actionError: failure ? messageFor() : '',
    // These reject on a refused write, which is what keeps an edit modal open showing its own
    // inline error rather than closing over a change the backend did not take.
    updateLecture: async (id: string, update: LectureUpdate) => {
      await updateLecture.mutateAsync({ id, update })
    },
    deleteLecture: async (id: string) => {
      await deleteLecture.mutateAsync(id)
    },
    updateProfessor: async (id: string, update: ProfessorUpdate) => {
      await updateProfessor.mutateAsync({ id, update })
    },
    deleteProfessor: async (id: string) => {
      await deleteProfessor.mutateAsync(id)
    },
  }
}
