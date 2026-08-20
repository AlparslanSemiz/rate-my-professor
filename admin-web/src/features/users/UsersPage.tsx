import type { User } from '../../api/UsersService'
import ErrorAlert from '../../components/ErrorAlert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import { useSelectedId } from '../../hooks/useSelectedId'
import { updateById } from '../../utils/collection'
import UserFilters from './components/UserFilters'
import UserProfileModal from './components/UserProfileModal'
import UsersStats from './components/UsersStats'
import UsersTable from './components/UsersTable'
import { useUsersPage } from './hooks/useUsersPage'
import type { UserChange } from './hooks/useUserProfile'

const SORT_LABELS = { newest: 'newest first', oldest: 'oldest first' }

export default function UsersPage() {
  const page = useUsersPage()
  const profile = useSelectedId()
  const setUsers = page.setItems

  function handleUserChanged(id: string, change: UserChange) {
    if (change.type === 'deleted') {
      setUsers((current: User[]) => current.filter((user) => user.id !== id))
      profile.close()
      return
    }

    // An edit, a block and an unblock can each change any field, so the row is replaced with
    // what the backend now reports rather than patched with what was asked for.
    if (change.type === 'refreshed') {
      setUsers((current: User[]) => updateById(current, id, () => change.user))
      return
    }

    setUsers((current: User[]) =>
      updateById(current, id, (user) => ({ ...user, warnings: change.warnings })),
    )
  }

  if (page.loading && page.items.length === 0 && !page.tableError) return <PageLoader />

  if (page.initialError) {
    return (
      <>
        <UsersPageHeader />
        <LoadError message={page.initialError} onRetry={() => void page.retryInitialLoad()} />
      </>
    )
  }

  return (
    <>
      <UsersPageHeader />

      <UsersStats counts={page.meta} />
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
        nextCursor={page.nextCursor}
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
      description="Everyone who's signed up — profiles, sessions and moderation, all in one place."
    />
  )
}
