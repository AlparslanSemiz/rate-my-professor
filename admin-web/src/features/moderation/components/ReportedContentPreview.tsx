import { Box, Text, Tooltip, type CSSProperties } from '@mantine/core'
import type { ReportItem } from '../model'
import { chrome } from '@/theme'
import { KIT } from '@/constants/colors'
import { TOOLTIP_THRESHOLD } from './contentRowStyles'


const reportTextBoxStyle: CSSProperties = {
  background: 'rgba(239,68,68,0.06)',
  border: '1px solid rgba(239,68,68,0.15)',
  borderRadius: 6,
  padding: '5px 8px',
}
const parentBoxStyle: CSSProperties = {
  borderLeft: `2px solid ${chrome.border}`,
  paddingLeft: 8,
  marginBottom: 4,
}
const breakWordStyle: CSSProperties = { wordBreak: 'break-word' }

function contentTextStyle(hasTooltip: boolean): CSSProperties {
  return { ...breakWordStyle, cursor: hasTooltip ? 'help' : 'default' }
}

export default function ReportedContentPreview({ report }: { report: ReportItem }) {
  const hasTooltip = report.content.length > TOOLTIP_THRESHOLD.reportPreview

  return (
    <>
      {report.parentContent && (
        <Box style={parentBoxStyle}>
          <Text size="xs" c={chrome.textFaint} lineClamp={1} style={breakWordStyle}>
            In reply to: {report.parentContent}
          </Text>
        </Box>
      )}
      <Tooltip label={report.content} multiline w={340} withArrow disabled={!hasTooltip}>
        <Text size="sm" c={chrome.textSecondary} lineClamp={2} mb={4} style={contentTextStyle(hasTooltip)}>
          "{report.content}"
        </Text>
      </Tooltip>
      {report.reportText && (
        <Box style={reportTextBoxStyle}>
          <Text size="xs" c={KIT.red} lineClamp={2} style={breakWordStyle}>
            Report: {report.reportText}
          </Text>
        </Box>
      )}
    </>
  )
}
