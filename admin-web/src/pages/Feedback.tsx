import { useEffect, useState } from 'react'
import { Title, Card, Group, Text, Badge, Stack, Loader, Center, Rating } from '@mantine/core'
import { getFeedback, type Feedback } from '../api/feedback'

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeedback().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <Center h={200}><Loader /></Center>

  const avgRating = items.reduce((sum, f) => sum + f.rating, 0) / items.length

  return (
    <>
      <Group justify="space-between" mb="lg" align="flex-end">
        <Title order={2}>Feedback</Title>
        <Group gap="xs">
          <Text size="sm" c="dimmed">{items.length} responses</Text>
          <Text size="sm" c="dimmed">·</Text>
          <Text size="sm" c="dimmed">Avg rating:</Text>
          <Rating value={avgRating} fractions={2} readOnly size="sm" />
          <Text size="sm" fw={500}>{avgRating.toFixed(1)}</Text>
        </Group>
      </Group>

      <Stack gap="sm">
        {items.map((item) => (
          <Card key={item.id} withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <div>
                <Text fw={500} size="sm">{item.userName}</Text>
                <Text size="xs" c="dimmed">{item.userEmail}</Text>
              </div>
              <Group gap="sm">
                <Rating value={item.rating} readOnly size="xs" />
                <Badge variant="light" color="gray" size="sm">{item.submittedAt}</Badge>
              </Group>
            </Group>
            <Text size="sm">{item.message}</Text>
          </Card>
        ))}
      </Stack>
    </>
  )
}
