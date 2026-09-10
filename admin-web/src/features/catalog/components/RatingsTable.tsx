import { Box, Button, Text, type CSSProperties } from '@mantine/core'
import { IconStar } from '@tabler/icons-react'
import { type Lecture, type Rating } from '@/api/catalog'
import CatalogTablePanel, { CatalogEmptyRow } from './CatalogTablePanel'
import RatingTableRow from './RatingTableRow'
import { chrome } from '@/theme'

const TABLE_COLUMNS = ['Lecture', 'Scores', 'Rated by', 'Date', ''] as const

const loadMoreStyle: CSSProperties = { padding: '14px 20px', textAlign: 'center' }

interface RatingsTableProps {
  ratings: Rating[]
  lecturesById: Map<string, Lecture>
  hasMore: boolean
  busy: boolean
  onLoadMore: () => void
  onOpen: (rating: Rating) => void
  onDelete: (rating: Rating) => void
}

/**
 * Read and delete only. A rating is someone's opinion — correcting its scores would put words
 * in their mouth — so there is no edit control here by design.
 */
export default function RatingsTable({
  ratings,
  lecturesById,
  hasMore,
  busy,
  onLoadMore,
  onOpen,
  onDelete,
}: RatingsTableProps) {
  return (
    <CatalogTablePanel
      title="Ratings"
      description={`${ratings.length} loaded · a rating can be removed, never rewritten`}
      columns={TABLE_COLUMNS}
      minWidth={760}
      footer={hasMore && (
        <Box style={loadMoreStyle}>
          <Button variant="light" loading={busy} onClick={onLoadMore}>
            Load more
          </Button>
        </Box>
      )}
    >
      {ratings.length === 0 ? (
        <CatalogEmptyRow colSpan={TABLE_COLUMNS.length}>
          <IconStar size={28} color={chrome.iconFaint} style={{ marginBottom: 10 }} />
          <Text c={chrome.textFaint} size="sm">
            No ratings here yet.
          </Text>
        </CatalogEmptyRow>
      ) : (
        ratings.map((rating, index) => (
          <RatingTableRow
            key={rating.id}
            rating={rating}
            lecture={rating.lectureId ? lecturesById.get(rating.lectureId) : undefined}
            isLast={index === ratings.length - 1}
            busy={busy}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))
      )}
    </CatalogTablePanel>
  )
}
