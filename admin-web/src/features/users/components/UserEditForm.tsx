import { useState, type CSSProperties } from 'react'
import { Box, Button, Group, Text, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { User, UserUpdate } from '@/api/users'
import ErrorAlert from '@/components/ErrorAlert'
import { KIT } from '@/constants/colors'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  buildUserUpdate,
  canSaveUserEdit,
  createUserEditDraft,
  type UserAccess,
  type UserEditDraft,
} from '../model'
import UserModerationFields from './UserModerationFields'

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
 * empty body and records one event listing exactly what moved — which is why the update is
 * still built by `buildUserUpdate` from the original account rather than by the form.
 */
export default function UserEditForm({
  user,
  access,
  loading,
  onCancel,
  onSubmit,
}: UserEditFormProps) {
  const form = useForm<UserEditDraft>({ initialValues: createUserEditDraft(user) })
  const [error, setError] = useState('')

  const update = buildUserUpdate(user, form.values, access)
  const canSave = canSaveUserEdit(user, form.values, access)

  async function handleSubmit() {
    if (!canSave) return

    setError('')
    try {
      await onSubmit(update)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'The change could not be saved.'))
    }
  }

  return (
    <Box component="form" mb={20} style={formStyle} onSubmit={form.onSubmit(handleSubmit)}>
      <Text size="xs" fw={600} c={KIT.blue} mb={10}>
        Edit {user.username}
      </Text>

      <Group grow align="flex-start" mb={10}>
        <TextInput label="Username" size="sm" {...form.getInputProps('username')} />
        <TextInput
          label="KIT email"
          description="Login identity; cannot be changed here."
          value={user.kitEmail}
          disabled
          size="sm"
        />
      </Group>

      <Textarea label="Biography" minRows={2} size="sm" mb={10} {...form.getInputProps('biography')} />

      <UserModerationFields form={form} access={access} />

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
