import { useEffect, useState, type FormEvent } from 'react'
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
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [year, setYear] = useState(0)
  const [season, setSeason] = useState<SemesterSeason>('WINTER')
  const [active, setActive] = useState(true)
  const [lectureType, setLectureType] = useState<LectureType | null>(null)
  const [professorIds, setProfessorIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!lecture) return
    setName(lecture.name)
    setCode(lecture.code)
    setYear(lecture.semesterYear)
    setSeason(lecture.semesterSeason)
    setActive(lecture.active)
    setLectureType(null)
    setProfessorIds(lecture.professors.map((professor) => professor.id))
    setError('')
  }, [lecture])

  const trimmedName = name.trim()
  const trimmedCode = code.trim()

  function buildUpdate(current: Lecture): LectureUpdate {
    const update: LectureUpdate = {}
    if (trimmedName !== current.name) update.name = trimmedName
    if (trimmedCode !== current.code) update.code = trimmedCode
    if (year !== current.semesterYear) update.semesterYear = year
    if (season !== current.semesterSeason) update.semesterSeason = season
    if (active !== current.active) update.active = active
    // The catalogue read does not report the current type, so it is sent only when picked.
    if (lectureType !== null) update.lectureType = lectureType
    if (!sameIdSet(professorIds, current.professors.map((professor) => professor.id))) {
      update.professorIds = professorIds
    }
    return update
  }

  const update = lecture ? buildUpdate(lecture) : {}
  const canSave =
    trimmedName.length > 0 &&
    trimmedCode.length > 0 &&
    year > 0 &&
    Object.keys(update).length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!lecture || !canSave) return

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
    <Modal
      opened={lecture !== null}
      onClose={onClose}
      title="Edit lecture"
      centered
      size="lg"
      styles={darkModalStyles}
      closeOnClickOutside={!saving}
      closeOnEscape={!saving}
      withCloseButton={!saving}
    >
      {lecture && (
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
              description="Decides which categories future ratings can score. The catalogue does not report the current type, so this is only sent when you pick one."
              placeholder="Leave unchanged"
              data={lectureTypeOptions}
              value={lectureType}
              onChange={(value) => setLectureType(isLectureType(value) ? value : null)}
              clearable
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
      )}
    </Modal>
  )
}
