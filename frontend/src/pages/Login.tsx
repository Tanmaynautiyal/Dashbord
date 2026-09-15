import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sparkles,
  KeyRound,
  CheckCircle2,
  X,
  ArrowRight,
  Send,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui'
import { useAuth } from '../ui/AuthContext'
import { authService } from '../services/authService'

function getMailboxInfo(email: string): { label: string; url: string } {
  const domain = email.split('@')[1]?.toLowerCase() || ''
  const username = email.split('@')[0] || ''
  if (domain === 'gmail.com') return { label: 'Open Gmail', url: 'https://mail.google.com' }
  if (domain === 'yopmail.com') return { label: 'Open Yopmail', url: `https://yopmail.com/?login=${encodeURIComponent(username)}` }
  if (domain === 'yahoo.com' || domain === 'ymail.com') return { label: 'Open Yahoo Mail', url: 'https://mail.yahoo.com' }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') return { label: 'Open Outlook', url: 'https://outlook.live.com' }
  return { label: 'Open Mailbox', url: `mailto:${email}` }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotInfo, setForgotInfo] = useState('')

  const { login, isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    try {
      const loggedInUser = await login(email, password)
      const nextPath = loggedInUser?.role?.toLowerCase() === 'admin' ? '/admin' : '/dashboard'
      navigate(nextPath)
    } catch (err: any) {
      if (err?.response?.status === 503 || err?.response?.status === 502) {
        setError('Cloud backend is waking up or suspended. Please check your Render dashboard.')
      } else if (!err?.response && (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK')) {
        setError('Cannot connect to server. Please check your internet connection or backend server status.')
      } else {
        setError(err?.response?.data?.detail || 'Invalid email or password.')
      }
    }
  }

  // Open Forgot Password Modal
  const openForgotModal = () => {
    setForgotEmail(email || '')
    setForgotStep('request')
    setForgotOtp('')
    setForgotNewPassword('')
    setForgotError('')
    setForgotInfo('')
    setForgotModalOpen(true)
  }

  // Step 1: Request Password Reset OTP
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotInfo('')

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await authService.forgotPassword(forgotEmail.trim())
      setForgotInfo(res.message || `A verification code has been sent directly to ${forgotEmail}. Please check your inbox.`)
      setForgotStep('reset')
      if (res.dev_otp) {
        setForgotOtp(res.dev_otp)
      }
    } catch (err: any) {
      setForgotError(err?.response?.data?.detail || 'Failed to send reset code. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  // Step 2: Submit Reset OTP and New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')

    if (!forgotOtp.trim()) {
      setForgotError('Please enter the OTP code.')
      return
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await authService.resetPassword(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword)
      setForgotModalOpen(false)
      setSuccessMessage(res.message || 'Password reset successfully! Please sign in with your new password.')
      setEmail(forgotEmail)
      setPassword('')
    } catch (err: any) {
      setForgotError(err?.response?.data?.detail || 'Failed to reset password. Please check your OTP.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border border-purple-500/25 shadow-2xl rounded-3xl p-2 sm:p-4">
          <CardHeader className="space-y-2 text-center pb-4 pt-6">
            <div className="flex justify-center mb-3">
              <motion.div
                whileHover={{ scale: 1.06, rotate: 4 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-13 h-13 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/30"
              >
                <Sparkles className="w-7 h-7" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Sign in to your DevProductivity workspace
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-0">
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMessage}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground" htmlFor="email">
                  Email address
                </label>
                <Input
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl bg-card border-border/70 focus:border-purple-500 focus-visible:ring-purple-500/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 rounded-xl bg-card border-border/70 focus:border-purple-500 focus-visible:ring-purple-500/20 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold shadow-lg shadow-purple-500/25 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border/50 px-6 py-5 mt-6">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
                Create one free
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Forgot Password OTP Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
            >
              <Card className="glass-card border border-purple-500/30 shadow-2xl rounded-3xl relative">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <CardHeader className="space-y-1 text-center pt-6 pb-2">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <KeyRound className="w-6 h-6" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-black">
                    {forgotStep === 'request' ? 'Reset Your Password' : 'Enter Reset Code'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {forgotStep === 'request'
                      ? "We'll send an OTP verification code to your email"
                      : `Enter the 6-digit code sent to ${forgotEmail}`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 py-4">
                  {forgotError && (
                    <div className="mb-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotStep === 'request' ? (
                    <form onSubmit={handleRequestResetOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Registered Email</label>
                        <Input
                          placeholder="name@company.com"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          className="h-11 rounded-xl bg-card border-border/70"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl"
                        disabled={forgotLoading}
                      >
                        {forgotLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending code to your mail...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>Send Password Reset OTP</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      {/* Only show Mail sent notice */}
                      <div className="py-2.5 px-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center text-xs font-semibold text-foreground">
                        Mail sent on this mail: <span className="font-bold text-purple-600 dark:text-purple-400">{forgotEmail}</span>
                      </div>

                      <div className="space-y-1.5 text-center">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground">6-Digit Verification Code</label>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-purple-400" />
                            Expires in 10 mins
                          </span>
                        </div>
                        <Input
                          placeholder="• • • • • •"
                          type="text"
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                          required
                          autoFocus
                          className="h-13 rounded-xl bg-card border-purple-500/40 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 text-center text-2xl font-mono font-bold tracking-[8px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">New Password</label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            required
                            placeholder="At least 6 characters"
                            className="h-11 rounded-xl bg-card border-border/70 pr-11 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 to-indigo-600"
                        disabled={forgotLoading || forgotOtp.length < 4 || forgotNewPassword.length < 6}
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Resetting Password...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Set New Password
                          </>
                        )}
                      </Button>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => setForgotStep('request')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Change Email
                        </button>
                        <button
                          type="button"
                          onClick={handleRequestResetOtp}
                          disabled={forgotLoading}
                          className="text-purple-400 font-semibold hover:underline"
                        >
                          Resend Code
                        </button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
