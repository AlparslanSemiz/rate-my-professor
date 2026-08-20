import { useState, type FormEvent } from 'react'
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
import type { Lecture, LectureUpdate, Professor } from '../../../api/CatalogService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkInputStyles } from '../../../constants/inputStyles'
import { darkModalStyles } from '../../../constants/modalStyles'
import {
  LECTURE_TYPES,
  SEMESTER_SEASONS,
  isLectureType,
  isSemesterSeason,
  type LectureType,
  type SemesterSeason,
} from '../../../domain/catalog'
import { sameIdSet } from '../../../utils/collection'
import { enumLabel } from '../../../utils/enumLabel'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import { professorName } from '../catalogModel'

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
      styles={darkModalStyles}
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
  const [name, setName] = useState(lecture.name)
  const [code, setCode] = useState(lecture.code)
  const [year, setYear] = useState(lecture.semesterYear)
  const [season, setSeason] = useState<SemesterSeason>(lecture.semesterSeason)
  const [active, setActive] = useState(lecture.active)
  const [lectureType, setLectureType] = useState<LectureType>(lecture.lectureType)
  const [professorIds, setProfessorIds] = useState<string[]>(
    lecture.professors.map((professor) => professor.id),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const trimmedName = name.trim()
  const trimmedCode = code.trim()

  const update: LectureUpdate = {}
  if (trimmedName !== lecture.name) update.name = trimmedName
  if (trimmedCode !== lecture.code) update.code = trimmedCode
  if (year !== lecture.semesterYear) update.semesterYear = year
  if (season !== lecture.semesterSeason) update.semesterSeason = season
  if (active !== lecture.active) update.active = active
  if (lectureType !== lecture.lectureType) update.lectureType = lectureType
  if (!sameIdSet(professorIds, lecture.professors.map((professor) => professor.id))) {
    update.professorIds = professorIds
  }

  const canSave =
    trimmedName.length > 0 && trimmedCode.length > 0 && year > 0 && Object.keys(update).length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setError('')
    try {
      await onSubmit(lecture.id, update)
      onClose()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'The lecture could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={14}>
        <TextInput
          label="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          styles={darkInputStyles}
        />
        <TextInput
          label="Code"
          value={code}
          onChange={(event) => setCode(event.currentTarget.value)}
          styles={darkInputStyles}
        />
        <Group grow align="flex-start">
          <NumberInput
            label="Semester year"
            value={year}
            onChange={(value) => setYear(typeof value === 'number' ? value : 0)}
            min={1900}
            max={2999}
            clampBehavior="strict"
            allowDecimal={false}
            styles={darkInputStyles}
          />
          <Select
            label="Semester season"
            data={seasonOptions}
            value={season}
            onChange={(value) => {
              if (isSemesterSeason(value)) setSeason(value)
            }}
            clearable={false}
            styles={darkInputStyles}
          />
        </Group>
        <MultiSelect
          label="Professors"
          description="Replaces the assignment — clear it to leave the lecture unassigned."
          data={professors.map((professor) => ({
            value: professor.id,
            label: professorName(professor),
          }))}
          value={professorIds}
          onChange={setProfessorIds}
          searchable
          clearable
          styles={darkInputStyles}
        />
        <Select
          label="Lecture type"
          description="Decides which categories future ratings can score. Ratings already submitted keep the categories they were given."
          data={lectureTypeOptions}
          value={lectureType}
          onChange={(value) => {
            if (isLectureType(value)) setLectureType(value)
          }}
          clearable={false}
          styles={darkInputStyles}
        />
        <Switch
          label="Active"
          checked={active}
          onChange={(event) => setActive(event.currentTarget.checked)}
          color="green"
        />
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
