'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  AlignCenter, ArrowDownToLine, ArrowLeft, ArrowRight, Box, Car, ChevronDown, Circle,
  Cloud, Copy, Download, Eye, FolderOpen, Grid3X3, Hand, House, Layers3, Lock, Menu, MousePointer2,
  Move, Pause, Play, Plus, Redo2, RefreshCw, RotateCw, Save, Search, Settings2, Shapes, Sparkles, Square,
  Sun, Trash2, TreePine, Undo2, Upload, UserRound, Wind, X, ZoomIn, ZoomOut, Compass, Mountain, Waves,
  User as UserIcon, LayoutDashboard, Check
} from 'lucide-react'

import {
  TransformBlock,
  TransformActionType,
  evaluateCumulativeTransform,
  computeWorldHierarchy,
} from '@/lib/cg-engine'

import {
  CGProjectData,
  createProjectPayload,
  parseProjectFile,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  downloadProjectFile,
} from '@/lib/cg-project'

import StageCanvas, {
  StageObject,
  SceneTheme
} from '@/components/StageCanvas'
import RightInspector from '@/components/RightInspector'
import TimelinePanel from '@/components/TimelinePanel'
import GraphicsLabModal, {
  CustomAssetData
} from '@/components/GraphicsLabModal'
import ExportModal from '@/components/ExportModal'
import PreviewModal from '@/components/PreviewModal'
import TemplatesModal from '@/components/TemplatesModal'
import CustomBackgroundModal, {
  CustomBackgroundConfig,
  defaultCustomBackground
} from '@/components/CustomBackgroundModal'
import AlgorithmsDocsModal from '@/components/AlgorithmsDocsModal'
import AudioModal from '@/components/AudioModal'
import AuthModal from '@/components/AuthModal'
import UserMenu from '@/components/UserMenu'
import ProfileDashboard from '@/components/ProfileDashboard'
import { useAuth } from '@/components/AuthProvider'
import {
  saveUserProject,
  logUserActivity,
  saveUserCustomAsset,
  getUserProjects,
} from '@/lib/user-store'
import {
  AudioTrackConfig,
  SoundCue,
  timelineAudio,
  generateChiptuneBuffer,
  generateLofiBuffer,
  generateCinematicBuffer,
  decodeCustomAudioBuffer,
} from '@/lib/audio-engine'

const coral = '#D95D4E'

interface AssetDef {
  name: string
  icon: string
  color: string
  category: 'world' | 'character' | 'custom'
  defaultW: number
  defaultH: number
  kind: 'object' | 'shape' | 'custom' | 'character'
  primitives?: any[]
  imageUrl?: string
}

// 1. World Objects
const worldAssets: AssetDef[] = [
  { name: 'Sun', icon: 'sun', color: '#F5B941', category: 'world', defaultW: 90, defaultH: 90, kind: 'object' },
  { name: 'Cloud', icon: 'cloud', color: '#D8E7E9', category: 'world', defaultW: 130, defaultH: 55, kind: 'object' },
  { name: 'Pine Tree', icon: 'tree', color: '#6A9B72', category: 'world', defaultW: 80, defaultH: 140, kind: 'object' },
  { name: 'Cottage House', icon: 'house', color: '#D98264', category: 'world', defaultW: 130, defaultH: 110, kind: 'object' },
  { name: 'Red Car', icon: 'car', color: coral, category: 'world', defaultW: 120, defaultH: 52, kind: 'object' },
  { name: 'Boat', icon: 'wind', color: '#3B7BA4', category: 'world', defaultW: 110, defaultH: 95, kind: 'object' },
  { name: 'Beach Ball', icon: 'circle', color: '#E75A4D', category: 'world', defaultW: 75, defaultH: 75, kind: 'object' },
]

// 2. Character & Rigging Parts (For Human Animation)
const characterAssets: AssetDef[] = [
  { name: 'Head', icon: 'user', color: '#E8BA94', category: 'character', defaultW: 60, defaultH: 60, kind: 'character' },
  { name: 'Torso / Body', icon: 'square', color: '#7B6DAF', category: 'character', defaultW: 70, defaultH: 100, kind: 'character' },
  { name: 'Upper Arm', icon: 'line', color: '#7B6DAF', category: 'character', defaultW: 26, defaultH: 70, kind: 'character' },
  { name: 'Lower Arm / Hand', icon: 'line', color: '#E8BA94', category: 'character', defaultW: 24, defaultH: 70, kind: 'character' },
  { name: 'Upper Leg', icon: 'line', color: '#3D485C', category: 'character', defaultW: 28, defaultH: 80, kind: 'character' },
  { name: 'Lower Leg / Foot', icon: 'line', color: '#272E3D', category: 'character', defaultW: 32, defaultH: 80, kind: 'character' },
]

const iconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>> = {
  sun: Sun,
  cloud: Cloud,
  tree: TreePine,
  house: House,
  car: Car,
  user: UserRound,
  wind: Wind,
  circle: Circle,
  square: Square,
  line: AlignCenter,
}

function AssetIcon({ type, color, size = 18 }: { type: string; color: string; size?: number }) {
  const Icon = iconMap[type] || Shapes
  return <Icon size={size} strokeWidth={1.8} style={{ color }} />
}

// -------------------------------------------------------------
// LANDING PAGE VIEW (TACTILE & ANIMATED)
// -------------------------------------------------------------
interface LandingProps {
  onOpenStudio: () => void
  onOpenShapeBuilder: () => void
  onOpenDocs: () => void
  onOpenTemplates: () => void
  onOpenProfile: () => void
  onProtectedAction: (destination: 'studio' | 'shape-builder' | 'profile' | 'templates', bannerText?: string) => void
}

