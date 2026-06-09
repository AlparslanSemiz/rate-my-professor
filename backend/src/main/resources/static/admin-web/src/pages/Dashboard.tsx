import { Title, Text, SimpleGrid, Card, Group, Badge } from '@mantine/core'

const mockStats = [
  { label: 'Total Users', value: '24' },
  { label: 'Active Users', value: '18' },
  { label: 'Admins', value: '3' },
]

const recentUsers = [
  { id: 1, name: 'Alice Smith', role: 'Admin', email: 'alice@example.com' },
  { id: 2, name: 'Bob Johnson', role: 'Developer', email: 'bob@example.com' },
  { id: 3, name: 'Carol White', role: 'Student', email: 'carol@example.com' },
]

export default function Dashboard() {
  return (
    <>
      <Title order={2} mb="lg">Dashboard</Title>

      <SimpleGrid cols={3} mb="xl">
        {mockStats.map((stat) => (
          <Card key={stat.label} withBorder radius="md" p="lg">
            <Text size="sm" c="dimmed">{stat.label}</Text>
            <Text size="xl" fw={700}>{stat.value}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <Title order={4} mb="md">Recent Users</Title>
      <SimpleGrid cols={1} spacing="xs">
        {recentUsers.map((user) => (
          <Card key={user.id} withBorder radius="md" p="sm">
            <Group justify="space-between">
              <div>
                <Text fw={500}>{user.name}</Text>
                <Text size="sm" c="dimmed">{user.email}</Text>
              </div>
              <Badge>{user.role}</Badge>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </>
  )
}
