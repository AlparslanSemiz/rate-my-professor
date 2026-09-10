import type { useModerationContent } from '../hooks/useModerationContent'
import type { ModeratedItem } from '../model'
import ContentFilters from './ContentFilters'
import ContentTable from './ContentTable'

interface ContentTabProps {
  content: ReturnType<typeof useModerationContent>
  /** Singular name of the moderated content, e.g. "comment". */
  noun: string
  updating: boolean
  onOpenProfile: (userId: string) => void
  onEdit: (item: ModeratedItem) => void
  onDelete: (item: ModeratedItem) => void
}

export default function ContentTab({
  content,
  noun,
  updating,
  onOpenProfile,
  onEdit,
  onDelete,
}: ContentTabProps) {
  return (
    <>
      <ContentFilters
        search={content.search}
        status={content.statusFilter}
        searchLabel={`Search ${noun}s`}
        onSearchChange={content.setSearch}
        onStatusChange={content.setStatusFilter}
      />
      {/* Remounted when the list narrows, so the table's expanded rows start from the
          filtered set rather than from whatever was open before. */}
      <ContentTable
        key={content.narrowed ? 'narrowed' : 'full'}
        items={content.filtered}
        noun={noun}
        updating={updating}
        autoExpand={content.narrowed}
        onOpenProfile={onOpenProfile}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  )
}
