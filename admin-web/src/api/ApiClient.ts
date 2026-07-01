export class ApiClient {
  private readonly baseUrl: string | null

  constructor(baseUrl: string | null) {
    this.baseUrl = baseUrl
  }

  get isConfigured(): boolean {
    return this.baseUrl !== null
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' })
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Request to ${path} failed with status ${response.status}`)
    }

    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || null)

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
