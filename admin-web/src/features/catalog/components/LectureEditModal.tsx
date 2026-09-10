import { Group, MultiSelect, NumberInput, Select, TextInput } from '@mantine/core'
import type { Lecture, LectureUpdate, Professor } from '@/api/catalog'
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
  professorName,
} from '../model'
import CatalogEditModal from './CatalogEditModal'
import { SEMESTER_YEAR_RANGE } from '../model'

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

/** The lecture's fields. Everything around them is `CatalogEditModal`. */
export default function LectureEditModal({
  lecture,
  professors,
  onClose,
  onSubmit,
}: LectureEditModalProps) {
  return (
    <CatalogEditModal
      record={lecture}
      title="Edit lecture"
      noun="lecture"
      errorMessage="The lecture could not be saved."
      createDraft={createLectureEditDraft}
      buildUpdate={buildLectureUpdate}
      canSave={canSaveLectureEdit}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      {(form) => (
        <>
          <TextInput label="Name" {...form.getInputProps('name')} />
          <TextInput label="Code" {...form.getInputProps('code')} />
          <Group grow align="flex-start">
            <NumberInput
              label="Semester year"
              min={SEMESTER_YEAR_RANGE.min}
              max={SEMESTER_YEAR_RANGE.max}
              clampBehavior="strict"
              allowDecimal={false}
              value={form.values.semesterYear}
              onChange={(value) =>
                form.setFieldValue('semesterYear', typeof value === 'number' ? value : 0)
              }
            />
            {/* Guarded rather than spread: a value outside the vocabulary must not reach the
                draft even if the option list changes. */}
            <Select
              label="Semester season"
              data={seasonOptions}
              clearable={false}
              value={form.values.semesterSeason}
              onChange={(value) =>
                isSemesterSeason(value) && form.setFieldValue('semesterSeason', value)
              }
            />
          </Group>
          <MultiSelect
            label="Professors"
            description="Replaces the assignment. Clear it to leave the lecture unassigned."
            data={professors.map((professor) => ({
              value: professor.id,
              label: professorName(professor),
            }))}
            searchable
            clearable
            {...form.getInputProps('professorIds')}
          />
          <Select
            label="Lecture type"
            description="Decides which categories future ratings can score. Ratings already submitted keep the categories they were given."
            data={lectureTypeOptions}
            clearable={false}
            value={form.values.lectureType}
            onChange={(value) => isLectureType(value) && form.setFieldValue('lectureType', value)}
          />
        </>
      )}
    </CatalogEditModal>
  )
}
