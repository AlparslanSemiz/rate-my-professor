import { Group, Modal, Stack, Text } from '@mantine/core'
import DetailSection from '@/components/DetailSection'
import type { Lecture, Rating } from '@/api/catalog'
import { EMPTY_VALUE } from '@/utils/emptyValue'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { lectureLabel } from '../model'
import { chrome } from '@/theme'

interface RatingDetailsModalProps {
  rating: Rating | null
  /** The lecture the rating is about, when it is one this screen has loaded. */
  lecture?: Lecture
  onClose: () => void
}

/**
 * One rating in full, and nothing that changes it.
 *
 * **Read-only by contract, not for simplicity.** The backend serves no write for a rating -
 * the panel's whole call surface holds `ratings.list` and `ratings.delete` and nothing else -
 * and both repositories say the same thing: a rating can be removed, never rewritten, because
 * it is someone's own assessment. So this answers `F-083`'s missing row click with a detail
 * view rather than an editor, and deletion stays where it already is, on the row.
 *
 * What it adds over the cell: the cell joins every category into one line that the column
 * clips, and this lists them.
 */
export default function RatingDetailsModal({ rating, lecture, onClose }: RatingDetailsModalProps) {
  const scores = Object.entries(rating?.scores ?? {})

  return (
    <Modal opened={rating !== null} onClose={onClose} title="Rating" centered size="lg">
      {rating && (
        <Stack gap={16}>
          <DetailSection label="Lecture">
            <Text size="sm" c={chrome.textSecondary}>
              {lecture ? lectureLabel(lecture) : EMPTY_VALUE}
            </Text>
          </DetailSection>

          <DetailSection label="Scores">
            {scores.length === 0 ? (
              <Text size="sm" c={chrome.textDim}>
                This rating scored no categories.
              </Text>
            ) : (
              <Stack gap={6}>
                {scores.map(([category, score]) => (
                  <Group key={category} justify="space-between" wrap="nowrap">
                    <Text size="sm" c={chrome.textSecondary}>
                      {enumLabel(category)}
                    </Text>
                    <Text size="sm" fw={600} c={chrome.textBright}>
                      {score}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </DetailSection>

          <DetailSection label="Rated by">
            <Text size="sm" c={chrome.textSecondary}>
              {rating.authorName}
            </Text>
            <Text size="xs" c={chrome.textFaint} mt={3}>
              {rating.createdAt ? formatDate(rating.createdAt) : EMPTY_VALUE}
            </Text>
          </DetailSection>
        </Stack>
      )}
    </Modal>
  )
}
