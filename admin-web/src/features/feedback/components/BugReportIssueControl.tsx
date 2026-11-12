import { Anchor, Button, Group } from '@mantine/core'
import { IconBrandGitlab, IconExternalLink } from '@tabler/icons-react'
import type { BugReport } from '@/api/feedback'
import { KIT } from '@/constants/colors'
import { iconSize } from '@/theme'

interface BugReportIssueControlProps {
  report: BugReport
  gitlabEnabled: boolean
  updating: boolean
  onCreateIssue: (id: string) => void
}

/**
 * The link once an issue exists, the button while it does not, and nothing when the backend
 * has no GitLab credentials.
 */
export default function BugReportIssueControl({
  report,
  gitlabEnabled,
  updating,
  onCreateIssue,
}: BugReportIssueControlProps) {
  if (report.issueUrl) {
    return (
      <Anchor href={report.issueUrl} target="_blank" rel="noreferrer" size="xs" c={KIT.orange}>
        <Group gap={4} wrap="nowrap">
          <IconExternalLink size={iconSize.compact} />
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
      leftSection={<IconBrandGitlab size={iconSize.compact} />}
      loading={updating}
      onClick={() => onCreateIssue(report.id)}
    >
      Create issue
    </Button>
  )
}
