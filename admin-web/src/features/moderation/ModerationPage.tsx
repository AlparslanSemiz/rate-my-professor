import { useState } from 'react'
import { Tabs } from '@mantine/core'
import { IconFlag, IconMessage } from '@tabler/icons-react'
import ConfirmModal from '../../components/ConfirmModal'
import ErrorAlert from '../../components/ErrorAlert'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import UserProfileModal from '../users/components/UserProfileModal'
import ContentEditModal from './components/ContentEditModal'
import ContentFilters from './components/ContentFilters'
import ContentStats from './components/ContentStats'
import ContentTable from './components/ContentTable'
import ReportFilters from './components/ReportFilters'
import ReportStats from './components/ReportStats'
import ReportsTable from './components/ReportsTable'
import { useModerationPage, type ModerationApi } from './hooks/useModerationPage'
import type { ModeratedItem, ReportItem } from './moderationModel'

interface ModerationPageProps {
  title: string
  description: string
  /** Singular name of the moderated content, e.g. "comment". Used in labels and empty states. */
  noun: string
  api: ModerationApi
  contentErrorMessage: string
  reportsErrorMessage: string
}

/**
 * The screen behind both Comments and Answers. The two differ only in which endpoints they
 * call and what the content is called, so the tabs, filters, tables and modals are shared.
 */
export default function ModerationPage({
  title,
  description,
  noun,
  api,
  contentErrorMessage,
  reportsErrorMessage,
}: ModerationPageProps) {
  const page = useModerationPage({ api, contentErrorMessage, reportsErrorMessage })
  const [editing, setEditing] = useState<ModeratedItem | null>(null)
  const [deleting, setDeleting] = useState<ModeratedItem | null>(null)
  const [withdrawing, setWithdrawing] = useState<ReportItem | null>(null)

  if (page.loading) return <PageLoader />
  if (page.loadError) return <LoadError message={page.loadError} onRetry={page.retry} />

  return (
    <>
      <PageHeader title={title} description={description} />
      <ErrorAlert message={page.actionError} />

      <Tabs defaultValue="content" keepMounted={false}>
        <Tabs.List mb={20}>
          <Tabs.Tab value="content" leftSection={<IconMessage size={14} />}>
            All {noun}s ({page.content.length})
          </Tabs.Tab>
          <Tabs.Tab value="reports" leftSection={<IconFlag size={14} />}>
            Reports ({page.reports.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="content">
          <ContentStats items={page.content} totalLabel={`Total ${noun}s`} />
          <ContentFilters
            search={page.contentSearch}
            status={page.contentStatusFilter}
            searchLabel={`Search ${noun}s`}
            onSearchChange={page.setContentSearch}
            onStatusChange={page.setContentStatusFilter}
          />
          <ContentTable
            items={page.filteredContent}
            noun={noun}
            updating={page.mutating}
            onOpenProfile={page.profile.open}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        </Tabs.Panel>

        <Tabs.Panel value="reports">
          <ReportStats reports={page.reports} />
          <ReportFilters
            search={page.reportSearch}
            status={page.reportStatusFilter}
            reason={page.reportReasonFilter}
            searchLabel={`Search reported ${noun}s`}
            onSearchChange={page.setReportSearch}
            onStatusChange={page.setReportStatusFilter}
            onReasonChange={page.setReportReasonFilter}
          />
          <ReportsTable
            reports={page.filteredReports}
            updating={page.mutating}
            onOpenProfile={page.profile.open}
            onStatusChange={page.changeReportStatus}
            onWithdraw={setWithdrawing}
          />
        </Tabs.Panel>
      </Tabs>

      <ContentEditModal
        item={editing}
        noun={noun}
        onClose={() => setEditing(null)}
        onSubmit={page.editContent}
      />

      {deleting && (
        <ConfirmModal
          opened
          title={`Delete ${noun}`}
          description={
            noun === 'comment'
              ? 'Delete this comment and every answer under it? This cannot be undone — use "Hidden" instead to take it out of the app while keeping it.'
              : 'Delete this answer? This cannot be undone — use "Hidden" instead to take it out of the app while keeping it.'
          }
          confirmLabel="Delete permanently"
          confirmColor="red"
          onConfirm={() => page.deleteContent(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}

      {withdrawing && (
        <ConfirmModal
          opened
          title="Withdraw report"
          description={`Withdraw this report? The ${noun} itself is left exactly as it is.`}
          confirmLabel="Withdraw report"
          confirmColor="red"
          onConfirm={() => page.withdrawReport(withdrawing.id)}
          onClose={() => setWithdrawing(null)}
        />
      )}

      <UserProfileModal
        userId={page.profile.selectedId}
        opened={page.profile.opened}
        onClose={page.profile.close}
      />
    </>
  )
}
