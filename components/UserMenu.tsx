'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, LogOut, Save, FolderOpen, User as UserIcon, CheckCircle2, LayoutDashboard } from 'lucide-react'
import { useAuth } from './AuthProvider'

interface UserMenuProps {
  onOpenAuth: () => void
  onOpenProfile?: () => void
  onSaveProject?: () => void
  onLoadProject?: () => void
  compact?: boolean
}

export function getUserInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'AM'
}

export default function UserMenu({
  onOpenAuth,
  onOpenProfile,
  onSaveProject,
  onLoadProject,
  compact = false,
}: UserMenuProps) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [imgError, setImgError] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // If logged out: render clean Sign In button with tactile motion
  if (!user) {
    return (
      <motion.button
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenAuth}
        className={compact ? 'outline-button' : 'coral-button'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '6px 12px' : '7px 14px',
          fontSize: '11.5px',
          fontWeight: 600,
          height: compact ? '30px' : 'auto',
          borderRadius: '7px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        title="Sign in with Google or Email to sync animations"
      >
        <LogIn size={13} />
        <span>Sign In</span>
      </motion.button>
    )
  }

  const initials = getUserInitials(user.displayName, user.email)
  const displayName = user.displayName || 'Creative Animator'
  const email = user.email || ''

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      {/* Avatar Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setMenuOpen(v => !v)}
        title={`${displayName} (${email}) - Click for account menu`}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1.5px solid #D8CFC0',
          padding: 0,
          background: 'var(--coral)',
          color: '#FFFFFF',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '11px',
          boxShadow: '0 2px 6px rgba(48, 46, 53, 0.12)',
          overflow: 'hidden',
        }}
      >
        {user.photoURL && !imgError ? (
          <img
            src={user.photoURL}
            alt={displayName}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </motion.button>

      {/* Account Dropdown Menu with Spring Animation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#FFFDF9',
              border: '1px solid #D8CFC0',
              borderRadius: '14px',
              boxShadow: '0 14px 40px rgba(48, 46, 53, 0.18)',
              width: '270px',
              zIndex: 1000,
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {/* User Profile Info Header */}
            <div
              style={{
                padding: '8px 10px 10px',
                borderBottom: '1px solid #EFEAE0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--coral)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: '12px',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {user.photoURL && !imgError ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    onError={() => setImgError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <strong
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    {displayName}
                  </strong>
                  <CheckCircle2 size={12} style={{ color: '#658D5A', flexShrink: 0 }} />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#8A7F75',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {email}
                </span>
              </div>
            </div>

            {/* Profile & Projects Dashboard link */}
            {onOpenProfile && (
              <motion.button
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onOpenProfile()
                  setMenuOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #FAF6F0 0%, #F5EFE6 100%)',
                  border: '1px solid #EAE3D5',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  marginTop: '4px',
                }}
              >
                <LayoutDashboard size={14} style={{ color: 'var(--coral)' }} />
                <span style={{ flex: 1 }}>My Profile &amp; Projects</span>
                <span style={{ fontSize: '10px', background: 'var(--coral)', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                  NEW
                </span>
              </motion.button>
            )}

            {/* Quick Actions: Download / Load Project */}
            {onSaveProject && (
              <motion.button
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onSaveProject()
                  setMenuOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 9px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3EFE6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Save size={14} style={{ color: 'var(--coral)' }} />
                <span>💾 Download Project (.cgproj)</span>
              </motion.button>
            )}

            {onLoadProject && (
              <motion.button
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onLoadProject()
                  setMenuOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 9px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3EFE6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <FolderOpen size={14} style={{ color: '#7B6DAF' }} />
                <span>📂 Load Project (.cgproj)</span>
              </motion.button>
            )}

            <div style={{ height: '1px', background: '#EFEAE0', margin: '4px 0' }} />

            {/* Sign Out Button */}
            <motion.button
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                setMenuOpen(false)
                await logout()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 9px',
                borderRadius: '6px',
                background: 'transparent',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                color: '#BA4437',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FDEEEB')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} />
              <span>🚪 Sign Out</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
