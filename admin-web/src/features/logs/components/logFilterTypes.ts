import type { Dispatch, SetStateAction } from 'react'
import type { FilterDraft } from '../logModel'

/** How a filter control hands its change back to the screen holding the draft. */
export type DraftSetter = Dispatch<SetStateAction<FilterDraft>>
