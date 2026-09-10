import { useState, type CSSProperties } from 'react'
import { Box, Button, Group, Text } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { BugReport, BugReportUpdate } from '@/api/feedback'
import ErrorAlert from '@/components/ErrorAlert'
import BugReportControls from './BugReportControls'
import BugReportEditForm from './BugReportEditForm'
import BugReportIssueControl from './BugReportIssueControl'
import BugReportSummary from './BugReportSummary'
import { chrome, iconSize } from '@/theme'

const detailsPanelStyle: CSSProperties = {
  background: chrome.surfaceSunken,
  border: `1px solid ${chrome.border}`,
  borderRadius: 10,
  padding: '14px 16px',
}
const deleteButtonStyle: CSSProperties = { marginLeft: 'auto' }

interface BugReportDetailsProps {
  report: BugReport
  onUpdate: (id: string, update: BugReportUpdate) => void
  onEdit: (id: string, update: BugReportUpdate) => Promise<void>
  onDelete: () => void
  gitlabEnabled: boolean
  onCreateIssue: (id: string) => void
  updating: boolean
  updateError: string
}

export default function BugReportDetails({
  report,
  onUpdate,
  onEdit,
  onDelete,
  gitlabEnabled,
  onCreateIssue,
  updating,
  updateError,
}: BugReportDetailsProps) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <BugReportSummary report={report} />

      <Group gap={8} mb={16}>
        <Button
          size="xs"
          variant="light"
          color="blue"
          leftSection={<IconPencil size={iconSize.compact} />}
          onClick={() => setEditing((visible) => !visible)}
        >
          Edit
        </Button>
        <BugReportIssueControl
          report={report}
          gitlabEnabled={gitlabEnabled}
          updating={updating}
          onCreateIssue={onCreateIssue}
        />
        <Button
          size="xs"
          variant="light"
          color="red"
          leftSection={<IconTrash size={iconSize.compact} />}
          onClick={onDelete}
          style={deleteButtonStyle}
        >
          Delete report
        </Button>
      </Group>

      {editing ? (
        <BugReportEditForm
          report={report}
          loading={updating}
          onCancel={() => setEditing(false)}
          onSubmit={async (update) => {
            await onEdit(report.id, update)
            setEditing(false)
          }}
        />
      ) : (
        <Box mb={20} style={detailsPanelStyle}>
          <Text size="xs" c={chrome.textFaint} mb={4}>
            Description
          </Text>
          <Text size="sm" c={chrome.textMuted}>
            {report.description}
          </Text>
        </Box>
      )}

      <ErrorAlert message={updateError} />
      <BugReportControls report={report} updating={updating} onUpdate={onUpdate} />
    </>
  )
}
