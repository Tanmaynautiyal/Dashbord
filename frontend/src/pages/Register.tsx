import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Sparkles,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Send,
  ExternalLink,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui'
import { useAuth } from '../ui/AuthContext'
import { authService } from '../services/authService'

function getMailboxInfo(email: string): { label: string; url: string } {
  const domain = email.split('@')[1]?.toLowerCase() || ''
  const username = email.split('@')[0] || ''
  if (domain === 'gmail.com') {
    return { label: 'Open Gmail', url: 'https://mail.google.com' }
  }
  if (domain === 'yopmail.com') {
    return { label: 'Open Yopmail', url: `https://yopmail.com/?login=${encodeURIComponent(username)}` }
  }
  if (domain === 'yahoo.com' || domain === 'ymail.com') {
    return { label: 'Open Yahoo Mail', url: 'https://mail.yahoo.com' }
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') {
    return { label: 'Open Outlook', url: 'https://outlook.live.com' }
  }
  if (domain === 'proton.me' || domain === 'protonmail.com') {
    return { label: 'Open ProtonMail', url: 'https://mail.proton.me' }
  }
  return { label: 'Open Mailbox', url: `mailto:${email}` }
}

export default function Register() {
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const { isAuthenticated, setSession } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Step 1: Submit details and request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      await authService.requestRegisterOtp(name.trim(), email.trim(), password)
      setStep('otp')
      setResendCooldown(45)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send verification code. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and sign in
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!otp.trim()) {
      setError('Please enter the verification code.')
      return
    }

    setLoading(true)
    try {
      const res = await authService.verifyRegisterOtp(email.trim(), otp.trim())
      setSession(res.access_token, res.user)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return
    setError('')
    setResending(true)
    try {
      await authService.requestRegisterOtp(name.trim(), email.trim(), password)
      setResendCooldown(45)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not resend OTP code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const mailbox = getMailboxInfo(email)

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
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
        <Card className="glass-card border border-purple-500/25 shadow-2xl rounded-3xl p-2 sm:p-4 backdrop-blur-xl">
          <CardHeader className="space-y-2 text-center pb-3 pt-6">
            <div className="flex justify-center mb-2">
              <motion.div
                whileHover={{ scale: 1.06, rotate: -4 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-13 h-13 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/30"
              >
                {step === 'details' ? <Sparkles className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
              </motion.div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight">
              {step === 'details' ? 'Create Account' : 'Verify Your Email'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {step === 'details'
                ? 'Register with verified email security to start learning'
                : 'Enter the 6-digit verification code sent to your email'}
            </CardDescription>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div
                className={`h-1.5 w-12 rounded-full transition-all duration-300 ${
                  step === 'details' ? 'bg-purple-600' : 'bg-purple-600/40'
                }`}
              />
              <div
                className={`h-1.5 w-12 rounded-full transition-all duration-300 ${
                  step === 'otp' ? 'bg-purple-600' : 'bg-muted'
                }`}
              />
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-2">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {step === 'details' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="Alex Rivera"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      className="h-11 rounded-xl bg-card border-border/70 focus:border-purple-500 focus-visible:ring-purple-500/20 pr-11 text-sm"
                    />
                    <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      placeholder="alex@company.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11 rounded-xl bg-card border-border/70 focus:border-purple-500 focus-visible:ring-purple-500/20 pr-11 text-sm"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
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
                  <p className="text-[11px] text-muted-foreground">Minimum 6 characters</p>
                </div>

                {/* Animated Sending Button */}
                <Button
                  type="submit"
                  className="w-full h-12 font-bold shadow-lg shadow-purple-500/25 mt-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right transition-all duration-300 rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2.5">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <Loader2 className="h-4 w-4" />
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        Sending code to your mail...
                      </motion.span>
                    </div>
                  ) : (
                    <>
                      <span>Get Verification Code</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* Only show Mail sent notice */}
                <div className="py-2.5 px-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center text-xs font-semibold text-foreground">
                  Mail sent on this mail: <span className="font-bold text-purple-600 dark:text-purple-400">{email}</span>
                </div>

                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground" htmlFor="otp-input">
                      6-Digit Security Code
                    </label>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      Expires in 10 mins
                    </span>
                  </div>

                  <div className="relative">
                    <Input
                      id="otp-input"
                      placeholder="• • • • • •"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                      className="h-14 rounded-2xl bg-card/90 border-purple-500/40 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 text-center text-3xl font-mono font-black tracking-[10px] shadow-inner"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl"
                  disabled={loading || otp.length < 4}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying code...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>Verify &amp; Enter Dashboard</span>
                    </div>
                  )}
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('details')
                      setError('')
                    }}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Change Details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resending}
                    className="flex items-center text-purple-600 dark:text-purple-400 font-bold disabled:opacity-50 hover:underline cursor-pointer"
                  >
                    {resending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    )}
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="justify-center border-t border-border/50 px-6 py-4 mt-5">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
