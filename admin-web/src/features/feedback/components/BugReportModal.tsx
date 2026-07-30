import { useState } from 'react'
import { Box, Button, Group, Modal, Text, type CSSProperties } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
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
