import { type CSSProperties } from 'react'
import { Modal, Text, Badge, Box, Group, Select } from '@mantine/core'
import { IconUser, IconClock } from '@tabler/icons-react'
import type { BugReport, BugReportUpdate } from '../api/FeedbackService'
import { severityColor, reportStatusColor } from '../constants/colors'
import { darkModalStyles } from '../constants/modalStyles'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import {
  REPORT_STATUSES,
  SEVERITIES,
  isReportStatus,
  isSeverity,
} from '../domain/moderation'
import ErrorAlert from './ErrorAlert'

interface BugReportModalProps {
  report: BugReport | null
  opened: boolean
  onClose: () => void
  onUpdate: (id: string, update: BugReportUpdate) => void
  updating: boolean
  updateError: string
}

const titleStyle: CSSProperties = {
  fontSize: 20,
}

const detailsPanelStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid #21262d',
  borderRadius: 10,
  padding: '14px 16px',
}

const statusSelectStyles = {
  input: {
    background: '#0f1117',
    border: '1px solid #21262d',
    color: '#e2e8f0',
    fontSize: 13,
  },
}

export default function BugReportModal({
  report,
  opened,
  onClose,
  onUpdate,
  updating,
  updateError,
}: BugReportModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Bug Report" centered size="lg" styles={darkModalStyles}>
      {report && (
        <>
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

          <Box mb={20} style={detailsPanelStyle}>
            <Text size="xs" c="#4b5563" mb={4}>
              Description
            </Text>
            <Text size="sm" c="#9ca3af">
              {report.description}
            </Text>
          </Box>

          <ErrorAlert message={updateError} />

          <Group grow align="flex-start">
            <Select
              label="Status"
              size="sm"
              value={report.status}
              data={REPORT_STATUSES.map((status) => ({ value: status, label: enumLabel(status) }))}
              styles={statusSelectStyles}
              disabled={updating}
              onChange={(value) => {
                if (isReportStatus(value)) onUpdate(report.id, { status: value })
              }}
            />
            <Select
              label="Severity"
              size="sm"
              value={report.severity}
              data={SEVERITIES.map((severity) => ({ value: severity, label: enumLabel(severity) }))}
              styles={statusSelectStyles}
              disabled={updating}
              onChange={(value) => {
                if (isSeverity(value)) onUpdate(report.id, { severity: value })
              }}
            />
          </Group>
        </>
      )}
    </Modal>
  )
}