function Landing({
  onOpenStudio,
  onOpenShapeBuilder,
  onOpenDocs,
  onOpenTemplates,
  onOpenProfile,
  onProtectedAction,
}: LandingProps) {
  return (
    <motion.main
      className="landing-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
    >
      {/* Top Navbar */}
      <nav className="landing-nav">
        <div className="brand">
          <span className="brand-mark">
            <Sparkles size={15} />
          </span>
          <span>2D Animation Studio</span>
        </div>
        <div className="nav-links">
          <motion.a
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onProtectedAction('profile', '✨ Sign in to view and resume your saved animation projects')}
            style={{ cursor: 'pointer' }}
          >
            Projects
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onProtectedAction('templates', '✨ Sign in to explore and create from starter templates')}
            style={{ cursor: 'pointer' }}
          >
            Templates
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenDocs}
            style={{ cursor: 'pointer' }}
          >
            CG Algorithms
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenDocs}
            style={{ cursor: 'pointer' }}
          >
            Docs
          </motion.a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserMenu
            onOpenAuth={() => onProtectedAction('studio', '✨ Sign in to open your Animation Studio & auto-save your work')}
            onOpenProfile={onOpenProfile}
          />
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="coral-button"
            onClick={() => onProtectedAction('studio', '✨ Sign in to open your Animation Studio & auto-save your work')}
          >
            Open Studio <ArrowRight size={16} />
          </motion.button>
        </div>
      </nav>

      {/* Hero Section with Live Animated Window */}
      <section className="hero-section">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.05 }}
        >
          <div className="eyebrow">
            <span>✦</span> Powered by 2D matrix transforms &amp; interpolation
          </div>
          <h1>
            Create.<br />
            Animate.<br />
            <em>Visualize.</em>
          </h1>
          <p>
            Turn geometric ideas into living scenes. Pick and drop vector art or character rigging parts onto pure scenic backdrops, and animate with 24 FPS precision.
          </p>
          <div className="hero-actions">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.94 }}
              className="coral-button large"
              onClick={() => onProtectedAction('studio', '✨ Sign in to open your Animation Studio & auto-save your work')}
            >
              <Play size={16} fill="currentColor" /> Start Creating
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.94 }}
              className="outline-button"
              onClick={() => onProtectedAction('shape-builder', '✨ Sign in to access the Computer Graphics Shape Builder')}
            >
              <Shapes size={16} /> Open Shape Builder
            </motion.button>
          </div>
          <div className="hero-note">
            <span className="avatar-stack">
              <i />
              <i />
              <i />
            </span>
            <span>Drag &amp; drop rigging ready</span>
            <span className="note-dot" />
            <span>24 FPS precision</span>
          </div>
        </motion.div>

        {/* Live Animated Hero Art Preview Window */}
        <div className="hero-art-wrap">
          <motion.div
            className="hero-window"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.15 }}
          >
            <div className="window-bar">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} style={{ color: 'var(--coral)' }} /> scene_01 / countryside-drive
              </span>
              <span className="window-status" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <motion.span
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.55, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#658D5A', display: 'inline-block' }}
                />
                Live Preview
              </span>
            </div>

            {/* Continuous Live Canvas Stage */}
            <div
              className="scene-art"
              style={{
                position: 'relative',
                height: '240px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #A8D5E5 0%, #D8EBF2 52%, #7CA86E 52%, #5D8F53 100%)',
              }}
            >
              {/* 1. Rotating & Glowing Sun */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                  filter: [
                    'drop-shadow(0 0 10px rgba(245, 185, 65, 0.45))',
                    'drop-shadow(0 0 22px rgba(245, 185, 65, 0.75))',
                    'drop-shadow(0 0 10px rgba(245, 185, 65, 0.45))',
                  ],
                }}
                transition={{
                  rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                  filter: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{ position: 'absolute', top: '16px', right: '36px', zIndex: 2 }}
              >
                <Sun size={46} color="#F5B941" fill="#F5B941" />
              </motion.div>

              {/* 2. Drifting Clouds */}
              <motion.div
                animate={{ x: [-25, 45, -25] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: '24px', left: '28px', zIndex: 3 }}
              >
                <Cloud size={50} color="#FFFFFF" fill="#FFFFFF" opacity={0.92} />
              </motion.div>

              <motion.div
                animate={{ x: [35, -30, 35] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: '56px', left: '160px', zIndex: 2 }}
              >
                <Cloud size={36} color="#FFFFFF" fill="#FFFFFF" opacity={0.78} />
              </motion.div>

              {/* 3. Rolling Hill Slope SVG */}
              <svg
                viewBox="0 0 500 120"
                preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '115px', zIndex: 4 }}
              >
                <path
                  d="M0,70 Q120,30 250,65 T500,45 L500,120 L0,120 Z"
                  fill="#6B9E5F"
                />
                <path
                  d="M0,90 Q150,55 320,85 T500,75 L500,120 L0,120 Z"
                  fill="#56864C"
                />
                <path
                  d="M0,102 Q150,96 320,104 T500,100"
                  stroke="#403C36"
                  strokeWidth="18"
                  fill="none"
                />
                <path
                  d="M0,102 Q150,96 320,104 T500,100"
                  stroke="#F5B941"
                  strokeWidth="2"
                  strokeDasharray="12 10"
                  fill="none"
                />
              </svg>

              {/* Pine trees along the hill */}
              <div style={{ position: 'absolute', bottom: '48px', left: '38px', zIndex: 4 }}>
                <TreePine size={32} color="#456E3B" fill="#456E3B" />
              </div>
              <div style={{ position: 'absolute', bottom: '56px', left: '88px', zIndex: 4 }}>
                <TreePine size={24} color="#385C2F" fill="#385C2F" />
              </div>
              <div style={{ position: 'absolute', bottom: '50px', right: '58px', zIndex: 4 }}>
                <TreePine size={34} color="#456E3B" fill="#456E3B" />
              </div>

              {/* 4. Red Car driving across the road with suspension bounce */}
              <motion.div
                animate={{
                  x: [-60, 440],
                  y: [0, -3, 1, -3, 0],
                }}
                transition={{
                  x: { duration: 8.5, repeat: Infinity, ease: 'linear' },
                  y: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{ position: 'absolute', bottom: '10px', left: 0, zIndex: 6 }}
              >
                <div style={{ position: 'relative' }}>
                  <Car size={42} color="var(--coral)" fill="var(--coral)" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', bottom: '2px', left: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#222' }}
                  />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', bottom: '2px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#222' }}
                  />
                </div>
              </motion.div>

              {/* 5. Floating Callout Badges with Gentle Bobbing */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="floating-badge badge-key"
                style={{ top: '22px', left: '16px', zIndex: 7 }}
              >
                <span>◆</span>
                <div>
                  <strong>2D Matrix Transforms</strong>
                  <small>Translation · Rotation · Shear</small>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 7, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="floating-badge badge-tween"
                style={{ bottom: '28px', right: '16px', zIndex: 7 }}
              >
                <span>✦</span>
                <div>
                  <strong>Procedural Interpolation</strong>
                  <small>24 FPS Cubic &amp; Elastic Easing</small>
                </div>
              </motion.div>
            </div>

            {/* Window Footer with scrubbed playhead */}
            <div className="window-footer">
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>00:00:03</span>
              <div className="mini-timeline" style={{ position: 'relative', overflow: 'hidden' }}>
                <i />
                <i />
                <i />
                <b />
                <motion.div
                  animate={{ left: ['4%', '96%'] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    background: 'var(--coral)',
                    borderRadius: '2px',
                    boxShadow: '0 0 6px var(--coral)',
                  }}
                />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--coral)' }}>24 FPS</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Features Banner */}
      <div className="landing-bottom">
        <span>Built for the craft of motion</span>
        <div className="landing-lines">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <span>
          Scroll to explore <ArrowDownToLine size={15} />
        </span>
      </div>
    </motion.main>
  )
}

