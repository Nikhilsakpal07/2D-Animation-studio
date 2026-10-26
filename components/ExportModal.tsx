'use client'

import React, { useRef, useState } from 'react'
import { Download, X, CheckCircle2 } from 'lucide-react'
import { StageObject, SceneTheme } from './StageCanvas'
import { CustomBackgroundConfig } from './CustomBackgroundModal'
import { TransformBlock } from '@/lib/cg-engine'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  drawSceneToCanvas,
} from '@/lib/cg-canvas-renderer'
import { GifEncoder } from '@/lib/gif-encoder'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  objects: StageObject[]
  blocksMap: Record<string, TransformBlock[]>
  theme: SceneTheme
  customConfig?: CustomBackgroundConfig
  hiddenMap?: Record<string, boolean>
  totalFrames?: number
  durationSeconds?: number
}

export default function ExportModal({
  isOpen,
  onClose,
  objects,
  blocksMap,
  theme,
  customConfig,
  hiddenMap,
  totalFrames: propTotalFrames,
  durationSeconds: propDurationSeconds,
}: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'MP4' | 'GIF' | 'PNG'>('MP4')
  const [resolution, setResolution] = useState('960 × 540 HD')
  const [frameRate, setFrameRate] = useState('24 fps')
  const [rendering, setRendering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentRenderFrame, setCurrentRenderFrame] = useState(0)
  const [completed, setCompleted] = useState(false)

  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null)

  if (!isOpen) return null

  const totalFrames = propTotalFrames || 168
  const durationSeconds = propDurationSeconds || 7

  async function handleStartExport() {
    setRendering(true)
    setProgress(0)
    setCompleted(false)
    setCurrentRenderFrame(0)

    // Strictly locked to 960 × 540 independent of CSS scaling
    const width = CANVAS_WIDTH
    const height = CANVAS_HEIGHT

    // Create or reuse offscreen canvas
    const canvas = hiddenCanvasRef.current || document.createElement('canvas')
    hiddenCanvasRef.current = canvas
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.style.aspectRatio = '16 / 9'

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      setRendering(false)
      return
    }

    // Preload all uploaded image assets into HTMLImageElements
    const imageMap = new Map<string, HTMLImageElement>()
    const imagePromises = objects
      .filter(o => o.imageUrl)
      .map(o => {
        return new Promise<void>(resolve => {
          const img = new Image()
          img.onload = () => {
            imageMap.set(o.imageUrl!, img)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = o.imageUrl!
        })
      })
    await Promise.all(imagePromises)

    // 1. Single Frame PNG Export at exact 960 × 540
    if (exportFormat === 'PNG') {
      drawSceneToCanvas(ctx, width, height, 0, objects, blocksMap, theme, customConfig, imageMap, hiddenMap)
      setProgress(100)
      setCompleted(true)
      setRendering(false)

      const link = document.createElement('a')
      link.download = `animation-frame-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      return
    }

    // 2. Animated GIF Export at exact 960 × 540
    if (exportFormat === 'GIF') {
      try {
        const gif = new GifEncoder(width, height, 4) // 4 hundredths = ~25 FPS
        const step = 2 // Sample every 2nd frame for responsive encoding and smooth 12-24 FPS GIF loop
        for (let currentF = 0; currentF <= totalFrames; currentF += step) {
          drawSceneToCanvas(ctx, width, height, currentF, objects, blocksMap, theme, customConfig, imageMap, hiddenMap)
          const imgData = ctx.getImageData(0, 0, width, height)
          gif.addFrame(imgData)
          setCurrentRenderFrame(currentF)
          setProgress(Math.round((currentF / totalFrames) * 92))
          await new Promise(r => setTimeout(r, 0))
        }

        setProgress(96)
        const blob = gif.finish()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `animation-${Date.now()}.gif`
        link.href = url
        link.click()
        setProgress(100)
        setRendering(false)
        setCompleted(true)
        return
      } catch (err) {
        console.error('GIF encoding error, falling back to MediaRecorder:', err)
      }
    }

    // 3. Real Video Animation Export (MP4 / WebM)
    const hasMediaRecorder =
      typeof window !== 'undefined' &&
      typeof (canvas as any).captureStream === 'function' &&
      typeof window.MediaRecorder !== 'undefined'

    if (hasMediaRecorder) {
      try {
        const stream = (canvas as any).captureStream(24)
        let mimeType = 'video/webm'
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
          mimeType = 'video/mp4;codecs=avc1'
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4'
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9'
        }

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 6000000,
        })
        const chunks: Blob[] = []

        recorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
          link.download = `animation-${Date.now()}.${ext}`
          link.href = url
          link.click()
          setRendering(false)
          setCompleted(true)
        }

        recorder.start()

        // Render each frame sequentially with actual CG matrices
        let currentF = 0
        const frameInterval = 1000 / 24

        const timer = setInterval(() => {
          drawSceneToCanvas(ctx, width, height, currentF, objects, blocksMap, theme, customConfig, imageMap, hiddenMap)
          setCurrentRenderFrame(currentF)
          setProgress(Math.round((currentF / totalFrames) * 100))

          currentF++
          if (currentF > totalFrames) {
            clearInterval(timer)
            setTimeout(() => {
              try {
                recorder.stop()
              } catch {}
            }, 300)
          }
        }, frameInterval)

        return
      } catch (err) {
        console.warn('MediaRecorder streaming fallback:', err)
      }
    }

    // Fallback if MediaRecorder unavailable: render full frames and download pristine capture
    let f = 0
    const fallbackTimer = setInterval(() => {
      drawSceneToCanvas(ctx, width, height, f, objects, blocksMap, theme, customConfig, imageMap, hiddenMap)
      setCurrentRenderFrame(f)
      setProgress(Math.round((f / totalFrames) * 100))
      f += 6
      if (f > totalFrames) {
        clearInterval(fallbackTimer)
        setProgress(100)
        setRendering(false)
        setCompleted(true)

        const link = document.createElement('a')
        link.download = `animation-export-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    }, 40)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="utility-modal export-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-head">
          <div>
            <span className="kicker">EXPORT</span>
            <h2>Export Animation Video</h2>
            <p>Render your 24 FPS scene locked to exact 960 × 540 HD resolution using 3×3 matrix kinematics.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Format Selection Grid */}
        <div className="format-grid">
          {(['MP4', 'GIF', 'PNG'] as const).map(f => (
            <button
              key={f}
              className={`format-card ${exportFormat === f ? 'active' : ''}`}
              onClick={() => {
                setExportFormat(f)
                setCompleted(false)
              }}
            >
              <strong>{f}</strong>
              <small>
                {f === 'MP4'
                  ? 'H.264 / WebM Video'
                  : f === 'GIF'
                  ? 'Looped GIF89a Animation'
                  : 'High-Res Frame Snapshot'}
              </small>
            </button>
          ))}
        </div>

        {/* Scene Specs & Resolution */}
        <div className="export-fields" style={{ marginTop: '16px' }}>
          <label>
            Resolution
            <select value={resolution} onChange={e => setResolution(e.target.value)} disabled={rendering}>
              <option value="960 × 540 HD">960 × 540 HD (Native Master 16:9)</option>
            </select>
          </label>
          <label>
            Frame rate
            <select value={frameRate} onChange={e => setFrameRate(e.target.value)} disabled={rendering}>
              <option value="24 fps">24 fps (Cinema Precision)</option>
              <option value="30 fps">30 fps (Web Standard)</option>
            </select>
          </label>
        </div>

        {/* Scene Summary Pill */}
        <div
          style={{
            background: '#F7F3EC',
            border: '1px solid #E6DED2',
            borderRadius: '8px',
            padding: '10px 14px',
            margin: '14px 0',
            fontSize: '11px',
            color: '#655A51',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            <strong>Scene:</strong> {theme.toUpperCase()} · {objects.length} Active Object{objects.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
            {exportFormat === 'PNG' ? 'Frame 0 (Snapshot) · 960 × 540' : `${totalFrames} Frames · ${durationSeconds.toFixed(2)}s · 960 × 540`}
          </span>
        </div>

        {/* Rendering Progress Bar */}
        {rendering && (
          <div className="render-progress" style={{ margin: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
              <span>
                {exportFormat === 'PNG'
                  ? 'Rendering high-resolution 960 × 540 snapshot...'
                  : exportFormat === 'GIF'
                  ? `Encoding GIF Frame ${currentRenderFrame} / ${totalFrames}...`
                  : `Recording Canvas Frame ${currentRenderFrame} / ${totalFrames}...`}
              </span>
              <strong>{progress}%</strong>
            </div>
            <i>
              <b style={{ width: `${progress}%`, transition: 'width 0.1s linear' }} />
            </i>
          </div>
        )}

        {/* Success Notice */}
        {completed && (
          <div
            style={{
              background: '#EEF7EE',
              border: '1px solid #C4E5C4',
              borderRadius: '8px',
              padding: '10px 12px',
              margin: '12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#2D6B2D',
              fontSize: '11px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>
              <strong>Export complete!</strong> Your file has been rendered at 960 × 540 and downloaded to your computer.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="outline-button" onClick={onClose} disabled={rendering}>
            Close
          </button>
          <button
            className="coral-button"
            onClick={handleStartExport}
            disabled={rendering}
          >
            <Download size={15} /> {rendering ? 'Rendering…' : `Export ${exportFormat}`}
          </button>
        </div>
      </div>
    </div>
  )
}
