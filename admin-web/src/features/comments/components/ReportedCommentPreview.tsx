import { Box, Text, Tooltip, type CSSProperties } from '@mantine/core'
import type { ReportedComment } from '../../../api/CommentsService'

const reportTextBoxStyle: CSSProperties = {
  background: 'rgba(239,68,68,0.06)',
  border: '1px solid rgba(239,68,68,0.15)',
  borderRadius: 6,
  padding: '5px 8px',
}
const breakWordStyle: CSSProperties = { wordBreak: 'break-word' }

function commentTextStyle(hasTooltip: boolean): CSSProperties {
  return {
    ...breakWordStyle,
    cursor: hasTooltip ? 'help' : 'default',
  }
}

export default function ReportedCommentPreview({ report }: { report: ReportedComment }) {
  const hasTooltip = report.commentContent.length > 80

  return (
    <>
      <Tooltip label={report.commentContent} multiline w={340} withArrow disabled={!hasTooltip}>
        <Text
          size="sm"
          c="#d1d5db"
          lineClamp={2}
          mb={4}
          style={commentTextStyle(hasTooltip)}
        >
          "{report.commentContent}"
        </Text>
      </Tooltip>
      {report.reportText && (
        <Box style={reportTextBoxStyle}>
          <Text size="xs" c="#fca5a5" lineClamp={2} style={breakWordStyle}>
            Report: {report.reportText}
          </Text>
        </Box>
      )}
    </>
  )
}
