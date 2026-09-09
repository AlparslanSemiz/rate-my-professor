import { useState } from 'react'
import {
  Button,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core'
import type { Lecture, LectureUpdate, Professor } from '@/api/catalog'
import ErrorAlert from '@/components/ErrorAlert'
import {
  LECTURE_TYPES,
  SEMESTER_SEASONS,
  isLectureType,
  isSemesterSeason,
} from '@/domain/catalog'
import { enumLabel } from '@/utils/enumLabel'
import {
  buildLectureUpdate,
  canSaveLectureEdit,
  createLectureEditDraft,
} from '../catalogEditModel'
import { professorName } from '../catalogModel'
import { useCatalogEditSubmit } from '../hooks/useCatalogEditSubmit'
import InactiveVisibilityNotice from './InactiveVisibilityNotice'

const seasonOptions = SEMESTER_SEASONS.map((season) => ({
  value: season,
  label: enumLabel(season),
}))
const lectureTypeOptions = LECTURE_TYPES.map((type) => ({ value: type, label: enumLabel(type) }))

interface LectureEditModalProps {
  lecture: Lecture | null
  professors: Professor[]
  onClose: () => void
  onSubmit: (id: string, update: LectureUpdate) => Promise<void>
}

export default function LectureEditModal({
  lecture,
  professors,
  onClose,
  onSubmit,
}: LectureEditModalProps) {
  return (
    <Modal
      opened={lecture !== null}
      onClose={onClose}
      title="Edit lecture"
      centered
      size="lg"
    >
      {/* Keyed on the lecture so the fields are initial state rather than state kept in
          step with a prop. */}
      {lecture && (
        <LectureEditForm
          key={lecture.id}
          lecture={lecture}
          professors={professors}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  )
}

interface LectureEditFormProps {
  lecture: Lecture
  professors: Professor[]
  onClose: () => void
  onSubmit: (id: string, update: LectureUpdate) => Promise<void>
}

function LectureEditForm({ lecture, professors, onClose, onSubmit }: LectureEditFormProps) {
  const [draft, setDraft] = useState(() => createLectureEditDraft(lecture))
  const update = buildLectureUpdate(lecture, draft)
  const canSave = canSaveLectureEdit(lecture, draft)

  const { saving, error, handleSubmit } = useCatalogEditSubmit({
    id: lecture.id,
    update,
    canSave,
    onClose,
    onSubmit,
    errorMessage: 'The lecture could not be saved.',
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={14}>
        <TextInput
          label="Name"
          value={draft.name}
          onChange={(event) => {
            const name = event.currentTarget.value
            setDraft((current) => ({ ...current, name }))
          }}
        />
        <TextInput
          label="Code"
          value={draft.code}
          onChange={(event) => {
            const code = event.currentTarget.value
            setDraft((current) => ({ ...current, code }))
          }}
        />
        <Group grow align="flex-start">
          <NumberInput
            label="Semester year"
            value={draft.semesterYear}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                semesterYear: typeof value === 'number' ? value : 0,
              }))
            }
            min={1900}
            max={2999}
            clampBehavior="strict"
            allowDecimal={false}
          />
          <Select
            label="Semester season"
            data={seasonOptions}
            value={draft.semesterSeason}
            onChange={(value) => {
              if (isSemesterSeason(value)) {
                setDraft((current) => ({ ...current, semesterSeason: value }))
              }
            }}
            clearable={false}
          />
        </Group>
        <MultiSelect
          label="Professors"
          description="Replaces the assignment — clear it to leave the lecture unassigned."
          data={professors.map((professor) => ({
            value: professor.id,
            label: professorName(professor),
          }))}
          value={draft.professorIds}
          onChange={(professorIds) => setDraft((current) => ({ ...current, professorIds }))}
          searchable
          clearable
        />
        <Select
          label="Lecture type"
          description="Decides which categories future ratings can score. Ratings already submitted keep the categories they were given."
          data={lectureTypeOptions}
          value={draft.lectureType}
          onChange={(value) => {
            if (isLectureType(value)) {
              setDraft((current) => ({ ...current, lectureType: value }))
            }
          }}
          clearable={false}
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
        {!draft.active && <InactiveVisibilityNotice noun="lecture" />}
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
