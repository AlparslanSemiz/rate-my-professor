import { SimpleGrid } from '@mantine/core'
import { IconShieldCheck, IconShieldOff, IconUserCheck, IconUsers } from '@tabler/icons-react'
import type { User } from '../../../api/UsersService'
import StatCard from '../../../components/StatCard'
import { statGridCols } from '../../../constants/layout'
import { countByValue } from '../../../utils/collection'

export default function UsersStats({ users }: { users: User[] }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Total users" value={users.length} icon={IconUsers} accent="#3b82f6" />
      <StatCard
        label="Active"
        value={countByValue(users, 'status', 'ACTIVE')}
        icon={IconUserCheck}
        accent="#22c55e"
      />
      <StatCard
        label="Admin accounts"
        value={countByValue(users, 'role', 'ADMIN')}
        icon={IconShieldCheck}
        accent="#f59e0b"
      />
      <StatCard
        label="Blocked"
        value={countByValue(users, 'status', 'BLOCKED')}
        icon={IconShieldOff}
        accent="#ef4444"
      />
    </SimpleGrid>
  )
}
