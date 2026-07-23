import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import {
  IconArrowRight,
  IconFileSearch,
  IconFilter,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react'
import {
  auditLogsService,
  type AuditAction,
  type AuditLog,
  type AuditLogFilters,
  type AuditMeta,
  type AuditTargetType,
  type AuditValue,
} from '../api/AuditLogsService'
import { ApiError } from '../api/ApiClient'
import ErrorAlert from '../components/ErrorAlert'
import LoadError from '../components/LoadError'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import Panel from '../components/Panel'
import TableHeaderRow from '../components/TableHeaderRow'
import { darkInputStyles } from '../constants/inputStyles'
import { darkModalStyles } from '../constants/modalStyles'
import { enumLabel } from '../utils/enumLabel'
import { formatDate } from '../utils/formatDate'
import { getErrorMessage } from '../utils/getErrorMessage'
import { activateOnEnterOrSpace } from '../utils/keyboard'

const TABLE_COLUMNS = ['Time', 'Admin', 'Action', 'Target', 'Changed fields'] as const
const EMPTY_META: AuditMeta = { actors: [], actions: [], targetTypes: [] }
const AUDIT_API_UNAVAILABLE_MESSAGE =
  'The configured backend does not support audit logs yet. Deploy the audit API endpoints, then try again.'

interface FilterDraft {
  q: string
  actorId: string | null
  action: AuditAction | null
  targetType: AuditTargetType | null
  from: string
  to: string
}

const EMPTY_FILTERS: FilterDraft = {
  q: '',
  actorId: null,
  action: null,
  targetType: null,
  from: '',
  to: '',
}

const panelOverflowStyle: CSSProperties = {
  overflow: 'hidden',
}

const filtersStyle: CSSProperties = {
  padding: '16px 20px',
}

const filterFieldStyle: CSSProperties = {
  flex: '1 1 180px',
}

const searchFieldStyle: CSSProperties = {
  flex: '2 1 280px',
}

const dateFieldStyle: CSSProperties = {
  flex: '1 1 150px',
}

const tableScrollStyle: CSSProperties = {
  overflowX: 'auto',
}

const tableStyle: CSSProperties = {
  width: '100%',
  minWidth: 900,
  borderCollapse: 'collapse',
}

const cellStyle: CSSProperties = {
  padding: '14px 20px',
  verticalAlign: 'middle',
}

const nowrapCellStyle: CSSProperties = {
  ...cellStyle,
  whiteSpace: 'nowrap',
}

const emptyStyle: CSSProperties = {
  padding: '56px 20px',
  textAlign: 'center',
}

const loadMoreStyle: CSSProperties = {
  borderTop: '1px solid #21262d',
  padding: 16,
  textAlign: 'center',
}

const detailCardStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: '#0f1117',
  border: '1px solid #21262d',
}

const valueStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '9px 10px',
  borderRadius: 8,
  background: '#0b0d12',
  border: '1px solid #1c2128',
  wordBreak: 'break-word',
}

function isAuditAction(value: string | null, meta: AuditMeta): value is AuditAction {
  return value !== null && meta.actions.some((action) => action === value)
}

function isAuditTargetType(value: string | null, meta: AuditMeta): value is AuditTargetType {
  return value !== null && meta.targetTypes.some((targetType) => targetType === value)
}

function toFilters(draft: FilterDraft): AuditLogFilters {
  return {
    q: draft.q,
    actorId: draft.actorId ?? undefined,
    action: draft.action ?? undefined,
    targetType: draft.targetType ?? undefined,
    from: draft.from || undefined,
    to: draft.to || undefined,
  }
}

function formatValue(value: AuditValue): string {
  if (value === null) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function getAuditErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 404) return AUDIT_API_UNAVAILABLE_MESSAGE
  return getErrorMessage(error, fallback)
}

