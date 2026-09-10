import { describe, expect, it } from 'vitest'
import { tableCellPadding } from '@/constants/layout'
import { catalogCellStyle } from '@/features/catalog/components/catalogTableStyles'
import { cellStyle as contentBodyCellStyle } from '@/features/moderation/components/contentRowStyles'

/**
 * `F-069`. Seven tables carried three different vertical cell paddings, which is three answers
 * to one question. Row *heights* still differ where content differs - that is not what this
 * asserts. It asserts that the padding is decided once.
 *
 * The style objects are compared directly rather than through a rendered row: these modules are
 * the decision, and a rendered assertion would pass just as well with the value copied into
 * each of them, which is the thing that went wrong.
 */
describe('table cell padding', () => {
  it('is one value, not one per feature', () => {
    expect(catalogCellStyle.padding).toBe(tableCellPadding)
    expect(contentBodyCellStyle.padding).toBe(tableCellPadding)
  })
})
