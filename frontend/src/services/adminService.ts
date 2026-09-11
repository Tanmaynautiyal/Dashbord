import { api } from './api'

export interface UserDetail {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminUsersResponse {
  users: UserDetail[]
  total: number
}

export interface AdminActivity {
  id: string
  user_id: string | null
  user_name: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  created_at: string
}

export interface AdminActivityResponse {
  activities: AdminActivity[]
  total: number
}

export const adminService = {
  async getStats(): Promise<any> {
    const { data } = await api.get('/admin/stats')
    return data
  },

  async getUsers(): Promise<AdminUsersResponse> {
    const { data } = await api.get<AdminUsersResponse>('/admin/users')
    return data
  },

  async createUser(payload: { name: string; email: string; password: string; role?: string; is_active?: boolean }): Promise<UserDetail> {
    const { data } = await api.post<UserDetail>('/admin/users', payload)
    return data
  },

  async updateUser(id: string, payload: { name?: string; email?: string; role?: string; is_active?: boolean; password?: string }): Promise<UserDetail> {
    const { data } = await api.put<UserDetail>(`/admin/users/${id}`, payload)
    return data
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`)
  },

  async getActivities(limit = 50): Promise<AdminActivityResponse> {
    const { data } = await api.get<AdminActivityResponse>('/admin/activities', { params: { limit } })
    return data
  },

  async updateUserRole(id: string, role: string) {
    const { data } = await api.put(`/admin/users/${id}/role`, { role })
    return data
  },

  async updateUserStatus(id: string, is_active: boolean) {
    const { data } = await api.put(`/admin/users/${id}/status`, { is_active })
    return data
  },

  // Technology
  async getTechnologies() {
    const { data } = await api.get('/admin/technologies')
    return data
  },
  async createTechnology(payload: any) {
    const { data } = await api.post('/admin/technologies', payload)
    return data
  },
  async updateTechnology(id: string, payload: any) {
    const { data } = await api.put(`/admin/technologies/${id}`, payload)
    return data
  },
  async deleteTechnology(id: string) {
    await api.delete(`/admin/technologies/${id}`)
  },

  // Category
  async getCategories() {
    const { data } = await api.get('/admin/categories')
    return data
  },
  async createCategory(payload: any) {
    const { data } = await api.post('/admin/categories', payload)
    return data
  },
  async updateCategory(id: string, payload: any) {
    const { data } = await api.put(`/admin/categories/${id}`, payload)
    return data
  },
  async deleteCategory(id: string) {
    await api.delete(`/admin/categories/${id}`)
  },

  // Learning Topics
  async getLearningTopics() {
    const { data } = await api.get('/admin/learning-topics')
    return data
  },
  async createLearningTopic(payload: any) {
    const { data } = await api.post('/admin/learning-topics', payload)
    return data
  },
  async updateLearningTopic(id: string, payload: any) {
    const { data } = await api.put(`/admin/learning-topics/${id}`, payload)
    return data
  },
  async deleteLearningTopic(id: string) {
    await api.delete(`/admin/learning-topics/${id}`)
  },

  // Daily Learning Content
  async getDailyLearning() {
    const { data } = await api.get('/admin/daily-learning')
    return data
  },
  async createDailyLearning(payload: any) {
    const { data } = await api.post('/admin/daily-learning', payload)
    return data
  },
  async updateDailyLearning(id: string, payload: any) {
    const { data } = await api.put(`/admin/daily-learning/${id}`, payload)
    return data
  },
  async deleteDailyLearning(id: string) {
    await api.delete(`/admin/daily-learning/${id}`)
  },
}
