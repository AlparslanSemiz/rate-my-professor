import { useState } from 'react'
import { Tabs } from '@mantine/core'
import { IconFlag, IconMessage } from '@tabler/icons-react'
import ConfirmModal from '@/components/ConfirmModal'
import ErrorAlert from '@/components/ErrorAlert'
import LoadError from '@/components/LoadError'
import PageHeader from '@/components/PageHeader'
import PageLoader from '@/components/PageLoader'
import UserProfileModal from '@/features/users/components/UserProfileModal'
import ContentEditModal from './components/ContentEditModal'
import ContentStats from './components/ContentStats'
import ContentTab from './components/ContentTab'
import ReportsTab from './components/ReportsTab'
import ReportStats from './components/ReportStats'
import { useModerationPage, type ModerationApi } from './hooks/useModerationPage'
import type { ModeratedItem, ReportItem } from './model'
import { iconSize } from '@/theme'

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
  const page = useModerationPage({
    api,
    resource: noun,
    contentErrorMessage,
    reportsErrorMessage,
  })
  /** Which half of the screen is open. Controlled because the cards above the strip follow it. */
  const [tab, setTab] = useState<'content' | 'reports'>('content')
  const [editing, setEditing] = useState<ModeratedItem | null>(null)
  const [deleting, setDeleting] = useState<ModeratedItem | null>(null)
  const [withdrawing, setWithdrawing] = useState<ReportItem | null>(null)

  if (page.loading) return <PageLoader />
  if (page.loadError) return <LoadError message={page.loadError} onRetry={page.retry} />

  return (
    <>
      <PageHeader title={title} description={description} />
      <ErrorAlert message={page.actions.actionError} />

      {/*
        `F-065`: the tab strip started at y=117.80 here and y=220.59 on the catalogue and on
        Bug Reports, because those render their cards once above `Tabs` while this screen
        rendered a different card set inside each panel. The cards are hoisted so the strip
        starts in the same place on every screen; because the two sets differ, the tab has to
        be controlled rather than uncontrolled so the numbers follow it.
      */}
      {tab === 'content' ? (
        <ContentStats items={page.content.items} totalLabel={`Total ${noun}s`} />
      ) : (
        <ReportStats reports={page.reports.items} />
      )}

      <Tabs value={tab} onChange={(value) => setTab(value === 'reports' ? 'reports' : 'content')} keepMounted={false}>
        <Tabs.List mb={20}>
          <Tabs.Tab value="content" leftSection={<IconMessage size={iconSize.inline} />}>
            All {noun}s ({page.content.items.length})
          </Tabs.Tab>
          <Tabs.Tab value="reports" leftSection={<IconFlag size={iconSize.inline} />}>
            Reports ({page.reports.items.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="content">
          <ContentTab
            content={page.content}
            noun={noun}
            updating={page.actions.mutating}
            onOpenProfile={page.profile.open}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        </Tabs.Panel>

        <Tabs.Panel value="reports">
          <ReportsTab
            reports={page.reports}
            noun={noun}
            updating={page.actions.mutating}
            contentFor={page.contentFor}
            onOpenProfile={page.profile.open}
            onStatusChange={page.actions.changeReportStatus}
            onEditContent={setEditing}
            onDeleteContent={setDeleting}
            onWithdraw={setWithdrawing}
          />
        </Tabs.Panel>
      </Tabs>

      <ContentEditModal
        item={editing}
        onClose={() => setEditing(null)}
        onSubmit={page.actions.editContent}
      />

      {deleting && (
        <ConfirmModal
          opened
          title={`Delete ${deleting.kind}`}
          description={
            deleting.kind === 'comment'
              ? 'Delete this comment and every answer under it? This cannot be undone. Use "Hidden" instead to take it out of the app while keeping it.'
              : 'Delete this answer? This cannot be undone. Use "Hidden" instead to take it out of the app while keeping it.'
          }
          confirmLabel="Delete permanently"
          confirmColor="red"
          onConfirm={() => page.actions.deleteContent(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}

      {withdrawing && (
        <ConfirmModal
          opened
          title="Withdraw report"
          description={`Withdraw this report? The ${withdrawing.kind} itself is left exactly as it is.`}
          confirmLabel="Withdraw report"
          confirmColor="red"
          onConfirm={() => page.actions.withdrawReport(withdrawing)}
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
