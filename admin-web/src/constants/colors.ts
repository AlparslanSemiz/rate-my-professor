export const roleColor: Record<string, string> = {
  Admin: 'blue',
  Professor: 'violet',
  Student: 'gray',
}

export const roleAccent: Record<string, string> = {
  Admin: '#3b82f6',
  Professor: '#8b5cf6',
  Student: '#6b7280',
}

export const userStatusColor: Record<string, string> = {
  Active: 'green',
  Inactive: 'gray',
  Blocked: 'red',
}

export const severityColor: Record<string, string> = {
  Low: 'gray',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
}

export const severityAccent: Record<string, string> = {
  Low: '#6b7280',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
}

export const reportStatusColor: Record<string, string> = {
  Open: 'red',
  'In Progress': 'blue',
  Resolved: 'green',
}

export const commentStatusColor: Record<string, string> = {
  Pending: 'orange',
  Reviewed: 'blue',
  Dismissed: 'gray',
  Removed: 'red',
}

export const reportReasonColor: Record<string, string> = {
  Spam: 'yellow',
  Harassment: 'red',
  'Hate Speech': 'red',
  Misinformation: 'orange',
  Inappropriate: 'grape',
  Other: 'gray',
}
