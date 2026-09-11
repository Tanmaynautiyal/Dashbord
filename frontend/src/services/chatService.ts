import { api } from './api';

export interface ChatMessage {
  id: string;
  user_id: string;
  sender: 'user' | 'bot';
  content: string;
  created_at: string;
}

export const chatService = {
  getHistory: async (): Promise<ChatMessage[]> => {
    const response = await api.get('/chat/history');
    return response.data;
  },

  sendMessage: async (content: string): Promise<ChatMessage[]> => {
    const response = await api.post('/chat/send', { content });
    return response.data;
  },
};