function actionColor(action: AuditAction) {
  if (action === 'ADMIN_LOGIN') return 'green'
  if (action === 'ADMIN_LOGOUT') return 'gray'
  if (action === 'USER_DELETED') return 'red'
  if (action === 'USER_BLOCKED' || action === 'USER_WARNING_CREATED') return 'orange'
  return 'blue'
}

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
    cursor: 'pointer',
    transition: 'background 0.1s',
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [meta, setMeta] = useState<AuditMeta>(EMPTY_META)
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_FILTERS)
  const [activeFilters, setActiveFilters] = useState<AuditLogFilters>({})
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [tableError, setTableError] = useState('')

  async function initialize() {
    setLoading(true)
    setError('')
    try {
      const [nextMeta, page] = await Promise.all([
        auditLogsService.getMeta(),
        auditLogsService.getLogs(),
      ])
      setMeta(nextMeta)
      setLogs(page.auditLogs)
      setNextCursor(page.nextCursor)
      setActiveFilters({})
    } catch (loadError: unknown) {
      setError(getAuditErrorMessage(loadError, 'Failed to load audit logs'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([
      auditLogsService.getMeta(),
      auditLogsService.getLogs(),
    ])
      .then(([nextMeta, page]) => {
        if (cancelled) return
        setMeta(nextMeta)
        setLogs(page.auditLogs)
        setNextCursor(page.nextCursor)
        setActiveFilters({})
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getAuditErrorMessage(loadError, 'Failed to load audit logs'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function applyFilters(nextDraft: FilterDraft) {
    if (nextDraft.from && nextDraft.to && nextDraft.from > nextDraft.to) {
      setTableError('The start date must be before or equal to the end date.')
      return
    }

    const filters = toFilters(nextDraft)
    setLoading(true)
    setTableError('')
    try {
      const page = await auditLogsService.getLogs(filters)
      setLogs(page.auditLogs)
      setNextCursor(page.nextCursor)
      setActiveFilters(filters)
    } catch (loadError: unknown) {
      setTableError(getAuditErrorMessage(loadError, 'Failed to apply audit log filters'))
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void applyFilters(draft)
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS)
    void applyFilters(EMPTY_FILTERS)
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return

    setLoadingMore(true)
    setTableError('')
    try {
      const page = await auditLogsService.getLogs(activeFilters, nextCursor)
      setLogs((current) => [...current, ...page.auditLogs])
      setNextCursor(page.nextCursor)
    } catch (loadError: unknown) {
      setTableError(getAuditErrorMessage(loadError, 'Failed to load more audit logs'))
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading && logs.length === 0 && !tableError) return <PageLoader />
  if (error) {
    return (
      <>
        <AuditPageHeader />
        <LoadError message={error} onRetry={() => void initialize()} />
      </>
    )
  }

  const actorOptions = meta.actors.map((actor) => ({
    value: actor.id,
    label: `${actor.name} · ${actor.email}`,
  }))
  const actionOptions = meta.actions.map((action) => ({ value: action, label: enumLabel(action) }))
  const targetTypeOptions = meta.targetTypes.map((type) => ({ value: type, label: enumLabel(type) }))

  return (
    <>
      <AuditPageHeader />

      <form onSubmit={handleSubmit}>
        <Panel mb={16} style={filtersStyle}>
          <Group gap={12} align="flex-end" wrap="wrap">
            <TextInput
              label="Search"
              placeholder="Admin, email, or target..."
              value={draft.q}
              onChange={(event) => {
                const q = event.currentTarget.value
                setDraft((current) => ({ ...current, q }))
              }}
              leftSection={<IconSearch size={14} color="#6b7280" />}
              style={searchFieldStyle}
              styles={darkInputStyles}
            />
            <Select
              label="Admin"
              placeholder="All admins"
              data={actorOptions}
              value={draft.actorId}
              onChange={(actorId) => setDraft((current) => ({ ...current, actorId }))}
              searchable
              clearable
              style={filterFieldStyle}
              styles={darkInputStyles}
            />
            <Select
              label="Action"
              placeholder="All actions"
              data={actionOptions}
              value={draft.action}
              onChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  action: isAuditAction(value, meta) ? value : null,
                }))
              }}
              clearable
              style={filterFieldStyle}
              styles={darkInputStyles}
            />
            <Select
              label="Target"
              placeholder="All targets"
              data={targetTypeOptions}
              value={draft.targetType}
              onChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  targetType: isAuditTargetType(value, meta) ? value : null,
                }))
              }}
              clearable
              style={filterFieldStyle}
              styles={darkInputStyles}
            />
            <TextInput
              label="From"
              type="date"
              aria-label="Audit start date"
              value={draft.from}
              onChange={(event) => {
                const from = event.currentTarget.value
                setDraft((current) => ({ ...current, from }))
              }}
              style={dateFieldStyle}
              styles={darkInputStyles}
            />
            <TextInput
              label="To"
              type="date"
              aria-label="Audit end date"
              value={draft.to}
              onChange={(event) => {
                const to = event.currentTarget.value
                setDraft((current) => ({ ...current, to }))
              }}
              style={dateFieldStyle}
              styles={darkInputStyles}
            />
            <Button type="submit" leftSection={<IconFilter size={15} />} loading={loading}>
              Apply filters
            </Button>
            <Button
              type="button"
              variant="subtle"
              color="gray"
              leftSection={<IconRefresh size={15} />}
              onClick={clearFilters}
              disabled={loading}
            >
              Clear
            </Button>
          </Group>
        </Panel>
      </form>

      <ErrorAlert message={tableError} />

      <Panel style={panelOverflowStyle} aria-busy={loading}>
        <Box px={20} py={14} style={{ borderBottom: '1px solid #21262d' }}>
          <Group gap={7}>
            <IconFileSearch size={15} color="#6b7280" />
            <Text size="xs" c="#6b7280">
              {logs.length} audit event{logs.length === 1 ? '' : 's'} loaded · newest first
            </Text>
          </Group>
        </Box>

        {logs.length === 0 ? (
          <Box style={emptyStyle}>
            <IconFileSearch size={34} color="#374151" />
            <Text c="#6b7280" size="sm" mt={10}>
              No audit events match these filters.
            </Text>
          </Box>
        ) : (
          <div style={tableScrollStyle}>
            <table style={tableStyle}>
              <TableHeaderRow columns={TABLE_COLUMNS} />
              <tbody>
                {logs.map((log, index) => (
                  <AuditLogRow
                    key={log.id}
                    log={log}
                    isLast={index === logs.length - 1 && !nextCursor}
                    onOpen={setSelected}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {nextCursor && (
          <Box style={loadMoreStyle}>
            <Button variant="light" loading={loadingMore} onClick={() => void loadMore()}>
              Load more
            </Button>
          </Box>
        )}
      </Panel>

      <AuditLogDetails log={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function AuditPageHeader() {
  return (
    <PageHeader
      title="Audit Logs"
      description="A trace of successful admin actions, showing who changed what and when."
    />
  )
}

function AuditLogRow({
  log,
  isLast,
  onOpen,
}: {
  log: AuditLog
  isLast: boolean
  onOpen: (log: AuditLog) => void
}) {
  const openDetails = () => onOpen(log)
  const changedFields = Object.keys(log.changes)

  return (
    <tr
      style={rowStyle(isLast)}
      onClick={openDetails}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openDetails)}
      onMouseEnter={(event) => { event.currentTarget.style.background = '#1c2128' }}
      onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent' }}
      tabIndex={0}
      aria-label={`Open audit event ${enumLabel(log.action)} by ${log.actor.name}`}
    >
      <td style={nowrapCellStyle}>
        <Text size="xs" c="#6b7280">
          {formatDate(log.createdAt, { withTime: true })}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="sm" fw={600} c="#e2e8f0">
          {log.actor.name}
        </Text>
        <Text size="xs" c="#4b5563">
          {log.actor.email}
        </Text>
      </td>
      <td style={nowrapCellStyle}>
        <Badge variant="light" color={actionColor(log.action)} size="sm">
          {enumLabel(log.action)}
        </Badge>
      </td>
      <td style={cellStyle}>
        {log.target ? (
          <>
            <Text size="sm" c="#cbd5e1" lineClamp={1}>
              {log.target.label}
            </Text>
            <Text size="xs" c="#4b5563">
              {enumLabel(log.target.type)}
            </Text>
          </>
        ) : (
          <Text size="xs" c="#4b5563">—</Text>
        )}
      </td>
      <td style={cellStyle}>
        <Text size="xs" c={changedFields.length > 0 ? '#9ca3af' : '#4b5563'}>
          {changedFields.length > 0 ? changedFields.map(enumLabel).join(', ') : 'No field changes'}
        </Text>
      </td>
    </tr>
  )
}

function AuditLogDetails({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  return (
    <Modal
      opened={log !== null}
      onClose={onClose}
      title="Audit Event Details"
      centered
      size="lg"
      styles={darkModalStyles}
    >
      {log && (
        <Stack gap={16}>
          <Box style={detailCardStyle}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Badge variant="light" color={actionColor(log.action)} mb={8}>
                  {enumLabel(log.action)}
                </Badge>
                <Text fw={600} c="#e2e8f0">
                  {log.actor.name}
                </Text>
                <Text size="xs" c="#6b7280">
                  {log.actor.email} · {enumLabel(log.actor.role)}
                </Text>
              </div>
              <Text size="xs" c="#6b7280">
                {formatDate(log.createdAt, { withTime: true })}
              </Text>
            </Group>
          </Box>

          <DetailSection label="Target">
            <Text size="sm" c="#d1d5db">
              {log.target?.label ?? 'No target'}
            </Text>
            {log.target && (
              <Text size="xs" c="#4b5563" mt={3}>
                {enumLabel(log.target.type)} · {log.target.id}
              </Text>
            )}
          </DetailSection>

          <div>
            <Text size="xs" fw={600} c="#6b7280" tt="uppercase" mb={8}>
              Changes
            </Text>
            {Object.entries(log.changes).length === 0 ? (
              <Text size="sm" c="#4b5563">No field changes recorded.</Text>
            ) : (
              <Stack gap={8}>
                {Object.entries(log.changes).map(([field, change]) => (
                  <Box key={field} style={detailCardStyle}>
                    <Text size="xs" fw={600} c="#9ca3af" mb={8}>
                      {enumLabel(field)}
                    </Text>
                    <Group gap={8} wrap="nowrap" align="stretch">
                      <Box style={valueStyle}>
                        <Text size="xs" c="#4b5563">Before</Text>
                        <Text size="sm" c="#fca5a5">{formatValue(change.before)}</Text>
                      </Box>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <IconArrowRight size={15} color="#4b5563" />
                      </Box>
                      <Box style={valueStyle}>
                        <Text size="xs" c="#4b5563">After</Text>
                        <Text size="sm" c="#86efac">{formatValue(change.after)}</Text>
                      </Box>
                    </Group>
                  </Box>
                ))}
              </Stack>
            )}
          </div>

          {Object.keys(log.metadata).length > 0 && (
            <DetailSection label="Additional context">
              <Stack gap={6}>
                {Object.entries(log.metadata).map(([key, value]) => (
                  <Group key={key} justify="space-between" align="flex-start" wrap="nowrap">
                    <Text size="xs" c="#6b7280">{enumLabel(key)}</Text>
                    <Text size="sm" c="#d1d5db" ta="right">{formatValue(value)}</Text>
                  </Group>
                ))}
              </Stack>
            </DetailSection>
          )}
        </Stack>
      )}
    </Modal>
  )
}

function DetailSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box style={detailCardStyle}>
      <Text size="xs" fw={600} c="#6b7280" tt="uppercase" mb={6}>
        {label}
      </Text>
      {children}
    </Box>
  )
}
