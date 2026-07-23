import { Box, SimpleGrid, Text } from '@mantine/core'
import ModuleCard from '../../../components/ModuleCard'
import { moduleGridCols } from '../../../constants/layout'
import { routes } from '../../../constants/routes'

const MODULES = [
  {
    label: 'Users',
    title: 'People',
    description: "Peek at profiles, sort out roles and tidy up sessions for everyone who's signed up.",
    accent: '#3b82f6',
    path: routes.users,
  },
  {
    label: 'Bug reports',
    title: 'Bugs & crashes',
    description: "See what's breaking — bug reports and crash logs, straight from your users.",
    accent: '#f97316',
    path: routes.feedback,
  },
  {
    label: 'Comments',
    title: 'Flagged comments',
    description: 'Look over the comments folks flagged and decide what happens next.',
    accent: '#8b5cf6',
    path: routes.comments,
  },
]

export default function ModuleNavigation({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <Box mb={8}>
      <Text fw={600} c="#e2e8f0" mb={4} size="sm">
        Jump to
      </Text>
      <Text size="xs" c="#6b7280" mb={16}>
        Head straight to any section.
      </Text>
      <SimpleGrid cols={moduleGridCols} spacing={16}>
        {MODULES.map((module) => (
          <ModuleCard key={module.path} {...module} onClick={onNavigate} />
        ))}
      </SimpleGrid>
    </Box>
  )
}
