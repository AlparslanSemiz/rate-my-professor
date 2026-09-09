import ConfirmModal from '@/components/ConfirmModal'
import { getCatalogDeletion, type CatalogDeletion } from '../model'

interface CatalogDeleteModalProps {
  deletion: CatalogDeletion
  onConfirm: (deletion: CatalogDeletion) => Promise<void>
  onClose: () => void
}

/**
 * One dialog for all three catalogue deletions. They were three `ConfirmModal`s differing
 * only in their wording, and the wording is the part that matters — a lecture takes its
 * comments, answers and ratings with it, a professor takes only the assignment — so it lives
 * in the model and this reads it from there.
 */
export default function CatalogDeleteModal({
  deletion,
  onConfirm,
  onClose,
}: CatalogDeleteModalProps) {
  const copy = getCatalogDeletion(deletion)

  return (
    <ConfirmModal
      opened
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      confirmColor="red"
      onConfirm={async () => {
        await onConfirm(deletion)
        onClose()
      }}
      onClose={onClose}
    />
  )
}
