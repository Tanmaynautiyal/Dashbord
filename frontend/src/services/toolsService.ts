import { api } from './api'

export interface AITool {
  id: string
  name: string
  slug: string
  description: string
  official_url: string
  category: string
  pricing_type: string
  logo_url: string | null
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export interface PaginatedTools {
  items: AITool[]
  total: number
  page: number
  page_size: number
}

export interface ToolsQuery {
  page?: number
  page_size?: number
  search?: string
  category?: string
}

export const toolsService = {
  async list(params: ToolsQuery = {}): Promise<PaginatedTools> {
    const { data } = await api.get<PaginatedTools>('/tools', { params })
    return data
  },

  async getBySlug(slug: string): Promise<AITool> {
    const { data } = await api.get<AITool>(`/tools/${slug}`)
    return data
  },

  async create(tool: {
    name: string
    slug: string
    description: string
    official_url: string
    category: string
    pricing_type: string
    logo_url?: string | null
    is_featured?: boolean
    is_active?: boolean
  }): Promise<AITool> {
    const { data } = await api.post<AITool>('/admin/tools', tool)
    return data
  },

  async update(id: string, tool: {
    name: string
    slug: string
    description: string
    official_url: string
    category: string
    pricing_type: string
    logo_url?: string | null
    is_featured?: boolean
    is_active?: boolean
  }): Promise<AITool> {
    const { data } = await api.put<AITool>(`/admin/tools/${id}`, tool)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/admin/tools/${id}`)
  },
}
