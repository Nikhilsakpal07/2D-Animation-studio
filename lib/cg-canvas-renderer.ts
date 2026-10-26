import { SceneTheme, StageObject } from '@/components/StageCanvas'
import { CustomBackgroundConfig } from '@/components/CustomBackgroundModal'
import { CGPrimitive, computeCustomAssetViewBox } from '@/components/GraphicsLabModal'
import {
  TransformBlock,
  evaluateCumulativeTransform,
  computeWorldHierarchy,
} from '@/lib/cg-engine'

export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 540

/**
 * Renders the pure environment backdrop and grid directly onto a 960 × 540 Canvas 2D context.
 * Used identically by both StageCanvas live stage and ExportModal offscreen recorder.
 */
export function drawBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: SceneTheme,
  customConfig?: CustomBackgroundConfig,
  grid: boolean = false
) {
  ctx.save()

  if (theme === 'blank') {
    ctx.fillStyle = '#FFFAF3'
    ctx.fillRect(0, 0, width, height)
    ctx.font = '10px monospace'
    ctx.fillStyle = '#B0A59A'
    ctx.fillText('ORIGIN: (0, 0) · 960 × 540 BLANK ARTBOARD', 16, 22)
  } else if (theme === 'beach') {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.48)
    skyGrad.addColorStop(0, '#70BFD1')
    skyGrad.addColorStop(1, '#BFE7F0')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, height * 0.48)

    // Distant palm/coastline silhouette on horizon
    ctx.save()
    ctx.fillStyle = '#2F626E'
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.roundRect(width * 0.73, height * 0.46, 120, 18, [9, 9, 0, 0])
    ctx.fill()
    ctx.restore()

    // Ocean
    const oceanGrad = ctx.createLinearGradient(0, height * 0.48, 0, height * 0.6)
    oceanGrad.addColorStop(0, '#1D7C9E')
    oceanGrad.addColorStop(1, '#2086AA')
    ctx.fillStyle = oceanGrad
    ctx.fillRect(0, height * 0.48, width, height * 0.12)

    // Shoreline Foam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillRect(0, height * 0.595, width, 6)

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

    // Green Hill A
    ctx.fillStyle = '#96BD8D'
    ctx.beginPath()
    ctx.ellipse(width * 0.28, height * 0.88, width * 0.45, height * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()

    // Green Hill B
    ctx.fillStyle = '#73A272'
    ctx.beginPath()
    ctx.ellipse(width * 0.78, height * 0.9, width * 0.45, height * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()

    // Dirt road
    ctx.fillStyle = '#E6C89F'
    ctx.fillRect(0, height - 24, width, 24)
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
      ctx.arc(width * (stars[i] / 100), height * (0.12 + (i % 4) * 0.12), 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Distant flat city silhouette horizon line
    ctx.save()
    ctx.fillStyle = '#0B0E17'
    ctx.globalAlpha = 0.45
    const skylineHeights = [45, 60, 35, 75, 50, 65, 40, 80, 55, 70, 48, 62, 50, 85]
    let curSkylineX = 15
    for (let i = 0; i < skylineHeights.length; i++) {
      const bW = 18 + (i % 3) * 8
      const bH = skylineHeights[i]
      ctx.beginPath()
      ctx.roundRect(curSkylineX, height * 0.64 - bH, bW, bH, [2, 2, 0, 0])
      ctx.fill()
      curSkylineX += bW + 6
    }
    ctx.restore()

    // Asphalt highway
    ctx.fillStyle = '#22252E'
    ctx.fillRect(0, height * 0.64, width, height * 0.36)
    ctx.strokeStyle = '#2F333E'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, height * 0.64)
    ctx.lineTo(width, height * 0.64)
    ctx.stroke()

    // Yellow dashed center road line
    ctx.strokeStyle = '#F5B941'
    ctx.lineWidth = 3
    ctx.setLineDash([24, 24])
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

    if (customConfig.hasStars) {
      ctx.fillStyle = '#FFFFFF'
      const stars = [15, 30, 48, 65, 82, 92, 22, 55, 75]
      for (let i = 0; i < stars.length; i++) {
        ctx.beginPath()
        ctx.arc(width * (stars[i] / 100), height * (0.1 + (i % 3) * 0.14), 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.fillStyle = customConfig.groundColor
    if (customConfig.horizonStyle === 'flat') {
      ctx.fillRect(0, horizonY, width, height - horizonY)
    } else if (customConfig.horizonStyle === 'hills') {
      ctx.beginPath()
      ctx.ellipse(width * 0.5, height, width * 0.6, height - horizonY + 70, 0, 0, Math.PI * 2)
      ctx.fill()
    } else if (customConfig.horizonStyle === 'waves') {
      ctx.fillRect(0, horizonY, width, height - horizonY)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, horizonY)
      ctx.lineTo(width, horizonY)
      ctx.stroke()
    } else if (customConfig.horizonStyle === 'dunes') {
      ctx.beginPath()
      ctx.ellipse(width * 0.45, height, width * 0.55, height - horizonY + 50, 0, 0, Math.PI * 2)
      ctx.fill()
    } else if (customConfig.horizonStyle === 'grid') {
      ctx.fillRect(0, horizonY, width, height - horizonY)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
      ctx.lineWidth = 1
      for (let x = 0; x <= width; x += 16) {
        ctx.beginPath()
        ctx.moveTo(x, horizonY)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = horizonY; y <= height; y += 16) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    } else {
      ctx.fillRect(0, horizonY, width, height - horizonY)
    }
  }

  // Draw Grid if enabled
  if (grid) {
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    const gridSize = 32
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
  }

  ctx.restore()
}

/**
 * Renders object vector shapes in local coordinate frame (0, 0, w, h).
 * Matches ObjectRenderer in StageCanvas pixel-for-pixel.
 */
export function drawObjectGeometry(
  ctx: CanvasRenderingContext2D,
  obj: StageObject,
  imageMap?: Map<string, HTMLImageElement>
) {
  const w = obj.w
  const h = obj.h
  const fill = obj.fillColor || obj.color || '#D95D4E'
  const stroke = obj.strokeColor || '#302E35'

  // Imported Raster or SVG Image Object
  if (obj.imageUrl) {
    const img = imageMap?.get(obj.imageUrl)
    if (img && img.complete) {
      ctx.drawImage(img, 0, 0, w, h)
    }
    return
  }

  // --- WORLD OBJECTS ---
  if (obj.name === 'Sun') {
    const sx = w / 100
    const sy = h / 100
    ctx.save()
    ctx.scale(sx, sy)
    // Core Sun
    ctx.fillStyle = fill || '#F5B941'
    ctx.beginPath()
    ctx.arc(50, 50, 44, 0, Math.PI * 2)
    ctx.fill()
    // Halo Ring
    ctx.strokeStyle = '#F5B941'
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.arc(50, 50, 48, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Cloud') {
    const sx = w / 140
    const sy = h / 60
    ctx.save()
    ctx.scale(sx, sy)
    const p = new Path2D(
      'M 25 50 Q 5 50 10 32 Q 12 15 35 15 Q 45 5 70 8 Q 95 5 105 20 Q 130 18 130 35 Q 135 50 115 50 Z'
    )
    ctx.fillStyle = fill || '#F8F7F2'
    ctx.fill(p)
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.stroke(p)
    ctx.restore()
  } else if (obj.name === 'Pine Tree') {
    const sx = w / 90
    const sy = h / 140
    ctx.save()
    ctx.scale(sx, sy)
    // Trunk
    ctx.fillStyle = '#714F36'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(38, 105, 14, 30, 2)
    ctx.fill()
    ctx.stroke()
    // Pine Foliage
    ctx.fillStyle = fill || '#4E8462'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const pts = [
      [45, 8],
      [85, 50],
      [65, 50],
      [82, 82],
      [58, 82],
      [75, 110],
      [15, 110],
      [32, 82],
      [8, 82],
      [25, 50],
      [5, 50],
    ]
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1])
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Cottage House') {
    const sx = w / 140
    const sy = h / 120
    ctx.save()
    ctx.scale(sx, sy)
    // Chimney
    ctx.fillStyle = '#8F4839'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.fillRect(95, 10, 16, 28)
    ctx.strokeRect(95, 10, 16, 28)
    // Body
    ctx.fillStyle = fill || '#D98264'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(20, 48, 100, 66, 3)
    ctx.fill()
    ctx.stroke()
    // Roof
    ctx.fillStyle = '#B96353'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(70, 8)
    ctx.lineTo(132, 50)
    ctx.lineTo(8, 50)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // Windows
    ctx.fillStyle = '#A7C5C4'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(32, 60, 22, 24, 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.roundRect(86, 60, 22, 24, 2)
    ctx.fill()
    ctx.stroke()
    // Door
    ctx.fillStyle = '#714F36'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(60, 75, 20, 39, 1)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Red Car') {
    const sx = w / 120
    const sy = h / 54
    ctx.save()
    ctx.scale(sx, sy)
    // Cabin
    const cabinPath = new Path2D('M 28 26 L 44 8 L 78 8 L 94 26 Z')
    ctx.fillStyle = fill || '#D95D4E'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.fill(cabinPath)
    ctx.stroke(cabinPath)
    // Window
    const winPath = new Path2D('M 46 12 L 74 12 L 85 24 L 37 24 Z')
    ctx.fillStyle = '#9BBABC'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.fill(winPath)
    ctx.stroke(winPath)
    // Body
    ctx.fillStyle = fill || '#D95D4E'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(8, 24, 104, 20, 6)
    ctx.fill()
    ctx.stroke()
    // Wheels
    ctx.fillStyle = '#433F4B'
    ctx.strokeStyle = '#F1DFC8'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(28, 44, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(92, 44, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Boat') {
    const sx = w / 110
    const sy = h / 95
    ctx.save()
    ctx.scale(sx, sy)
    // Hull
    const hullPath = new Path2D('M 10 65 L 100 65 L 85 88 L 25 88 Z')
    ctx.fillStyle = '#C68B59'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.fill(hullPath)
    ctx.stroke(hullPath)
    // Mast
    ctx.strokeStyle = stroke
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(55, 10)
    ctx.lineTo(55, 65)
    ctx.stroke()
    // Main Sail
    ctx.fillStyle = '#F8F7F2'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(58, 15)
    ctx.lineTo(95, 58)
    ctx.lineTo(58, 58)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // Front Sail
    ctx.fillStyle = '#D95D4E'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(52, 22)
    ctx.lineTo(18, 58)
    ctx.lineTo(52, 58)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Beach Ball') {
    const sx = w / 80
    const sy = h / 80
    ctx.save()
    ctx.scale(sx, sy)
    // Base circle
    ctx.fillStyle = '#F8F7F2'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(40, 40, 36, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Red panel
    const redPanel = new Path2D('M 40 4 Q 20 40 40 76 Q 30 40 40 4 Z')
    ctx.fillStyle = '#D95D4E'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.fill(redPanel)
    ctx.stroke(redPanel)
    // Blue panel
    const bluePanel = new Path2D('M 40 4 Q 60 40 40 76 Q 50 40 40 4 Z')
    ctx.fillStyle = '#3B7BA4'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.fill(bluePanel)
    ctx.stroke(bluePanel)
    // Yellow panel
    const yellowPanel = new Path2D('M 4 40 Q 40 20 76 40 Q 40 30 4 40 Z')
    ctx.fillStyle = '#F5B941'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.fill(yellowPanel)
    ctx.stroke(yellowPanel)
    // Center cap
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(40, 40, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else if (obj.name === 'Head') {
    const sx = w / 60
    const sy = h / 60
    ctx.save()
    ctx.scale(sx, sy)
    // Hair
    const hair = new Path2D('M 12 28 C 12 12, 48 12, 48 28 C 52 30, 48 10, 30 8 C 12 10, 8 30, 12 28 Z')
    ctx.fillStyle = '#302E35'
    ctx.fill(hair)
    // Face
    ctx.fillStyle = fill || '#E8BA94'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(30, 32, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Eyes
    ctx.fillStyle = '#302E35'
    ctx.beginPath()
    ctx.arc(23, 30, 2.5, 0, Math.PI * 2)
    ctx.arc(37, 30, 2.5, 0, Math.PI * 2)
    ctx.fill()
    // Smile
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    const smile = new Path2D('M 24 37 Q 30 42 36 37')
    ctx.stroke(smile)
    // Neck pin
    ctx.fillStyle = '#D95D4E'
    ctx.beginPath()
    ctx.arc(30, 50, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else if (obj.name.includes('Torso') || obj.name === 'Torso / Body') {
    const sx = w / 70
    const sy = h / 100
    ctx.save()
    ctx.scale(sx, sy)
    // Shirt
    const shirt = new Path2D('M 18 15 L 52 15 L 58 75 L 12 75 Z')
    ctx.fillStyle = fill || '#7B6DAF'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2.5
    ctx.fill(shirt)
    ctx.stroke(shirt)
    // Collar
    ctx.fillStyle = '#F8F7F2'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(30, 15)
    ctx.lineTo(40, 15)
    ctx.lineTo(35, 26)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // Belt
    ctx.fillStyle = '#3D405B'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.fillRect(12, 75, 46, 10)
    ctx.strokeRect(12, 75, 46, 10)
    ctx.fillStyle = '#F5B941'
    ctx.fillRect(31, 75, 8, 10)
    // Pivot Pins
    ctx.fillStyle = '#F5B941'
    ctx.globalAlpha = 0.8
    for (const [px, py] of [
      [18, 18],
      [52, 18],
      [20, 85],
      [50, 85],
    ]) {
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  } else if (obj.name.includes('Upper Arm')) {
    const sx = w / 28
    const sy = h / 70
    ctx.save()
    ctx.scale(sx, sy)
    ctx.fillStyle = fill || '#7B6DAF'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(6, 8, 16, 52, 8)
    ctx.fill()
    ctx.stroke()
    // Shoulder
    ctx.fillStyle = '#D95D4E'
    ctx.beginPath()
    ctx.arc(14, 12, 4, 0, Math.PI * 2)
    ctx.fill()
    // Elbow
    ctx.fillStyle = '#F5B941'
    ctx.beginPath()
    ctx.arc(14, 56, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else if (obj.name.includes('Lower Arm') || obj.name.includes('Arm') || obj.name.includes('Hand')) {
    const sx = w / 26
    const sy = h / 70
    ctx.save()
    ctx.scale(sx, sy)
    // Forearm
    ctx.fillStyle = fill || '#E8BA94'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(6, 8, 14, 42, 6)
    ctx.fill()
    ctx.stroke()
    // Hand
    ctx.beginPath()
    ctx.arc(13, 55, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Elbow joint
    ctx.fillStyle = '#F5B941'
    ctx.beginPath()
    ctx.arc(13, 12, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else if (obj.name.includes('Upper Leg')) {
    const sx = w / 30
    const sy = h / 80
    ctx.save()
    ctx.scale(sx, sy)
    ctx.fillStyle = fill || '#3D485C'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(6, 8, 18, 64, 8)
    ctx.fill()
    ctx.stroke()
    // Hip
    ctx.fillStyle = '#D95D4E'
    ctx.beginPath()
    ctx.arc(15, 14, 4, 0, Math.PI * 2)
    ctx.fill()
    // Knee
    ctx.fillStyle = '#F5B941'
    ctx.beginPath()
    ctx.arc(15, 66, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else if (obj.name.includes('Lower Leg') || obj.name.includes('Leg') || obj.name.includes('Foot')) {
    const sx = w / 36
    const sy = h / 80
    ctx.save()
    ctx.scale(sx, sy)
    // Shin
    ctx.fillStyle = fill || '#272E3D'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(8, 8, 16, 52, 6)
    ctx.fill()
    ctx.stroke()
    // Shoe
    const shoe = new Path2D('M 8 60 L 32 60 C 35 60, 36 72, 28 72 L 6 72 C 4 72, 6 60, 8 60 Z')
    ctx.fillStyle = '#D95D4E'
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.fill(shoe)
    ctx.stroke(shoe)
    // Knee
    ctx.fillStyle = '#F5B941'
    ctx.beginPath()
    ctx.arc(16, 12, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else if (obj.kind === 'custom' && obj.primitives && obj.primitives.length > 0) {
    // Custom Composite Assets from Graphics Lab
    const { vbX, vbY, vbW, vbH } = computeCustomAssetViewBox(obj.primitives)

    ctx.save()
    ctx.scale(w / Math.max(1, vbW), h / Math.max(1, vbH))
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
    const sx = w / 100
    const sy = h / 100
    ctx.save()
    ctx.scale(sx, sy)
    ctx.strokeStyle = obj.strokeColor || stroke
    ctx.fillStyle = obj.fillColor || fill
    ctx.lineWidth = obj.strokeWidth || 3
    ctx.lineCap = 'round'

    if (obj.tool === 'line-dda' || obj.tool === 'line-bresenham') {
      ctx.beginPath()
      ctx.moveTo(5, 95)
      ctx.lineTo(95, 5)
      ctx.stroke()
    } else if (obj.tool === 'circle-midpoint') {
      ctx.beginPath()
      ctx.arc(50, 50, 44, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (obj.tool === 'rect') {
      ctx.beginPath()
      ctx.roundRect(6, 6, 88, 88, 4)
      ctx.fill()
      ctx.stroke()
    } else if (obj.tool === 'polygon') {
      ctx.beginPath()
      ctx.moveTo(50, 8)
      ctx.lineTo(92, 90)
      ctx.lineTo(8, 90)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (obj.tool === 'bezier') {
      const bezierPath = new Path2D('M 10 85 C 20 15, 80 15, 90 85')
      ctx.stroke(bezierPath)
    }
    ctx.restore()
  } else {
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 6)
    ctx.fill()
    ctx.stroke()
    ctx.font = 'bold 10px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(obj.name, w / 2, h / 2)
  }
}

/**
 * High-fidelity Canvas 2D scene renderer for locked 960 × 540 animation frames.
 */
export function drawSceneToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  objects: StageObject[],
  blocksMap: Record<string, TransformBlock[]>,
  theme: SceneTheme,
  customConfig?: CustomBackgroundConfig,
  imageMap?: Map<string, HTMLImageElement>,
  hiddenMap?: Record<string, boolean>
) {
  // 1. Clear and Draw Pure Environment Backdrop locked to 960 × 540
  ctx.clearRect(0, 0, width, height)
  drawBackgroundToCanvas(ctx, width, height, theme, customConfig, false)

  // 2. Filter out hidden objects
  const visibleObjects = objects.filter(o => !hiddenMap?.[o.id] && !hiddenMap?.[o.name])

  // 3. Evaluate Cumulative Animations & 3x3 Hierarchical Kinematics
  const animated = visibleObjects.map(o => {
    const blocks = blocksMap[o.id] || blocksMap[o.name] || []
    return blocks.length > 0 ? evaluateCumulativeTransform(o, blocks, frame) : o
  })
  const worldObjects = computeWorldHierarchy(animated)

  // 4. Draw All Objects via Native 3x3 Matrix Transformation
  for (const obj of worldObjects) {
    ctx.save()
    // Direct 3x3 Homogeneous World Matrix Transform
    const m = obj.worldMatrix
    ctx.transform(m[0][0], m[1][0], m[0][1], m[1][1], m[0][2], m[1][2])

    // Draw Vector Object in Local Box Coordinates (0, 0, w, h)
    drawObjectGeometry(ctx, obj, imageMap)
    ctx.restore()
  }
}
