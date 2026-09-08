import { useState, type CSSProperties, type FormEvent } from 'react'
import { Box, Button, Group, NumberInput, Select, Text, TextInput, Textarea } from '@mantine/core'
import type { User, UserUpdate } from '../../../api/UsersService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkInputStyles } from '../../../constants/inputStyles'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import type { UserAccess } from '../userAccess'
import {
  buildUserUpdate,
  canSaveUserEdit,
  createUserEditDraft,
  isEditableUserStatus,
  isUserRole,
  USER_ROLE_EDIT_OPTIONS,
  USER_STATUS_EDIT_OPTIONS,
} from '../userEditModel'

const formStyle: CSSProperties = {
  background: 'rgba(59,130,246,0.05)',
  border: '1px solid rgba(59,130,246,0.2)',
  borderRadius: 10,
  padding: '14px 16px',
}

interface UserEditFormProps {
  user: User
  access: UserAccess
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
  access,
  loading,
  onCancel,
  onSubmit,
}: UserEditFormProps) {
  const [draft, setDraft] = useState(() => createUserEditDraft(user))
  const [error, setError] = useState('')

  const update = buildUserUpdate(user, draft, access)
  const canSave = canSaveUserEdit(user, draft, access)

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
          value={draft.username}
          onChange={(event) => {
            const username = event.currentTarget.value
            setDraft((current) => ({ ...current, username }))
          }}
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
        value={draft.biography}
        onChange={(event) => {
          const biography = event.currentTarget.value
          setDraft((current) => ({ ...current, biography }))
        }}
        minRows={2}
        size="sm"
        mb={10}
        styles={darkInputStyles}
      />

      <Group grow align="flex-start" mb={12}>
        <Select
          label="Status"
          data={USER_STATUS_EDIT_OPTIONS}
          value={draft.status}
          onChange={(value) => {
            if (isEditableUserStatus(value)) {
              setDraft((current) => ({ ...current, status: value }))
            }
          }}
          disabled={!access.canEditStatus}
          description={
            !access.canEditStatus
              ? 'Admin accounts are protected here.'
              : 'Deleting is a separate action.'
          }
          size="sm"
          clearable={false}
          styles={darkInputStyles}
        />
        <Select
          label="Role"
          data={USER_ROLE_EDIT_OPTIONS}
          value={draft.role}
          onChange={(value) => {
            if (isUserRole(value)) {
              setDraft((current) => ({ ...current, role: value }))
            }
          }}
          disabled={!access.canEditRole}
          description={
            !access.canEditRole
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
          value={draft.credibilityScore ?? ''}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              credibilityScore: typeof value === 'number' ? value : null,
            }))
          }
          allowDecimal={false}
          disabled={!access.canEditCredibilityScore}
          description={!access.canEditCredibilityScore ? 'You cannot change your own score.' : undefined}
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
