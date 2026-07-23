import { Group, Select } from '@mantine/core'
import type { BugReport, BugReportUpdate } from '../../../api/FeedbackService'
import {
  REPORT_STATUSES,
  SEVERITIES,
  isReportStatus,
  isSeverity,
} from '../../../domain/moderation'
import { enumLabel } from '../../../utils/enumLabel'

const selectStyles = {
  input: {
    background: '#0f1117',
    border: '1px solid #21262d',
    color: '#e2e8f0',
    fontSize: 13,
  },
}

interface BugReportControlsProps {
  report: BugReport
  updating: boolean
  onUpdate: (id: string, update: BugReportUpdate) => void
}

export default function BugReportControls({
  report,
  updating,
  onUpdate,
}: BugReportControlsProps) {
  return (
    <Group grow align="flex-start">
      <Select
        label="Status"
        size="sm"
        value={report.status}
        data={REPORT_STATUSES.map((status) => ({ value: status, label: enumLabel(status) }))}
        styles={selectStyles}
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
        styles={selectStyles}
        disabled={updating}
        onChange={(value) => {
          if (isSeverity(value)) onUpdate(report.id, { severity: value })
        }}
      />
    </Group>
  )
}
