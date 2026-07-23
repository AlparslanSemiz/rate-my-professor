import { usersService, type User } from '../../api/UsersService'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useSearch } from '../../hooks/useSearch'
import { useSelectedId } from '../../hooks/useSelectedId'
import { updateById } from '../../utils/collection'
import UserProfileModal from './components/UserProfileModal'
import UsersStats from './components/UsersStats'
import UsersTable from './components/UsersTable'
import type { UserChange } from './hooks/useUserProfile'

const LOAD_ERROR_MESSAGE = 'Failed to load users'
const EMPTY_USERS: User[] = []

function loadUsers() {
  return usersService.getAll()
}

function matchesQuery(user: User, query: string) {
  return user.username.toLowerCase().includes(query) || user.kitEmail.toLowerCase().includes(query)
}

export default function UsersPage() {
  const {
    data: users,
    setData: setUsers,
    loading,
    error,
    retry,
  } = useAsyncData(loadUsers, EMPTY_USERS, LOAD_ERROR_MESSAGE)
  const profile = useSelectedId()
  const { search, setSearch, filtered } = useSearch(users, matchesQuery)

  function handleUserChanged(id: string, change: UserChange) {
    const userUpdates: Partial<Record<UserChange, (user: User) => User>> = {
      blocked: (user) => ({ ...user, status: 'BLOCKED' }),
      unblocked: (user) => ({ ...user, status: 'ACTIVE' }),
      warned: (user) => ({ ...user, warnings: user.warnings + 1 }),
    }

    if (change === 'deleted') {
      setUsers((current) => current.filter((user) => user.id !== id))
      profile.close()
      return
    }

    const update = userUpdates[change]
    if (update) {
      setUsers((current) => updateById(current, id, update))
    }
  }

  if (loading) return <PageLoader />
  if (error) return <LoadError message={error} onRetry={retry} />

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who's signed up — profiles, sessions and moderation, all in one place."
      />

      <UsersStats users={users} />
      <UsersTable
        users={users}
        filteredUsers={filtered}
        search={search}
        onSearchChange={setSearch}
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
