import { Accordion, Badge, Box, Group, Stack, Text, type CSSProperties } from '@mantine/core'
import PageHeader from '../../components/PageHeader'
import Panel from '../../components/Panel'
import { HELP_SECTIONS, type HelpActionRow, type HelpValueGroup } from './helpContent'

const accordionStyles = {
  item: { background: 'transparent', border: 'none' },
  control: {
    background: 'linear-gradient(180deg, #171b23 0%, #14171e 100%)',
    border: '1px solid #232935',
    borderRadius: 12,
    padding: '14px 18px',
  },
  panel: { padding: 0 },
  content: { padding: 0 },
  label: { color: '#e2e8f0', fontWeight: 600 },
  chevron: { color: '#6b7280' },
}

const panelBodyStyle: CSSProperties = {
  padding: '4px 18px 18px',
  marginTop: -4,
  background: 'linear-gradient(180deg, #14171e 0%, #12151b 100%)',
  border: '1px solid #232935',
  borderTop: 'none',
  borderRadius: '0 0 12px 12px',
}

const groupHeadingStyle: CSSProperties = { textTransform: 'uppercase', letterSpacing: '0.04em' }
const valueRowStyle: CSSProperties = { padding: '6px 0', borderBottom: '1px solid #1c2128' }
const actionRowStyle: CSSProperties = { padding: '8px 0', borderBottom: '1px solid #1c2128' }

function ValueTable({ group }: { group: HelpValueGroup }) {
  return (
    <Box mb={14}>
      <Text size="xs" c="#6b7280" fw={600} mb={6} style={groupHeadingStyle}>
        {group.heading}
      </Text>
      {group.rows.map((row, index) => (
        <Group
          key={row.value}
          gap={12}
          wrap="nowrap"
          align="flex-start"
          style={index === group.rows.length - 1 ? undefined : valueRowStyle}
          py={6}
        >
          <Badge color={row.color} variant="light" size="sm" style={{ flexShrink: 0, minWidth: 92 }}>
            {row.value}
          </Badge>
          <Text size="sm" c="#9ca3af">
            {row.meaning}
          </Text>
        </Group>
      ))}
    </Box>
  )
}

function ActionList({ actions }: { actions: HelpActionRow[] }) {
  return (
    <Box>
      <Text size="xs" c="#6b7280" fw={600} mb={6} style={groupHeadingStyle}>
        What happens when you…
      </Text>
      {actions.map((row, index) => (
        <Group
          key={row.action}
          gap={12}
          wrap="nowrap"
          align="flex-start"
          style={index === actions.length - 1 ? undefined : actionRowStyle}
          py={6}
        >
          <Text size="sm" c="#d1d5db" fw={600} style={{ flexShrink: 0, minWidth: 150 }}>
            {row.action}
          </Text>
          <Text size="sm" c="#9ca3af">
            {row.result}
          </Text>
        </Group>
      ))}
    </Box>
  )
}

export default function HelpPage() {
  return (
    <>
      <PageHeader
        title="Help"
        description="What each status means and what happens when you use a control — one reference per page in the panel."
      />

      <Accordion multiple variant="separated" transitionDuration={0} styles={accordionStyles}>
        {HELP_SECTIONS.map((section) => (
          <Accordion.Item key={section.id} value={section.id}>
            <Accordion.Control icon={<section.icon size={16} color="#6b7280" />}>
              {section.title}
            </Accordion.Control>
            <Accordion.Panel>
              <Panel style={panelBodyStyle}>
                <Stack gap={0} pt={14}>
                  <Text size="sm" c="#9ca3af" mb={section.valueGroups || section.actions ? 16 : 0}>
                    {section.summary}
                  </Text>
                  {section.valueGroups?.map((group) => <ValueTable key={group.heading} group={group} />)}
                  {section.actions && <ActionList actions={section.actions} />}
                </Stack>
              </Panel>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </>
  )
}
