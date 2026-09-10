import type { KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { activateOnEnterOrSpace, isActivationKey, isOwnActivation } from './keyboard'

const row = { id: 'row' } as unknown as EventTarget
const button = { id: 'button' } as unknown as EventTarget

function keyPress(key: string, target: EventTarget = row): KeyboardEvent<HTMLElement> {
  return {
    key,
    target,
    currentTarget: row,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLElement>
}

describe('isActivationKey', () => {
  it.each(['Enter', ' '])('accepts %j, the keys a button responds to', (key) => {
    expect(isActivationKey(keyPress(key))).toBe(true)
  })

  it.each(['Tab', 'Escape', 'a', 'ArrowDown'])('rejects %j', (key) => {
    expect(isActivationKey(keyPress(key))).toBe(false)
  })
})

describe('isOwnActivation', () => {
  it('accepts a press on the element the handler is bound to', () => {
    expect(isOwnActivation(keyPress('Enter', row))).toBe(true)
  })

  it('rejects a press that bubbled up from something inside it', () => {
    // A row's own buttons and links are focusable. Claiming their Enter is what made a
    // keyboard user open the edit dialog when they meant to open an author's profile.
    expect(isOwnActivation(keyPress('Enter', button))).toBe(false)
  })
})

describe('activateOnEnterOrSpace', () => {
  it('activates the element and swallows the key so Space does not scroll', () => {
    const activate = vi.fn()
    const event = keyPress(' ')

    activateOnEnterOrSpace(event, activate)

    expect(activate).toHaveBeenCalledOnce()
    expect(event.preventDefault).toHaveBeenCalledOnce()
  })

  it('leaves a bubbled keypress entirely alone', () => {
    const activate = vi.fn()
    const event = keyPress('Enter', button)

    activateOnEnterOrSpace(event, activate)

    expect(activate).not.toHaveBeenCalled()
    // Not preventing the default is the whole point: the browser still turns this Enter into
    // a click on the button that is actually focused.
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('ignores a key that is not an activation', () => {
    const activate = vi.fn()
    activateOnEnterOrSpace(keyPress('Tab'), activate)
    expect(activate).not.toHaveBeenCalled()
  })
})
