import { Accordion, Badge, Box, Group, Stack, Text, type CSSProperties } from '@mantine/core'
import PageHeader from '@/components/PageHeader'
import Panel from '@/components/Panel'
import { HELP_SECTIONS, type HelpActionRow, type HelpValueGroup } from './content'
import { chrome } from '@/theme'

/** The icon in an accordion control, matched to its heading rather than to body text. */
const SECTION_ICON_SIZE = 16


const accordionStyles = {
  item: { background: 'transparent', border: 'none' },
  control: {
    background: `linear-gradient(180deg, ${chrome.surface} 0%, ${chrome.pageBase} 100%)`,
    border: `1px solid ${chrome.border}`,
    borderRadius: 12,
    padding: '14px 18px',
  },
  panel: { padding: 0 },
  content: { padding: 0 },
  label: { color: chrome.textPrimary, fontWeight: 600 },
  chevron: { color: chrome.textDim },
}

const panelBodyStyle: CSSProperties = {
  padding: '4px 18px 18px',
  marginTop: -4,
  background: `linear-gradient(180deg, ${chrome.pageBase} 0%, ${chrome.surfaceSunken} 100%)`,
  border: `1px solid ${chrome.border}`,
  borderTop: 'none',
  borderRadius: '0 0 12px 12px',
}

const groupHeadingStyle: CSSProperties = { textTransform: 'uppercase', letterSpacing: '0.04em' }
const valueRowStyle: CSSProperties = { padding: '6px 0', borderBottom: `1px solid ${chrome.borderSubtle}` }
const actionRowStyle: CSSProperties = { padding: '8px 0', borderBottom: `1px solid ${chrome.borderSubtle}` }

function ValueTable({ group }: { group: HelpValueGroup }) {
  return (
    <Box mb={14}>
      <Text size="xs" c={chrome.textDim} fw={600} mb={6} style={groupHeadingStyle}>
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
          <Text size="sm" c={chrome.textMuted}>
            {row.meaning}
          </Text>
        </Group>
      ))}
    </Box>
  )
}

function ActionList({ actions }: { actions: readonly HelpActionRow[] }) {
  return (
    <Box>
      <Text size="xs" c={chrome.textDim} fw={600} mb={6} style={groupHeadingStyle}>
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
          <Text size="sm" c={chrome.textSecondary} fw={600} style={{ flexShrink: 0, minWidth: 150 }}>
            {row.action}
          </Text>
          <Text size="sm" c={chrome.textMuted}>
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
        description="What each status means and what happens when you use a control. One reference per page in the panel."
      />

      <Accordion multiple variant="separated" transitionDuration={0} styles={accordionStyles}>
        {HELP_SECTIONS.map((section) => (
          <Accordion.Item key={section.id} value={section.id}>
            <Accordion.Control icon={<section.icon size={SECTION_ICON_SIZE} color={chrome.textDim} />}>
              {section.title}
            </Accordion.Control>
            <Accordion.Panel>
              <Panel style={panelBodyStyle}>
                <Stack gap={0} pt={14}>
                  <Text size="sm" c={chrome.textMuted} mb={section.valueGroups || section.actions ? 16 : 0}>
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
