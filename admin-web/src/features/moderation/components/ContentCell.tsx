import type { MouseEvent } from 'react'
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { chrome, iconSize } from '@/theme'
import type { ModeratedItem } from '../model'
import { breakWordStyle, contentTextBoxStyle, replyIndentStyle } from './contentRowStyles'
import { TOOLTIP_THRESHOLD } from './contentRowStyles'

/** Past this length the text is clamped to two lines, so the full text needs a tooltip. */

interface ContentCellProps {
  item: ModeratedItem
  isReply: boolean
  expanded: boolean
  /** Present only for a comment that has answers. */
  onToggleExpand?: () => void
  onStopRowClick: (event: MouseEvent) => void
}

/** The text of a comment or answer, with the control that opens the thread beneath it. */
export default function ContentCell({
  item,
  isReply,
  expanded,
  onToggleExpand,
  onStopRowClick,
}: ContentCellProps) {
  const hasTooltip = item.content.length > TOOLTIP_THRESHOLD.contentColumn

  return (
    <Group gap={6} wrap="nowrap" align="flex-start" style={isReply ? replyIndentStyle : undefined}>
      {onToggleExpand && (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label={`${expanded ? 'Collapse' : 'Expand'} answers under ${item.author.name}'s comment`}
          onClick={(event) => {
            onStopRowClick(event)
            onToggleExpand()
          }}
        >
          {expanded ? <IconChevronDown size={iconSize.inline} /> : <IconChevronRight size={iconSize.inline} />}
        </ActionIcon>
      )}
      <Box style={contentTextBoxStyle}>
        <Tooltip label={item.content} multiline w={360} withArrow disabled={!hasTooltip}>
          <Text
            size="sm"
            c={chrome.textSecondary}
            lineClamp={2}
            style={{ ...breakWordStyle, cursor: hasTooltip ? 'help' : 'default' }}
          >
            {item.content}
          </Text>
        </Tooltip>
        <Text size="xs" c={chrome.textFaint} mt={4} lineClamp={1} style={breakWordStyle}>
          {item.detail}
        </Text>
      </Box>
    </Group>
  )
}
