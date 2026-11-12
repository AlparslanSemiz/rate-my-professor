import type { CSSProperties, ReactNode } from 'react'
import { activateOnEnterOrSpace } from '@/utils/keyboard'

interface ClickableRowProps {
  /** What activating the row does. The same thing for a click and for Enter or Space. */
  onActivate: () => void
  /**
   * What a screen reader announces. Required, not optional: a focusable row with no name is
   * read out as "row, eight columns", which says nothing about it being activatable at all.
   * Four of the five rows in this panel had no name until this component existed.
   */
  label: string
  /** Extra classes beyond the interactive ones every clickable row carries. */
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * A table row the operator can open.
 *
 * Five rows carried this contract — the two interactive classes, the click handler, the key
 * handler, `tabIndex` and a name — and they carried it at three different levels of
 * correctness. One had a name, four did not. The point of holding it here is that the
 * incomplete versions become impossible rather than merely discouraged: `label` is required.
 *
 * **Known compromise.** A focusable `<tr>` is not how this should be built. The accessible
 * form is an ordinary control inside the first cell, so the table keeps its row semantics and
 * the activatable thing announces itself as a button. Adding `role="button"` to the `<tr>`
 * would trade one defect for another — it strips the row out of the table's structure — so it
 * is deliberately not done here. Changing the markup is a visual change and wants the pass
 * `docs/DESIGN.md` asks for; it is recorded in `docs/TODO.md` rather than done quietly.
 */
export default function ClickableRow({
  onActivate,
  label,
  className,
  style,
  children,
}: ClickableRowProps) {
  return (
    <tr
      className={className ? `row-interactive row-clickable ${className}` : 'row-interactive row-clickable'}
      style={style}
      onClick={onActivate}
      onKeyDown={(event) => activateOnEnterOrSpace(event, onActivate)}
      tabIndex={0}
      aria-label={label}
    >
      {children}
    </tr>
  )
}
