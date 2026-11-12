import type { KeyboardEvent } from 'react'

/**
 * Whether this keypress is the keyboard's equivalent of clicking — Enter or Space, the two
 * keys a native `<button>` responds to.
 *
 * A pure predicate, kept apart from the acting on it so that the question can be asked and
 * tested on its own. It used to be inlined inside a function that also called
 * `preventDefault()`, which is how the second half of the condition below went missing.
 */
export function isActivationKey(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key === 'Enter' || event.key === ' '
}

/**
 * Whether *this* element was activated from the keyboard, rather than something inside it.
 *
 * The `currentTarget` test is the load-bearing half. Keyboard events bubble, so without it a
 * clickable row claims every Enter pressed anywhere inside it — including on its own buttons.
 * That is not hypothetical: a keyboard user who tabbed to a row's author chip and pressed
 * Enter got the row's edit dialog, because the row's handler called `preventDefault()` first,
 * which suppressed the browser's synthetic click on the button and stopped the chip's own
 * handler from ever running. The mouse path had been shielded against this since it was
 * written (`onClick` guards on the cells); the key path never was.
 *
 * @param event the keyboard event, as React delivers it
 * @returns true only for Enter or Space aimed at the element the handler is bound to
 */
export function isOwnActivation(event: KeyboardEvent<HTMLElement>): boolean {
  return isActivationKey(event) && event.target === event.currentTarget
}

/**
 * Runs `activate` when the element carrying this handler was itself activated by keyboard.
 *
 * @param event the keyboard event, as React delivers it
 * @param activate what clicking the element would have done
 */
export function activateOnEnterOrSpace(
  event: KeyboardEvent<HTMLElement>,
  activate: () => void
): void {
  if (!isOwnActivation(event)) return

  // Only once the press is known to be ours: Space would otherwise scroll the page, and
  // Enter would be swallowed on behalf of whatever is actually focused.
  event.preventDefault()
  activate()
}
