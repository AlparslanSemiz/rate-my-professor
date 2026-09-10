import { IconSchool } from '@tabler/icons-react'
import type { HelpSection } from './types'

export const CATALOG_HELP: HelpSection = {
  id: 'catalog',
  title: 'Lectures & Professors',
  icon: IconSchool,
  summary: 'The lectures students rate and the professors who teach them.',
  actions: [
    {
      action: 'Edit lecture',
      result: 'Changes its name/details and which professors are assigned to it.',
    },
    { action: 'Edit professor', result: 'Changes their details and which lectures they teach.' },
    {
      action: 'Delete lecture',
      result: 'Removes the lecture and every comment, answer and rating under it. Cannot be undone.',
    },
    {
      action: 'Delete professor',
      result: 'Removes the professor only; their lectures stay, just the assignment is dropped.',
    },
  ],
}
