import { Button, Group } from '@mantine/core'
import { IconFilter, IconRefresh } from '@tabler/icons-react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import Panel from './Panel'
import { FILTER_BAR_GAP } from '@/constants/layout'
import { iconSize } from '@/theme'

const panelStyle: CSSProperties = { padding: '16px 20px' }

interface FilterBarProps {
  /** The controls, search first. They wrap among themselves and never reach the action row. */
  children: ReactNode
  /**
   * Present only on the screens where filtering is a submit rather than a keystroke. Comments
   * and the catalogue filter as you type, so there is nothing for an Apply button to do.
   */
  actions?: {
    loading: boolean
    onApply: () => void
    onClear: () => void
  }
}

/**
 * The one filter bar shell, used by all five screens that filter.
 *
 * `F-067`: there were five layouts. Two screens had a `<form>` with its own panel, two had a
 * bare panel and no Apply at all, and the catalogue had no filter bar whatsoever - its search
 * sat inside the table panel's header, right-aligned at x=1067 where every other search is at
 * x=293. The differences were not decisions; each screen had simply been written on its own.
 *
 * **Apply and Clear get their own row, and that is the point rather than a detail.** They used
 * to be the last two flex children of the same wrapping group as the controls, so their
 * position was decided by how many controls a screen happened to offer - at 1440 they wrapped
 * to a second line on the two log screens and stayed on the first on Users. A row of their own
 * makes that impossible instead of unlikely, and it is why the shell owns the buttons rather
 * than taking them as children.
 */
export default function FilterBar({ children, actions }: FilterBarProps) {
  const bar = (
    <Panel mb={16} style={panelStyle}>
      <Group gap={FILTER_BAR_GAP} align="flex-end" wrap="wrap">
        {children}
      </Group>
      {actions && (
        <Group gap={8} justify="flex-end" mt={FILTER_BAR_GAP}>
          <Button
            type="submit"
            leftSection={<IconFilter size={iconSize.rowAction} />}
            loading={actions.loading}
          >
            Apply filters
          </Button>
          <Button
            type="button"
            variant="subtle"
            color="gray"
            leftSection={<IconRefresh size={iconSize.rowAction} />}
            onClick={actions.onClear}
            disabled={actions.loading}
          >
            Clear
          </Button>
        </Group>
      )}
    </Panel>
  )

  if (!actions) return bar

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    actions?.onApply()
  }

  return <form onSubmit={handleSubmit}>{bar}</form>
}
