/**
 * Query keys for a moderation screen, scoped by the resource it moderates.
 *
 * The screen is generic — comments and answers both render through it — so the noun is part
 * of the key. Without it the two would share a cache entry and show each other's rows.
 */
export const moderationKeys = {
  all: (resource: string) => ['moderation', resource] as const,
  content: (resource: string) => [...moderationKeys.all(resource), 'content'] as const,
  reports: (resource: string) => [...moderationKeys.all(resource), 'reports'] as const,
}
