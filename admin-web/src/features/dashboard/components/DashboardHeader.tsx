import PageHeader from '@/components/PageHeader'
import { useAuth } from '@/context/useAuth'

/** The name the account signed in with, falling back to the address when it carries no name. */
function greetingName(name: string | undefined, email: string | undefined) {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  return email?.split('@')[0] ?? 'there'
}

/**
 * `F-064` and `F-071`: this screen drew its own title and so had neither an `h1` nor the accent
 * bar the other seven routes carry. A cross-route sweep put every other title at x=288, y=32
 * and found nothing here, which made the panel's landing screen the one screen whose title did
 * not read as a title, and the one a screen reader had no top-level heading to navigate by.
 *
 * The greeting is now the header's title rather than a separate block, so the shape is
 * structural instead of per-screen. The type is one step smaller than it was - `PageHeader`
 * sets 28px against the 32px this used - which is the point: the size was per-screen too.
 */
export default function DashboardHeader() {
  const { user } = useAuth()

  return (
    <PageHeader
      title={`Welcome back, ${greetingName(user?.name, user?.email)}`}
      description="A quick look at how your community's doing today."
    />
  )
}
