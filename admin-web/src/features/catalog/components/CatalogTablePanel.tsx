import { Box, Group, Text, type CSSProperties } from '@mantine/core'
import type { ReactNode } from 'react'
import Panel from '@/components/Panel'
import TableHeaderRow from '@/components/TableHeaderRow'
import { EMPTY_STATE_PADDING } from '@/constants/layout'
import { chrome } from '@/theme'

const panelStyle: CSSProperties = { overflow: 'hidden' }
const headerStyle: CSSProperties = { borderBottom: `1px solid ${chrome.border}` }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const baseTableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const emptyCellStyle: CSSProperties = { padding: EMPTY_STATE_PADDING, textAlign: 'center' }

interface CatalogTablePanelProps {
  title: string
  description: ReactNode
  columns: readonly string[]
  minWidth: number
  icon?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export default function CatalogTablePanel({
  title,
  description,
  columns,
  minWidth,
  icon,
  footer,
  children,
}: CatalogTablePanelProps) {
  return (
    <Panel style={panelStyle}>
      <Box px={20} py={16} style={headerStyle}>
        <Group justify="space-between" wrap="wrap" gap={12}>
          <div>
            <Group gap={6}>
              {icon}
              <Text fw={600} c={chrome.textPrimary} size="sm">
                {title}
              </Text>
            </Group>
            <Text size="xs" c={chrome.textFaint}>
              {description}
            </Text>
          </div>
        </Group>
      </Box>

      <div style={tableScrollStyle}>
        <table style={{ ...baseTableStyle, minWidth }}>
          <TableHeaderRow columns={columns} />
          <tbody>{children}</tbody>
        </table>
      </div>

      {footer}
    </Panel>
  )
}

interface CatalogEmptyRowProps {
  colSpan: number
  children: ReactNode
}

export function CatalogEmptyRow({ colSpan, children }: CatalogEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} style={emptyCellStyle}>
        {children}
      </td>
    </tr>
  )
}
