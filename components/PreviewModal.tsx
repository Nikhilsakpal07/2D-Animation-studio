'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Play, Pause, X } from 'lucide-react'
import { StageObject, SceneTheme } from './StageCanvas'
import { CustomBackgroundConfig } from './CustomBackgroundModal'
import { TransformBlock } from '@/lib/cg-engine'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  drawSceneToCanvas,
} from '@/lib/cg-canvas-renderer'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  objects: StageObject[]
  blocksMap?: Record<string, TransformBlock[]>
  keyframesMap?: Record<string, any>
  theme: SceneTheme
  customConfig?: CustomBackgroundConfig
  hiddenMap?: Record<string, boolean>
  totalFrames?: number
  durationSeconds?: number
}

export default function PreviewModal({
  isOpen,
  onClose,
  objects,
  blocksMap = {},
  theme,
  customConfig,
  hiddenMap,
  totalFrames = 168,
  durationSeconds = 7,
}: PreviewModalProps) {
  const [frame, setFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageMapRef = useRef<Map<string, HTMLImageElement>>(new Map())

  // Preload any uploaded image objects
  useEffect(() => {
    if (!isOpen) return
    const imagePromises = objects
      .filter(o => o.imageUrl && !imageMapRef.current.has(o.imageUrl))
      .map(o => {
        return new Promise<void>(resolve => {
          const img = new Image()
          img.onload = () => {
            imageMapRef.current.set(o.imageUrl!, img)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = o.imageUrl!
        })
      })
    Promise.all(imagePromises)
  }, [isOpen, objects])

  // Playback timer (24 FPS)
  useEffect(() => {
    if (!isOpen || !isPlaying) return
    const interval = window.setInterval(() => {
      setFrame(f => (f >= totalFrames ? 0 : f + 1))
    }, 1000 / 24)
    return () => window.clearInterval(interval)
  }, [isOpen, isPlaying, totalFrames])

  // Render current frame to 960 × 540 canvas buffer
  useEffect(() => {
    if (!isOpen) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawSceneToCanvas(
      ctx,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      frame,
      objects,
      blocksMap,
      theme,
      customConfig,
      imageMapRef.current,
      hiddenMap
    )
  }, [isOpen, frame, objects, blocksMap, theme, customConfig, hiddenMap])

  if (!isOpen) return null

  const totalSeconds = frame / 24
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const centis = Math.floor((totalSeconds % 1) * 100)
  const timecodeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(centis).padStart(2, '0')}`

  const maxM = Math.floor(durationSeconds / 60)
  const maxS = Math.floor(durationSeconds % 60)
  const maxC = Math.floor((durationSeconds % 1) * 100)
  const maxTimecodeStr = `${String(maxM).padStart(2, '0')}:${String(maxS).padStart(2, '0')}:${String(maxC).padStart(2, '0')}`

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="utility-modal preview-modal"
        onClick={e => e.stopPropagation()}
        style={{ width: 'min(860px, 94vw)' }}
      >
        {/* Header */}
        <div className="modal-head">
          <div>
            <span className="kicker">PREVIEW</span>
            <h2>Looping Scene Preview</h2>
            <p>960 × 540 · Clean 24 FPS animation preview rendered on canvas buffer</p>
          </div>
          <button onClick={onClose} aria-label="Close preview">
            <X size={20} />
          </button>
        </div>

        {/* 960 × 540 Clean Stage Canvas */}
        <div
          className="preview-stage"
          style={{
            position: 'relative',
            aspectRatio: '16/9',
            width: 'calc(100% - 48px)',
            maxHeight: '440px',
            overflow: 'hidden',
            margin: '16px 24px 0',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            backgroundColor: theme === 'blank' ? '#FFFAF3' : '#CCE1E4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Preview Playback Bar */}
        <div className="preview-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="icon-button"
              style={{ background: 'var(--coral)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%' }}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <span style={{ color: '#72976D', fontWeight: 'bold' }}>● LIVE PREVIEW</span>
          </div>
          <span style={{ font: '11px monospace' }}>
            {timecodeStr} / {maxTimecodeStr} · Frame {frame} / {totalFrames}
          </span>
          <span style={{ background: '#E4DDD2', padding: '3px 7px', borderRadius: '4px', fontSize: '10px', font: '10px monospace' }}>
            24 FPS
          </span>
        </div>
      </div>
    </div>
  )
}
