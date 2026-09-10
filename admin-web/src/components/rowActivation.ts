import type { MouseEvent } from 'react'

/**
 * Stops a click inside a cell from also activating the row around it.
 *
 * Put it on any cell that holds its own controls — an edit button, an author chip. Without it
 * the button fires *and* the row opens, because the click bubbles.
 *
 * It is the other half of the row contract, and it was written out identically in three row
 * components. The keyboard half lives in `activateOnEnterOrSpace`, which ignores anything that
 * bubbled; this is the same idea for the pointer, and it has to be a separate mechanism
 * because a click on the cell's own padding *should* still open the row.
 *
 * @param event the click, as React delivers it
 */
export function keepFromRow(event: MouseEvent): void {
  event.stopPropagation()
}
