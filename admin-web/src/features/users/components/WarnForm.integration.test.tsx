import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import WarnForm from './WarnForm'

/**
 * Named `.integration.` because it renders through `MantineProvider`, which is what turns the
 * `Textarea` into the label/input pair this file is about. It is a component scenario, not a
 * unit.
 *
 * `WarnForm` is reached only by opening a user's profile modal and choosing "Warn", so the
 * accessibility sweep in `App.a11y.integration.test.tsx` — which scans each route as it first
 * renders — never sees it. That is why the one unlabelled input in the panel sat on a
 * moderation action without any layer noticing.
 */
function renderWarnForm() {
  return render(
    <MantineProvider>
      <WarnForm userName="Alice" loading={false} onCancel={vi.fn()} onSubmit={vi.fn()} />
    </MantineProvider>,
  )
}

describe('WarnForm', () => {
  it('names the message field, so it is not announced as a bare textbox', () => {
    renderWarnForm()

    // `getByLabelText` resolves an `aria-label` as well as a wired `<label>`, so this asserts
    // the field has *a* name rather than dictating which mechanism supplies it. Its sibling
    // `WarningEditor` already carries one, which is what makes the omission an oversight
    // rather than a decision.
    expect(screen.getByLabelText('Warning message')).toBe(
      screen.getByRole('textbox', { name: 'Warning message' }),
    )
  })

  it('offers a placeholder as well, which is not a substitute for the name', () => {
    renderWarnForm()

    // Pinned deliberately: the placeholder disappears the moment the operator types, so it can
    // never be the field's accessible name. Both are expected to be present at once.
    expect(screen.getByLabelText('Warning message')).toHaveAttribute(
      'placeholder',
      'Describe the reason for this warning...',
    )
  })
})
