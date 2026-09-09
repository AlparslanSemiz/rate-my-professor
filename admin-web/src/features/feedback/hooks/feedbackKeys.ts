/**
 * Query keys for the bug report screen.
 *
 * `gitlab` is separate from the queue because it is a different question with a different
 * lifetime: whether the backend holds GitLab credentials does not change when a report does.
 */
export const feedbackKeys = {
  all: ['feedback'] as const,
  reports: () => [...feedbackKeys.all, 'reports'] as const,
  gitlab: () => [...feedbackKeys.all, 'gitlab-enabled'] as const,
}
