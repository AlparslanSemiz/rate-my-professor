import {
  ActionIcon,
  Box,
  Button,
  Group,
  Select,
  Text,
  Tooltip,
  type CSSProperties,
} from '@mantine/core'
import { IconStar, IconTrash } from '@tabler/icons-react'
import type { Lecture } from '../../../api/CatalogService'
import type { Rating } from '../../../api/RatingsService'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import { darkInputStyles } from '../../../constants/inputStyles'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { lectureLabel } from '../catalogModel'

const TABLE_COLUMNS = ['Lecture', 'Scores', 'Rated by', 'Date', ''] as const

const panelStyle: CSSProperties = { overflow: 'hidden' }
const headerStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const filterStyle: CSSProperties = { flex: '1 1 260px', maxWidth: 360 }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 760 }
const cellStyle: CSSProperties = { padding: '14px 20px' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }
const emptyCellStyle: CSSProperties = { padding: '40px 20px', textAlign: 'center' }
const loadMoreStyle: CSSProperties = { padding: '14px 20px', textAlign: 'center' }

function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
}

/** The categories a rating carries depend on the lecture type, so they are rendered as given. */
function scoreLine(scores: Record<string, number>): string {
  const entries = Object.entries(scores)
  if (entries.length === 0) return '—'
  return entries.map(([category, score]) => `${enumLabel(category)} ${score}`).join(' · ')
}

interface RatingsTableProps {
  ratings: Rating[]
  lectures: Lecture[]
  lecturesById: Map<string, Lecture>
  lectureId: string | null
  nextCursor: string | null
  busy: boolean
  onFilterByLecture: (lectureId: string | null) => void
  onLoadMore: () => void
  onDelete: (rating: Rating) => void
}

/**
 * Read and delete only. A rating is someone's opinion — correcting its scores would put words
 * in their mouth — so there is no edit control here by design.
 */
export default function RatingsTable({
  ratings,
  lectures,
  lecturesById,
  lectureId,
  nextCursor,
  busy,
  onFilterByLecture,
  onLoadMore,
  onDelete,
}: RatingsTableProps) {
  const lectureOptions = lectures.map((lecture) => ({
    value: lecture.id,
    label: lectureLabel(lecture),
  }))

  return (
    <Panel style={panelStyle}>
      <Box px={20} py={16} style={headerStyle}>
        <Group justify="space-between" wrap="wrap" gap={12}>
          <div>
            <Text fw={600} c="#e2e8f0" size="sm">
              Ratings
            </Text>
            <Text size="xs" c="#4b5563">
              {ratings.length} loaded · a rating can be removed, never rewritten
            </Text>
          </div>
          <Select
            placeholder="All lectures"
            aria-label="Filter ratings by lecture"
            data={lectureOptions}
            value={lectureId}
            onChange={onFilterByLecture}
            style={filterStyle}
            size="sm"
            searchable
            clearable
            styles={darkInputStyles}
          />
        </Group>
      </Box>

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
          <TableHeaderRow columns={TABLE_COLUMNS} />
          <tbody>
            {ratings.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} style={emptyCellStyle}>
                  <IconStar size={28} color="#374151" style={{ marginBottom: 10 }} />
                  <Text c="#4b5563" size="sm">
                    No ratings here yet.
                  </Text>
                </td>
              </tr>
            ) : (
              ratings.map((rating, index) => {
                const lecture = rating.lectureId ? lecturesById.get(rating.lectureId) : undefined

                return (
                  <tr key={rating.id} style={rowStyle(index === ratings.length - 1)}>
                    <td style={cellStyle}>
                      <Text size="sm" c="#e2e8f0">
                        {lecture ? lectureLabel(lecture) : '—'}
                      </Text>
                    </td>
                    <td style={cellStyle}>
                      <Text size="xs" c="#9ca3af">
                        {scoreLine(rating.scores)}
                      </Text>
                    </td>
                    <td style={nowrapCellStyle}>
                      <Text size="sm" c="#9ca3af">
                        {rating.authorName}
                      </Text>
                    </td>
                    <td style={nowrapCellStyle}>
                      <Text size="xs" c="#6b7280">
                        {rating.createdAt ? formatDate(rating.createdAt) : '—'}
                      </Text>
                    </td>
                    <td style={cellStyle}>
                      <Tooltip label="Remove this rating" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          disabled={busy}
                          aria-label={`Delete rating by ${rating.authorName}`}
                          onClick={() => onDelete(rating)}
                        >
                          <IconTrash size={15} />
                        </ActionIcon>
                      </Tooltip>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <Box style={loadMoreStyle}>
          <Button variant="light" loading={busy} onClick={onLoadMore}>
            Load more
          </Button>
        </Box>
      )}
    </Panel>
  )
}
