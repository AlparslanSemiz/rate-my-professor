import { useEffect, useState } from 'react'
import { Text, Badge, Box, SimpleGrid, Select, Group, Loader, Center } from '@mantine/core'
import { IconBug, IconAlertCircle, IconCircleCheck, IconClock } from '@tabler/icons-react'
import { getReports, updateReportStatus, type BugReport, type ReportStatus } from '../api/feedback'

const severityColor: Record<string, string> = {
  Low: 'gray',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
}

const severityAccent: Record<string, string> = {
  Low: '#6b7280',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
}

const statusColor: Record<string, string> = {
  Open: 'red',
  'In Progress': 'blue',
  Resolved: 'green',
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent: string }) {
  return (
    <Box
      style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Box
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${accent}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={accent} />
      </Box>
      <div>
        <Text fw={700} c="#f1f5f9" style={{ fontSize: 22, lineHeight: 1 }}>
          {value}
        </Text>
        <Text size="xs" c="#6b7280" mt={2}>
          {label}
        </Text>
      </div>
    </Box>
  )
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
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  if (loading)
    return (
      <Center h={200}>
        <Loader color="green" />
      </Center>
    )

  const open = reports.filter((r) => r.status === 'Open').length
  const inProgress = reports.filter((r) => r.status === 'In Progress').length
  const resolved = reports.filter((r) => r.status === 'Resolved').length

  return (
    <div>
      <Text fw={700} c="#f1f5f9" mb={4} style={{ fontSize: 28, lineHeight: 1.1 }}>
        Bug Reports
      </Text>
      <Text size="sm" c="#6b7280" mb={28}>
        User-submitted bug forms, screenshots, device info and automatic crash logs.
      </Text>

      <SimpleGrid cols={4} spacing={14} mb={28}>
        <StatCard label="Total reports" value={reports.length} icon={IconBug} accent="#f97316" />
        <StatCard label="Open" value={open} icon={IconAlertCircle} accent="#ef4444" />
        <StatCard label="In progress" value={inProgress} icon={IconClock} accent="#3b82f6" />
        <StatCard label="Resolved" value={resolved} icon={IconCircleCheck} accent="#22c55e" />
      </SimpleGrid>

      {/* Report queue */}
      <Box
        style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Box px={20} py={16} style={{ borderBottom: '1px solid #21262d' }}>
          <Text fw={600} c="#e2e8f0" size="sm">
            Report queue
          </Text>
          <Text size="xs" c="#4b5563">
            Newest entries shown first.
          </Text>
        </Box>

        {reports.length === 0 ? (
          <Box py={60} style={{ textAlign: 'center' }}>
            <IconBug size={32} color="#374151" style={{ marginBottom: 12 }} />
            <Text c="#4b5563" size="sm">
              No bug reports yet.
            </Text>
          </Box>
        ) : (
          <div>
            {reports.map((report, i) => (
              <Box
                key={report.id}
                px={20}
                py={18}
                style={{
                  borderBottom: i < reports.length - 1 ? '1px solid #1c2128' : 'none',
                }}
              >
                <Group justify="space-between" mb={8}>
                  <Group gap={8}>
                    <Box
                      style={{
                        width: 3,
                        height: 36,
                        borderRadius: 2,
                        background: severityAccent[report.severity] ?? '#6b7280',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <Text fw={600} c="#e2e8f0" size="sm">
                        {report.title}
                      </Text>
                      <Group gap={6} mt={2}>
                        <Badge color={severityColor[report.severity]} variant="light" size="xs">
                          {report.severity}
                        </Badge>
                        <Badge color={statusColor[report.status]} variant="light" size="xs">
                          {report.status}
                        </Badge>
                      </Group>
                    </div>
                  </Group>
                  <Group gap={10} align="center">
                    <Text size="xs" c="#4b5563">
                      {report.reportedAt}
                    </Text>
                    <Select
                      size="xs"
                      w={130}
                      value={report.status}
                      data={['Open', 'In Progress', 'Resolved']}
                      styles={{
                        input: {
                          background: '#0f1117',
                          border: '1px solid #21262d',
                          color: '#e2e8f0',
                          fontSize: 12,
                        },
                      }}
                      onChange={(val) =>
                        val && handleStatusChange(report.id, val as ReportStatus)
                      }
                    />
                  </Group>
                </Group>
                <Text size="sm" c="#6b7280" ml={11}>
                  {report.description}
                </Text>
                <Text size="xs" c="#374151" mt={6} ml={11}>
                  Reported by {report.reportedBy}
                </Text>
              </Box>
            ))}
          </div>
        )}
      </Box>
    </div>
  )
}
