export const roleColor: Record<string, string> = {
  ADMIN: 'blue',
  STUDENT: 'gray',
}

export const roleAccent: Record<string, string> = {
  ADMIN: '#3b82f6',
  STUDENT: '#6b7280',
}

export const userStatusColor: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  BLOCKED: 'red',
  DELETED: 'dark',
}

export const severityColor: Record<string, string> = {
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
}

export const severityAccent: Record<string, string> = {
  LOW: '#6b7280',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
}

export const reportStatusColor: Record<string, string> = {
  OPEN: 'red',
  REVIEWED: 'blue',
  DISMISSED: 'gray',
  ACTION_TAKEN: 'green',
}

export const reportReasonColor: Record<string, string> = {
  SPAM: 'yellow',
  INSULT: 'orange',
  HARASSMENT: 'red',
  HATE_SPEECH: 'red',
  PERSONAL_INFORMATION: 'grape',
  OFF_TOPIC: 'gray',
  INAPPROPRIATE_CONTENT: 'orange',
  OTHER: 'gray',
}
