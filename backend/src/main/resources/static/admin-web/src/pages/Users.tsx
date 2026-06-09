import { useEffect, useState } from 'react'
import { Title, Table, Badge, TextInput, Group, ActionIcon, Text, Loader, Center } from '@mantine/core'
import { getUsers, deleteUser, type User } from '../api/users'

const roleColor: Record<string, string> = {
  Admin: 'blue',
  Developer: 'teal',
  Student: 'gray',
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUsers().then((data) => {
      setUsers(data)
      setLoading(false)
    })
  }, [])

  async function handleDelete(id: number) {
    await deleteUser(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Center h={200}><Loader /></Center>

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Users</Title>
        <TextInput
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          w={260}
        />
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Joined</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text c="dimmed" ta="center" py="md">No users found</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            filtered.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.name}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <Badge color={roleColor[user.role]} variant="light">{user.role}</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={user.status === 'Active' ? 'green' : 'red'} variant="dot">
                    {user.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{user.joinedAt}</Table.Td>
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    title="Delete user"
                  >
                    ✕
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </>
  )
}
