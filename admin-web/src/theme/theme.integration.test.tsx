import {
  AppShell,
  MantineProvider,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Textarea,
  TextInput,
} from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { chrome } from './chrome'
import { theme } from './index'

/**
 * Named `.integration.` because that is what it is: it renders real Mantine components inside
 * a provider and asserts the computed styles, so it exercises the theme *against the Styles
 * API* rather than in isolation. It exists because moving a style into the theme fails
 * quietly — an input that stops being themed still renders, only paler — and no other test
 * would notice.
 */

function renderThemed(ui: React.ReactNode) {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {ui}
    </MantineProvider>
  )
}

const panelInput = {
  background: chrome.surfaceSunken,
  border: `1px solid ${chrome.border}`,
  color: chrome.textPrimary,
}

/**
 * These styles were handed to `styles={...}` at 42 call sites before they moved into the
 * theme. The risk in that move is a quiet one: an input that stops being themed still
 * renders, only paler, and no other test would notice. So the theme is asserted directly.
 */
describe('panel theme', () => {
  it.each([
    ['TextInput', 'Name', <TextInput key="t" label="Name" />],
    ['Textarea', 'Note', <Textarea key="a" label="Note" />],
    ['Select', 'Status', <Select key="s" label="Status" data={['ACTIVE']} />],
    ['NumberInput', 'Score', <NumberInput key="n" label="Score" />],
  ])(
    'paints a %s with the panel input colours without a styles prop',
    (_component, label, element) => {
      renderThemed(element)

      // A Select labels its listbox as well as its field, so the field is picked by tag
      // rather than by assuming the label matches one node.
      const field = screen
        .getAllByLabelText(label)
        .find((node) => node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')

      expect(field).toHaveStyle(panelInput)
    }
  )

  it('paints a MultiSelect with the panel input colours without a styles prop', () => {
    const { container } = renderThemed(<MultiSelect label="Lectures" data={['LA']} />)

    // MultiSelect is built on PillsInput: the bordered box is the `input` element of the
    // Styles API, while the node carrying the label is the text field nested inside it.
    expect(container.querySelector('.mantine-MultiSelect-input')).toHaveStyle(panelInput)
  })

  it('paints a modal surface and title without a styles prop', () => {
    renderThemed(
      <Modal opened onClose={() => {}} title="Edit professor">
        body
      </Modal>
    )

    expect(screen.getByText('Edit professor')).toHaveStyle({ color: chrome.textBright })
  })

  it('keeps a component-level override on top of the themed base', () => {
    renderThemed(<Textarea label="Warning" styles={{ input: { fontSize: 13 } }} />)

    const field = screen.getByRole('textbox', { name: 'Warning' })
    // The override applies…
    expect(field).toHaveStyle({ fontSize: '13px' })
    // …without dropping what the theme supplies underneath it.
    expect(field).toHaveStyle({ background: chrome.surfaceSunken })
  })

  it('paints the app shell navbar without a styles prop', () => {
    const { container } = renderThemed(
      <AppShell navbar={{ width: 240, breakpoint: 'sm' }} padding={0}>
        <AppShell.Navbar>sidebar</AppShell.Navbar>
        <AppShell.Main>page</AppShell.Main>
      </AppShell>
    )

    // The navbar's wash and hairline moved here out of `AdminLayout`. If they stop being
    // applied the panel still renders, only flatter, so it is asserted rather than looked at.
    expect(container.querySelector('.mantine-AppShell-navbar')).toHaveStyle({
      borderRight: `1px solid ${chrome.borderSubtle}`,
    })
  })
})
