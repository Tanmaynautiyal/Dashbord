import { api } from './api'

export interface User {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

export interface LoginResponse {
  message: string
  access_token: string
  user: User
}

export interface RegisterOtpResponse {
  message: string
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  email: string
}

export interface SMTPConfigInfo {
  is_configured: boolean
  mail_server: string
  mail_port: number
  mail_username: string
  mail_from: string
  mail_from_name: string
  mail_starttls: boolean
  mail_ssl_tls: boolean
}

export interface SMTPConfigUpdate {
  mail_server: string
  mail_port: number
  mail_username: string
  mail_password?: string
  mail_from: string
  mail_from_name: string
  mail_starttls: boolean
  mail_ssl_tls: boolean
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    return data
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const { data } = await api.post<User>('/auth/register', { name, email, password })
    return data
  },

  async requestRegisterOtp(name: string, email: string, password: string): Promise<RegisterOtpResponse> {
    const { data } = await api.post<RegisterOtpResponse>('/auth/register-otp', { name, email, password })
    return data
  },

  async verifyRegisterOtp(email: string, otp: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/verify-registration-otp', { email, otp })
    return data
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email })
    return data
  },

  async resetPassword(email: string, otp: string, new_password: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', {
      email,
      otp,
      new_password,
    })
    return data
  },

  async changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/change-password', {
      current_password,
      new_password,
    })
    return data
  },

  async getSmtpStatus(): Promise<{ configured: boolean; mode: string }> {
    const { data } = await api.get<{ configured: boolean; mode: string }>('/auth/smtp-status')
    return data
  },

  async getSmtpSettings(): Promise<SMTPConfigInfo> {
    const { data } = await api.get<SMTPConfigInfo>('/settings/smtp')
    return data
  },

  async updateSmtpSettings(config: SMTPConfigUpdate): Promise<SMTPConfigInfo> {
    const { data } = await api.put<SMTPConfigInfo>('/settings/smtp', config)
    return data
  },

  async testSmtp(test_email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>('/settings/smtp/test', {
      test_email,
    })
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}
