'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

export function getFriendlyErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.'
  const code = err.code || ''
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format.'
    case 'auth/user-not-found':
      return 'No account found with this email address.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your details.'
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/popup-closed-by-user':
      return 'Sign in cancelled. Google popup was closed.'
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.'
    default:
      return err.message?.replace(/^Firebase:\s*/, '') || 'Authentication failed. Please try again.'
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  async function loginWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: any) {
      throw new Error(getFriendlyErrorMessage(err))
    }
  }

  async function loginWithEmail(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err: any) {
      throw new Error(getFriendlyErrorMessage(err))
    }
  }

  async function signupWithEmail(name: string, email: string, password: string) {
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password)
      if (name.trim() && res.user) {
        await updateProfile(res.user, { displayName: name.trim() })
        // Force refresh user state with updated displayName
        setUser({ ...res.user, displayName: name.trim() })
      }
    } catch (err: any) {
      throw new Error(getFriendlyErrorMessage(err))
    }
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch (err: any) {
      throw new Error(getFriendlyErrorMessage(err))
    }
  }

  async function logout() {
    try {
      await signOut(auth)
    } catch (err: any) {
      throw new Error(getFriendlyErrorMessage(err))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
