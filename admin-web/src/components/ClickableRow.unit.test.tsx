import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ClickableRow from './ClickableRow'
import { keepFromRow } from './rowActivation'

function renderRow(onActivate: () => void, children = <td>Cell</td>) {
  return render(
    <table>
      <tbody>
        <ClickableRow onActivate={onActivate} label="Open the profile of Alice">
          {children}
        </ClickableRow>
      </tbody>
    </table>,
  )
}

describe('ClickableRow', () => {
  it('carries an accessible name, so it is not announced as "row, one column"', () => {
    renderRow(vi.fn())

    expect(screen.getByLabelText('Open the profile of Alice')).toBeInTheDocument()
  })

  it('is reachable from the keyboard', () => {
    renderRow(vi.fn())

    expect(screen.getByLabelText('Open the profile of Alice')).toHaveAttribute('tabindex', '0')
  })

  it('activates on click', async () => {
    const onActivate = vi.fn()
    const user = userEvent.setup()
    renderRow(onActivate)

    await user.click(screen.getByLabelText('Open the profile of Alice'))

    expect(onActivate).toHaveBeenCalledOnce()
  })

  it.each(['{Enter}', '{ }'])('activates on %s when the row itself has focus', async (key) => {
    const onActivate = vi.fn()
    const user = userEvent.setup()
    renderRow(onActivate)

    screen.getByLabelText('Open the profile of Alice').focus()
    await user.keyboard(key)

    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('lets a control inside it keep its own Enter', async () => {
    const onActivate = vi.fn()
    const onInner = vi.fn()
    const user = userEvent.setup()
    renderRow(
      onActivate,
      <td onClick={keepFromRow}>
        <button type="button" onClick={onInner}>
          Delete
        </button>
      </td>,
    )

    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')

    // The regression both halves of this contract exist for. The row used to claim every
    // Enter pressed inside it and call `preventDefault`, which suppressed the button's own
    // click — so tabbing to Delete and pressing Enter opened the row instead of deleting.
    expect(onInner).toHaveBeenCalledOnce()
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('needs the cell shield as well: without it the button click reaches the row', async () => {
    const onActivate = vi.fn()
    const user = userEvent.setup()
    renderRow(
      onActivate,
      <td>
        <button type="button">Delete</button>
      </td>,
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    // Recorded rather than tolerated: a cell holding its own controls must use `keepFromRow`,
    // and this is what forgetting it costs. The keyboard guard cannot cover this, because a
    // click on the cell's own padding *should* still open the row.
    expect(onActivate).toHaveBeenCalledOnce()
  })
})
