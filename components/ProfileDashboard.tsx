'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, User as UserIcon, Mail, Briefcase, Calendar, Clock,
  FolderOpen, Plus, Play, Copy, Download, Trash2, ArrowRight, ArrowLeft,
  Check, Edit3, Film, Shapes, Layers, Activity, LogOut, Disc3, ShieldCheck
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { getUserInitials } from './UserMenu'
import {
  UserProjectItem,
  UserActivityItem,
  UserProfileData,
  getUserProjects,
  saveUserProject,
  deleteUserProject,
  duplicateUserProject,
  getUserCustomAssets,
  getUserActivity,
  getUserProfile,
  updateUserProfile,
} from '@/lib/user-store'
import { CGProjectData, downloadProjectFile, AssetDef } from '@/lib/cg-project'

interface ProfileDashboardProps {
  onBack: () => void
  onOpenStudio: (projectToLoad?: CGProjectData) => void
  onOpenGraphicsLab: () => void
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ProfileDashboard({
  onBack,
  onOpenStudio,
  onOpenGraphicsLab,
}: ProfileDashboardProps) {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'projects' | 'assets' | 'activity'>('projects')

  // Data states
  const [projects, setProjects] = useState<UserProjectItem[]>([])
  const [customAssets, setCustomAssets] = useState<AssetDef[]>([])
  const [activity, setActivity] = useState<UserActivityItem[]>([])
  const [profile, setProfile] = useState<UserProfileData>({
    bio: 'Creating expressive vector animations with procedural Computer Graphics transforms & keyframes.',
    role: 'Computer Graphics Creator',
    totalProjects: 0,
    totalAssets: 0,
    totalBlocks: 0,
  })

  // Edit Bio state
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const uid = user.uid
    async function loadData() {
      setLoading(true)
      try {
        const [pList, aList, actList, prof] = await Promise.all([
          getUserProjects(uid),
          getUserCustomAssets(uid),
          getUserActivity(uid),
          getUserProfile(uid),
        ])
        setProjects(pList)
        setCustomAssets(aList)
        setActivity(actList)
        setProfile(prof)
        setBioInput(prof.bio)
        setRoleInput(prof.role)
      } catch (err) {
        console.error('Failed to load profile dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  async function handleSaveBio() {
    if (!user) return
    await updateUserProfile(user.uid, { bio: bioInput.trim(), role: roleInput.trim() })
    setProfile(prev => ({ ...prev, bio: bioInput.trim(), role: roleInput.trim() }))
    setIsEditingBio(false)
  }

  async function handleDelete(projectId: string) {
    if (!user) return
    if (window.confirm('Delete this saved project? This action cannot be undone.')) {
      await deleteUserProject(user.uid, projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    }
  }

  async function handleDuplicate(projectId: string) {
    if (!user) return
    const duplicated = await duplicateUserProject(user.uid, projectId)
    if (duplicated) {
      setProjects(prev => [duplicated, ...prev])
    }
  }

  const initials = getUserInitials(user?.displayName, user?.email)
  const totalBlocks = projects.reduce((acc, p) => acc + (p.blockCount || 0), 0)

  return (
    <motion.div
      className="profile-dashboard-shell"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{
        minHeight: '100vh',
        background: '#FAF6F0',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navbar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 28px',
          background: '#FFFDF9',
          borderBottom: '1px solid #D8CFC0',
          boxShadow: '0 1px 4px rgba(48, 46, 53, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="outline-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 600,
              borderRadius: '8px',
              height: '32px',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> Back
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                background: 'var(--coral)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Sparkles size={14} />
            </span>
            <strong style={{ fontSize: '14px', fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }}>
              Studio Profile &amp; Workspace
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onOpenStudio()}
            className="coral-button"
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(217, 93, 78, 0.25)',
            }}
          >
            <Plus size={14} /> Create New Animation <ArrowRight size={14} />
          </motion.button>
        </div>
      </nav>

      {/* Main Content Container */}
      <div style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', padding: '28px 24px 60px', flex: 1 }}>
        {/* 1. Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: '#FFFDF9',
            border: '1px solid #D8CFC0',
            borderRadius: '16px',
            padding: '24px 28px',
            boxShadow: '0 4px 20px rgba(48, 46, 53, 0.06)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {/* Avatar */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D95D4E 0%, #7B6DAF 100%)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  boxShadow: '0 6px 16px rgba(217, 93, 78, 0.25)',
                  border: '3px solid #FFFDF9',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{initials}</span>
                )}
              </motion.div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
                    {user?.displayName || 'Creative Animator'}
                  </h1>
                  <span
                    style={{
                      background: '#EBF5EA',
                      color: '#2F6E2B',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ShieldCheck size={12} /> Verified Creator
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#7A6F66', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={13} style={{ color: '#9E9287' }} /> {user?.email}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={13} style={{ color: '#9E9287' }} /> {profile.role}
                  </span>
                </div>

                {isEditingBio ? (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      value={roleInput}
                      onChange={e => setRoleInput(e.target.value)}
                      placeholder="Your role (e.g. 2D Animator & CG Enthusiast)"
                      style={{
                        padding: '6px 10px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        maxWidth: '380px',
                      }}
                    />
                    <textarea
                      value={bioInput}
                      onChange={e => setBioInput(e.target.value)}
                      rows={2}
                      style={{
                        padding: '6px 10px',
                        background: '#FAF6F0',
                        border: '1px solid #D8CFC0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        maxWidth: '480px',
                        resize: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={handleSaveBio}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--coral)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Save Bio
                      </button>
                      <button
                        onClick={() => setIsEditingBio(false)}
                        style={{
                          padding: '4px 10px',
                          background: '#EAE4D7',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#5C534D', maxWidth: '520px', lineHeight: 1.4 }}>
                      {profile.bio}
                    </p>
                    <button
                      onClick={() => setIsEditingBio(true)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--coral)', cursor: 'pointer', padding: '2px' }}
                      title="Edit bio & role"
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Logout button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                await logout()
                onBack()
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#FAF6F0',
                border: '1px solid #D8CFC0',
                color: '#BA4437',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={13} /> Sign Out
            </motion.button>
          </div>

          {/* Stats Pills Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid #EFEAE0',
            }}
          >
            <div style={{ background: '#FAF6F0', padding: '10px 14px', borderRadius: '10px', border: '1px solid #EAE3D5' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#9E9287', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Animations Saved
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <Film size={18} style={{ color: 'var(--coral)' }} />
                <strong style={{ fontSize: '20px', fontFamily: 'Newsreader, Georgia, serif', color: 'var(--ink)' }}>
                  {projects.length}
                </strong>
              </div>
            </div>

            <div style={{ background: '#FAF6F0', padding: '10px 14px', borderRadius: '10px', border: '1px solid #EAE3D5' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#9E9287', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Custom CG Assets
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <Shapes size={18} style={{ color: '#7B6DAF' }} />
                <strong style={{ fontSize: '20px', fontFamily: 'Newsreader, Georgia, serif', color: 'var(--ink)' }}>
                  {customAssets.length}
                </strong>
              </div>
            </div>

            <div style={{ background: '#FAF6F0', padding: '10px 14px', borderRadius: '10px', border: '1px solid #EAE3D5' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#9E9287', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Total Transform Blocks
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <Layers size={18} style={{ color: '#6A9B72' }} />
                <strong style={{ fontSize: '20px', fontFamily: 'Newsreader, Georgia, serif', color: 'var(--ink)' }}>
                  {totalBlocks}
                </strong>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. Interactive Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid #D8CFC0',
            paddingBottom: '8px',
            position: 'relative',
          }}
        >
          {[
            { id: 'projects', label: 'My Saved Animations', count: projects.length, icon: Film },
            { id: 'assets', label: 'Custom CG Assets', count: customAssets.length, icon: Shapes },
            { id: 'activity', label: 'Work History & Log', count: activity.length, icon: Activity },
          ].map(t => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'var(--coral)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#6A5F56',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#EAE3D5',
                    color: isActive ? '#fff' : '#6E645C',
                  }}
                >
                  {t.count}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* 3. Tab Contents */}
        <AnimatePresence mode="wait">
          {/* TAB 1: SAVED ANIMATIONS */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '18px',
                }}
              >
                {/* Create New Card */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenStudio()}
                  style={{
                    background: '#FFFDF9',
                    border: '2px dashed var(--coral)',
                    borderRadius: '14px',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '220px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(217, 93, 78, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#FFF0EE',
                      color: 'var(--coral)',
                      display: 'grid',
                      placeItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <Plus size={22} />
                  </span>
                  <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>+ Create New Animation</strong>
                  <p style={{ fontSize: '11px', color: '#887C72', margin: '4px 0 0', maxWidth: '200px' }}>
                    Start fresh on the 960 × 540 stage with clean keyframes
                  </p>
                </motion.div>

                {/* Saved Projects Cards */}
                {projects.map((proj, idx) => (
                  <motion.div
                    key={proj.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -4, scale: 1.015 }}
                    style={{
                      background: '#FFFDF9',
                      border: '1px solid #D8CFC0',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: '0 3px 12px rgba(48, 46, 53, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Thumbnail preview banner */}
                    <div
                      style={{
                        height: '110px',
                        background:
                          proj.theme === 'beach'
                            ? 'linear-gradient(#70BFD1 0%, #1D7C9E 50%, #F5D7B3 100%)'
                            : proj.theme === 'midnight'
                            ? 'linear-gradient(#0A0B10 0%, #1A1C29 60%, #303348 100%)'
                            : 'linear-gradient(180deg, #A7D7E8 0%, #CCE7F0 45%, #6A9B72 45%, #4C7D54 100%)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '10px',
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {proj.theme}
                      </div>

                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '10px',
                          background: 'rgba(255,255,255,0.85)',
                          color: '#302E35',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        24 FPS
                      </div>

                      {/* Objects count badge in center */}
                      <div style={{ textAlign: 'center', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        <span style={{ fontSize: '22px', fontWeight: 700, display: 'block' }}>{proj.objectCount}</span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Objects Rigged
                        </span>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{proj.name}</strong>
                        <span style={{ fontSize: '10px', color: '#978C82' }}>{timeAgo(proj.updatedAt)}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '9.5px', background: '#F0ECE4', color: '#6E645C', padding: '1px 6px', borderRadius: '4px' }}>
                          {proj.objectCount} Objects
                        </span>
                        <span style={{ fontSize: '9.5px', background: '#EAE4F3', color: '#6A5C94', padding: '1px 6px', borderRadius: '4px' }}>
                          {proj.blockCount} Blocks
                        </span>
                      </div>

                      {/* Card Action Buttons */}
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '6px' }}>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onOpenStudio(proj.data)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            background: 'var(--coral)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '7px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 5px rgba(217, 93, 78, 0.25)',
                          }}
                        >
                          <Play size={12} fill="currentColor" /> Resume
                        </motion.button>

                        <button
                          onClick={() => handleDuplicate(proj.id)}
                          style={{
                            background: '#FAF6F0',
                            border: '1px solid #D8CFC0',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#635B55',
                          }}
                          title="Duplicate project"
                        >
                          <Copy size={13} />
                        </button>

                        <button
                          onClick={() => downloadProjectFile(proj.data)}
                          style={{
                            background: '#FAF6F0',
                            border: '1px solid #D8CFC0',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#635B55',
                          }}
                          title="Download .cgproj file"
                        >
                          <Download size={13} />
                        </button>

                        <button
                          onClick={() => handleDelete(proj.id)}
                          style={{
                            background: '#FAF6F0',
                            border: '1px solid #D8CFC0',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#BA4437',
                          }}
                          title="Delete project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 2: CUSTOM CG ASSETS */}
          {activeTab === 'assets' && (
            <motion.div
              key="assets-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '14px',
                }}
              >
                {/* Build New in Graphics Lab card */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenGraphicsLab}
                  style={{
                    background: '#FFFDF9',
                    border: '2px dashed #7B6DAF',
                    borderRadius: '12px',
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '160px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#F0ECF8',
                      color: '#7B6DAF',
                      display: 'grid',
                      placeItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <Plus size={20} />
                  </span>
                  <strong style={{ fontSize: '13px', color: '#4E4275' }}>+ Build in Graphics Lab</strong>
                  <small style={{ fontSize: '10px', color: '#887C72' }}>Rasterize with DDA, Bresenham &amp; Midpoint</small>
                </motion.div>

                {customAssets.map((asset, idx) => (
                  <motion.div
                    key={`${asset.name}-${idx}`}
                    whileHover={{ y: -3 }}
                    style={{
                      background: '#FFFDF9',
                      border: '1px solid #D8CFC0',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(48, 46, 53, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          background: `${asset.color}20`,
                          display: 'grid',
                          placeItems: 'center',
                          color: asset.color,
                        }}
                      >
                        <Shapes size={18} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '12.5px', color: 'var(--ink)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {asset.name}
                        </strong>
                        <span style={{ fontSize: '10px', color: '#8A7F75' }}>
                          {asset.primitives?.length || 1} CG Primitives
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '9px', background: '#F0ECE4', padding: '1px 5px', borderRadius: '3px', color: '#6A5F56' }}>
                        {asset.kind}
                      </span>
                      <span style={{ fontSize: '9px', background: '#EAE4F3', padding: '1px 5px', borderRadius: '3px', color: '#6A5C94' }}>
                        {asset.defaultW}×{asset.defaultH}px
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: WORK HISTORY & ACTION LOG */}
          {activeTab === 'activity' && (
            <motion.div
              key="activity-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  background: '#FFFDF9',
                  border: '1px solid #D8CFC0',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  boxShadow: '0 2px 10px rgba(48, 46, 53, 0.05)',
                }}
              >
                {activity.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: '#978C82' }}>
                    <Activity size={28} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No session activity logged yet.</p>
                    <small style={{ fontSize: '11px' }}>Your project saves, custom shapes, and exports will appear here automatically.</small>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                    {activity.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          paddingBottom: '14px',
                          borderBottom: idx < activity.length - 1 ? '1px solid #EFEAE0' : 'none',
                        }}
                      >
                        <span
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#FAF6F0',
                            border: '1px solid #EAE3D5',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '15px',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ fontSize: '12.5px', color: 'var(--ink)' }}>{item.title}</strong>
                            <span style={{ fontSize: '10px', color: '#9E9287' }}>{timeAgo(item.timestamp)}</span>
                          </div>
                          {item.details && (
                            <p style={{ fontSize: '11px', color: '#7A6F66', margin: '2px 0 0' }}>{item.details}</p>
                          )}
                        </div>

                        {item.badge && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              background: '#EAE4F3',
                              color: '#6A5C94',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
