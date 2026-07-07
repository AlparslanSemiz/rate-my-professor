export function formatDate(iso: string, options?: { withTime?: boolean }): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(options?.withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}
