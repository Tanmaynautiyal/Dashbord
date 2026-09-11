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
}

export interface LearningTopic {
  id: string
  title: string
  description: string
  difficulty_level: string
}

export interface DashboardData {
  user: {
    id: string
    name: string
    email: string
    role: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  stats: {
    total_tools: number
    featured_tools: number
    total_topics: number
    user_activity_week: number
    user_activity_month: number
    learning_streak?: number
  }
  featured_tools: AITool[]
  latest_topics: LearningTopic[]
  today_content: {
    id: string
    topic_id?: string
    topic_title?: string
    difficulty_level?: string
    content_text: string
    publish_date: string
    date_formatted?: string
  } | null
  recent_activity: Array<{
    id: string
    action: string
    resource_type: string | null
    resource_id: string | null
    created_at: string
  }>
  ai_insight: string
  active_users: number
}

export const dashboardService = {
  async getMyDashboard(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>('/dashboard/me')
    return data
  },

  async shuffleTopics(offset: number = 1): Promise<LearningTopic[]> {
    const { data } = await api.get<LearningTopic[]>('/dashboard/topics/shuffle', {
      params: { offset },
    })
    return data
  },

  async getAllTopics(search?: string, difficulty?: string): Promise<LearningTopic[]> {
    const { data } = await api.get<LearningTopic[]>('/dashboard/topics', {
      params: { search, difficulty },
    })
    return data
  },

  async recordActivity(payload: {
    action: string
    resource_type?: string
    resource_id?: string
  }): Promise<void> {
    try {
      await api.post('/dashboard/activity', payload)
    } catch (e) {
      // Non-blocking activity recording
      console.warn('Could not record activity:', e)
    }
  },
}
