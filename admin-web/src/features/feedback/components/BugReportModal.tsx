import { Box, Modal, Text, type CSSProperties } from '@mantine/core'
import type { BugReport, BugReportUpdate } from '../../../api/FeedbackService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkModalStyles } from '../../../constants/modalStyles'
import BugReportControls from './BugReportControls'
import BugReportSummary from './BugReportSummary'

interface BugReportModalProps {
  report: BugReport | null
  opened: boolean
  onClose: () => void
  onUpdate: (id: string, update: BugReportUpdate) => void
  updating: boolean
  updateError: string
}

const detailsPanelStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid #21262d',
  borderRadius: 10,
  padding: '14px 16px',
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
    <Modal
      opened={opened}
      onClose={onClose}
      title="Bug Report"
      centered
      size="lg"
      styles={darkModalStyles}
    >
      {report && (
        <>
          <BugReportSummary report={report} />
          <Box mb={20} style={detailsPanelStyle}>
            <Text size="xs" c="#4b5563" mb={4}>
              Description
            </Text>
            <Text size="sm" c="#9ca3af">
              {report.description}
            </Text>
          </Box>

          <ErrorAlert message={updateError} />
          <BugReportControls
            report={report}
            updating={updating}
            onUpdate={onUpdate}
          />
        </>
      )}
    </Modal>
  )
}
