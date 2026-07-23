import { Badge, Box, Group, Text, type CSSProperties } from '@mantine/core'
import { IconClock, IconUser } from '@tabler/icons-react'
import type { BugReport } from '../../../api/FeedbackService'
import { reportStatusColor, severityColor } from '../../../constants/colors'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'

const titleStyle: CSSProperties = { fontSize: 20 }

export default function BugReportSummary({ report }: { report: BugReport }) {
  return (
    <Box mb={20}>
      <Group gap={8} mb={8}>
        <Text fw={700} c="#f1f5f9" style={titleStyle}>
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
        <IconUser size={13} color="#6b7280" />
        <Text size="sm" c="#6b7280">
          Reported by {report.reporterName}
        </Text>
      </Group>
      <Group gap={6} mt={4}>
        <IconClock size={13} color="#6b7280" />
        <Text size="xs" c="#4b5563">
          {formatDate(report.reportedAt, { withTime: true })}
        </Text>
      </Group>
    </Box>
  )
}
