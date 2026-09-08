import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { ContentUpdate } from './contentTypes'
import type { ManagedAnswer } from './answerTypes'

interface ManagedAnswersResponse extends BasicResponse {
  answers: ManagedAnswer[]
}

export class AnswerContentService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getAll(): Promise<ManagedAnswer[]> {
    const response = await this.client.get<ManagedAnswersResponse>('/answers')
    return expectArray<ManagedAnswer>(response, 'answers', 'GET /answers')
  }

  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/answers/${id}`, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/answers/${id}`)
  }
}
