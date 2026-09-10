import { useMemo, useState } from 'react'
import { Select, Tabs, TextInput } from '@mantine/core'
import { IconSchool, IconSearch, IconStar, IconUserStar } from '@tabler/icons-react'
import ErrorAlert from '@/components/ErrorAlert'
import FilterBar from '@/components/FilterBar'
import LoadError from '@/components/LoadError'
import PageHeader from '@/components/PageHeader'
import PageLoader from '@/components/PageLoader'
import { useSelectedId } from '@/hooks/useSelectedId'
import { indexById } from '@/utils/collection'
import type { Rating } from '@/api/catalog'
import type { CatalogDeleters, CatalogDeletion } from './model'
import { activityFilterOptions, lectureLabel, toActivityFilter } from './model'
import CatalogDeleteModal from './components/CatalogDeleteModal'
import CatalogStats from './components/CatalogStats'
import LectureEditModal from './components/LectureEditModal'
import LecturesTable from './components/LecturesTable'
import ProfessorEditModal from './components/ProfessorEditModal'
import ProfessorsTable from './components/ProfessorsTable'
import RatingDetailsModal from './components/RatingDetailsModal'
import RatingsTable from './components/RatingsTable'
import { useCatalog } from './hooks/useCatalog'
import { useRatings } from './hooks/useRatings'
import { chrome, iconSize } from '@/theme'
import { filterFieldWidth } from '@/constants/layout'

const NO_LECTURES: string[] = []

/** The three halves of this screen, and the only values its tab may take. */
type CatalogTab = 'lectures' | 'professors' | 'ratings'

export default function CatalogPage() {
  const { lists, actions } = useCatalog()
  const ratings = useRatings()
  // Ids rather than records: the lists are re-read after every write, and a held record would
  // still be the one that was clicked. The row is looked up again below from what is current.
  const lectureEdit = useSelectedId()
  const professorEdit = useSelectedId()
  const [deleting, setDeleting] = useState<CatalogDeletion | null>(null)
  /** The rating whose details are open. Held whole: the list is a page, not an index. */
  const [viewingRating, setViewingRating] = useState<Rating | null>(null)
  /** Which table is open. Controlled because the filter bar above the strip follows it. */
  const [tab, setTab] = useState<CatalogTab>('lectures')

  // The three services, handed to the model so that it — and only it — decides which one a
  // given deletion needs. The page knows how to delete each kind; it does not choose.
  const deleters: CatalogDeleters = {
    lecture: actions.deleteLecture,
    professor: actions.deleteProfessor,
    rating: ratings.remove,
  }

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
        description="The lectures students rate and the professors who teach them: names, terms and assignments."
      />
      <ErrorAlert message={actions.actionError || ratings.actionError || ratings.loadError} />
      <CatalogStats lectures={lists.lectures} professors={lists.professors} />

      <Tabs value={tab} onChange={(value) => setTab(toCatalogTab(value))} keepMounted={false}>
        <Tabs.List mb={20}>
          <Tabs.Tab value="lectures" leftSection={<IconSchool size={iconSize.inline} />}>
            Lectures ({lists.lecturesInState.length})
          </Tabs.Tab>
          <Tabs.Tab value="professors" leftSection={<IconUserStar size={iconSize.inline} />}>
            Professors ({lists.professorsInState.length})
          </Tabs.Tab>
          <Tabs.Tab value="ratings" leftSection={<IconStar size={iconSize.inline} />}>
            Ratings
          </Tabs.Tab>
        </Tabs.List>

      {/*
        `F-067`: this was the one screen with no filter bar at all. Its search sat inside the
        table panel's own header, right-aligned at x=1067, where every other screen puts its
        search at x=293 - which is why it read as part of the table rather than as a filter.
        The control differs per tab, so the page holds the tab for the bar to follow it, the
        same cost `F-065` found on Comments.
      */}
      <FilterBar>
        {tab === 'lectures' && (
          <>
            <TextInput
              placeholder="Search by name, code, or professor..."
              value={lists.lectureSearch}
              onChange={(event) => lists.setLectureSearch(event.currentTarget.value)}
              style={filterFieldWidth.search}
              size="sm"
              aria-label="Search lectures"
              leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
            />
            <Select
              aria-label="Filter lectures by status"
              data={activityFilterOptions}
              value={lists.lectureActivity}
              onChange={(value) => lists.setLectureActivity(toActivityFilter(value))}
              style={filterFieldWidth.select}
              size="sm"
              clearable={false}
            />
          </>
        )}
        {tab === 'professors' && (
          <>
            <TextInput
              placeholder="Search by name..."
              value={lists.professorSearch}
              onChange={(event) => lists.setProfessorSearch(event.currentTarget.value)}
              style={filterFieldWidth.search}
              size="sm"
              aria-label="Search professors"
              leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
            />
            <Select
              aria-label="Filter professors by status"
              data={activityFilterOptions}
              value={lists.professorActivity}
              onChange={(value) => lists.setProfessorActivity(toActivityFilter(value))}
              style={filterFieldWidth.select}
              size="sm"
              clearable={false}
            />
          </>
        )}
        {tab === 'ratings' && (
          <Select
            placeholder="All lectures"
            aria-label="Filter ratings by lecture"
            data={lists.lectures.map((lecture) => ({
              value: lecture.id,
              label: lectureLabel(lecture),
            }))}
            value={ratings.lectureId}
            onChange={ratings.filterByLecture}
            style={filterFieldWidth.search}
            size="sm"
            searchable
            clearable
          />
        )}
      </FilterBar>

        <Tabs.Panel value="lectures">
          <LecturesTable
            lectures={lists.filteredLectures}
            totalCount={lists.lectures.length}
            mutating={actions.mutating}
            onEdit={(lecture) => lectureEdit.open(lecture.id)}
            onDelete={(record) => setDeleting({ type: 'lecture', record })}
          />
        </Tabs.Panel>

        <Tabs.Panel value="professors">
          <ProfessorsTable
            professors={lists.filteredProfessors}
            totalCount={lists.professors.length}
            mutating={actions.mutating}
            lecturesById={lecturesById}
            onEdit={(professor) => professorEdit.open(professor.id)}
            onDelete={(record) => setDeleting({ type: 'professor', record })}
          />
        </Tabs.Panel>

        <Tabs.Panel value="ratings">
          <RatingsTable
            ratings={ratings.ratings}
            lecturesById={lecturesById}
            hasMore={ratings.hasMore}
            busy={ratings.busy}
            onLoadMore={ratings.loadMore}
            onOpen={setViewingRating}
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

      <RatingDetailsModal
        rating={viewingRating}
        lecture={viewingRating?.lectureId ? lecturesById.get(viewingRating.lectureId) : undefined}
        onClose={() => setViewingRating(null)}
      />

      {deleting && (
        <CatalogDeleteModal
          deletion={deleting}
          deleters={deleters}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

/**
 * Mantine hands back `string | null`, so the tab is narrowed rather than cast: an unknown value
 * falls back to the first table instead of putting the page in a state it has no panel for.
 */
function toCatalogTab(value: string | null): CatalogTab {
  return value === 'professors' || value === 'ratings' ? value : 'lectures'
}
