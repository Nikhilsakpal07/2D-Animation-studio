'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { X, Eye, EyeOff, Sparkles, Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from './AuthProvider'

export type AuthView = 'login' | 'signup' | 'reset'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialView?: AuthView
  bannerText?: string
  onSuccess?: () => void
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export default function AuthModal({
  isOpen,
  onClose,
  initialView = 'login',
  bannerText,
  onSuccess,
}: AuthModalProps) {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth()
  const [view, setView] = useState<AuthView>(initialView)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Feedback states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)

  function triggerCelebration() {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D95D4E', '#F5B941', '#7B6DAF', '#6A9B72'],
      })
    } catch (e) {}
  }

  function resetForm() {
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setResetSuccess(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  function switchView(nextView: AuthView) {
    setError(null)
    setResetSuccess(false)
    setView(nextView)
  }

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      await loginWithGoogle()
      triggerCelebration()
      resetForm()
      onClose()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in both email and password.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      triggerCelebration()
      resetForm()
      onClose()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email || !password) {
      setError('Please provide an email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await signupWithEmail(name, email, password)
      triggerCelebration()
      resetForm()
      onClose()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address to reset password.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email)
      setResetSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(30, 26, 23, 0.58)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
          onClick={e => {
            if (e.target === e.currentTarget) {
              resetForm()
              onClose()
            }
          }}
        >
          <motion.div
            className="modal-window auth-modal-card"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{
              width: '100%',
              maxWidth: '430px',
              background: '#FFFDF9',
              border: '1px solid #D8CFC0',
              borderRadius: '18px',
              boxShadow: '0 24px 60px rgba(48, 46, 53, 0.22)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Friendly banner at top when gate intercept occurs */}
            {bannerText && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #FFF5EA 0%, #FFE9DC 100%)',
                  borderBottom: '1px solid #F3C7B6',
                  padding: '11px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#A83B29',
                  fontSize: '12px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                <Sparkles size={14} style={{ color: 'var(--coral)', flexShrink: 0 }} />
                <span>{bannerText}</span>
              </div>
            )}

            {/* Header Bar */}
            <div
              style={{
                padding: '20px 24px 16px',
                background: '#FAF6F0',
                borderBottom: '1px solid #EFEAE0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'var(--coral)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Sparkles size={13} />
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: '#8F8278' }}>
                2D ANIMATION STUDIO
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'Newsreader, Georgia, serif',
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {view === 'login' && 'Sign In to Studio'}
              {view === 'signup' && 'Create Your Account'}
              {view === 'reset' && 'Reset Password'}
            </h2>
            <p style={{ fontSize: '12px', color: '#6F655D', margin: '4px 0 0', lineHeight: 1.4 }}>
              {view === 'login' && 'Access and sync your animation projects seamlessly.'}
              {view === 'signup' && 'Join to create, animate, and export custom scenes.'}
              {view === 'reset' && 'Enter your account email to receive a password recovery link.'}
            </p>
          </div>

          <button
            onClick={() => {
              resetForm()
              onClose()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8A7F75',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <div style={{ padding: '22px 24px' }}>
          {/* Error Banner */}
          {error && (
            <div
              style={{
                background: '#FDEEEB',
                border: '1px solid #F3C3BA',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#BA4437',
                fontSize: '11.5px',
                fontWeight: 500,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner for Password Reset */}
          {resetSuccess && (
            <div
              style={{
                background: '#EBF5EA',
                border: '1px solid #BFE4BD',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                color: '#2F6E2B',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Password reset email sent!</strong>
                <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.9 }}>
                  Check your inbox ({email}) for instructions to reset your password.
                </p>
              </div>
            </div>
          )}

          {/* VIEW 1: SIGN IN */}
          {view === 'login' && (
            <div>
              {/* Google Sign In Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: '#FFFFFF',
                  border: '1.5px solid #D8CFC0',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 1px 3px rgba(48, 46, 53, 0.05)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              {/* Or Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '18px 0 16px',
                  color: '#9E9287',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: '#EAE3D5' }} />
                <span style={{ padding: '0 10px' }}>or sign in with email</span>
                <div style={{ flex: 1, height: '1px', background: '#EAE3D5' }} />
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#6E645C',
                      marginBottom: '5px',
                    }}
                  >
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={15}
                      style={{ position: 'absolute', left: '12px', top: '11px', color: '#978C82' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#6E645C' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => switchView('reset')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--coral)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={15}
                      style={{ position: 'absolute', left: '12px', top: '11px', color: '#978C82' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 36px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#978C82',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Coral Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '4px',
                    width: '100%',
                    background: 'var(--coral)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 8px rgba(217, 93, 78, 0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#7A6F66' }}>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--coral)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Sign up
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: SIGN UP */}
          {view === 'signup' && (
            <div>
              {/* Google Sign In Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: '#FFFFFF',
                  border: '1.5px solid #D8CFC0',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 1px 3px rgba(48, 46, 53, 0.05)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
              >
                <GoogleIcon />
                <span>Sign up with Google</span>
              </button>

              {/* Or Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '16px 0 14px',
                  color: '#9E9287',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: '#EAE3D5' }} />
                <span style={{ padding: '0 10px' }}>or register with email</span>
                <div style={{ flex: 1, height: '1px', background: '#EAE3D5' }} />
              </div>

              <form onSubmit={handleEmailSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6E645C', marginBottom: '4px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#978C82' }} />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Animator"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6E645C', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#978C82' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6E645C', marginBottom: '4px' }}>
                    Password (min 6 characters)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#978C82' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 36px 8px 36px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '7px',
                        background: 'transparent',
                        border: 'none',
                        color: '#978C82',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6E645C', marginBottom: '4px' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#978C82' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 36px 8px 36px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '7px',
                        background: 'transparent',
                        border: 'none',
                        color: '#978C82',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Coral Create Account Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '6px',
                    width: '100%',
                    background: 'var(--coral)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 8px rgba(217, 93, 78, 0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#7A6F66' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--coral)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {view === 'reset' && (
            <div>
              <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#6E645C',
                      marginBottom: '5px',
                    }}
                  >
                    Account Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={15}
                      style={{ position: 'absolute', left: '12px', top: '11px', color: '#978C82' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#D8CFC0')}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '4px',
                    width: '100%',
                    background: 'var(--coral)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 8px rgba(217, 93, 78, 0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#635B55',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  )
}
