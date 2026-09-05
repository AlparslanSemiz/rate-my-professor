import { useState, type CSSProperties, type FormEvent } from 'react'
import { Box, Button, Group, NumberInput, Select, Text, TextInput, Textarea } from '@mantine/core'
import type { User, UserUpdate } from '../../../api/UsersService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkInputStyles } from '../../../constants/inputStyles'
import { getErrorMessage } from '../../../utils/getErrorMessage'

const formStyle: CSSProperties = {
  background: 'rgba(59,130,246,0.05)',
  border: '1px solid rgba(59,130,246,0.2)',
  borderRadius: 10,
  padding: '14px 16px',
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BLOCKED', label: 'Blocked' },
]

const roleOptions = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'ADMIN', label: 'Admin' },
]

function isEditableStatus(value: string): value is 'ACTIVE' | 'BLOCKED' {
  return value === 'ACTIVE' || value === 'BLOCKED'
}

function isRole(value: string): value is 'STUDENT' | 'ADMIN' {
  return value === 'STUDENT' || value === 'ADMIN'
}

interface UserEditFormProps {
  user: User
  /** True when the profile belongs to the signed-in admin, who cannot change its own access. */
  isSelf: boolean
  /** True when the signed-in admin may also change the status of other admin accounts. */
  canActOnAdmins: boolean
  loading: boolean
  onCancel: () => void
  onSubmit: (update: UserUpdate) => Promise<void>
}

/**
 * Corrects a wrong name, a typo'd address or a stale biography, and moves an account between
 * student and admin. Only the fields that actually changed are sent: the backend rejects an
 * empty body and records one event listing exactly what moved.
 */
export default function UserEditForm({
  user,
  isSelf,
  canActOnAdmins,
  loading,
  onCancel,
  onSubmit,
}: UserEditFormProps) {
  const [username, setUsername] = useState(user.username)
  const [biography, setBiography] = useState(user.biography)
  const [status, setStatus] = useState(user.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE')
  const [role, setRole] = useState<string>(user.role)
  const [credibilityScore, setCredibilityScore] = useState<number | null>(user.credibilityScore)
  const [error, setError] = useState('')

  const trimmedUsername = username.trim()
  // Only the status of an admin account is reserved for an elevated operator. Username,
  // biography, role and credibility score are accepted from any admin against an admin
  // target, so locking them here only hid edits the backend would have taken.
  const statusLocked = isSelf || (user.role === 'ADMIN' && !canActOnAdmins)

  const update: UserUpdate = {}
  if (trimmedUsername !== user.username) update.username = trimmedUsername
  if (biography !== user.biography) update.biography = biography
  if (!statusLocked && isEditableStatus(status) && status !== user.status) {
    update.status = status
  }
  if (!isSelf && isRole(role) && role !== user.role) update.role = role
  // Compared against the seeded value so re-entering the stored number is not sent as an edit.
  if (!isSelf && credibilityScore !== null && credibilityScore !== user.credibilityScore) {
    update.credibilityScore = credibilityScore
  }

  const canSave = trimmedUsername.length > 0 && Object.keys(update).length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return

    setError('')
    try {
      await onSubmit(update)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'The change could not be saved.'))
    }
  }

  return (
    <Box component="form" mb={20} style={formStyle} onSubmit={handleSubmit}>
      <Text size="xs" fw={600} c="#60a5fa" mb={10}>
        Edit {user.username}
      </Text>

      <Group grow align="flex-start" mb={10}>
        <TextInput
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value)}
          size="sm"
          styles={darkInputStyles}
        />
        <TextInput
          label="KIT email"
          description="Login identity; cannot be changed here."
          value={user.kitEmail}
          disabled
          size="sm"
          styles={darkInputStyles}
        />
      </Group>

      <Textarea
        label="Biography"
        value={biography}
        onChange={(event) => setBiography(event.currentTarget.value)}
        minRows={2}
        size="sm"
        mb={10}
        styles={darkInputStyles}
      />

      <Group grow align="flex-start" mb={12}>
        <Select
          label="Status"
          data={statusOptions}
          value={status}
          onChange={(value) => {
            if (value !== null && isEditableStatus(value)) setStatus(value)
          }}
          disabled={statusLocked}
          description={
            statusLocked ? 'Admin accounts are protected here.' : 'Deleting is a separate action.'
          }
          size="sm"
          clearable={false}
          styles={darkInputStyles}
        />
        <Select
          label="Role"
          data={roleOptions}
          value={role}
          onChange={(value) => {
            if (value !== null) setRole(value)
          }}
          disabled={isSelf}
          description={
            isSelf
              ? 'You cannot change your own role.'
              : 'Demoting an admin also signs it out.'
          }
          size="sm"
          clearable={false}
          styles={darkInputStyles}
        />
        <NumberInput
          label="Credibility score"
          placeholder="Leave unchanged"
          value={credibilityScore ?? ''}
          onChange={(value) => setCredibilityScore(typeof value === 'number' ? value : null)}
          allowDecimal={false}
          disabled={isSelf}
          description={isSelf ? 'You cannot change your own score.' : undefined}
          size="sm"
          styles={darkInputStyles}
        />
      </Group>

      <ErrorAlert message={error} />
      <Group gap={8} justify="flex-end">
        <Button
          type="button"
          size="xs"
          variant="subtle"
          color="gray"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" size="xs" color="blue" loading={loading} disabled={!canSave}>
          Save changes
        </Button>
      </Group>
    </Box>
  )
}