// -------------------------------------------------------------
// MAIN STUDIO VIEW
// -------------------------------------------------------------
function Studio({
  onBack,
  onOpenProfile,
  initialOpenModal,
  initialProjectData,
}: {
  onBack: () => void
  onOpenProfile?: () => void
  initialOpenModal?: boolean
  initialProjectData?: CGProjectData | null
}) {
  const { user } = useAuth()
  // Navigation & Tabs
  const [tab, setTab] = useState<'Objects' | 'Shapes' | 'Scenes'>('Objects')
  const [theme, setTheme] = useState<SceneTheme>('countryside')
  const [customBgConfig, setCustomBgConfig] = useState<CustomBackgroundConfig>(defaultCustomBackground)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'edit' | 'animate'>('edit')
  const [grid, setGrid] = useState(true)

  // Modals
  const [graphicsLabOpen, setGraphicsLabOpen] = useState(initialOpenModal || false)
  const [exportOpen, setExportOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [customBgModalOpen, setCustomBgModalOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Custom Assets saved by user
  const [customAssets, setCustomAssets] = useState<AssetDef[]>([])

  // Dedicated Audio Track & Sound Effect Cues
  const [audioTrack, setAudioTrack] = useState<AudioTrackConfig | null>(null)
  const [soundCues, setSoundCues] = useState<SoundCue[]>([])
  const [audioModalOpen, setAudioModalOpen] = useState(false)
  const audioBufferRef = useRef<AudioBuffer | null>(null)

  // Stage Scene Objects State - starts clean with 0 objects when template is selected
  const [sceneObjects, setSceneObjects] = useState<StageObject[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Infinite Canvas Pan & Zoom Navigation State
  const [viewportZoom, setViewportZoom] = useState(1.0)
  const [viewportPan, setViewportPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'move'>('select')

  // Timeline & Sequential Transformation Blocks
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [blocksMap, setBlocksMap] = useState<Record<string, TransformBlock[]>>({})
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [hiddenMap, setHiddenMap] = useState<Record<string, boolean>>({})
  const [lockedMap, setLockedMap] = useState<Record<string, boolean>>({})
  const [isPickingTarget, setIsPickingTarget] = useState(false)
  // Project Info & Auto-Save
  const [projectName, setProjectName] = useState('My 2D Animation')
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'idle'>('saved')
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const isLoadedFromStorageRef = useRef(false)
  const projectFileInputRef = useRef<HTMLInputElement>(null)
  const imageUploadRef = useRef<HTMLInputElement>(null)
  const projectMenuRef = useRef<HTMLDivElement>(null)

  // Helper to load audio buffer for background playback
  async function loadAudioTrackBuffer(track: AudioTrackConfig) {
    try {
      let buf: AudioBuffer | null = null
      if (track.type === 'preset' && track.presetId) {
        if (track.presetId === 'chiptune') {
          const res = await generateChiptuneBuffer()
          buf = res.buffer
        } else if (track.presetId === 'lofi') {
          const res = await generateLofiBuffer()
          buf = res.buffer
        } else if (track.presetId === 'cinematic') {
          const res = await generateCinematicBuffer()
          buf = res.buffer
        }
      } else if (track.type === 'custom' && track.audioDataUrl) {
        const resp = await fetch(track.audioDataUrl)
        const arrayBuf = await resp.arrayBuffer()
        const res = await decodeCustomAudioBuffer(arrayBuf)
        buf = res.buffer
      }
      if (buf) {
        audioBufferRef.current = buf
        timelineAudio.setBuffer(buf)
        timelineAudio.setVolume(track.volume)
        timelineAudio.setMuted(track.muted)
      }
    } catch (e) {
      console.warn('Failed to load audio buffer:', e)
    }
  }

  // 1. Restore Project State from LocalStorage on mount
  useEffect(() => {
    const saved = loadFromLocalStorage()
    if (saved) {
      if (saved.projectName) setProjectName(saved.projectName)
      if (saved.theme) setTheme(saved.theme)
      if (saved.customBgConfig) setCustomBgConfig(saved.customBgConfig)
      if (saved.sceneObjects) setSceneObjects(saved.sceneObjects)
      if (saved.blocksMap) setBlocksMap(saved.blocksMap)
      if (saved.customAssets) setCustomAssets(saved.customAssets)
      if (saved.audioTrack) {
        setAudioTrack(saved.audioTrack)
        loadAudioTrackBuffer(saved.audioTrack)
      }
      if (saved.soundCues) setSoundCues(saved.soundCues)
    }
    isLoadedFromStorageRef.current = true
    setSaveStatus('saved')
  }, [])

  // Restore initialProjectData when passed from Profile Dashboard
  useEffect(() => {
    if (initialProjectData) {
      if (initialProjectData.projectName) setProjectName(initialProjectData.projectName)
      if (initialProjectData.theme) setTheme(initialProjectData.theme)
      if (initialProjectData.customBgConfig) setCustomBgConfig(initialProjectData.customBgConfig)
      if (initialProjectData.sceneObjects) setSceneObjects(initialProjectData.sceneObjects)
      if (initialProjectData.blocksMap) setBlocksMap(initialProjectData.blocksMap)
      if (initialProjectData.customAssets) setCustomAssets(initialProjectData.customAssets)
      if (initialProjectData.audioTrack) {
        setAudioTrack(initialProjectData.audioTrack)
        loadAudioTrackBuffer(initialProjectData.audioTrack)
      }
      if (initialProjectData.soundCues) setSoundCues(initialProjectData.soundCues)
      setSelectedId(null)
      setSelectedIds([])
      setSelectedBlockId(null)
      setFrame(0)
      setPlaying(false)
      setSaveStatus('saved')
    }
  }, [initialProjectData])

  // Save Project to Profile (Cloud Firestore + LocalStorage)
  async function handleSaveToMyProfile() {
    if (!user) {
      setAuthModalOpen(true)
      return
    }
    setSaveStatus('saving')
    try {
      const payload = createProjectPayload({
        projectName,
        theme,
        customBgConfig,
        sceneObjects,
        blocksMap,
        customAssets,
        audioTrack,
        soundCues,
      })
      await saveUserProject(user.uid, payload)
      await logUserActivity(user.uid, {
        icon: '💾',
        title: `Saved project '${projectName}' to Profile`,
        details: `${sceneObjects.length} objects · ${theme} backdrop · ${Object.keys(blocksMap).length} animated tracks`,
        badge: 'Saved',
      })
      setSaveStatus('saved')
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.15 },
          colors: ['#D95D4E', '#F5B941', '#7B6DAF', '#6A9B72'],
        })
      } catch (e) {}
    } catch (err) {
      console.error('Failed to save project to profile:', err)
      setSaveStatus('idle')
    }
  }

  // 2. Debounced Auto-Save to LocalStorage & Cloud Profile on edits
  useEffect(() => {
    if (!isLoadedFromStorageRef.current) return

    setSaveStatus('saving')
    const timer = setTimeout(() => {
      const payload = createProjectPayload({
        projectName,
        theme,
        customBgConfig,
        sceneObjects,
        blocksMap,
        customAssets,
        audioTrack,
        soundCues,
      })
      saveToLocalStorage(payload)
      if (user?.uid) {
        saveUserProject(user.uid, payload).catch(e => console.warn('User project sync:', e))
      }
      setSaveStatus('saved')
    }, 550)

    return () => clearTimeout(timer)
  }, [projectName, theme, customBgConfig, sceneObjects, blocksMap, customAssets, audioTrack, soundCues, user?.uid])

  // 3. Dismiss project menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false)
      }
    }
    if (projectMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [projectMenuOpen])

  // 4. Global window drag-and-drop listener for .cgproj and .json files
  useEffect(() => {
    function onDragOver(e: DragEvent) {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault()
      }
    }
    function onDrop(e: DragEvent) {
      if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return
      const file = e.dataTransfer.files[0]
      if (
        file.name.endsWith('.cgproj') ||
        file.name.endsWith('.cgproj.json') ||
        (file.name.endsWith('.json') && !e.defaultPrevented)
      ) {
        e.preventDefault()
        handleLoadProjectFile(file)
      }
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  // 24 FPS smooth timeline playback loop with Audio Track & Sound Cue synchronization
  useEffect(() => {
    if (!playing) {
      timelineAudio.stop()
      return
    }

    // Start background audio synchronized to the current playhead frame
    timelineAudio.play(frame, 24)

    const interval = window.setInterval(() => {
      setFrame(cur => {
        const next = cur >= 168 ? 0 : cur + 1
        // Fire any sound effect cues placed at this frame!
        timelineAudio.onFrameTick(next, soundCues)
        // If loop wrapped around, re-sync audio from frame 0
        if (cur >= 168) {
          timelineAudio.play(0, 24)
        }
        return next
      })
    }, 1000 / 24)

    return () => {
      window.clearInterval(interval)
      timelineAudio.stop()
    }
  }, [playing, soundCues])

  // Sync volume and mute changes with audio engine
  useEffect(() => {
    if (audioTrack) {
      timelineAudio.setVolume(audioTrack.volume)
      timelineAudio.setMuted(audioTrack.muted)
    }
  }, [audioTrack?.volume, audioTrack?.muted])

  // Scrub playhead handler that also seeks audio accurately
  function handleSetFrame(newFrame: number | ((f: number) => number)) {
    setFrame(prev => {
      const calculated = typeof newFrame === 'function' ? newFrame(prev) : newFrame
      if (!playing) {
        timelineAudio.seek(calculated, false, 24)
        timelineAudio.onFrameTick(calculated, soundCues)
      }
      return calculated
    })
  }

  // Filtered lists
  const filteredWorld = useMemo(() => {
    return worldAssets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
  }, [search])

  const filteredCharacter = useMemo(() => {
    return characterAssets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
  }, [search])

  const filteredCustom = useMemo(() => {
    return customAssets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
  }, [customAssets, search])

  // Selected Object Reference
  const selectedObj = sceneObjects.find(o => o.id === selectedId) || null

  // Currently selected Transformation Block
  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null
    for (const list of Object.values(blocksMap)) {
      const found = list.find(b => b.id === selectedBlockId)
      if (found) return found
    }
    return null
  }, [blocksMap, selectedBlockId])

  // Auto-cancel canvas picking if active block is deselected or changed away from translation
  useEffect(() => {
    if (!selectedBlock || selectedBlock.actionType !== 'translation') {
      setIsPickingTarget(false)
    }
  }, [selectedBlock])

  // Compute cumulative transformed objects AND hierarchical forward kinematics (M_world = M_parent × M_local)
  const displayObjects = useMemo(() => {
    const animated = sceneObjects.map(obj => {
      const blocks = blocksMap[obj.id] || []
      if (blocks.length > 0) {
        return evaluateCumulativeTransform(obj, blocks, frame)
      }
      return obj
    })
    return computeWorldHierarchy(animated)
  }, [sceneObjects, blocksMap, frame])

  // Handle object base updates
  function handleUpdateObject(id: string, updates: Partial<StageObject>) {
    setSceneObjects(prev =>
      prev.map(o => (o.id === id ? { ...o, ...updates } : o))
    )
  }

  // Add Sequential Action Block for an object
  function handleAddBlock(objectId: string, actionType?: TransformActionType) {
    const existing = blocksMap[objectId] || []
    const lastEnd = existing.length > 0 ? Math.max(...existing.map(b => b.endFrame)) : 1
    const startFrame = existing.length > 0 ? lastEnd : (frame > 0 ? frame : 1)
    const endFrame = Math.min(168, startFrame + 20)

    const type: TransformActionType = actionType || (
      existing.length === 0 ? 'translation' :
      existing.length === 1 ? 'rotation' :
      existing.length === 2 ? 'scaling' : 'shear'
    )

    const newBlock: TransformBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      objectId,
      actionType: type,
      startFrame,
      endFrame: Math.max(startFrame + 5, endFrame),
      dx: type === 'translation' ? 180 : 0,
      dy: 0,
      deltaRotation: type === 'rotation' ? 45 : 0,
      scaleX: type === 'scaling' ? 1.4 : 1,
      scaleY: type === 'scaling' ? 1.4 : 1,
      skewX: type === 'shear' ? 15 : 0,
      skewY: 0,
      easing: 'cubic',
    }

    setBlocksMap(prev => ({
      ...prev,
      [objectId]: [...(prev[objectId] || []), newBlock].sort((a, b) => a.startFrame - b.startFrame),
    }))
    setSelectedBlockId(newBlock.id)
    setSelectedId(objectId)
    setSelectedIds([objectId])
  }

  // Update existing block
  function handleUpdateBlock(blockId: string, updates: Partial<TransformBlock>) {
    setBlocksMap(prev => {
      const next: Record<string, TransformBlock[]> = {}
      for (const [objId, list] of Object.entries(prev)) {
        next[objId] = list.map(b => (b.id === blockId ? { ...b, ...updates } : b)).sort((a, b) => a.startFrame - b.startFrame)
      }
      return next
    })
  }

  // Delete a block
  function handleDeleteBlock(blockId: string) {
    setBlocksMap(prev => {
      const next: Record<string, TransformBlock[]> = {}
      for (const [objId, list] of Object.entries(prev)) {
        next[objId] = list.filter(b => b.id !== blockId)
      }
      return next
    })
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null)
    }
  }

  // Add Asset via Click
  function handleAddAssetToStage(asset: AssetDef) {
    const defaultX = 400 + Math.floor(Math.random() * 60)
    const defaultY = 200 + Math.floor(Math.random() * 50)
    insertAssetOnStage(asset, defaultX, defaultY)
  }

  // Add Asset via Drag-and-Drop at exact (dropX, dropY)
  function handleDropAssetAt(asset: AssetDef, dropX: number, dropY: number) {
    const w = asset.defaultW || 90
    const h = asset.defaultH || 90
    const x = Math.max(10, Math.min(950 - w, Math.round(dropX - w / 2)))
    const y = Math.max(10, Math.min(530 - h, Math.round(dropY - h / 2)))
    insertAssetOnStage(asset, x, y)
  }

  function insertAssetOnStage(asset: AssetDef, x: number, y: number) {
    const newId = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const newObj: StageObject = {
      id: newId,
      name: asset.name,
      icon: asset.icon,
      color: asset.color,
      kind: asset.kind,
      x,
      y,
      w: asset.defaultW || 90,
      h: asset.defaultH || 90,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      fillColor: asset.color,
      strokeColor: '#302E35',
      primitives: asset.primitives,
      imageUrl: asset.imageUrl,
    }

    setSceneObjects(prev => [...prev, newObj])
    setSelectedId(newId)
    setSelectedIds([newId])

    // Clean layer row with sequential blocks
    setBlocksMap(prev => ({
      ...prev,
      [newId]: [],
    }))
  }

  // Handle Project File Save (.cgproj / JSON)
  function handleSaveProjectFile() {
    const payload = createProjectPayload({
      projectName,
      theme,
      customBgConfig,
      sceneObjects,
      blocksMap,
      customAssets,
      audioTrack,
      soundCues,
    })
    downloadProjectFile(payload)
    setSaveStatus('saved')
    setProjectMenuOpen(false)
  }

  // Handle Project File Load (.cgproj / JSON)
  function handleLoadProjectFile(file: File) {
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      if (!text) return
      const parsed = parseProjectFile(text)
      if (parsed) {
        setProjectName(parsed.projectName)
        setTheme(parsed.theme)
        setCustomBgConfig(parsed.customBgConfig)
        setSceneObjects(parsed.sceneObjects)
        setBlocksMap(parsed.blocksMap)
        setCustomAssets(parsed.customAssets)
        setAudioTrack(parsed.audioTrack || null)
        setSoundCues(parsed.soundCues || [])
        if (parsed.audioTrack) {
          loadAudioTrackBuffer(parsed.audioTrack)
        } else {
          audioBufferRef.current = null
          timelineAudio.setBuffer(null)
        }
        setSelectedId(null)
        setSelectedIds([])
        setSelectedBlockId(null)
        setFrame(0)
        setPlaying(false)
        saveToLocalStorage(parsed)
        setSaveStatus('saved')
        setProjectMenuOpen(false)
      } else {
        alert('Invalid project file format. Please ensure this is a valid .cgproj or JSON project file.')
      }
    }
    reader.readAsText(file)
  }

  // Reset to Default Project State
  function handleResetProjectToDefault() {
    if (window.confirm('Reset project to blank default canvas? All unsaved objects and timeline tracks will be cleared.')) {
      clearLocalStorage()
      setProjectName('Untitled Animation')
      setTheme('countryside')
      setCustomBgConfig(defaultCustomBackground)
      setSceneObjects([])
      setBlocksMap({})
      setCustomAssets([])
      setAudioTrack(null)
      setSoundCues([])
      audioBufferRef.current = null
      timelineAudio.setBuffer(null)
      timelineAudio.stop()
      setSelectedId(null)
      setSelectedIds([])
      setSelectedBlockId(null)
      setFrame(0)
      setPlaying(false)
      setSaveStatus('saved')
      setProjectMenuOpen(false)
    }
  }

  // Handle Custom SVG / PNG / JPG / WebP Image Import
  function handleUploadImageFile(file: File, dropX?: number, dropY?: number) {
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return

      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Uploaded Asset'

      const img = new Image()
      img.onload = () => {
        let naturalW = img.naturalWidth || 100
        let naturalH = img.naturalHeight || 100

        // Scale down to fit cleanly on 960x540 stage (max 130px)
        const maxDim = 130
        let targetW = naturalW
        let targetH = naturalH
        if (targetW > maxDim || targetH > maxDim) {
          if (targetW >= targetH) {
            targetH = Math.round((targetH / targetW) * maxDim)
            targetW = maxDim
          } else {
            targetW = Math.round((targetW / targetH) * maxDim)
            targetH = maxDim
          }
        }
        targetW = Math.max(30, targetW)
        targetH = Math.max(30, targetH)

        // 1. Add as reusable item in customAssets
        const newAssetDef: AssetDef = {
          name: cleanName,
          icon: 'image',
          color: '#86AEB7',
          category: 'custom',
          defaultW: targetW,
          defaultH: targetH,
          kind: 'custom',
          imageUrl: dataUrl,
        }
        setCustomAssets(prev => [...prev, newAssetDef])

        // 2. Drop directly onto stage
        const placeX = dropX !== undefined
          ? Math.max(10, Math.min(950 - targetW, Math.round(dropX - targetW / 2)))
          : 400 + Math.floor(Math.random() * 50)
        const placeY = dropY !== undefined
          ? Math.max(10, Math.min(530 - targetH, Math.round(dropY - targetH / 2)))
          : 200 + Math.floor(Math.random() * 40)

        const newObjId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        const newObj: StageObject = {
          id: newObjId,
          name: cleanName,
          icon: 'image',
          color: '#86AEB7',
          kind: 'custom',
          imageUrl: dataUrl,
          x: placeX,
          y: placeY,
          w: targetW,
          h: targetH,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          skewY: 0,
          fillColor: '#86AEB7',
          strokeColor: '#302E35',
          parentId: null,
          pivotPreset: 'center',
        }

        setSceneObjects(prev => [...prev, newObj])
        setSelectedId(newObjId)
        setSelectedIds([newObjId])
        setBlocksMap(prev => ({
          ...prev,
          [newObjId]: [],
        }))
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  // Drop Standalone CG Primitive onto Stage
  function handleDropPrimitive(primitiveType: string, name: string) {
    const newId = `prim_${Date.now()}`
    const newObj: StageObject = {
      id: newId,
      name,
      icon: 'shapes',
      color: coral,
      kind: 'shape',
      tool: primitiveType,
      x: 380,
      y: 220,
      w: 100,
      h: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      fillColor: '#F5B941',
      strokeColor: '#302E35',
      strokeWidth: 3,
    }

    setSceneObjects(prev => [...prev, newObj])
    setSelectedId(newId)
    setSelectedIds([newId])

    // Clean start with sequential blocks
    setBlocksMap(prev => ({
      ...prev,
      [newId]: [],
    }))
  }

  // Save Custom Asset from Graphics Lab Modal
  function handleSaveCustomAsset(customAsset: CustomAssetData) {
    const newAsset: AssetDef = {
      name: customAsset.name,
      icon: 'shapes',
      color: customAsset.color,
      category: 'custom',
      defaultW: 130,
      defaultH: 100,
      kind: 'custom',
      primitives: customAsset.primitives,
    }
    setCustomAssets(prev => [...prev, newAsset])

    // Also add to stage canvas with clean timeline track
    insertAssetOnStage(newAsset, 400, 220)

    if (user?.uid) {
      saveUserCustomAsset(user.uid, newAsset).catch(e => console.warn('Custom asset sync:', e))
      logUserActivity(user.uid, {
        icon: '🎨',
        title: `Created custom asset '${newAsset.name}'`,
        details: `Drawn using ${customAsset.primitives?.map((p: any) => p.tool).join(', ') || 'CG Primitives'}`,
        badge: 'Custom Asset',
      }).catch(e => console.warn('Activity log error:', e))
    }
  }

  // When a user selects a Template, the stage starts CLEAN (0 objects on timeline by default)
  function handleSelectTemplate(newTheme: SceneTheme) {
    setTheme(newTheme)
    setSceneObjects([])
    setBlocksMap({})
    setSelectedBlockId(null)
    setSelectedId(null)
    setSelectedIds([])
    setFrame(0)
    setPlaying(false)
  }

  function handleApplyCustomBackground(config: CustomBackgroundConfig) {
    setCustomBgConfig(config)
    handleSelectTemplate('custom')
  }

  function handleDuplicate(id: string) {
    const obj = sceneObjects.find(o => o.id === id)
    if (!obj) return
    const newId = `${obj.id}_copy_${Date.now()}`
    const copy: StageObject = {
      ...obj,
      id: newId,
      name: `${obj.name} (Copy)`,
      x: obj.x + 25,
      y: obj.y + 25,
    }
    setSceneObjects(prev => [...prev, copy])
    setSelectedId(newId)
    setSelectedIds([newId])

    const existingBlocks = blocksMap[id] || []
    const copiedBlocks = existingBlocks.map(b => ({
      ...b,
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      objectId: newId,
    }))
    setBlocksMap(prev => ({
      ...prev,
      [newId]: copiedBlocks,
    }))
  }

  // Multi-object and single-object selection handler
  function handleSelectObject(id: string, isShift?: boolean) {
    if (isShift) {
      setSelectedIds(prev => {
        const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        if (next.includes(id)) {
          setSelectedId(id)
        } else if (next.length > 0) {
          setSelectedId(next[next.length - 1])
        } else {
          setSelectedId(null)
        }
        return next
      })
    } else {
      setSelectedIds([id])
      setSelectedId(id)
      if (selectedBlock && selectedBlock.objectId !== id) {
        setSelectedBlockId(null)
      }
    }
  }

  function handleSelectMultiple(ids: string[]) {
    setSelectedIds(ids)
    if (ids.length > 0) {
      if (selectedId && ids.includes(selectedId)) {
        // Keep current selected object as primary if it's still in the selection
      } else {
        setSelectedId(ids[ids.length - 1])
      }
    } else {
      setSelectedId(null)
      setSelectedBlockId(null)
    }
  }

  function handleUpdateMultipleObjects(updatesMap: Record<string, Partial<StageObject>>) {
    setSceneObjects(prev =>
      prev.map(o => (updatesMap[o.id] ? { ...o, ...updatesMap[o.id] } : o))
    )
  }

  function handleDeleteMultiple(idsToDelete: string[]) {
    if (idsToDelete.length === 0) return
    const idSet = new Set(idsToDelete)

    setSceneObjects(prev =>
      prev
        .filter(o => !idSet.has(o.id))
        .map(o => (o.parentId && idSet.has(o.parentId) ? { ...o, parentId: null } : o))
    )

    setBlocksMap(prev => {
      const next = { ...prev }
      for (const id of idsToDelete) {
        delete next[id]
      }
      return next
    })

    setSelectedIds(prev => prev.filter(id => !idSet.has(id)))
    if (selectedId && idSet.has(selectedId)) {
      setSelectedId(null)
      setSelectedBlockId(null)
    }
  }

  function handleDelete(id: string) {
    handleDeleteMultiple([id])
  }

  // Compound Grouping / Ungrouping
  const canUngroup = useMemo(() => {
    if (selectedIds.length === 0) return false
    const idSet = new Set(selectedIds)
    return sceneObjects.some(
      o => (idSet.has(o.id) && o.parentId != null) || (o.parentId != null && idSet.has(o.parentId))
    )
  }, [selectedIds, sceneObjects])

  function handleGroupSelected() {
    if (selectedIds.length < 2) return

    // Pick parent: primary selectedObj if in selectedIds, otherwise first element
    const parentId = (selectedId && selectedIds.includes(selectedId)) ? selectedId : selectedIds[0]
    const parentObj = displayObjects.find(o => o.id === parentId)
    if (!parentObj) return

    const parentWorldX = parentObj.worldX ?? parentObj.x
    const parentWorldY = parentObj.worldY ?? parentObj.y

    setSceneObjects(prev =>
      prev.map(o => {
        if (o.id === parentId) return o
        if (selectedIds.includes(o.id)) {
          const childWorld = displayObjects.find(d => d.id === o.id)
          const curWX = childWorld?.worldX ?? o.x
          const curWY = childWorld?.worldY ?? o.y
          return {
            ...o,
            parentId,
            x: Math.round(curWX - parentWorldX),
            y: Math.round(curWY - parentWorldY),
          }
        }
        return o
      })
    )
  }

  function handleUngroupSelected() {
    const idSet = new Set(selectedIds)

    setSceneObjects(prev =>
      prev.map(o => {
        if ((idSet.has(o.id) && o.parentId != null) || (o.parentId != null && idSet.has(o.parentId))) {
          const displayed = displayObjects.find(d => d.id === o.id)
          return {
            ...o,
            parentId: null,
            x: Math.round(displayed?.worldX ?? o.x),
            y: Math.round(displayed?.worldY ?? o.y),
          }
        }
        return o
      })
    )
  }

  // Quick Spawn Rigged Human with hierarchical parent-child kinematics & joint pivots
  function handleSpawnRiggedHuman() {
    const timestamp = Date.now()
    const torsoId = `torso_${timestamp}`
    const headId = `head_${timestamp}`
    const lArmId = `larm_${timestamp}`
    const rArmId = `rarm_${timestamp}`
    const lLegId = `lleg_${timestamp}`
    const rLegId = `rleg_${timestamp}`

    // Root coordinate centered on 960x540 artboard
    const rootX = 445
    const rootY = 175

    // 1. Torso (Parent: null / World Space Root)
    const torso: StageObject = {
      id: torsoId,
      name: 'Torso',
      icon: 'square',
      color: '#7B6DAF',
      kind: 'character',
      x: rootX,
      y: rootY,
      w: 70,
      h: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      fillColor: '#7B6DAF',
      strokeColor: '#302E35',
      parentId: null,
      pivotPreset: 'center',
    }

    // 2. Head (Parent: Torso, Neck joint pivot)
    const head: StageObject = {
      id: headId,
      name: 'Head',
      icon: 'user',
      color: '#E8BA94',
      kind: 'character',
      x: 5,
      y: -65,
      w: 60,
      h: 60,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      fillColor: '#E8BA94',
      strokeColor: '#302E35',
      parentId: torsoId,
      pivotPreset: 'bottom-center',
    }

    // 3. Left Arm (Parent: Torso, Left Shoulder joint pivot)
    const leftArm: StageObject = {
      id: lArmId,
      name: 'Left Arm',
      icon: 'line',
      color: '#7B6DAF',
      kind: 'character',
      x: -24,
      y: 8,
      w: 26,
      h: 70,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      fillColor: '#7B6DAF',
      strokeColor: '#302E35',
      parentId: torsoId,
      pivotPreset: 'top-center',
    }

    // 4. Right Arm (Parent: Torso, Right Shoulder joint pivot)
    const rightArm: StageObject = {
      id: rArmId,
      name: 'Right Arm',
      icon: 'line',
      color: '#7B6DAF',
      kind: 'character',
      x: 68,
      y: 8,
      w: 26,
      h: 70,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      fillColor: '#7B6DAF',
      strokeColor: '#302E35',
      parentId: torsoId,
      pivotPreset: 'top-center',
    }

    // 5. Left Leg (Parent: Torso, Left Hip joint pivot)
    const leftLeg: StageObject = {
      id: lLegId,
      name: 'Left Leg',
      icon: 'line',
      color: '#3D485C',
      kind: 'character',
      x: 4,
      y: 95,
      w: 28,
      h: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      fillColor: '#3D485C',
      strokeColor: '#302E35',
      parentId: torsoId,
      pivotPreset: 'top-center',
    }

    // 6. Right Leg (Parent: Torso, Right Hip joint pivot)
    const rightLeg: StageObject = {
      id: rLegId,
      name: 'Right Leg',
      icon: 'line',
      color: '#272E3D',
      kind: 'character',
      x: 38,
      y: 95,
      w: 28,
      h: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      fillColor: '#272E3D',
      strokeColor: '#302E35',
      parentId: torsoId,
      pivotPreset: 'top-center',
    }

    setSceneObjects(prev => [...prev, torso, head, leftArm, rightArm, leftLeg, rightLeg])
    setSelectedId(torsoId)
    setSelectedIds([torsoId, headId, lArmId, rArmId, lLegId, rLegId])
    setBlocksMap(prev => ({
      ...prev,
      [torsoId]: [],
      [headId]: [],
      [lArmId]: [],
      [rArmId]: [],
      [lLegId]: [],
      [rLegId]: [],
    }))
  }

  function handleToggleHide(id: string) {
    setHiddenMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleToggleLock(id: string) {
    setLockedMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Keyboard shortcuts: ⌘K, Pan/Zoom, Multi-Select Group/Ungroup & Delete
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isInput = targetTag === 'input' || targetTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setGraphicsLabOpen(true)
        return
      }

      if (isInput) return

      // Zoom Reset (Ctrl + 0)
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setViewportZoom(1.0)
        setViewportPan({ x: 0, y: 0 })
        return
      }

      // Group: Ctrl/Cmd + G (without Shift)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (selectedIds.length >= 2) {
          handleGroupSelected()
        }
        return
      }

      // Ungroup: Ctrl/Cmd + Shift + G
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        handleUngroupSelected()
        return
      }

      // Tool shortcuts: V = Select, H = Hand / Pan
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === 'v') {
          setActiveTool('select')
        } else if (e.key.toLowerCase() === 'h') {
          setActiveTool('hand')
        }
      }

      // Delete / Backspace for multi-selection deletion
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault()
          handleDeleteMultiple(selectedIds)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedIds, displayObjects, sceneObjects, selectedId])

  return (
    <main className="studio-shell">
      {/* Studio Top Navbar */}
      <header className="studio-topbar">
        <div className="studio-brand">
          <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span className="brand-mark small">
              <Sparkles size={13} />
            </span>
            <strong>2D Animation Studio</strong>
          </div>
          <span className="top-divider" />

          {/* Project Title & Management Dropdown */}
          <div style={{ position: 'relative' }} ref={projectMenuRef}>
            <button
              className="project-name"
              onClick={() => setProjectMenuOpen(v => !v)}
              title="Project file options, auto-save & scene template"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 8px',
                borderRadius: '6px',
                background: projectMenuOpen ? '#EAE4D7' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {projectName}
              </span>
              <ChevronDown size={13} style={{ opacity: 0.7 }} />
            </button>

            {projectMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: '#FFFDF9',
                  border: '1px solid #D8CFC0',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(48, 46, 53, 0.16)',
                  width: '240px',
                  zIndex: 100,
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {/* Editable Project Name */}
                <div style={{ padding: '4px 6px 8px', borderBottom: '1px solid #EFEAE0' }}>
                  <label style={{ fontSize: '9px', fontWeight: 700, color: '#978C82', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
                    PROJECT NAME
                  </label>
                  <input
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '100%',
                      background: '#FAF6F0',
                      border: '1px solid #D6CABA',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      fontSize: '11px',
                      color: 'var(--ink)',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                    placeholder="Enter project name..."
                  />
                </div>

                {/* Save Project (.cgproj) */}
                <button
                  onClick={handleSaveProjectFile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 9px',
                    borderRadius: '6px',
                    background: 'transparent',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F3EFE6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Save size={14} style={{ color: 'var(--coral)' }} />
                  <span>💾 Save Project (.cgproj)</span>
                </button>

                {/* Load Project (.cgproj / .json) */}
                <button
                  onClick={() => {
                    projectFileInputRef.current?.click()
                    setProjectMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 9px',
                    borderRadius: '6px',
                    background: 'transparent',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F3EFE6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <FolderOpen size={14} style={{ color: '#7B6DAF' }} />
                  <span>📂 Load Project (.cgproj / .json)</span>
                </button>

                {/* Switch Scene Template */}
                <button
                  onClick={() => {
                    setTemplatesOpen(true)
                    setProjectMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 9px',
                    borderRadius: '6px',
                    background: 'transparent',
                    fontSize: '11px',
                    color: '#635B55',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F3EFE6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Shapes size={14} style={{ color: '#6A9B72' }} />
                  <span>🎨 Change Scene Template...</span>
                </button>

                <div style={{ height: '1px', background: '#EFEAE0', margin: '2px 0' }} />

                {/* Reset to Default */}
                <button
                  onClick={handleResetProjectToDefault}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 9px',
                    borderRadius: '6px',
                    background: 'transparent',
                    fontSize: '11px',
                    color: '#BA4437',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FDEEEB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <RefreshCw size={14} />
                  <span>↺ Reset to Default</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Auto-Save Indicator */}
          {saveStatus === 'saving' ? (
            <span className="saved" style={{ color: '#B57418', fontWeight: 600 }}>
              <i style={{ background: '#E5A93C', boxShadow: '0 0 0 3px rgba(229, 169, 60, 0.35)' }} /> Saving...
            </span>
          ) : (
            <span className="saved" style={{ color: '#658D5A', fontWeight: 500 }}>
              <i style={{ background: '#7CA86E', boxShadow: '0 0 0 3px rgba(124, 168, 110, 0.25)' }} /> All changes saved
            </span>
          )}
        </div>

        {/* Hidden File Inputs for Project & Image Uploads */}
        <input
          type="file"
          ref={projectFileInputRef}
          accept=".cgproj,.json,application/json"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleLoadProjectFile(e.target.files[0])
              e.target.value = ''
            }
          }}
        />
        <input
          type="file"
          ref={imageUploadRef}
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleUploadImageFile(e.target.files[0])
              e.target.value = ''
            }
          }}
        />

        <div className="top-actions">
          {/* Prominent Save to My Profile button */}
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="coral-button"
            onClick={handleSaveToMyProfile}
            title="Save and sync project to your personal cloud profile"
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              height: '30px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(217, 93, 78, 0.25)',
            }}
          >
            <Cloud size={13} />
            <span>💾 Save to Profile</span>
          </motion.button>

          {/* Quick Save & Load Buttons */}
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="outline-button"
            onClick={handleSaveProjectFile}
            title="Save project file (.cgproj / .json)"
            style={{ padding: '6px 10px', fontSize: '11px', height: '30px' }}
          >
            <Save size={13} style={{ color: 'var(--coral)' }} />
            <span>Save .cgproj</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="outline-button"
            onClick={() => projectFileInputRef.current?.click()}
            title="Load project file (.cgproj / .json)"
            style={{ padding: '6px 10px', fontSize: '11px', height: '30px' }}
          >
            <FolderOpen size={13} style={{ color: '#7B6DAF' }} />
            <span>Load</span>
          </motion.button>

          <span className="toolbar-sep" style={{ margin: '0 3px' }} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="icon-button"
            title="Undo (⌘Z)"
          >
            <Undo2 size={17} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="icon-button"
            title="Redo (⌘⇧Z)"
          >
            <Redo2 size={17} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="lavender-button"
            onClick={() => setPreviewOpen(true)}
            title="Preview 24 FPS animation looping"
          >
            <Play size={14} fill="currentColor" /> Preview
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="coral-button"
            onClick={() => setExportOpen(true)}
            title="Export animation to GIF/MP4/PNG"
          >
            <Download size={15} /> Export Video
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="icon-button"
            onClick={() => setDocsOpen(true)}
            title="Computer Graphics Algorithms &amp; Documentation"
          >
            <Settings2 size={17} />
          </motion.button>

          <UserMenu
            compact
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenProfile={onOpenProfile}
            onSaveProject={handleSaveProjectFile}
            onLoadProject={() => projectFileInputRef.current?.click()}
          />
        </div>
      </header>

      {/* Main Studio 3-Column Grid */}
      <div className="studio-grid">
        {/* Left Sidebar: Asset Library (Clean single vertical scrollbar) */}
        <aside
          className="left-sidebar panel"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
          }}
        >
          <div className="side-heading">
            <div>
              <span className="kicker">LIBRARY</span>
              <h2>Asset Library</h2>
            </div>
            <button
              className="square-button"
              onClick={() => setGraphicsLabOpen(true)}
              title="Create custom CG shape"
              aria-label="Create custom asset"
            >
              <Plus size={17} />
            </button>
          </div>

          {/* Action buttons: Create Custom CG Shape + Upload Image */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <button
              className="create-asset"
              onClick={() => setGraphicsLabOpen(true)}
              title="Create custom shape with Computer Graphics algorithms (⌘K)"
            >
              <Sparkles size={15} /> Create Asset <span>⌘ K</span>
            </button>
            <button
              onClick={() => imageUploadRef.current?.click()}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                background: '#FAF6F0',
                border: '1.5px dashed #C8BDB0',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#4C4540',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--coral)'
                e.currentTarget.style.color = 'var(--coral)'
                e.currentTarget.style.background = '#FFF8F6'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#C8BDB0'
                e.currentTarget.style.color = '#4C4540'
                e.currentTarget.style.background = '#FAF6F0'
              }}
              title="Upload PNG, SVG, JPG, or WebP image"
            >
              <Upload size={13} style={{ color: 'var(--coral)' }} />
              <span>⬆️ Upload PNG / SVG</span>
            </button>
          </div>

          <div className="search-field">
            <Search size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search library..."
            />
            <span>⌘F</span>
          </div>

          {/* Library Tabs */}
          <div className="tab-row">
            {(['Objects', 'Shapes', 'Scenes'] as const).map(t => (
              <button
                key={t}
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab 1: Objects (World Objects + Character Rigging Parts) */}
          {tab === 'Objects' && (
            <div style={{ width: '100%' }}>
              <div
                style={{
                  background: '#EAE4D766',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '9px',
                  color: '#7C726A',
                  marginBottom: '10px',
                  lineHeight: 1.4,
                }}
              >
                💡 <strong>Click</strong> or <strong>Drag &amp; Drop</strong> any asset onto the stage canvas.
              </div>

              {/* 1. World Objects Section */}
              <p className="section-label">
                WORLD OBJECTS <span>{filteredWorld.length}</span>
              </p>
              <div className="asset-grid" style={{ marginBottom: '14px' }}>
                {filteredWorld.map(asset => (
                  <button
                    className="asset-card"
                    key={asset.name}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('application/json', JSON.stringify(asset))
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => handleAddAssetToStage(asset)}
                    title={`Click or drag ${asset.name} onto canvas`}
                  >
                    <span
                      className="asset-icon"
                      style={{ background: `${asset.color}18` }}
                    >
                      <AssetIcon type={asset.icon} color={asset.color} />
                    </span>
                    <span style={{ fontSize: '10px' }}>{asset.name}</span>
                    <Plus size={12} style={{ color: '#B8ACA0' }} />
                  </button>
                ))}
              </div>

              {/* 2. Character & Rigging Parts Section */}
              <p className="section-label" style={{ color: '#6A5C94' }}>
                CHARACTER &amp; RIGGING PARTS <span>{filteredCharacter.length}</span>
              </p>

              {/* Quick Spawn Rigged Human Button */}
              <button
                onClick={handleSpawnRiggedHuman}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #F0ECF8 0%, #E3DCF2 100%)',
                  border: '1.5px solid #C9BEE4',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#473B6F',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  boxShadow: '0 2px 6px rgba(123, 109, 175, 0.12)',
                  textAlign: 'left',
                }}
                title="Drop a connected Torso + Head + 2 Arms + 2 Legs parent-locked to Torso"
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: '#7B6DAF',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <UserRound size={14} />
                </span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '10.5px' }}>⚡ Quick Spawn Rigged Human</strong>
                  <small style={{ fontSize: '8.5px', color: '#6E6290', display: 'block' }}>
                    Torso + Head + Arms + Legs with joint pins
                  </small>
                </span>
              </button>
              <div className="asset-grid" style={{ marginBottom: '16px' }}>
                {filteredCharacter.map(asset => (
                  <button
                    className="asset-card"
                    key={asset.name}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('application/json', JSON.stringify(asset))
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => handleAddAssetToStage(asset)}
                    title={`Click or drag ${asset.name} onto canvas to rig`}
                    style={{ borderLeft: '2px solid #7B6DAF' }}
                  >
                    <span
                      className="asset-icon"
                      style={{ background: '#7B6DAF18' }}
                    >
                      <AssetIcon type={asset.icon} color={asset.color} />
                    </span>
                    <span style={{ fontSize: '10px' }}>{asset.name}</span>
                    <Plus size={12} style={{ color: '#B8ACA0' }} />
                  </button>
                ))}
              </div>

              {/* 3. My Custom Assets Section */}
              <p className="section-label custom-label">
                MY CUSTOM ASSETS <span>{customAssets.length}</span>
              </p>

              {customAssets.length > 0 && (
                <div className="asset-grid" style={{ marginBottom: '10px' }}>
                  {filteredCustom.map((asset, idx) => (
                    <button
                      className="asset-card"
                      key={`${asset.name}-${idx}`}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('application/json', JSON.stringify(asset))
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onClick={() => handleAddAssetToStage(asset)}
                    >
                      <span
                        className="asset-icon"
                        style={{ background: `${asset.color}18`, overflow: 'hidden', padding: asset.imageUrl ? '2px' : 0 }}
                      >
                        {asset.imageUrl ? (
                          <img src={asset.imageUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <AssetIcon type="shapes" color={asset.color} />
                        )}
                      </span>
                      <span style={{ fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {asset.name}
                      </span>
                      <Plus size={12} />
                    </button>
                  ))}
                </div>
              )}

              <div
                className="custom-empty"
                onClick={() => setGraphicsLabOpen(true)}
              >
                <span>
                  <Plus size={18} />
                </span>
                <div>
                  <strong>Build something new</strong>
                  <small>Combine primitives into an asset</small>
                </div>
              </div>

              {/* Graphics Lab Card in normal sidebar flow below custom assets */}
              <button
                className="sidebar-tip"
                onClick={() => setGraphicsLabOpen(true)}
              >
                <Sparkles size={16} />
                <span>
                  <strong>Graphics Lab</strong>
                  <small>Build with CG algorithms</small>
                </span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Tab 2: Standalone CG Primitives */}
          {tab === 'Shapes' && (
            <div className="shape-list" style={{ width: '100%' }}>
              {[
                ['line-bresenham', 'Bresenham Line', 'Integer error rasterization', 'line'],
                ['line-dda', 'DDA Line', 'Digital differential analyzer', 'line'],
                ['circle-midpoint', 'Midpoint Circle', '8-way symmetry math', 'circle'],
                ['rect', 'Rectangle', '4-vertex polygon bounds', 'square'],
                ['polygon', 'Polygon', 'Arbitrary vertices & pen', 'shapes'],
                ['bezier', 'Bézier Curve', 'Parametric cubic curve B(t)', 'wind'],
              ].map(([id, name, desc, icon]) => (
                <button
                  key={id}
                  onClick={() => handleDropPrimitive(id, name)}
                  title={`Drop ${name} directly onto stage`}
                >
                  <span className="shape-symbol">
                    <AssetIcon type={icon} color="#7B6DAF" />
                  </span>
                  <span>
                    <strong>{name}</strong>
                    <small>{desc}</small>
                  </span>
                  <Plus size={14} />
                </button>
              ))}
            </div>
          )}

          {/* Tab 3: Background Templates (Pure Environments + Custom) */}
          {tab === 'Scenes' && (
            <div className="scene-list" style={{ width: '100%' }}>
              <div
                style={{
                  background: '#EAE4D766',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '9px',
                  color: '#7C726A',
                  marginBottom: '6px',
                }}
              >
                ⚡ Selecting a template starts with a clean stage and 0 timeline layers.
              </div>

              {/* 1. Blank Canvas */}
              <button
                className={theme === 'blank' ? 'selected-template' : ''}
                onClick={() => handleSelectTemplate('blank')}
              >
                <span className="scene-thumb blank" />
                <span>
                  <strong>Blank Canvas</strong>
                  <small>Clean white/cream coordinate grid</small>
                </span>
              </button>

              {/* 2. Sunny Beach */}
              <button
                className={theme === 'beach' ? 'selected-template' : ''}
                onClick={() => handleSelectTemplate('beach')}
              >
                <span
                  className="scene-thumb"
                  style={{
                    background: 'linear-gradient(#70BFD1 0%, #BFE7F0 48%, #1D7C9E 48%, #2086AA 60%, #E8C197 60%, #F5D7B3 100%)',
                  }}
                />
                <span>
                  <strong>Sunny Beach</strong>
                  <small>Ocean waves, sandy shore &amp; palm horizon</small>
                </span>
              </button>

              {/* 3. Countryside Scenery */}
              <button
                className={theme === 'countryside' ? 'selected-template' : ''}
                onClick={() => handleSelectTemplate('countryside')}
              >
                <span className="scene-thumb countryside" />
                <span>
                  <strong>Countryside Scenery</strong>
                  <small>Rolling green hills &amp; dirt path</small>
                </span>
              </button>

              {/* 4. Midnight Highway */}
              <button
                className={theme === 'midnight' ? 'selected-template' : ''}
                onClick={() => handleSelectTemplate('midnight')}
              >
                <span className="scene-thumb night" />
                <span>
                  <strong>Midnight Highway</strong>
                  <small>Starry night sky &amp; flat road</small>
                </span>
              </button>

              {/* 5. + Create Custom Background */}
              <button
                onClick={() => setCustomBgModalOpen(true)}
                style={{
                  border: '1.5px dashed var(--coral)',
                  background: '#FFF8F6',
                  color: 'var(--coral)',
                }}
              >
                <span
                  className="shape-symbol"
                  style={{ background: '#FCECE9', color: 'var(--coral)' }}
                >
                  <Plus size={16} />
                </span>
                <span>
                  <strong>+ Create Custom Background</strong>
                  <small style={{ color: '#978C82' }}>Pick sky/ground colors &amp; horizon</small>
                </span>
              </button>
            </div>
          )}
        </aside>

        {/* Center Section: Workspace & 960 × 540 Stage */}
        <section className="workspace">
          {/* Workspace Toolbar */}
          <div className="workspace-toolbar">
            <div className="mode-switch">
              <button
                className={mode === 'edit' ? 'active' : ''}
                onClick={() => setMode('edit')}
              >
                <MousePointer2 size={14} /> Edit Mode
              </button>
              <button
                className={mode === 'animate' ? 'active' : ''}
                onClick={() => setMode('animate')}
              >
                <Sparkles size={14} /> Animate Mode
              </button>
            </div>

            <div className="tool-group">
              <button
                className={activeTool === 'select' ? 'active' : ''}
                onClick={() => setActiveTool('select')}
                title="Selection Tool (V) - Click & Marquee Box Drag"
              >
                <MousePointer2 size={16} />
              </button>
              <button
                className={activeTool === 'hand' ? 'active' : ''}
                onClick={() => setActiveTool('hand')}
                title="Hand Tool (H) - Pan Stage Canvas"
              >
                <Hand size={16} />
              </button>
              <button
                className={activeTool === 'move' ? 'active' : ''}
                onClick={() => setActiveTool('move')}
                title="Move Tool"
              >
                <Move size={16} />
              </button>
            </div>

            {/* Clean Zoom Control Pill: - | 100% | + | Fit to Screen */}
            <div
              className="zoom-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#FAF6F0',
                border: '1px solid #D8CFC0',
                borderRadius: '8px',
                padding: '2px 4px',
                gap: '2px',
                boxShadow: '0 1px 3px rgba(48, 46, 53, 0.05)',
              }}
            >
              <button
                onClick={() => setViewportZoom(z => Math.max(0.25, Math.round((z - 0.1) * 10) / 10))}
                title="Zoom Out (Ctrl -)"
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '5px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <ZoomOut size={13} />
              </button>

              <button
                onClick={() => {
                  setViewportZoom(1.0)
                  setViewportPan({ x: 0, y: 0 })
                }}
                title="Click to reset zoom to 100%"
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: 'var(--ink)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: '45px',
                  textAlign: 'center',
                }}
              >
                {Math.round(viewportZoom * 100)}%
              </button>

              <button
                onClick={() => setViewportZoom(z => Math.min(4.0, Math.round((z + 0.1) * 10) / 10))}
                title="Zoom In (Ctrl +)"
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '5px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <ZoomIn size={13} />
              </button>

              <button
                onClick={() => {
                  setViewportZoom(1.0)
                  setViewportPan({ x: 0, y: 0 })
                }}
                title="Fit to Screen (Reset Pan & Zoom 100%)"
                style={{
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: '#635B55',
                  background: '#F0ECE4',
                  border: '1px solid #D8CFC0',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginLeft: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                Fit
              </button>
            </div>

            {/* Prominent Multi-Object Grouping Buttons in Top Canvas Toolbar */}
            {selectedIds.length >= 2 && (
              <button
                onClick={handleGroupSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'linear-gradient(135deg, #7B6DAF 0%, #6857A1 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(123, 109, 175, 0.3)',
                }}
                title="🔗 Group Selected Objects as Compound Unit (Ctrl+G)"
              >
                <span>🔗</span> Group Selected ({selectedIds.length})
              </button>
            )}

            {canUngroup && (
              <button
                onClick={handleUngroupSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#F0ECE4',
                  color: '#4C4540',
                  border: '1px solid #C8BDB0',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Ungroup Compound Objects (Ctrl+Shift+G)"
              >
                <span>🔓</span> Ungroup
              </button>
            )}

            <span className="toolbar-sep" />

            <button
              className="grid-toggle"
              onClick={() => setGrid(!grid)}
              title="Toggle Stage Coordinate Grid"
            >
              <span className={grid ? 'toggle on' : 'toggle'}>
                <i />
              </span>{' '}
              Grid
            </button>

            <span className="coords">
              {selectedIds.length > 1 ? (
                <span style={{ color: '#7B6DAF', fontWeight: 600 }}>
                  {selectedIds.length} Objects Selected
                </span>
              ) : selectedObj ? (
                `X ${selectedObj.x} · Y ${selectedObj.y} · ${selectedObj.rotation}°`
              ) : (
                'X 0 · Y 0'
              )}
            </span>

            <button
              className="graphics-button"
              onClick={() => setGraphicsLabOpen(true)}
            >
              <Sparkles size={15} /> Graphics Lab <ArrowRight size={14} />
            </button>
          </div>

          {/* Stage Zone */}
          <div className="stage-zone">
            <div className="stage-label">
              <span>SCENE: {theme.toUpperCase()}</span>
              <span>960 × 540 PX</span>
              <span className="stage-live">
                <i /> {sceneObjects.length} OBJECT{sceneObjects.length !== 1 ? 'S' : ''}
              </span>
            </div>

            {/* Interactive 960 × 540 Stage with Drag-and-Drop */}
            <StageCanvas
              objects={displayObjects}
              selectedId={selectedId}
              selectedIds={selectedIds}
              onSelectObject={handleSelectObject}
              onSelectMultiple={handleSelectMultiple}
              onUpdateObject={handleUpdateObject}
              onUpdateMultipleObjects={handleUpdateMultipleObjects}
              onDropAsset={handleDropAssetAt}
              onDropImageFile={(file, dropX, dropY) => handleUploadImageFile(file, dropX, dropY)}
              activeBlock={selectedBlock}
              onUpdateActiveBlock={handleUpdateBlock}
              blocksMap={blocksMap}
              isPickingTarget={isPickingTarget}
              onStopPickingTarget={() => setIsPickingTarget(false)}
              hiddenMap={hiddenMap}
              lockedMap={lockedMap}
              grid={grid}
              theme={theme}
              customConfig={customBgConfig}
              isAnimateMode={mode === 'animate'}
              zoom={viewportZoom}
              onZoomChange={setViewportZoom}
              pan={viewportPan}
              onPanChange={setViewportPan}
              activeTool={activeTool}
            />
          </div>
        </section>

        {/* Right Sidebar: Selected Object Inspector with Active Action Editor */}
        <RightInspector
          selected={selectedObj}
          allObjects={sceneObjects}
          onUpdate={updates => {
            if (selectedId) handleUpdateObject(selectedId, updates)
          }}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onGroupSelected={handleGroupSelected}
          onUngroupSelected={handleUngroupSelected}
          canUngroup={canUngroup}
          onDeleteSelected={() => handleDeleteMultiple(selectedIds)}
          blocks={selectedId ? (blocksMap[selectedId] || []) : []}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onAddBlock={handleAddBlock}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          isPickingTarget={isPickingTarget}
          onTogglePickTarget={setIsPickingTarget}
        />
      </div>

      {/* Bottom 24 FPS Timeline with Sequential Transformation Block Clips & Dedicated Audio Track */}
      <TimelinePanel
        objects={sceneObjects}
        selectedId={selectedId}
        selectedIds={selectedIds}
        onSelectObject={handleSelectObject}
        frame={frame}
        setFrame={handleSetFrame}
        playing={playing}
        setPlaying={setPlaying}
        blocksMap={blocksMap}
        selectedBlockId={selectedBlockId}
        onSelectBlock={setSelectedBlockId}
        onAddBlock={handleAddBlock}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        onToggleHide={handleToggleHide}
        onToggleLock={handleToggleLock}
        hiddenMap={hiddenMap}
        lockedMap={lockedMap}
        audioTrack={audioTrack}
        soundCues={soundCues}
        onUpdateAudioTrack={updates => {
          setAudioTrack(prev => {
            if (!prev) return null
            const next = { ...prev, ...updates }
            if (updates.volume !== undefined) timelineAudio.setVolume(updates.volume)
            if (updates.muted !== undefined) timelineAudio.setMuted(updates.muted)
            return next
          })
        }}
        onOpenAudioModal={() => setAudioModalOpen(true)}
        onAddSoundCue={cue => {
          setSoundCues(prev => [...prev.filter(c => c.id !== cue.id), cue].sort((a, b) => a.frame - b.frame))
        }}
        onUpdateSoundCue={(id, updates) => {
          setSoundCues(prev =>
            prev.map(c => (c.id === id ? { ...c, ...updates } : c)).sort((a, b) => a.frame - b.frame)
          )
        }}
        onDeleteSoundCue={id => {
          setSoundCues(prev => prev.filter(c => c.id !== id))
        }}
      />

      {/* Audio Track & Sound FX Manager Modal */}
      <AudioModal
        isOpen={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
        currentFrame={frame}
        audioTrack={audioTrack}
        onSetAudioTrack={(track, buffer) => {
          setAudioTrack(track)
          if (track && buffer) {
            audioBufferRef.current = buffer
            timelineAudio.setBuffer(buffer)
            timelineAudio.setVolume(track.volume)
            timelineAudio.setMuted(track.muted)
          } else if (!track) {
            audioBufferRef.current = null
            timelineAudio.setBuffer(null)
            timelineAudio.stop()
          }
        }}
        onAddSoundCue={cue => {
          setSoundCues(prev => [...prev.filter(c => c.id !== cue.id), cue].sort((a, b) => a.frame - b.frame))
        }}
      />

      {/* Modals */}
      <GraphicsLabModal
        isOpen={graphicsLabOpen}
        onClose={() => setGraphicsLabOpen(false)}
        onSaveAsset={handleSaveCustomAsset}
      />

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        objects={sceneObjects}
        blocksMap={blocksMap}
        theme={theme}
        customConfig={customBgConfig}
      />

      <PreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        objects={sceneObjects}
        blocksMap={blocksMap}
        theme={theme}
        customConfig={customBgConfig}
      />

      <TemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        currentTheme={theme}
        onSelectTheme={handleSelectTemplate}
        onOpenCustomModal={() => setCustomBgModalOpen(true)}
      />

      <CustomBackgroundModal
        isOpen={customBgModalOpen}
        onClose={() => setCustomBgModalOpen(false)}
        onApply={handleApplyCustomBackground}
        initialConfig={customBgConfig}
      />

      <AlgorithmsDocsModal
        isOpen={docsOpen}
        onClose={() => setDocsOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </main>
  )
}

// -------------------------------------------------------------
// ROOT PAGE COMPONENT (STRICT AUTH GATE & ANIMATED DASHBOARD)
// -------------------------------------------------------------
export default function Page() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<'landing' | 'studio' | 'profile'>('landing')
  const [openShapeBuilderOnEnter, setOpenShapeBuilderOnEnter] = useState(false)
  const [projectToLoad, setProjectToLoad] = useState<CGProjectData | null>(null)

  // Auth Gate Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authBannerText, setAuthBannerText] = useState('')
  const [pendingDestination, setPendingDestination] = useState<'studio' | 'shape-builder' | 'profile' | 'templates' | null>(null)

  // Modals
  const [docsModalOpen, setDocsModalOpen] = useState(false)
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false)

  // Strict Protected Action Interceptor
  function handleProtectedAction(
    destination: 'studio' | 'shape-builder' | 'profile' | 'templates',
    bannerText: string = '✨ Sign in to open your Animation Studio & auto-save your work'
  ) {
    if (user) {
      if (destination === 'studio') {
        setProjectToLoad(null)
        setOpenShapeBuilderOnEnter(false)
        setCurrentView('studio')
      } else if (destination === 'shape-builder') {
        setProjectToLoad(null)
        setOpenShapeBuilderOnEnter(true)
        setCurrentView('studio')
      } else if (destination === 'profile') {
        setCurrentView('profile')
      } else if (destination === 'templates') {
        setTemplatesModalOpen(true)
      }
    } else {
      // User is NOT signed in: intercept and open Auth Modal with custom banner
      setPendingDestination(destination)
      setAuthBannerText(bannerText)
      setAuthModalOpen(true)
    }
  }

  // Called when login/signup succeeds
  function handleAuthSuccess() {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#D95D4E', '#F5B941', '#7B6DAF', '#6A9B72'],
      })
    } catch (e) {}

    const dest = pendingDestination || 'studio'
    setPendingDestination(null)

    if (dest === 'profile') {
      setCurrentView('profile')
    } else if (dest === 'shape-builder') {
      setOpenShapeBuilderOnEnter(true)
      setCurrentView('studio')
    } else if (dest === 'templates') {
      setTemplatesModalOpen(true)
    } else {
      setOpenShapeBuilderOnEnter(false)
      setCurrentView('studio')
    }
  }

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: '#FAF6F0' }}>
      <AnimatePresence mode="wait">
        {currentView === 'landing' && (
          <motion.div
            key="view-landing"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <Landing
              onOpenStudio={() => handleProtectedAction('studio')}
              onOpenShapeBuilder={() => handleProtectedAction('shape-builder')}
              onOpenDocs={() => setDocsModalOpen(true)}
              onOpenTemplates={() => handleProtectedAction('templates', '✨ Sign in to explore and create from starter templates')}
              onOpenProfile={() => handleProtectedAction('profile', '✨ Sign in to view and resume your saved animation projects')}
              onProtectedAction={handleProtectedAction}
            />
          </motion.div>
        )}

        {currentView === 'profile' && (
          <motion.div
            key="view-profile"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <ProfileDashboard
              onBack={() => setCurrentView('landing')}
              onOpenStudio={(project) => {
                if (project) {
                  setProjectToLoad(project)
                } else {
                  setProjectToLoad(null)
                }
                setOpenShapeBuilderOnEnter(false)
                setCurrentView('studio')
              }}
              onOpenGraphicsLab={() => {
                setProjectToLoad(null)
                setOpenShapeBuilderOnEnter(true)
                setCurrentView('studio')
              }}
            />
          </motion.div>
        )}

        {currentView === 'studio' && (
          <motion.div
            key="view-studio"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <Studio
              onBack={() => setCurrentView('landing')}
              onOpenProfile={() => setCurrentView('profile')}
              initialOpenModal={openShapeBuilderOnEnter}
              initialProjectData={projectToLoad}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AlgorithmsDocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />

      <TemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        currentTheme="countryside"
        onSelectTheme={() => {
          setTemplatesModalOpen(false)
          setProjectToLoad(null)
          setCurrentView('studio')
        }}
        onOpenCustomModal={() => {
          setTemplatesModalOpen(false)
          setProjectToLoad(null)
          setCurrentView('studio')
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false)
          setPendingDestination(null)
        }}
        bannerText={authBannerText}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
