import { api } from './api';

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
}

export interface Quiz {
  id: string;
  date: string;
  topic_id: string;
  topic_title?: string;
  difficulty_level?: string;
  questions: QuizQuestion[];
  already_completed_perfect: boolean;
}

export interface QuizAnswerSubmit {
  question_id: string;
  selected_index: number;
}

export interface QuizSubmitResponse {
  score: number;
  total: number;
  feedback: string;
}

export interface QuizTopicOption {
  key: string;
  title: string;
  category: string;
  icon: string;
}

export interface QuizDifficultyOption {
  key: string;
  label: string;
  badgeColor: string;
  desc: string;
}

export interface QuizOptionsResponse {
  topics: QuizTopicOption[];
  difficulties: QuizDifficultyOption[];
}

export const quizService = {
  getQuizOptions: async (): Promise<QuizOptionsResponse> => {
    const response = await api.get('/quiz/options');
    return response.data;
  },

  getTodayQuiz: async (params?: {
    topic_key?: string;
    difficulty?: string;
    shuffle_seed?: number;
  }): Promise<Quiz> => {
    const response = await api.get('/quiz/today', { params });
    return response.data;
  },

  submitQuiz: async (answers: QuizAnswerSubmit[]): Promise<QuizSubmitResponse> => {
    const response = await api.post('/quiz/submit', { answers });
    return response.data;
  },
};
