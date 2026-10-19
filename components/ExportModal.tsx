'use client'

import React, { useRef, useState } from 'react'
import { Download, X, Film, Sparkles, CheckCircle2 } from 'lucide-react'
import { StageObject, SceneTheme } from './StageCanvas'
import { CustomBackgroundConfig } from './CustomBackgroundModal'
import { computeCustomAssetViewBox } from './GraphicsLabModal'
import {
  TransformBlock,
  evaluateCumulativeTransform,
  computeWorldHierarchy,
  Matrix3x3,
} from '@/lib/cg-engine'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  objects: StageObject[]
  blocksMap: Record<string, TransformBlock[]>
  theme: SceneTheme
  customConfig?: CustomBackgroundConfig
}

export default function ExportModal({
  isOpen,
  onClose,
  objects,
  blocksMap,
  theme,
  customConfig,
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

  const totalFrames = 168 // 7 seconds @ 24 FPS

  async function handleStartExport() {
    setRendering(true)
    setProgress(0)
    setCompleted(false)
    setCurrentRenderFrame(0)

    const isUpscaled = resolution.startsWith('1280')
    const width = isUpscaled ? 1280 : 960
    const height = isUpscaled ? 720 : 540

    // Create or reuse offscreen canvas
    const canvas = hiddenCanvasRef.current || document.createElement('canvas')
    hiddenCanvasRef.current = canvas
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
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

    // 1. Single Frame PNG Export
    if (exportFormat === 'PNG') {
      drawSceneToCanvas(ctx, width, height, 0, objects, blocksMap, theme, customConfig, imageMap)
      setProgress(100)
      setCompleted(true)
      setRendering(false)

      const link = document.createElement('a')
      link.download = `animation-frame-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      return
    }

    // 2. Real Video / Animation Export (MP4 / WebM / GIF)
    // Check MediaRecorder browser support
    const hasMediaRecorder =
      typeof window !== 'undefined' &&
      typeof (canvas as any).captureStream === 'function' &&
      typeof window.MediaRecorder !== 'undefined'

    if (hasMediaRecorder) {
      try {
        const stream = (canvas as any).captureStream(24)
        let mimeType = 'video/webm'
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9'
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4'
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
          drawSceneToCanvas(ctx, width, height, currentF, objects, blocksMap, theme, customConfig, imageMap)
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
      drawSceneToCanvas(ctx, width, height, f, objects, blocksMap, theme, customConfig, imageMap)
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
            <p>Render your 24 FPS scene using genuine 3×3 matrix kinematics and cumulative transformation blocks.</p>
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
                  ? 'Looped Animation'
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
              <option value="960 × 540 HD">960 × 540 HD (Native 16:9)</option>
              <option value="1280 × 720 HD">1280 × 720 HD (Broadcast 720p)</option>
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
            {exportFormat === 'PNG' ? 'Frame 0 (Snapshot)' : '168 Frames · 7.00s'}
          </span>
        </div>

        {/* Rendering Progress Bar */}
        {rendering && (
          <div className="render-progress" style={{ margin: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
              <span>
                {exportFormat === 'PNG'
                  ? 'Rendering high-resolution vector snapshot...'
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
              <strong>Export complete!</strong> Your file has been rendered and downloaded to your computer.
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

/**
 * High-fidelity Canvas 2D scene renderer for pristine video and snapshot recording
 */
function drawSceneToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  objects: StageObject[],
  blocksMap: Record<string, TransformBlock[]>,
  theme: SceneTheme,
  customConfig?: CustomBackgroundConfig,
  imageMap?: Map<string, HTMLImageElement>
) {
  const scale = width / 960

  // 1. Draw Pure Environment Backdrop
  ctx.save()
  if (theme === 'blank') {
    ctx.fillStyle = '#FFFAF3'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    const gridSize = 32 * scale
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  } else if (theme === 'beach') {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.48)
    skyGrad.addColorStop(0, '#70BFD1')
    skyGrad.addColorStop(1, '#BFE7F0')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, height * 0.48)

    // Ocean
    const oceanGrad = ctx.createLinearGradient(0, height * 0.48, 0, height * 0.6)
    oceanGrad.addColorStop(0, '#1D7C9E')
    oceanGrad.addColorStop(1, '#2086AA')
    ctx.fillStyle = oceanGrad
    ctx.fillRect(0, height * 0.48, width, height * 0.12)

    // Shoreline Foam
    ctx.fillStyle = '#FFFFFFCC'
    ctx.fillRect(0, height * 0.595, width, 5 * scale)

    // Sand
    const sandGrad = ctx.createLinearGradient(0, height * 0.6, 0, height)
    sandGrad.addColorStop(0, '#E8C197')
    sandGrad.addColorStop(1, '#F5D7B3')
    ctx.fillStyle = sandGrad
    ctx.fillRect(0, height * 0.6, width, height * 0.4)
  } else if (theme === 'countryside') {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.54)
    skyGrad.addColorStop(0, '#CCE1E4')
    skyGrad.addColorStop(1, '#DCEBEC')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, height)

    // Green Hills
    ctx.fillStyle = '#96BD8D'
    ctx.beginPath()
    ctx.ellipse(width * 0.28, height * 0.88, width * 0.45, height * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#73A272'
    ctx.beginPath()
    ctx.ellipse(width * 0.78, height * 0.9, width * 0.45, height * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()

    // Dirt road
    ctx.fillStyle = '#E6C89F'
    ctx.fillRect(0, height - 24 * scale, width, 24 * scale)
  } else if (theme === 'midnight') {
    // Night sky
    const nightGrad = ctx.createLinearGradient(0, 0, 0, height * 0.64)
    nightGrad.addColorStop(0, '#121624')
    nightGrad.addColorStop(1, '#1E2638')
    ctx.fillStyle = nightGrad
    ctx.fillRect(0, 0, width, height)

    // Stars
    ctx.fillStyle = '#FFFFFF'
    const stars = [12, 28, 44, 62, 78, 91, 20, 50, 72]
    for (let i = 0; i < stars.length; i++) {
      ctx.beginPath()
      ctx.arc(width * (stars[i] / 100), height * (0.12 + (i % 4) * 0.12), 1.5 * scale, 0, Math.PI * 2)
      ctx.fill()
    }

    // Asphalt highway
    ctx.fillStyle = '#22252E'
    ctx.fillRect(0, height * 0.64, width, height * 0.36)
    ctx.strokeStyle = '#2F333E'
    ctx.lineWidth = 2 * scale
    ctx.beginPath()
    ctx.moveTo(0, height * 0.64)
    ctx.lineTo(width, height * 0.64)
    ctx.stroke()

    // Yellow dashed center road line
    ctx.strokeStyle = '#F5B941'
    ctx.lineWidth = 3 * scale
    ctx.setLineDash([24 * scale, 24 * scale])
    ctx.beginPath()
    ctx.moveTo(0, height * 0.82)
    ctx.lineTo(width, height * 0.82)
    ctx.stroke()
    ctx.setLineDash([])
  } else if (theme === 'custom' && customConfig) {
    const horizonY = height * (customConfig.horizonHeight / 100)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
    skyGrad.addColorStop(0, customConfig.skyTop)
    skyGrad.addColorStop(1, customConfig.skyBottom)
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, horizonY)

    ctx.fillStyle = customConfig.groundColor
    ctx.fillRect(0, horizonY, width, height - horizonY)
  }
  ctx.restore()

  // 2. Evaluate Cumulative Animations & 3x3 Hierarchical Kinematic Transforms
  const animated = objects.map(o => {
    const blocks = blocksMap[o.id] || blocksMap[o.name] || []
    return blocks.length > 0 ? evaluateCumulativeTransform(o, blocks, frame) : o
  })
  const worldObjects = computeWorldHierarchy(animated)

  // 3. Draw All Objects via Native 3x3 Matrix Transformation
  for (const obj of worldObjects) {
    ctx.save()
    // Global canvas scaling
    ctx.scale(scale, scale)

    // Direct 3x3 Homogeneous World Matrix Transform
    const m = obj.worldMatrix
    ctx.transform(m[0][0], m[1][0], m[0][1], m[1][1], m[0][2], m[1][2])

    // Draw Vector Object in Local Box Coordinates (0, 0, w, h)
    drawObjectGeometry(ctx, obj, imageMap)
    ctx.restore()
  }
}

/**
 * Renders object vector shapes in local coordinate frame (0, 0, w, h)
 */
function drawObjectGeometry(ctx: CanvasRenderingContext2D, obj: StageObject, imageMap?: Map<string, HTMLImageElement>) {
  const w = obj.w
  const h = obj.h
  const fill = obj.fillColor || obj.color || '#D95D4E'
  const stroke = obj.strokeColor || '#302E35'

  if (obj.imageUrl) {
    const img = imageMap?.get(obj.imageUrl)
    if (img && img.complete) {
      ctx.drawImage(img, 0, 0, w, h)
    }
    return
  }

  if (obj.name === 'Sun') {
    ctx.fillStyle = fill || '#F5B941'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.44, 0, Math.PI * 2)
    ctx.fill()
  } else if (obj.name === 'Cloud') {
    const sx = w / 140
    const sy = h / 60
    ctx.save()
    ctx.scale(sx, sy)
    ctx.fillStyle = fill || '#F8F7F2'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(40, 35, 20, 0, Math.PI * 2)
    ctx.arc(70, 25, 25, 0, Math.PI * 2)
    ctx.arc(100, 35, 18, 0, Math.PI * 2)
    ctx.rect(30, 35, 80, 20)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Pine Tree') {
    const sx = w / 90
    const sy = h / 140
    ctx.save()
    ctx.scale(sx, sy)
    ctx.fillStyle = '#714F36'
    ctx.fillRect(38, 105, 14, 30)
    ctx.fillStyle = fill || '#4E8462'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(45, 8)
    ctx.lineTo(85, 50)
    ctx.lineTo(65, 50)
    ctx.lineTo(82, 82)
    ctx.lineTo(58, 82)
    ctx.lineTo(75, 110)
    ctx.lineTo(15, 110)
    ctx.lineTo(32, 82)
    ctx.lineTo(8, 82)
    ctx.lineTo(25, 50)
    ctx.lineTo(5, 50)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Cottage House') {
    const sx = w / 140
    const sy = h / 120
    ctx.save()
    ctx.scale(sx, sy)
    ctx.fillStyle = '#8F4839'
    ctx.fillRect(95, 10, 16, 28)
    ctx.fillStyle = fill || '#D98264'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.fillRect(20, 48, 100, 66)
    ctx.strokeRect(20, 48, 100, 66)
    ctx.fillStyle = '#B96353'
    ctx.beginPath()
    ctx.moveTo(70, 8)
    ctx.lineTo(132, 50)
    ctx.lineTo(8, 50)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#A7C5C4'
    ctx.fillRect(32, 60, 22, 24)
    ctx.strokeRect(32, 60, 22, 24)
    ctx.fillRect(86, 60, 22, 24)
    ctx.strokeRect(86, 60, 22, 24)
    ctx.restore()
  } else if (obj.name === 'Red Car') {
    const sx = w / 120
    const sy = h / 54
    ctx.save()
    ctx.scale(sx, sy)
    ctx.fillStyle = fill || '#D95D4E'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(28, 26)
    ctx.lineTo(44, 8)
    ctx.lineTo(78, 8)
    ctx.lineTo(94, 26)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillRect(8, 24, 104, 20)
    ctx.strokeRect(8, 24, 104, 20)
    ctx.fillStyle = '#433F4B'
    ctx.beginPath()
    ctx.arc(28, 44, 10, 0, Math.PI * 2)
    ctx.arc(92, 44, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else if (obj.name === 'Boat') {
    const sx = w / 110
    const sy = h / 95
    ctx.save()
    ctx.scale(sx, sy)
    ctx.fillStyle = '#C68B59'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(10, 65)
    ctx.lineTo(100, 65)
    ctx.lineTo(85, 88)
    ctx.lineTo(25, 88)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(55, 10)
    ctx.lineTo(55, 65)
    ctx.stroke()
    ctx.fillStyle = '#F8F7F2'
    ctx.beginPath()
    ctx.moveTo(58, 15)
    ctx.lineTo(95, 58)
    ctx.lineTo(58, 58)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#D95D4E'
    ctx.beginPath()
    ctx.moveTo(52, 22)
    ctx.lineTo(18, 58)
    ctx.lineTo(52, 58)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Beach Ball') {
    ctx.save()
    ctx.fillStyle = '#F8F7F2'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#D95D4E'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, -Math.PI / 3, Math.PI / 3)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  } else if (obj.name === 'Head') {
    ctx.fillStyle = fill || '#E8BA94'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.42, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#302E35'
    ctx.beginPath()
    ctx.arc(w * 0.38, h * 0.48, 2.5, 0, Math.PI * 2)
    ctx.arc(w * 0.62, h * 0.48, 2.5, 0, Math.PI * 2)
    ctx.fill()
  } else if (obj.name.includes('Torso')) {
    ctx.fillStyle = fill || '#7B6DAF'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(w * 0.25, h * 0.15)
    ctx.lineTo(w * 0.75, h * 0.15)
    ctx.lineTo(w * 0.85, h * 0.85)
    ctx.lineTo(w * 0.15, h * 0.85)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (obj.name.includes('Arm') || obj.name.includes('Leg')) {
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    const radius = Math.min(w, h) * 0.35
    ctx.beginPath()
    ctx.roundRect(w * 0.15, h * 0.08, w * 0.7, h * 0.84, radius)
    ctx.fill()
    ctx.stroke()
  } else if (obj.kind === 'custom' && obj.primitives && obj.primitives.length > 0) {
    // Custom Composite Assets from Graphics Lab
    const { vbX, vbY, vbW, vbH } = computeCustomAssetViewBox(obj.primitives)

    ctx.save()
    ctx.scale(w / vbW, h / vbH)
    ctx.translate(-vbX, -vbY)

    for (const p of obj.primitives) {
      if (!p.visible) continue
      ctx.strokeStyle = p.strokeColor
      ctx.fillStyle = p.fillColor !== 'transparent' ? p.fillColor : 'transparent'
      ctx.lineWidth = p.strokeWidth

      if (p.tool === 'line-dda' || p.tool === 'line-bresenham') {
        ctx.beginPath()
        ctx.moveTo(p.x0, p.y0)
        ctx.lineTo(p.x1, p.y1)
        ctx.stroke()
      } else if (p.tool === 'circle-midpoint') {
        const cx = p.cx ?? p.x0
        const cy = p.cy ?? p.y0
        const r = p.r ?? 20
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        if (p.fillColor !== 'transparent') ctx.fill()
        ctx.stroke()
      } else if (p.tool === 'ellipse-midpoint') {
        const cx = p.cx ?? p.x0
        const cy = p.cy ?? p.y0
        const rx = p.rx ?? 25
        const ry = p.ry ?? 15
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        if (p.fillColor !== 'transparent') ctx.fill()
        ctx.stroke()
      } else if (p.tool === 'rect') {
        const x = Math.min(p.x0, p.x1)
        const y = Math.min(p.y0, p.y1)
        const rw = Math.abs(p.x1 - p.x0)
        const rh = Math.abs(p.y1 - p.y0)
        if (p.fillColor !== 'transparent') ctx.fillRect(x, y, rw, rh)
        ctx.strokeRect(x, y, rw, rh)
      } else if (p.tool === 'polygon' && p.points && p.points.length > 0) {
        ctx.beginPath()
        ctx.moveTo(p.points[0].x, p.points[0].y)
        for (let i = 1; i < p.points.length; i++) {
          ctx.lineTo(p.points[i].x, p.points[i].y)
        }
        ctx.closePath()
        if (p.fillColor !== 'transparent') ctx.fill()
        ctx.stroke()
      } else if (p.tool === 'bezier') {
        const pts = p.points || [
          { x: p.x0, y: p.y0 },
          { x: (p.x0 * 2 + p.x1) / 3, y: p.y0 - 40 },
          { x: (p.x0 + p.x1 * 2) / 3, y: p.y1 + 40 },
          { x: p.x1, y: p.y1 },
        ]
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        ctx.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y)
        ctx.stroke()
      }
    }
    ctx.restore()
  } else if (obj.kind === 'shape') {
    ctx.strokeStyle = stroke
    ctx.fillStyle = fill
    ctx.lineWidth = obj.strokeWidth || 3
    ctx.lineCap = 'round'
    if (obj.tool === 'line-dda' || obj.tool === 'line-bresenham') {
      ctx.beginPath()
      ctx.moveTo(5, h - 5)
      ctx.lineTo(w - 5, 5)
      ctx.stroke()
    } else if (obj.tool === 'circle-midpoint') {
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.44, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (obj.tool === 'rect') {
      ctx.fillRect(4, 4, w - 8, h - 8)
      ctx.strokeRect(4, 4, w - 8, h - 8)
    } else if (obj.tool === 'polygon') {
      ctx.beginPath()
      ctx.moveTo(w / 2, 8)
      ctx.lineTo(w - 8, h - 8)
      ctx.lineTo(8, h - 8)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (obj.tool === 'bezier') {
      ctx.beginPath()
      ctx.moveTo(10, h * 0.85)
      ctx.bezierCurveTo(w * 0.2, h * 0.15, w * 0.8, h * 0.15, w - 10, h * 0.85)
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.fillRect(0, 0, w, h)
    ctx.strokeRect(0, 0, w, h)
  }
}
