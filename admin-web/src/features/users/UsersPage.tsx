import ErrorAlert from '@/components/ErrorAlert'
import LoadError from '@/components/LoadError'
import PageHeader from '@/components/PageHeader'
import PageLoader from '@/components/PageLoader'
import { useSelectedId } from '@/hooks/useSelectedId'
import UserFilters from './components/UserFilters'
import UserProfileModal from './components/UserProfileModal'
import UsersStats from './components/UsersStats'
import UsersTable from './components/UsersTable'
import { useUsersPage } from './hooks/useUsersPage'
import type { UserChange } from './model'

const SORT_LABELS = { newest: 'newest first', oldest: 'oldest first' }

export default function UsersPage() {
  const page = useUsersPage()
  const profile = useSelectedId()

  function handleUserChanged(id: string, change: UserChange) {
    page.applyUserChange(id, change)
    if (change.type === 'deleted') profile.close()
  }

  if (page.loading && page.items.length === 0 && !page.tableError) return <PageLoader />

  if (page.initialError) {
    return (
      <>
        <UsersPageHeader />
        <LoadError message={page.initialError} onRetry={page.retryInitialLoad} />
      </>
    )
  }

  return (
    <>
      <UsersPageHeader />

      <UsersStats counts={page.counts} />
      <UserFilters
        draft={page.draft}
        loading={page.loading}
        onDraftChange={page.setDraft}
        onApply={page.applyFilters}
        onClear={page.clearFilters}
      />
      {/* A refused filter is a `400` with a usable message — it belongs on screen, above the
          rows that are still the last good answer. */}
      <ErrorAlert message={page.tableError} />
      <UsersTable
        users={page.items}
        sortLabel={SORT_LABELS[page.draft.sort]}
        hasMore={page.hasMore}
        loadingMore={page.loadingMore}
        onLoadMore={page.loadMore}
        onOpenProfile={profile.open}
      />

      <UserProfileModal
        userId={profile.selectedId}
        opened={profile.opened}
        onClose={profile.close}
        onUserChanged={handleUserChanged}
      />
    </>
  )
}

function UsersPageHeader() {
  return (
    <PageHeader
      title="Users"
      description="Everyone who's signed up: profiles, sessions and moderation, all in one place."
    />
  )
}
