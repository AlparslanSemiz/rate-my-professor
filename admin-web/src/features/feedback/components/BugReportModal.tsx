import { useState } from 'react'
import { Anchor, Box, Button, Group, Modal, Text, type CSSProperties } from '@mantine/core'
import { IconBrandGitlab, IconExternalLink, IconPencil, IconTrash } from '@tabler/icons-react'
import type { BugReport, BugReportUpdate } from '../../../api/FeedbackService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkModalStyles } from '../../../constants/modalStyles'
import BugReportControls from './BugReportControls'
import BugReportEditForm from './BugReportEditForm'
import BugReportSummary from './BugReportSummary'

interface BugReportModalProps {
  report: BugReport | null
  opened: boolean
  onClose: () => void
  onUpdate: (id: string, update: BugReportUpdate) => void
  onEdit: (id: string, update: BugReportUpdate) => Promise<void>
  onDelete: () => void
  /** False while the backend holds no GitLab credentials; the control stays hidden then. */
  gitlabEnabled: boolean
  onCreateIssue: (id: string) => void
  updating: boolean
  updateError: string
}

const detailsPanelStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid #21262d',
  borderRadius: 10,
  padding: '14px 16px',
}
const deleteButtonStyle: CSSProperties = { marginLeft: 'auto' }

export default function BugReportModal({
  report,
  opened,
  onClose,
  onUpdate,
  onEdit,
  onDelete,
  gitlabEnabled,
  onCreateIssue,
  updating,
  updateError,
}: BugReportModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Bug Report"
      centered
      size="lg"
      styles={darkModalStyles}
    >
      {/* Keyed on the report so opening a different one starts collapsed, without an effect
          resetting the toggle. */}
      {report && (
        <BugReportDetails
          key={report.id}
          report={report}
          onUpdate={onUpdate}
          onEdit={onEdit}
          onDelete={onDelete}
          gitlabEnabled={gitlabEnabled}
          onCreateIssue={onCreateIssue}
          updating={updating}
          updateError={updateError}
        />
      )}
    </Modal>
  )
}

type BugReportDetailsProps = Omit<BugReportModalProps, 'report' | 'opened' | 'onClose'> & {
  report: BugReport
}

function BugReportDetails({
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
          leftSection={<IconPencil size={13} />}
          onClick={() => setEditing((visible) => !visible)}
        >
          Edit
        </Button>
        <IssueControl
          report={report}
          gitlabEnabled={gitlabEnabled}
          updating={updating}
          onCreateIssue={onCreateIssue}
        />
        <Button
          size="xs"
          variant="light"
          color="red"
          leftSection={<IconTrash size={13} />}
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
          <Text size="xs" c="#4b5563" mb={4}>
            Description
          </Text>
          <Text size="sm" c="#9ca3af">
            {report.description}
          </Text>
        </Box>
      )}

      <ErrorAlert message={updateError} />
      <BugReportControls report={report} updating={updating} onUpdate={onUpdate} />
    </>
  )
}

/**
 * The link once an issue exists, the button while it does not, and nothing at all when the
 * backend has no GitLab credentials — the endpoint answers `503` then, and a control that
 * cannot work is worse than none.
 */
function IssueControl({
  report,
  gitlabEnabled,
  updating,
  onCreateIssue,
}: {
  report: BugReport
  gitlabEnabled: boolean
  updating: boolean
  onCreateIssue: (id: string) => void
}) {
  if (report.issueUrl) {
    return (
      <Anchor href={report.issueUrl} target="_blank" rel="noreferrer" size="xs" c="#f97316">
        <Group gap={4} wrap="nowrap">
          <IconExternalLink size={13} />
          Open issue on GitLab
        </Group>
      </Anchor>
    )
  }

  if (!gitlabEnabled) return null

  return (
    <Button
      size="xs"
      variant="light"
      color="orange"
      leftSection={<IconBrandGitlab size={13} />}
      loading={updating}
      onClick={() => onCreateIssue(report.id)}
    >
      Create issue
    </Button>
  )
}
