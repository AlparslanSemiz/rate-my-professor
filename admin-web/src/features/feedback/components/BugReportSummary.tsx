import { Badge, Box, Group, Text, type CSSProperties } from '@mantine/core'
import { IconClock, IconUser } from '@tabler/icons-react'
import type { BugReport } from '@/api/feedback'
import { reportStatusColor, severityColor } from '@/constants/colors'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { chrome, iconSize } from '@/theme'

const titleStyle: CSSProperties = { fontSize: 20 }

export default function BugReportSummary({ report }: { report: BugReport }) {
  return (
    <Box mb={20}>
      <Group gap={8} mb={8}>
        <Text fw={700} c={chrome.textBright} style={titleStyle}>
          {report.title}
        </Text>
        <Badge size="sm" variant="light" color={severityColor[report.severity]}>
          {enumLabel(report.severity)}
        </Badge>
        <Badge size="sm" variant="light" color={reportStatusColor[report.status]}>
          {enumLabel(report.status)}
        </Badge>
      </Group>
      <Group gap={6}>
        <IconUser size={iconSize.compact} color={chrome.textDim} />
        <Text size="sm" c={chrome.textDim}>
          Reported by {report.reporterName}
        </Text>
      </Group>
      <Group gap={6} mt={4}>
        <IconClock size={iconSize.compact} color={chrome.textDim} />
        <Text size="xs" c={chrome.textFaint}>
          {formatDate(report.reportedAt, { withTime: true })}
        </Text>
      </Group>
    </Box>
  )
}
