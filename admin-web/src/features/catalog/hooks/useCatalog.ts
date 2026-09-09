import { useCatalogActions } from './useCatalogActions'
import { useCatalogLists } from './useCatalogLists'

/**
 * The catalogue screen's data, as two objects rather than sixteen flat fields: what is on
 * screen, and what can be done to it. The page hands each to the part that needs it.
 */
export function useCatalog() {
  return { lists: useCatalogLists(), actions: useCatalogActions() }
}
