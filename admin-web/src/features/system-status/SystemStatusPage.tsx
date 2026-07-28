import { SimpleGrid } from '@mantine/core'
import ErrorAlert from '../../components/ErrorAlert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import DatabasePanel from './components/DatabasePanel'
import LastWriteList from './components/LastWriteList'
import SystemCounters from './components/SystemCounters'
import SystemHealthBanner from './components/SystemHealthBanner'
import { useSystemStatus } from './hooks/useSystemStatus'
import { STALE_READING_SUFFIX } from './systemStatusModel'

export default function SystemStatusPage() {
  const { status, loading, refreshing, error, refresh } = useSystemStatus()

  if (loading && !status) {
    return <PageLoader />
  }

  if (!status) {
    return (
      <>
        <StatusPageHeader />
        <LoadError message={error} onRetry={refresh} />
      </>
    )
  }

  return (
    <>
      <StatusPageHeader />
      <ErrorAlert message={error ? `${error} ${STALE_READING_SUFFIX}` : ''} />
      <SystemHealthBanner status={status} refreshing={refreshing} onRefresh={refresh} />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={16} mb={16}>
        <DatabasePanel database={status.database} />
        <LastWriteList lastWriteAt={status.lastWriteAt} />
      </SimpleGrid>
      <SystemCounters counts={status.counts} />
    </>
  )
}

function StatusPageHeader() {
  return (
    <PageHeader
      title="System Status"
      description="How the backend is doing, and whether the actions taken here actually reached the database."
    />
  )
}
