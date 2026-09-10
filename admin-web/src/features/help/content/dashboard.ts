import { IconLayoutDashboard } from '@tabler/icons-react'
import { KIT, accentForRoute } from '@/constants/colors'
import { routes } from '@/constants/routes'
import { DASHBOARD_CARDS, REFRESH_INTERVAL_MS } from '@/features/dashboard/dashboardModel'
import type { HelpSection } from './types'

const REFRESH_SECONDS = REFRESH_INTERVAL_MS / 1000

/**
 * The badge beside each card's name, drawn in the accent the card itself uses.
 *
 * A hex rather than a Mantine colour name, because the dashboard's accents come from `KIT`
 * and not from the state maps. Reading them from the same constants is what stops this table
 * from drifting again: it described a card called "Not blocked" in green and an admin card in
 * yellow, and the dashboard has shown neither.
 */
const CARD_ACCENTS = {
  total: accentForRoute(routes.users),
  active: KIT.green,
  admins: KIT.orange,
  openReports: accentForRoute(routes.feedback),
} as const

export const DASHBOARD_HELP: HelpSection = {
  id: 'dashboard',
  title: 'Dashboard',
  icon: IconLayoutDashboard,
  summary: `An overview, not a reporting system. Numbers refresh automatically every ${REFRESH_SECONDS} seconds.`,
  valueGroups: [
    {
      heading: 'What the cards mean',
      rows: [
        {
          value: DASHBOARD_CARDS.total,
          color: CARD_ACCENTS.total,
          meaning: 'Every account the backend returned.',
        },
        {
          value: DASHBOARD_CARDS.active,
          color: CARD_ACCENTS.active,
          meaning:
            'Accounts whose status is Active. An inactive account is neither active nor blocked, so this is not "everyone who is not blocked", and it is not a count of who is online, which the backend does not measure.',
        },
        {
          value: DASHBOARD_CARDS.admins,
          color: CARD_ACCENTS.admins,
          meaning: 'Accounts whose role is Admin.',
        },
        {
          value: DASHBOARD_CARDS.openReports,
          color: CARD_ACCENTS.openReports,
          meaning: 'Bug reports whose status is Open; reported comments and answers are not counted here.',
        },
      ],
    },
  ],
}
