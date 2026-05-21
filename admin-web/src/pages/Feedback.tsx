import { useEffect, useState } from 'react'
import { Title, Card, Group, Text, Badge, Stack, Loader, Center, Button, Select } from '@mantine/core'
import { getReports, updateReportStatus, type BugReport, type ReportStatus } from '../api/feedback'

const severityColor: Record<string, string> = {
  Low: 'gray',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
}

const statusColor: Record<string, string> = {
  Open: 'red',
  'In Progress': 'blue',
  Resolved: 'green',
}

export default function FeedbackPage() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReports().then((data) => {
      setReports(data)
      setLoading(false)
    })
  }, [])

  async function handleStatusChange(id: number, status: ReportStatus) {
    await updateReportStatus(id, status)
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    )
  }

  if (loading) return <Center h={200}><Loader /></Center>

  const open = reports.filter((r) => r.status === 'Open').length
  const inProgress = reports.filter((r) => r.status === 'In Progress').length
  const resolved = reports.filter((r) => r.status === 'Resolved').length

  return (
    <>
      <Group justify="space-between" mb="lg" align="flex-end">
        <Title order={2}>Feedback Dashboard</Title>
        <Group gap="xl">
          <Text size="sm" c="red">{open} Open</Text>
          <Text size="sm" c="blue">{inProgress} In Progress</Text>
          <Text size="sm" c="green">{resolved} Resolved</Text>
        </Group>
      </Group>

      {reports.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">No reports submitted yet.</Text>
        </Center>
      ) : (
        <Stack gap="sm">
          {reports.map((report) => (
            <Card key={report.id} withBorder radius="md" p="md">
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Badge color={severityColor[report.severity]} variant="filled" size="sm">
                    {report.severity}
                  </Badge>
                  <Badge color={statusColor[report.status]} variant="light" size="sm">
                    {report.status}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">{report.reportedAt}</Text>
              </Group>

              <Text fw={600} mb={4}>{report.title}</Text>
              <Text size="sm" c="dimmed" mb="md">{report.description}</Text>

              <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed">Reported by {report.reportedBy}</Text>
                <Group gap="xs">
                  <Select
                    size="xs"
                    w={130}
                    value={report.status}
                    data={['Open', 'In Progress', 'Resolved']}
                    onChange={(val) => val && handleStatusChange(report.id, val as ReportStatus)}
                  />
                  <Button size="xs" variant="light">
                    Report
                  </Button>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </>
  )
}
