import { useMemo, useState } from 'react'
import { Tabs } from '@mantine/core'
import { IconSchool, IconStar, IconUserStar } from '@tabler/icons-react'
import type { Lecture, Professor } from '../../api/CatalogService'
import type { Rating } from '../../api/RatingsService'
import ConfirmModal from '../../components/ConfirmModal'
import ErrorAlert from '../../components/ErrorAlert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import { indexById } from '../../utils/collection'
import { lectureLabel, professorName } from './catalogModel'
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
  const catalog = useCatalog()
  const ratings = useRatings()
  const [deletingRating, setDeletingRating] = useState<Rating | null>(null)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [deletingLecture, setDeletingLecture] = useState<Lecture | null>(null)
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null)
  const [deletingProfessor, setDeletingProfessor] = useState<Professor | null>(null)

  const lectures = catalog.lectures
  const lecturesById = useMemo(() => indexById(lectures), [lectures])

  if (catalog.loading) return <PageLoader />
  if (catalog.loadError) return <LoadError message={catalog.loadError} onRetry={catalog.retry} />

  return (
    <>
      <PageHeader
        title="Lectures & Professors"
        description="The lectures students rate and the professors who teach them — names, terms and assignments."
      />
      <ErrorAlert message={catalog.actionError || ratings.actionError || ratings.loadError} />
      <CatalogStats lectures={catalog.lectures} professors={catalog.professors} />

      <Tabs defaultValue="lectures" keepMounted={false}>
        <Tabs.List mb={20}>
          <Tabs.Tab value="lectures" leftSection={<IconSchool size={14} />}>
            Lectures ({catalog.lectures.length})
          </Tabs.Tab>
          <Tabs.Tab value="professors" leftSection={<IconUserStar size={14} />}>
            Professors ({catalog.professors.length})
          </Tabs.Tab>
          <Tabs.Tab value="ratings" leftSection={<IconStar size={14} />}>
            Ratings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="lectures">
          <LecturesTable
            lectures={catalog.filteredLectures}
            totalCount={catalog.lectures.length}
            search={catalog.lectureSearch}
            mutating={catalog.mutating}
            onSearchChange={catalog.setLectureSearch}
            onEdit={setEditingLecture}
            onDelete={setDeletingLecture}
          />
        </Tabs.Panel>

        <Tabs.Panel value="professors">
          <ProfessorsTable
            professors={catalog.filteredProfessors}
            totalCount={catalog.professors.length}
            search={catalog.professorSearch}
            mutating={catalog.mutating}
            lecturesById={lecturesById}
            onSearchChange={catalog.setProfessorSearch}
            onEdit={setEditingProfessor}
            onDelete={setDeletingProfessor}
          />
        </Tabs.Panel>
        <Tabs.Panel value="ratings">
          <RatingsTable
            ratings={ratings.ratings}
            lectures={catalog.lectures}
            lecturesById={lecturesById}
            lectureId={ratings.lectureId}
            nextCursor={ratings.nextCursor}
            busy={ratings.busy || ratings.loading}
            onFilterByLecture={ratings.filterByLecture}
            onLoadMore={ratings.loadMore}
            onDelete={setDeletingRating}
          />
        </Tabs.Panel>
      </Tabs>

      {deletingRating && (
        <ConfirmModal
          opened
          title="Delete rating"
          description={`Remove this rating by ${deletingRating.authorName}? A rating is someone's own assessment, so this cannot be undone.`}
          confirmLabel="Delete rating"
          confirmColor="red"
          onConfirm={async () => {
            await ratings.remove(deletingRating.id)
            setDeletingRating(null)
          }}
          onClose={() => setDeletingRating(null)}
        />
      )}

      <LectureEditModal
        lecture={editingLecture}
        professors={catalog.professors}
        onClose={() => setEditingLecture(null)}
        onSubmit={catalog.updateLecture}
      />

      <ProfessorEditModal
        professor={editingProfessor}
        lectures={catalog.lectures}
        assignedLectureIds={editingProfessor?.lectureIds ?? NO_LECTURES}
        onClose={() => setEditingProfessor(null)}
        onSubmit={catalog.updateProfessor}
      />

      {deletingLecture && (
        <ConfirmModal
          opened
          title="Delete lecture"
          description={`Delete ${lectureLabel(deletingLecture)}? Its comments, answers and ratings go with it. This cannot be undone.`}
          confirmLabel="Delete lecture"
          confirmColor="red"
          onConfirm={() => catalog.deleteLecture(deletingLecture.id)}
          onClose={() => setDeletingLecture(null)}
        />
      )}

      {deletingProfessor && (
        <ConfirmModal
          opened
          title="Delete professor"
          description={`Delete ${professorName(deletingProfessor)}? The lectures stay — only the assignment is dropped.`}
          confirmLabel="Delete professor"
          confirmColor="red"
          onConfirm={() => catalog.deleteProfessor(deletingProfessor.id)}
          onClose={() => setDeletingProfessor(null)}
        />
      )}
    </>
  )
}
