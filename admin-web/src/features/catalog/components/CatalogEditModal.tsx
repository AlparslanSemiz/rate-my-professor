import { useState, type ReactNode } from 'react'
import { Button, Group, Modal, Stack, Switch } from '@mantine/core'
import { useForm, type UseFormReturnType } from '@mantine/form'
import ErrorAlert from '@/components/ErrorAlert'
import { getErrorMessage } from '@/utils/getErrorMessage'
import InactiveVisibilityNotice from './InactiveVisibilityNotice'

interface CatalogEditModalProps<
  TRecord extends { id: string },
  TDraft extends { active: boolean },
  TUpdate extends object,
> {
  /** The record being edited, or `null` when the modal is closed. */
  record: TRecord | null
  title: string
  noun: 'lecture' | 'professor'
  errorMessage: string
  createDraft: (record: TRecord) => TDraft
  /**
   * Kept as model functions rather than form validation, and taking the record they came
   * from: only the fields that actually changed are sent, because the backend rejects an
   * empty body and records one event listing exactly what moved.
   */
  buildUpdate: (record: TRecord, draft: TDraft) => TUpdate
  canSave: (record: TRecord, draft: TDraft) => boolean
  onClose: () => void
  onSubmit: (id: string, update: TUpdate) => Promise<void>
  children: (form: UseFormReturnType<TDraft>) => ReactNode
}

/**
 * The shell both catalogue edit forms are built from: the modal, the form, the submit, the
 * Active switch and the save/cancel pair. `LectureEditModal` and `ProfessorEditModal` were
 * the same component twice — 323 lines between them — differing only in their field block,
 * their title and their error copy. Those three are what a caller passes in.
 *
 * The Active switch lives here rather than in the field sets because both records have one
 * and it means the same thing in both: saving it off takes the record out of every list this
 * panel can read, which is why the notice sits beside it.
 *
 * A professor's update needs the assignment the page derived and a lecture's does not. That
 * difference never reaches this component: `buildUpdate` and `canSave` are supplied by the
 * caller, which closes over whatever else it has.
 */
export default function CatalogEditModal<
  TRecord extends { id: string },
  TDraft extends { active: boolean },
  TUpdate extends object,
>({ record, title, ...form }: CatalogEditModalProps<TRecord, TDraft, TUpdate>) {
  return (
    <Modal opened={record !== null} onClose={form.onClose} title={title} centered size="lg">
      {/* Keyed on the record so the fields are initial state rather than state kept in step
          with a prop. */}
      {record && <CatalogEditForm key={record.id} record={record} {...form} />}
    </Modal>
  )
}

type CatalogEditFormProps<
  TRecord extends { id: string },
  TDraft extends { active: boolean },
  TUpdate extends object,
> = Omit<CatalogEditModalProps<TRecord, TDraft, TUpdate>, 'record' | 'title'> & { record: TRecord }

function CatalogEditForm<
  TRecord extends { id: string },
  TDraft extends { active: boolean },
  TUpdate extends object,
>({
  record,
  noun,
  errorMessage,
  createDraft,
  buildUpdate,
  canSave,
  onClose,
  onSubmit,
  children,
}: CatalogEditFormProps<TRecord, TDraft, TUpdate>) {
  const form = useForm<TDraft>({ initialValues: createDraft(record) })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const saveable = canSave(record, form.values)

  async function handleSubmit() {
    if (!saveable) return

    setSaving(true)
    setError('')
    try {
      await onSubmit(record.id, buildUpdate(record, form.values))
      onClose()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, errorMessage))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap={14}>
        {children(form)}
        <Switch
          label="Active"
          color="green"
          {...form.getInputProps('active', { type: 'checkbox' })}
        />
        {!form.values.active && <InactiveVisibilityNotice noun={noun} />}
        <ErrorAlert message={error} mb={0} />
        <Group justify="flex-end" gap={10}>
          <Button variant="subtle" color="gray" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" color="green" loading={saving} disabled={!saveable}>
            Save changes
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
