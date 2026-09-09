import { useMemo, useState } from 'react'
import { Tabs } from '@mantine/core'
import { IconSchool, IconStar, IconUserStar } from '@tabler/icons-react'
import ErrorAlert from '@/components/ErrorAlert'
import LoadError from '@/components/LoadError'
import PageHeader from '@/components/PageHeader'
import PageLoader from '@/components/PageLoader'
import { useSelectedId } from '@/hooks/useSelectedId'
import { indexById } from '@/utils/collection'
import type { CatalogDeletion } from './model'
import CatalogDeleteModal from './components/CatalogDeleteModal'
import CatalogStats from './components/CatalogStats'
import LectureEditModal from './components/LectureEditModal'
import LecturesTable from './components/LecturesTable'
import ProfessorEditModal from './components/ProfessorEditModal'
import ProfessorsTable from './components/ProfessorsTable'
import RatingsTable from './components/RatingsTable'
import { useCatalog } from './hooks/useCatalog'
import { useRatings } from './hooks/useRatings'

const NO_LECTURES: string[] = []

export default function CatalogPage() {
  const { lists, actions } = useCatalog()
  const ratings = useRatings()
  // Ids rather than records: the lists are re-read after every write, and a held record would
  // still be the one that was clicked. The row is looked up again below from what is current.
  const lectureEdit = useSelectedId()
  const professorEdit = useSelectedId()
  const [deleting, setDeleting] = useState<CatalogDeletion | null>(null)

  const lecturesById = useMemo(() => indexById(lists.lectures), [lists.lectures])
  const professorsById = useMemo(() => indexById(lists.professors), [lists.professors])

  const editingLecture = lectureEdit.opened
    ? (lecturesById.get(lectureEdit.selectedId ?? '') ?? null)
    : null
  const editingProfessor = professorEdit.opened
    ? (professorsById.get(professorEdit.selectedId ?? '') ?? null)
    : null

  if (lists.loading) return <PageLoader />
  if (lists.loadError) return <LoadError message={lists.loadError} onRetry={lists.retry} />

  return (
    <>
      <PageHeader
        title="Lectures & Professors"
        description="The lectures students rate and the professors who teach them — names, terms and assignments."
      />
      <ErrorAlert message={actions.actionError || ratings.actionError || ratings.loadError} />
      <CatalogStats lectures={lists.lectures} professors={lists.professors} />

      <Tabs defaultValue="lectures" keepMounted={false}>
        <Tabs.List mb={20}>
          <Tabs.Tab value="lectures" leftSection={<IconSchool size={14} />}>
            Lectures ({lists.lectures.length})
          </Tabs.Tab>
          <Tabs.Tab value="professors" leftSection={<IconUserStar size={14} />}>
            Professors ({lists.professors.length})
          </Tabs.Tab>
          <Tabs.Tab value="ratings" leftSection={<IconStar size={14} />}>
            Ratings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="lectures">
          <LecturesTable
            lectures={lists.filteredLectures}
            totalCount={lists.lectures.length}
            search={lists.lectureSearch}
            mutating={actions.mutating}
            onSearchChange={lists.setLectureSearch}
            onEdit={(lecture) => lectureEdit.open(lecture.id)}
            onDelete={(record) => setDeleting({ type: 'lecture', record })}
          />
        </Tabs.Panel>

        <Tabs.Panel value="professors">
          <ProfessorsTable
            professors={lists.filteredProfessors}
            totalCount={lists.professors.length}
            search={lists.professorSearch}
            mutating={actions.mutating}
            lecturesById={lecturesById}
            onSearchChange={lists.setProfessorSearch}
            onEdit={(professor) => professorEdit.open(professor.id)}
            onDelete={(record) => setDeleting({ type: 'professor', record })}
          />
        </Tabs.Panel>

        <Tabs.Panel value="ratings">
          <RatingsTable
            ratings={ratings.ratings}
            lectures={lists.lectures}
            lecturesById={lecturesById}
            lectureId={ratings.lectureId}
            hasMore={ratings.hasMore}
            busy={ratings.busy}
            onFilterByLecture={ratings.filterByLecture}
            onLoadMore={ratings.loadMore}
            onDelete={(record) => setDeleting({ type: 'rating', record })}
          />
        </Tabs.Panel>
      </Tabs>

      <LectureEditModal
        lecture={editingLecture}
        professors={lists.professors}
        onClose={lectureEdit.close}
        onSubmit={actions.updateLecture}
      />

      <ProfessorEditModal
        professor={editingProfessor}
        lectures={lists.lectures}
        assignedLectureIds={editingProfessor?.lectureIds ?? NO_LECTURES}
        onClose={professorEdit.close}
        onSubmit={actions.updateProfessor}
      />

      {deleting && (
        <CatalogDeleteModal
          deletion={deleting}
          onConfirm={deleteRecord}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )

  function deleteRecord(deletion: CatalogDeletion) {
    if (deletion.type === 'lecture') return actions.deleteLecture(deletion.record.id)
    if (deletion.type === 'professor') return actions.deleteProfessor(deletion.record.id)
    return ratings.remove(deletion.record.id)
  }
}
