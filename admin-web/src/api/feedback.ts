export interface Feedback {
  id: number
  userName: string
  userEmail: string
  message: string
  rating: 1 | 2 | 3 | 4 | 5
  submittedAt: string
}

const MOCK_FEEDBACK: Feedback[] = [
  { id: 1, userName: 'Carol White',  userEmail: 'carol@example.com',  message: 'Great app, very intuitive!',                      rating: 5, submittedAt: '2025-05-01' },
  { id: 2, userName: 'David Brown',  userEmail: 'david@example.com',  message: 'The notifications are a bit slow sometimes.',      rating: 3, submittedAt: '2025-05-03' },
  { id: 3, userName: 'Emma Davis',   userEmail: 'emma@example.com',   message: 'Wish there was a dark mode.',                     rating: 4, submittedAt: '2025-05-07' },
  { id: 4, userName: 'Frank Miller', userEmail: 'frank@example.com',  message: 'Crashes on Android 12 when uploading a photo.',   rating: 2, submittedAt: '2025-05-10' },
  { id: 5, userName: 'Carol White',  userEmail: 'carol@example.com',  message: 'The new update fixed everything, love it now!',   rating: 5, submittedAt: '2025-05-15' },
]

export async function getFeedback(): Promise<Feedback[]> {
  await new Promise((r) => setTimeout(r, 400))
  return MOCK_FEEDBACK
}
