import { Modal } from '@mantine/core'
import type { BugReport, BugReportUpdate } from '@/api/feedback'
import BugReportDetails from './BugReportDetails'

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
