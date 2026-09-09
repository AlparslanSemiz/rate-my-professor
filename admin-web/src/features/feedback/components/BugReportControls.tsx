import { Group, Select } from '@mantine/core'
import type { BugReport, BugReportUpdate } from '@/api/feedback'
import {
  REPORT_STATUSES,
  SEVERITIES,
  isReportStatus,
  isSeverity,
} from '@/domain/moderation'
import { enumLabel } from '@/utils/enumLabel'
import { chrome } from '@/theme'

const selectStyles = {
  input: {
    background: chrome.surfaceSunken,
    border: `1px solid ${chrome.border}`,
    color: chrome.textPrimary,
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
