import { useState, type FormEvent } from 'react'
import { Button, Group, Modal, MultiSelect, Stack, Switch, TextInput } from '@mantine/core'
import type { Lecture, Professor, ProfessorUpdate } from '../../../api/CatalogService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkInputStyles } from '../../../constants/inputStyles'
import { darkModalStyles } from '../../../constants/modalStyles'
import { sameIdSet } from '../../../utils/collection'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import { lectureLabel } from '../catalogModel'
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
  const [firstName, setFirstName] = useState(professor.firstName)
  const [lastName, setLastName] = useState(professor.lastName)
  const [active, setActive] = useState(professor.active)
  const [lectureIds, setLectureIds] = useState<string[]>(assignedLectureIds)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const trimmedFirstName = firstName.trim()
  const trimmedLastName = lastName.trim()

  const update: ProfessorUpdate = {}
  if (trimmedFirstName !== professor.firstName) update.firstName = trimmedFirstName
  if (trimmedLastName !== professor.lastName) update.lastName = trimmedLastName
  if (active !== professor.active) update.active = active
  if (!sameIdSet(lectureIds, assignedLectureIds)) update.lectureIds = lectureIds

  const canSave =
    trimmedFirstName.length > 0 && trimmedLastName.length > 0 && Object.keys(update).length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setError('')
    try {
      await onSubmit(professor.id, update)
      onClose()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'The professor could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={14}>
        <Group grow align="flex-start">
          <TextInput
            label="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.currentTarget.value)}
            styles={darkInputStyles}
          />
          <TextInput
            label="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.currentTarget.value)}
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
          value={lectureIds}
          onChange={setLectureIds}
          searchable
          clearable
          styles={darkInputStyles}
        />
        <Switch
          label="Active"
          checked={active}
          onChange={(event) => setActive(event.currentTarget.checked)}
          color="green"
        />
        {!active && <InactiveVisibilityNotice noun="professor" />}
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
