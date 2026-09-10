import { Group, NumberInput, Select } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import {
  isEditableUserStatus,
  isUserRole,
  USER_ROLE_EDIT_OPTIONS,
  USER_STATUS_EDIT_OPTIONS,
  type UserAccess,
  type UserEditDraft,
} from '../model'

interface UserModerationFieldsProps {
  form: UseFormReturnType<UserEditDraft>
  access: UserAccess
}

/**
 * The three fields the operator's own permissions decide: status, role and credibility score.
 * Each says *why* it is locked rather than only being disabled — "Admin accounts are
 * protected here" is actionable, a greyed-out box is not.
 *
 * The two selects set their field through a type guard rather than `getInputProps`, so a
 * value outside the vocabulary can never reach the draft even if the options change.
 */
export default function UserModerationFields({ form, access }: UserModerationFieldsProps) {
  return (
    <Group grow align="flex-start" mb={12}>
      <Select
        label="Status"
        data={USER_STATUS_EDIT_OPTIONS}
        value={form.values.status}
        onChange={(value) => isEditableUserStatus(value) && form.setFieldValue('status', value)}
        disabled={!access.canEditStatus}
        description={
          access.canEditStatus
            ? 'Deleting is a separate action.'
            : 'Admin accounts are protected here.'
        }
        size="sm"
        clearable={false}
      />
      <Select
        label="Role"
        data={USER_ROLE_EDIT_OPTIONS}
        value={form.values.role}
        onChange={(value) => isUserRole(value) && form.setFieldValue('role', value)}
        disabled={!access.canEditRole}
        description={
          access.canEditRole
            ? 'Demoting an admin also signs it out.'
            : 'You cannot change your own role.'
        }
        size="sm"
        clearable={false}
      />
      <NumberInput
        label="Credibility score"
        placeholder="Leave unchanged"
        value={form.values.credibilityScore ?? ''}
        onChange={(value) =>
          form.setFieldValue('credibilityScore', typeof value === 'number' ? value : null)
        }
        allowDecimal={false}
        disabled={!access.canEditCredibilityScore}
        description={access.canEditCredibilityScore ? undefined : 'You cannot change your own score.'}
        size="sm"
      />
    </Group>
  )
}
