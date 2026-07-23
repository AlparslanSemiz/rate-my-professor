import type { Dispatch, SetStateAction } from 'react'
import type { FilterDraft } from '../auditLogModel'

export type DraftSetter = Dispatch<SetStateAction<FilterDraft>>
