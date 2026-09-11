import { api } from './api'

export interface ScrapedTool {
  name: string
  slug: string
  url: string
  description: string
  category: string
  pricing: string
  image_url: string | null
}

export interface ScrapeResponse {
  items: ScrapedTool[]
  total: number
}

export interface ImportResponse {
  imported: string[]
  skipped: string[]
  total_imported: number
}

export const scraperService = {
  async getTools(limit = 20): Promise<ScrapeResponse> {
    const { data } = await api.get<ScrapeResponse>('/scrape/futuretools', { params: { limit } })
    return data
  },

  async getAixploriaTools(limit = 20): Promise<ScrapeResponse> {
    const { data } = await api.get<ScrapeResponse>('/scrape/aixploria', { params: { limit } })
    return data
  },

  async getW3SchoolsLanguages(limit = 20): Promise<ScrapeResponse> {
    const { data } = await api.get<ScrapeResponse>('/scrape/w3schools/languages', { params: { limit } })
    return data
  },

  async getDailyLearningPlan(): Promise<any> {
    const { data } = await api.get('/scrape/learning/daily')
    return data
  },

  async getNewTools(limit = 20): Promise<ScrapeResponse> {
    const { data } = await api.get<ScrapeResponse>('/scrape/futuretools/new', { params: { limit } })
    return data
  },

  async importTools(limit = 20): Promise<ImportResponse> {
    const { data } = await api.post<ImportResponse>('/scrape/futuretools/import', null, { params: { limit } })
    return data
  },
}
