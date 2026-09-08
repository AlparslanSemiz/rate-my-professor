import { useState } from 'react'
import { Button, Group, Modal, MultiSelect, Stack, Switch, TextInput } from '@mantine/core'
import type { Lecture, Professor, ProfessorUpdate } from '../../../api/CatalogService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkInputStyles } from '../../../constants/inputStyles'
import { darkModalStyles } from '../../../constants/modalStyles'
import {
  buildProfessorUpdate,
  canSaveProfessorEdit,
  createProfessorEditDraft,
} from '../catalogEditModel'
import { lectureLabel } from '../catalogModel'
import { useCatalogEditSubmit } from '../hooks/useCatalogEditSubmit'
import InactiveVisibilityNotice from './InactiveVisibilityNotice'

interface ProfessorEditModalProps {
  professor: Professor | null
  lectures: Lecture[]
  /** Lecture ids the professor currently teaches, derived from the lecture list. */
  assignedLectureIds: string[]
  onClose: () => void
  onSubmit: (id: string, update: ProfessorUpdate) => Promise<void>
}

export default function ProfessorEditModal({
  professor,
  lectures,
  assignedLectureIds,
  onClose,
  onSubmit,
}: ProfessorEditModalProps) {
  return (
    <Modal
      opened={professor !== null}
      onClose={onClose}
      title="Edit professor"
      centered
      size="lg"
      styles={darkModalStyles}
    >
      {/* Keyed on the professor so the fields are initial state rather than state kept in
          step with a prop. */}
      {professor && (
        <ProfessorEditForm
          key={professor.id}
          professor={professor}
          lectures={lectures}
          assignedLectureIds={assignedLectureIds}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  )
}

interface ProfessorEditFormProps {
  professor: Professor
  lectures: Lecture[]
  assignedLectureIds: string[]
  onClose: () => void
  onSubmit: (id: string, update: ProfessorUpdate) => Promise<void>
}

function ProfessorEditForm({
  professor,
  lectures,
  assignedLectureIds,
  onClose,
  onSubmit,
}: ProfessorEditFormProps) {
  const [draft, setDraft] = useState(() => createProfessorEditDraft(professor, assignedLectureIds))
  const update = buildProfessorUpdate(professor, assignedLectureIds, draft)
  const canSave = canSaveProfessorEdit(professor, assignedLectureIds, draft)

  const { saving, error, handleSubmit } = useCatalogEditSubmit({
    id: professor.id,
    update,
    canSave,
    onClose,
    onSubmit,
    errorMessage: 'The professor could not be saved.',
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={14}>
        <Group grow align="flex-start">
          <TextInput
            label="First name"
            value={draft.firstName}
            onChange={(event) => {
              const firstName = event.currentTarget.value
              setDraft((current) => ({ ...current, firstName }))
            }}
            styles={darkInputStyles}
          />
          <TextInput
            label="Last name"
            value={draft.lastName}
            onChange={(event) => {
              const lastName = event.currentTarget.value
              setDraft((current) => ({ ...current, lastName }))
            }}
            styles={darkInputStyles}
          />
        </Group>
        <MultiSelect
          label="Lectures"
          description="Replaces the assignment — clear it to detach the professor from every lecture."
          data={lectures.map((lecture) => ({
            value: lecture.id,
            label: lectureLabel(lecture),
          }))}
          value={draft.lectureIds}
          onChange={(lectureIds) => setDraft((current) => ({ ...current, lectureIds }))}
          searchable
          clearable
          styles={darkInputStyles}
        />
        <Switch
          label="Active"
          checked={draft.active}
          onChange={(event) => {
            const active = event.currentTarget.checked
            setDraft((current) => ({ ...current, active }))
          }}
          color="green"
        />
        {!draft.active && <InactiveVisibilityNotice noun="professor" />}
        <ErrorAlert message={error} mb={0} />
        <Group justify="flex-end" gap={10}>
          <Button variant="subtle" color="gray" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" color="green" loading={saving} disabled={!canSave}>
            Save changes
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
