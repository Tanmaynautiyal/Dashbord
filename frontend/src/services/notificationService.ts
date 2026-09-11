import { api } from './api';

export interface NotificationItem {
  id: string;
  category: string;
  category_label: string;
  title: string;
  detail: string;
  badge: string;
  badge_color: string;
  timestamp: string;
  unread: boolean;
  action_url?: string;
  action_label?: string;
}

export const notificationService = {
  getNotifications: async (params?: { category?: string; unread_only?: boolean }): Promise<NotificationItem[]> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markAllRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  toggleRead: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/notifications/${id}/toggle-read`);
    return response.data;
  },

  deleteNotification: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
