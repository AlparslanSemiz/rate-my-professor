import { Group, MultiSelect, TextInput } from '@mantine/core'
import type { Lecture, Professor, ProfessorUpdate } from '@/api/catalog'
import {
  buildProfessorUpdate,
  canSaveProfessorEdit,
  createProfessorEditDraft,
  lectureLabel,
} from '../model'
import CatalogEditModal from './CatalogEditModal'

interface ProfessorEditModalProps {
  professor: Professor | null
  lectures: Lecture[]
  /** Lecture ids the professor currently teaches, derived from the lecture list. */
  assignedLectureIds: readonly string[]
  onClose: () => void
  onSubmit: (id: string, update: ProfessorUpdate) => Promise<void>
}

/**
 * The professor's fields. Everything around them is `CatalogEditModal`.
 *
 * The three model calls are bound to `assignedLectureIds` here, because the professor
 * endpoint does not report the assignment — it is derived from the lecture list the page
 * already loaded, and only this component knows that.
 */
export default function ProfessorEditModal({
  professor,
  lectures,
  assignedLectureIds,
  onClose,
  onSubmit,
}: ProfessorEditModalProps) {
  return (
    <CatalogEditModal
      record={professor}
      title="Edit professor"
      noun="professor"
      errorMessage="The professor could not be saved."
      createDraft={(record) => createProfessorEditDraft(record, assignedLectureIds)}
      buildUpdate={(record, draft) => buildProfessorUpdate(record, assignedLectureIds, draft)}
      canSave={(record, draft) => canSaveProfessorEdit(record, assignedLectureIds, draft)}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      {(form) => (
        <>
          <Group grow align="flex-start">
            <TextInput label="First name" {...form.getInputProps('firstName')} />
            <TextInput label="Last name" {...form.getInputProps('lastName')} />
          </Group>
          <MultiSelect
            label="Lectures"
            description="Replaces the assignment. Clear it to detach the professor from every lecture."
            data={lectures.map((lecture) => ({
              value: lecture.id,
              label: lectureLabel(lecture),
            }))}
            searchable
            clearable
            {...form.getInputProps('lectureIds')}
          />
        </>
      )}
    </CatalogEditModal>
  )
}
