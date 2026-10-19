'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  AlignCenter, Circle, MousePointer2, Move, Plus, RotateCw, Shapes,
  Sparkles, Square, Trash2, Wind, X, Download, Eye, Layers, Palette, RefreshCw
} from 'lucide-react'
import {
  Point,
  ddaLine,
  bresenhamLine,
  midpointCircle,
  midpointEllipse,
  cubicBezier,
} from '@/lib/cg-engine'

export type ToolType =
  | 'select'
  | 'line-bresenham'
  | 'line-dda'
  | 'circle-midpoint'
  | 'ellipse-midpoint'
  | 'rect'
  | 'polygon'
  | 'bezier'

export interface CGPrimitive {
  id: string
  tool: ToolType
  name: string
  x0: number
  y0: number
  x1: number
  y1: number
  cx?: number
  cy?: number
  r?: number
  rx?: number
  ry?: number
  points?: Point[]
  fillColor: string
  strokeColor: string
  strokeWidth: number
  visible: boolean
}

export interface CustomAssetData {
  id: string
  name: string
  icon: string
  color: string
  kind: 'custom'
  primitives: CGPrimitive[]
  previewUrl?: string
}

/**
 * Calculates optimal bounding box viewBox for custom composite assets
 * so they auto-fit cleanly in their target w x h frame across stage, preview, and export.
 */
export function computeCustomAssetViewBox(primitives?: CGPrimitive[]) {
  if (!primitives || primitives.length === 0) {
    return { vbX: 0, vbY: 0, vbW: 540, vbH: 360, viewBox: '0 0 540 360' }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of primitives) {
    if (!p.visible) continue
    if (p.points && p.points.length > 0) {
      for (const pt of p.points) {
        minX = Math.min(minX, pt.x)
        minY = Math.min(minY, pt.y)
        maxX = Math.max(maxX, pt.x)
        maxY = Math.max(maxY, pt.y)
      }
    } else {
      const x0 = p.cx ? p.cx - (p.r || p.rx || 20) : Math.min(p.x0, p.x1)
      const x1 = p.cx ? p.cx + (p.r || p.rx || 20) : Math.max(p.x0, p.x1)
      const y0 = p.cy ? p.cy - (p.r || p.ry || 20) : Math.min(p.y0, p.y1)
      const y1 = p.cy ? p.cy + (p.r || p.ry || 20) : Math.max(p.y0, p.y1)
      minX = Math.min(minX, x0)
      minY = Math.min(minY, y0)
      maxX = Math.max(maxX, x1)
      maxY = Math.max(maxY, y1)
    }
  }

  const pad = 12
  const vbX = isFinite(minX) ? Math.max(0, minX - pad) : 0
  const vbY = isFinite(minY) ? Math.max(0, minY - pad) : 0
  const vbW = isFinite(maxX) && maxX > minX ? maxX - minX + pad * 2 : 540
  const vbH = isFinite(maxY) && maxY > minY ? maxY - minY + pad * 2 : 360

  return {
    vbX,
    vbY,
    vbW,
    vbH,
    viewBox: `${vbX} ${vbY} ${vbW} ${vbH}`,
  }
}

interface GraphicsLabModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveAsset: (asset: CustomAssetData) => void
}

const PRESET_COLORS = [
  '#D95D4E', // Coral
  '#F5B941', // Sun Yellow
  '#6A9B72', // Pine Green
  '#D98264', // Cottage Sienna
  '#86AEB7', // Sky Blue
  '#7B6DAF', // Lavender Purple
  '#302E35', // Charcoal Ink
  '#FFFFFF', // White
]

export default function GraphicsLabModal({
  isOpen,
  onClose,
  onSaveAsset,
}: GraphicsLabModalProps) {
  const [assetName, setAssetName] = useState('My Custom Asset')
  const [tool, setTool] = useState<ToolType>('line-bresenham')
  const [showPixelGrid, setShowPixelGrid] = useState(true)
  const [fillColor, setFillColor] = useState('#D95D4E')
  const [strokeColor, setStrokeColor] = useState('#302E35')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [primitives, setPrimitives] = useState<CGPrimitive[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Interactive drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const startPtRef = useRef<Point>({ x: 0, y: 0 })
  const currentPtRef = useRef<Point>({ x: 0, y: 0 })
  const polygonPointsRef = useRef<Point[]>([])

  // Initialize with a fun starter composite object if empty
  useEffect(() => {
    if (primitives.length === 0) {
      loadPreset('robot')
    }
  }, [])

  function loadPreset(
    type: 'robot' | 'robot-head' | 'robot-torso' | 'robot-arm' | 'car' | 'windmill' | 'blank'
  ) {
    if (type === 'blank') {
      setPrimitives([])
      setAssetName('Blank Asset')
      return
    }

    if (type === 'robot') {
      setAssetName('CG Robot Mascot')
      setPrimitives([
        // Head (Rect)
        {
          id: 'p1',
          tool: 'rect',
          name: 'Robot Head (Rect)',
          x0: 220,
          y0: 70,
          x1: 320,
          y1: 150,
          fillColor: '#86AEB7',
          strokeColor: '#302E35',
          strokeWidth: 3,
          visible: true,
        },
        // Eyes (Midpoint Circles)
        {
          id: 'p2',
          tool: 'circle-midpoint',
          name: 'Left Eye (Midpoint Circle)',
          x0: 245,
          y0: 105,
          x1: 255,
          y1: 105,
          cx: 245,
          cy: 105,
          r: 10,
          fillColor: '#F5B941',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        {
          id: 'p3',
          tool: 'circle-midpoint',
          name: 'Right Eye (Midpoint Circle)',
          x0: 295,
          y0: 105,
          x1: 305,
          y1: 105,
          cx: 295,
          cy: 105,
          r: 10,
          fillColor: '#F5B941',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        // Antenna (Bresenham line)
        {
          id: 'p4',
          tool: 'line-bresenham',
          name: 'Antenna (Bresenham Line)',
          x0: 270,
          y0: 70,
          x1: 270,
          y1: 35,
          fillColor: 'transparent',
          strokeColor: '#D95D4E',
          strokeWidth: 3,
          visible: true,
        },
        // Antenna Beacon (Midpoint Circle)
        {
          id: 'p5',
          tool: 'circle-midpoint',
          name: 'Antenna Tip (Circle)',
          x0: 270,
          y0: 30,
          x1: 276,
          y1: 30,
          cx: 270,
          cy: 30,
          r: 7,
          fillColor: '#D95D4E',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        // Body (Rect)
        {
          id: 'p6',
          tool: 'rect',
          name: 'Robot Torso (Rect)',
          x0: 200,
          y0: 165,
          x1: 340,
          y1: 270,
          fillColor: '#7B6DAF',
          strokeColor: '#302E35',
          strokeWidth: 3,
          visible: true,
        },
        // Chest Gauge (Midpoint Ellipse)
        {
          id: 'p7',
          tool: 'ellipse-midpoint',
          name: 'Power Core (Midpoint Ellipse)',
          x0: 270,
          y0: 215,
          x1: 305,
          y1: 235,
          cx: 270,
          cy: 215,
          rx: 35,
          ry: 20,
          fillColor: '#F5B941',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        // Left Arm (Bézier Curve)
        {
          id: 'p8',
          tool: 'bezier',
          name: 'Left Arm (Bézier Curve)',
          x0: 200,
          y0: 180,
          x1: 150,
          y1: 240,
          points: [
            { x: 200, y: 180 },
            { x: 160, y: 190 },
            { x: 140, y: 220 },
            { x: 155, y: 250 },
          ],
          fillColor: 'transparent',
          strokeColor: '#302E35',
          strokeWidth: 4,
          visible: true,
        },
        // Right Arm (Bézier Curve)
        {
          id: 'p9',
          tool: 'bezier',
          name: 'Right Arm (Bézier Curve)',
          x0: 340,
          y0: 180,
          x1: 390,
          y1: 240,
          points: [
            { x: 340, y: 180 },
            { x: 380, y: 190 },
            { x: 400, y: 220 },
            { x: 385, y: 250 },
          ],
          fillColor: 'transparent',
          strokeColor: '#302E35',
          strokeWidth: 4,
          visible: true,
        },
      ])
    } else if (type === 'windmill') {
      setAssetName('CG Windmill')
      setPrimitives([
        // Tower Base (Polygon)
        {
          id: 'w1',
          tool: 'polygon',
          name: 'Windmill Tower (Polygon)',
          x0: 220,
          y0: 320,
          x1: 320,
          y1: 150,
          points: [
            { x: 230, y: 320 },
            { x: 310, y: 320 },
            { x: 285, y: 150 },
            { x: 255, y: 150 },
          ],
          fillColor: '#D98264',
          strokeColor: '#302E35',
          strokeWidth: 3,
          visible: true,
        },
        // Center Hub (Midpoint Circle)
        {
          id: 'w2',
          tool: 'circle-midpoint',
          name: 'Rotor Hub (Circle)',
          x0: 270,
          y0: 145,
          x1: 282,
          y1: 145,
          cx: 270,
          cy: 145,
          r: 12,
          fillColor: '#F5B941',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        // Blade 1 (DDA Line)
        {
          id: 'w3',
          tool: 'line-dda',
          name: 'Blade Top (DDA Line)',
          x0: 270,
          y0: 145,
          x1: 270,
          y1: 45,
          fillColor: 'transparent',
          strokeColor: '#86AEB7',
          strokeWidth: 6,
          visible: true,
        },
        // Blade 2 (DDA Line)
        {
          id: 'w4',
          tool: 'line-dda',
          name: 'Blade Right (DDA Line)',
          x0: 270,
          y0: 145,
          x1: 370,
          y1: 175,
          fillColor: 'transparent',
          strokeColor: '#86AEB7',
          strokeWidth: 6,
          visible: true,
        },
        // Blade 3 (DDA Line)
        {
          id: 'w5',
          tool: 'line-dda',
          name: 'Blade Left (DDA Line)',
          x0: 270,
          y0: 145,
          x1: 170,
          y1: 175,
          fillColor: 'transparent',
          strokeColor: '#86AEB7',
          strokeWidth: 6,
          visible: true,
        },
      ])
    } else if (type === 'robot-head') {
      setAssetName('Robot Head')
      setPrimitives([
        {
          id: 'rh1',
          tool: 'rect',
          name: 'Head Chassis (Rect)',
          x0: 220,
          y0: 100,
          x1: 320,
          y1: 180,
          fillColor: '#86AEB7',
          strokeColor: '#302E35',
          strokeWidth: 3,
          visible: true,
        },
        {
          id: 'rh2',
          tool: 'circle-midpoint',
          name: 'Left Optic (Circle)',
          x0: 245,
          y0: 135,
          x1: 255,
          y1: 135,
          cx: 245,
          cy: 135,
          r: 10,
          fillColor: '#F5B941',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        {
          id: 'rh3',
          tool: 'circle-midpoint',
          name: 'Right Optic (Circle)',
          x0: 295,
          y0: 135,
          x1: 305,
          y1: 135,
          cx: 295,
          cy: 135,
          r: 10,
          fillColor: '#F5B941',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        {
          id: 'rh4',
          tool: 'line-bresenham',
          name: 'Antenna (Bresenham)',
          x0: 270,
          y0: 100,
          x1: 270,
          y1: 65,
          fillColor: 'transparent',
          strokeColor: '#D95D4E',
          strokeWidth: 3,
          visible: true,
        },
        {
          id: 'rh5',
          tool: 'circle-midpoint',
          name: 'Antenna Tip (Circle)',
          x0: 270,
          y0: 60,
          x1: 276,
          y1: 60,
          cx: 270,
          cy: 60,
          r: 7,
          fillColor: '#D95D4E',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        {
          id: 'rh6',
          tool: 'line-dda',
          name: 'Speaker Mouth (DDA)',
          x0: 250,
          y0: 160,
          x1: 290,
          y1: 160,
          fillColor: 'transparent',
          strokeColor: '#302E35',
          strokeWidth: 3,
          visible: true,
        },
      ])
    } else if (type === 'robot-torso') {
      setAssetName('Robot Torso')
      setPrimitives([
        {
          id: 'rt1',
          tool: 'rect',
          name: 'Chassis Hull (Rect)',
          x0: 200,
          y0: 100,
          x1: 340,
          y1: 240,
          fillColor: '#7B6DAF',
          strokeColor: '#302E35',
          strokeWidth: 3,
          visible: true,
        },
        {
          id: 'rt2',
          tool: 'ellipse-midpoint',
          name: 'Core Generator (Ellipse)',
          x0: 270,
          y0: 160,
          x1: 305,
          y1: 182,
          cx: 270,
          cy: 160,
          rx: 35,
          ry: 22,
          fillColor: '#F5B941',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        {
          id: 'rt3',
          tool: 'line-dda',
          name: 'Plating Ridge 1 (DDA)',
          x0: 215,
          y0: 205,
          x1: 325,
          y1: 205,
          fillColor: 'transparent',
          strokeColor: '#302E35',
          strokeWidth: 2.5,
          visible: true,
        },
        {
          id: 'rt4',
          tool: 'line-bresenham',
          name: 'Plating Ridge 2 (Bresenham)',
          x0: 215,
          y0: 220,
          x1: 325,
          y1: 220,
          fillColor: 'transparent',
          strokeColor: '#302E35',
          strokeWidth: 2.5,
          visible: true,
        },
      ])
    } else if (type === 'robot-arm') {
      setAssetName('Robot Arm')
      setPrimitives([
        {
          id: 'ra1',
          tool: 'circle-midpoint',
          name: 'Shoulder Joint (Circle)',
          x0: 270,
          y0: 75,
          x1: 284,
          y1: 75,
          cx: 270,
          cy: 75,
          r: 14,
          fillColor: '#D95D4E',
          strokeColor: '#302E35',
          strokeWidth: 2.5,
          visible: true,
        },
        {
          id: 'ra2',
          tool: 'rect',
          name: 'Upper Limb (Rect)',
          x0: 258,
          y0: 75,
          x1: 282,
          y1: 165,
          fillColor: '#7B6DAF',
          strokeColor: '#302E35',
          strokeWidth: 3,
          visible: true,
        },
        {
          id: 'ra3',
          tool: 'circle-midpoint',
          name: 'Elbow Joint (Circle)',
          x0: 270,
          y0: 165,
          x1: 280,
          y1: 165,
          cx: 270,
          cy: 165,
          r: 10,
          fillColor: '#F5B941',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
        {
          id: 'ra4',
          tool: 'bezier',
          name: 'Forearm (Bézier Curve)',
          x0: 270,
          y0: 165,
          x1: 270,
          y1: 250,
          points: [
            { x: 270, y: 165 },
            { x: 290, y: 195 },
            { x: 285, y: 230 },
            { x: 270, y: 250 },
          ],
          fillColor: 'transparent',
          strokeColor: '#302E35',
          strokeWidth: 4,
          visible: true,
        },
        {
          id: 'ra5',
          tool: 'polygon',
          name: 'Hand Gripper (Polygon)',
          x0: 250,
          y0: 250,
          x1: 290,
          y1: 275,
          points: [
            { x: 258, y: 250 },
            { x: 282, y: 250 },
            { x: 290, y: 275 },
            { x: 270, y: 266 },
            { x: 250, y: 275 },
          ],
          fillColor: '#D95D4E',
          strokeColor: '#302E35',
          strokeWidth: 2,
          visible: true,
        },
      ])
    }
  }

  // Redraw canvas whenever primitives or showPixelGrid changes
  useEffect(() => {
    drawAll()
  }, [primitives, showPixelGrid, selectedId])

  function drawAll() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background color
    ctx.fillStyle = '#FFFAF3'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Render coordinate grid if enabled
    if (showPixelGrid) {
      drawCoordinateGrid(ctx, canvas.width, canvas.height)
    }

    // Render each primitive
    for (const p of primitives) {
      if (!p.visible) continue
      renderPrimitive(ctx, p, showPixelGrid, p.id === selectedId)
    }

    // Render active live drawing preview
    if (isDrawingRef.current) {
      renderActivePreview(ctx)
    }
  }

  function drawCoordinateGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const gridSize = 16
    ctx.save()
    ctx.strokeStyle = '#EADBCA'
    ctx.lineWidth = 0.6

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

    // Subtle coordinate markings
    ctx.fillStyle = '#B8A898'
    ctx.font = '8px monospace'
    for (let x = 32; x < width; x += 64) {
      ctx.fillText(`${x}`, x + 2, 10)
    }
    for (let y = 32; y < height; y += 64) {
      ctx.fillText(`${y}`, 2, y - 2)
    }
    ctx.restore()
  }

  function renderPrimitive(
    ctx: CanvasRenderingContext2D,
    p: CGPrimitive,
    useRasterPixelGrid: boolean,
    isSelected: boolean
  ) {
    ctx.save()

    // If raster mode is active, render via genuine CG engine point arrays
    if (useRasterPixelGrid) {
      renderPrimitiveRaster(ctx, p)
    } else {
      renderPrimitiveVector(ctx, p)
    }

    // Selection highlight
    if (isSelected) {
      ctx.strokeStyle = '#D95D4E'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      const bounds = getPrimitiveBounds(p)
      ctx.strokeRect(bounds.minX - 4, bounds.minY - 4, bounds.maxX - bounds.minX + 8, bounds.maxY - bounds.minY + 8)
      ctx.setLineDash([])
    }

    ctx.restore()
  }

  function renderPrimitiveRaster(ctx: CanvasRenderingContext2D, p: CGPrimitive) {
    let points: Point[] = []

    if (p.tool === 'line-dda') {
      points = ddaLine(p.x0, p.y0, p.x1, p.y1)
    } else if (p.tool === 'line-bresenham') {
      points = bresenhamLine(p.x0, p.y0, p.x1, p.y1)
    } else if (p.tool === 'circle-midpoint') {
      const cx = p.cx ?? p.x0
      const cy = p.cy ?? p.y0
      const r = p.r ?? Math.hypot(p.x1 - p.x0, p.y1 - p.y0)
      points = midpointCircle(cx, cy, r)
      // Optional fill
      if (p.fillColor && p.fillColor !== 'transparent') {
        ctx.fillStyle = p.fillColor
        ctx.beginPath()
        ctx.arc(cx, cy, Math.max(1, r - 1), 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (p.tool === 'ellipse-midpoint') {
      const cx = p.cx ?? p.x0
      const cy = p.cy ?? p.y0
      const rx = p.rx ?? Math.abs(p.x1 - p.x0)
      const ry = p.ry ?? Math.abs(p.y1 - p.y0)
      points = midpointEllipse(cx, cy, rx, ry)
      if (p.fillColor && p.fillColor !== 'transparent') {
        ctx.fillStyle = p.fillColor
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.max(1, rx - 1), Math.max(1, ry - 1), 0, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (p.tool === 'bezier') {
      const pts = p.points || [
        { x: p.x0, y: p.y0 },
        { x: (p.x0 * 2 + p.x1) / 3, y: p.y0 - 40 },
        { x: (p.x0 + p.x1 * 2) / 3, y: p.y1 + 40 },
        { x: p.x1, y: p.y1 },
      ]
      points = cubicBezier(pts[0], pts[1], pts[2], pts[3], 50)
    } else if (p.tool === 'rect') {
      const left = Math.min(p.x0, p.x1)
      const top = Math.min(p.y0, p.y1)
      const right = Math.max(p.x0, p.x1)
      const bottom = Math.max(p.y0, p.y1)

      if (p.fillColor && p.fillColor !== 'transparent') {
        ctx.fillStyle = p.fillColor
        ctx.fillRect(left, top, right - left, bottom - top)
      }

      // Perimeter points via Bresenham lines
      const topPts = bresenhamLine(left, top, right, top)
      const rightPts = bresenhamLine(right, top, right, bottom)
      const bottomPts = bresenhamLine(right, bottom, left, bottom)
      const leftPts = bresenhamLine(left, bottom, left, top)
      points = [...topPts, ...rightPts, ...bottomPts, ...leftPts]
    } else if (p.tool === 'polygon') {
      const polyPts = p.points || [
        { x: p.x0, y: p.y1 },
        { x: p.x1, y: p.y1 },
        { x: (p.x0 + p.x1) / 2, y: p.y0 },
      ]

      if (p.fillColor && p.fillColor !== 'transparent') {
        ctx.fillStyle = p.fillColor
        ctx.beginPath()
        ctx.moveTo(polyPts[0].x, polyPts[0].y)
        for (let i = 1; i < polyPts.length; i++) {
          ctx.lineTo(polyPts[i].x, polyPts[i].y)
        }
        ctx.closePath()
        ctx.fill()
      }

      // Perimeter via Bresenham lines between vertices
      for (let i = 0; i < polyPts.length; i++) {
        const next = (i + 1) % polyPts.length
        const seg = bresenhamLine(polyPts[i].x, polyPts[i].y, polyPts[next].x, polyPts[next].y)
        points.push(...seg)
      }
    }

    // Render individual discrete raster pixels
    ctx.fillStyle = p.strokeColor
    const pixelBlock = Math.max(2, p.strokeWidth)
    for (const pt of points) {
      ctx.fillRect(
        Math.floor(pt.x - pixelBlock / 2),
        Math.floor(pt.y - pixelBlock / 2),
        pixelBlock,
        pixelBlock
      )
    }
  }

  function renderPrimitiveVector(ctx: CanvasRenderingContext2D, p: CGPrimitive) {
    ctx.fillStyle = p.fillColor
    ctx.strokeStyle = p.strokeColor
    ctx.lineWidth = p.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (p.tool === 'line-dda' || p.tool === 'line-bresenham') {
      ctx.beginPath()
      ctx.moveTo(p.x0, p.y0)
      ctx.lineTo(p.x1, p.y1)
      ctx.stroke()
    } else if (p.tool === 'circle-midpoint') {
      const cx = p.cx ?? p.x0
      const cy = p.cy ?? p.y0
      const r = p.r ?? Math.hypot(p.x1 - p.x0, p.y1 - p.y0)
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2)
      if (p.fillColor && p.fillColor !== 'transparent') ctx.fill()
      ctx.stroke()
    } else if (p.tool === 'ellipse-midpoint') {
      const cx = p.cx ?? p.x0
      const cy = p.cy ?? p.y0
      const rx = p.rx ?? Math.abs(p.x1 - p.x0)
      const ry = p.ry ?? Math.abs(p.y1 - p.y0)
      ctx.beginPath()
      ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2)
      if (p.fillColor && p.fillColor !== 'transparent') ctx.fill()
      ctx.stroke()
    } else if (p.tool === 'rect') {
      const x = Math.min(p.x0, p.x1)
      const y = Math.min(p.y0, p.y1)
      const w = Math.abs(p.x1 - p.x0)
      const h = Math.abs(p.y1 - p.y0)
      if (p.fillColor && p.fillColor !== 'transparent') ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
    } else if (p.tool === 'polygon') {
      const polyPts = p.points || [
        { x: p.x0, y: p.y1 },
        { x: p.x1, y: p.y1 },
        { x: (p.x0 + p.x1) / 2, y: p.y0 },
      ]
      ctx.beginPath()
      ctx.moveTo(polyPts[0].x, polyPts[0].y)
      for (let i = 1; i < polyPts.length; i++) {
        ctx.lineTo(polyPts[i].x, polyPts[i].y)
      }
      ctx.closePath()
      if (p.fillColor && p.fillColor !== 'transparent') ctx.fill()
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

  function renderActivePreview(ctx: CanvasRenderingContext2D) {
    const s = startPtRef.current
    const c = currentPtRef.current

    ctx.save()
    ctx.strokeStyle = '#D95D4E'
    ctx.fillStyle = '#D95D4E33'
    ctx.lineWidth = strokeWidth
    ctx.setLineDash([3, 3])

    if (tool === 'line-dda' || tool === 'line-bresenham') {
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(c.x, c.y)
      ctx.stroke()
    } else if (tool === 'circle-midpoint') {
      const r = Math.hypot(c.x - s.x, c.y - s.y)
      ctx.beginPath()
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (tool === 'ellipse-midpoint') {
      const rx = Math.abs(c.x - s.x)
      const ry = Math.abs(c.y - s.y)
      ctx.beginPath()
      ctx.ellipse(s.x, s.y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (tool === 'rect') {
      const x = Math.min(s.x, c.x)
      const y = Math.min(s.y, c.y)
      const w = Math.abs(c.x - s.x)
      const h = Math.abs(c.y - s.y)
      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
    } else if (tool === 'polygon') {
      const pts = polygonPointsRef.current
      if (pts.length > 0) {
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y)
        }
        ctx.lineTo(c.x, c.y)
        ctx.stroke()
      }
    } else if (tool === 'bezier') {
      const p0 = s
      const p3 = c
      const p1 = { x: (p0.x * 2 + p3.x) / 3, y: p0.y - 45 }
      const p2 = { x: (p0.x + p3.x * 2) / 3, y: p3.y + 45 }
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
      ctx.stroke()
    }

    ctx.restore()
  }

  function getCanvasCoords(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const pt = getCanvasCoords(e)
    const canvas = canvasRef.current
    if (!canvas) return

    if (tool === 'select') {
      // Find clicked primitive
      const hit = findHitPrimitive(pt)
      setSelectedId(hit ? hit.id : null)
      return
    }

    isDrawingRef.current = true
    startPtRef.current = pt
    currentPtRef.current = pt
    canvas.setPointerCapture(e.pointerId)

    if (tool === 'polygon') {
      polygonPointsRef.current.push(pt)
      // Check if closing polygon near start point
      if (polygonPointsRef.current.length > 2) {
        const first = polygonPointsRef.current[0]
        if (Math.hypot(pt.x - first.x, pt.y - first.y) < 15) {
          // Close polygon
          const polyPts = [...polygonPointsRef.current]
          polyPts.pop() // remove closing click
          const newPrim: CGPrimitive = {
            id: `p_${Date.now()}`,
            tool: 'polygon',
            name: `Polygon (${polyPts.length} vertices)`,
            x0: polyPts[0].x,
            y0: polyPts[0].y,
            x1: polyPts[1]?.x ?? polyPts[0].x,
            y1: polyPts[1]?.y ?? polyPts[0].y,
            points: polyPts,
            fillColor,
            strokeColor,
            strokeWidth,
            visible: true,
          }
          setPrimitives(prev => [...prev, newPrim])
          polygonPointsRef.current = []
          isDrawingRef.current = false
          return
        }
      }
    }

    drawAll()
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current && tool !== 'polygon') return
    const pt = getCanvasCoords(e)
    currentPtRef.current = pt
    drawAll()
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const s = startPtRef.current
    const c = currentPtRef.current
    const dist = Math.hypot(c.x - s.x, c.y - s.y)

    // For polygon, clicks add points, finish on double click or close
    if (tool === 'polygon') {
      return
    }

    isDrawingRef.current = false
    canvasRef.current?.releasePointerCapture(e.pointerId)

    if (dist < 3) return // Ignore accidental tiny clicks

    let newPrim: CGPrimitive | null = null

    if (tool === 'line-dda' || tool === 'line-bresenham') {
      newPrim = {
        id: `p_${Date.now()}`,
        tool,
        name: tool === 'line-dda' ? 'DDA Line' : 'Bresenham Line',
        x0: s.x,
        y0: s.y,
        x1: c.x,
        y1: c.y,
        fillColor: 'transparent',
        strokeColor,
        strokeWidth,
        visible: true,
      }
    } else if (tool === 'circle-midpoint') {
      const r = Math.round(dist)
      newPrim = {
        id: `p_${Date.now()}`,
        tool,
        name: `Midpoint Circle (r=${r})`,
        x0: s.x,
        y0: s.y,
        x1: c.x,
        y1: c.y,
        cx: s.x,
        cy: s.y,
        r,
        fillColor,
        strokeColor,
        strokeWidth,
        visible: true,
      }
    } else if (tool === 'ellipse-midpoint') {
      const rx = Math.round(Math.abs(c.x - s.x))
      const ry = Math.round(Math.abs(c.y - s.y))
      newPrim = {
        id: `p_${Date.now()}`,
        tool,
        name: `Midpoint Ellipse (${rx}×${ry})`,
        x0: s.x,
        y0: s.y,
        x1: c.x,
        y1: c.y,
        cx: s.x,
        cy: s.y,
        rx,
        ry,
        fillColor,
        strokeColor,
        strokeWidth,
        visible: true,
      }
    } else if (tool === 'rect') {
      const w = Math.round(Math.abs(c.x - s.x))
      const h = Math.round(Math.abs(c.y - s.y))
      newPrim = {
        id: `p_${Date.now()}`,
        tool,
        name: `Rectangle (${w}×${h})`,
        x0: s.x,
        y0: s.y,
        x1: c.x,
        y1: c.y,
        fillColor,
        strokeColor,
        strokeWidth,
        visible: true,
      }
    } else if (tool === 'bezier') {
      const p0 = s
      const p3 = c
      const p1 = { x: Math.round((p0.x * 2 + p3.x) / 3), y: Math.round(p0.y - 45) }
      const p2 = { x: Math.round((p0.x + p3.x * 2) / 3), y: Math.round(p3.y + 45) }
      newPrim = {
        id: `p_${Date.now()}`,
        tool,
        name: 'Cubic Bézier Curve',
        x0: s.x,
        y0: s.y,
        x1: c.x,
        y1: c.y,
        points: [p0, p1, p2, p3],
        fillColor: 'transparent',
        strokeColor,
        strokeWidth,
        visible: true,
      }
    }

    if (newPrim) {
      setPrimitives(prev => [...prev, newPrim!])
      setSelectedId(newPrim.id)
    }

    drawAll()
  }

  function getPrimitiveBounds(p: CGPrimitive) {
    if (p.tool === 'circle-midpoint') {
      const cx = p.cx ?? p.x0
      const cy = p.cy ?? p.y0
      const r = p.r ?? 20
      return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r }
    }
    if (p.tool === 'ellipse-midpoint') {
      const cx = p.cx ?? p.x0
      const cy = p.cy ?? p.y0
      const rx = p.rx ?? 20
      const ry = p.ry ?? 15
      return { minX: cx - rx, minY: cy - ry, maxX: cx + rx, maxY: cy + ry }
    }
    if (p.points && p.points.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const pt of p.points) {
        minX = Math.min(minX, pt.x)
        minY = Math.min(minY, pt.y)
        maxX = Math.max(maxX, pt.x)
        maxY = Math.max(maxY, pt.y)
      }
      return { minX, minY, maxX, maxY }
    }
    return {
      minX: Math.min(p.x0, p.x1),
      minY: Math.min(p.y0, p.y1),
      maxX: Math.max(p.x0, p.x1),
      maxY: Math.max(p.y0, p.y1),
    }
  }

  function findHitPrimitive(pt: Point): CGPrimitive | null {
    // Reverse check so topmost primitive is selected
    for (let i = primitives.length - 1; i >= 0; i--) {
      const p = primitives[i]
      const b = getPrimitiveBounds(p)
      if (pt.x >= b.minX - 5 && pt.x <= b.maxX + 5 && pt.y >= b.minY - 5 && pt.y <= b.maxY + 5) {
        return p
      }
    }
    return null
  }

  function deletePrimitive(id: string) {
    setPrimitives(prev => prev.filter(p => p.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function toggleVisibility(id: string) {
    setPrimitives(prev =>
      prev.map(p => (p.id === id ? { ...p, visible: !p.visible } : p))
    )
  }

  function handleSave() {
    const previewCanvas = canvasRef.current
    const previewUrl = previewCanvas ? previewCanvas.toDataURL('image/png') : undefined

    const customAsset: CustomAssetData = {
      id: `custom_${Date.now()}`,
      name: assetName || 'Custom Asset',
      icon: 'shapes',
      color: fillColor,
      kind: 'custom',
      primitives: [...primitives],
      previewUrl,
    }

    onSaveAsset(customAsset)
    onClose()
  }

  if (!isOpen) return null

  const toolsList: Array<{ id: ToolType; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'select', label: 'Select / Move', icon: MousePointer2 },
    { id: 'line-bresenham', label: 'Bresenham Line', icon: AlignCenter },
    { id: 'line-dda', label: 'DDA Line', icon: AlignCenter },
    { id: 'circle-midpoint', label: 'Midpoint Circle', icon: Circle },
    { id: 'ellipse-midpoint', label: 'Midpoint Ellipse', icon: Circle },
    { id: 'rect', label: 'Rectangle', icon: Square },
    { id: 'polygon', label: 'Polygon / Pen', icon: Shapes },
    { id: 'bezier', label: 'Bézier Curve', icon: Wind },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="asset-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1020px' }}>
        {/* Header */}
        <div className="modal-head">
          <div>
            <span className="kicker">GRAPHICS LAB</span>
            <h2>Build a custom asset</h2>
            <p>Combine geometric primitives into a living vector object using genuine CG algorithms.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Builder Body: 3 columns */}
        <div className="builder-body" style={{ gridTemplateColumns: '210px 1fr 240px', height: '420px' }}>
          {/* Left: Tool Palette */}
          <div className="builder-tools" style={{ overflowY: 'auto' }}>
            <span className="tool-label">DRAWING TOOLS</span>
            {toolsList.map(t => {
              const Icon = t.icon
              const isActive = tool === t.id
              return (
                <button
                  key={t.id}
                  className={isActive ? 'active' : ''}
                  onClick={() => setTool(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 9px' }}
                >
                  <Icon size={16} />
                  <span style={{ fontSize: '11px', flex: 1 }}>{t.label}</span>
                </button>
              )
            })}

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--stone)', paddingTop: '14px' }}>
              <span className="tool-label">RASTERIZATION</span>
              <button
                className="builder-grid-toggle"
                onClick={() => setShowPixelGrid(v => !v)}
                style={{ margin: '8px 0', width: '100%' }}
              >
                <span className={showPixelGrid ? 'toggle on' : 'toggle'}>
                  <i />
                </span>
                <span style={{ fontSize: '10px' }}>Show CG Raster Pixel Grid</span>
              </button>
            </div>

            <div style={{ marginTop: '12px', borderTop: '1px solid var(--stone)', paddingTop: '12px' }}>
              <span className="tool-label">PRESETS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button
                  className="outline-button"
                  style={{ padding: '6px 10px', fontSize: '10px', justifyContent: 'flex-start' }}
                  onClick={() => loadPreset('robot')}
                >
                  <Sparkles size={13} style={{ color: '#D95D4E' }} /> Robot Mascot
                </button>
                <button
                  className="outline-button"
                  style={{ padding: '6px 10px', fontSize: '10px', justifyContent: 'flex-start' }}
                  onClick={() => loadPreset('robot-head')}
                >
                  <Sparkles size={13} style={{ color: '#86AEB7' }} /> Robot Head
                </button>
                <button
                  className="outline-button"
                  style={{ padding: '6px 10px', fontSize: '10px', justifyContent: 'flex-start' }}
                  onClick={() => loadPreset('robot-torso')}
                >
                  <Sparkles size={13} style={{ color: '#7B6DAF' }} /> Robot Torso
                </button>
                <button
                  className="outline-button"
                  style={{ padding: '6px 10px', fontSize: '10px', justifyContent: 'flex-start' }}
                  onClick={() => loadPreset('robot-arm')}
                >
                  <Sparkles size={13} style={{ color: '#F5B941' }} /> Robot Arm
                </button>
                <button
                  className="outline-button"
                  style={{ padding: '6px 10px', fontSize: '10px', justifyContent: 'flex-start' }}
                  onClick={() => loadPreset('windmill')}
                >
                  <Wind size={13} style={{ color: '#6A9B72' }} /> CG Windmill
                </button>
                <button
                  className="outline-button"
                  style={{ padding: '6px 10px', fontSize: '10px', justifyContent: 'flex-start' }}
                  onClick={() => loadPreset('blank')}
                >
                  <RefreshCw size={13} style={{ color: '#887E78' }} /> Clear Canvas
                </button>
              </div>
            </div>
          </div>

          {/* Center: 540 × 360 px Canvas */}
          <div
            className={`builder-canvas ${showPixelGrid ? '' : 'no-pixel-grid'}`}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '16px',
              background: '#FFFAF3',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.04)',
            }}
          >
            <canvas
              ref={canvasRef}
              width={540}
              height={360}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                width: '100%',
                height: '100%',
                cursor: tool === 'select' ? 'default' : 'crosshair',
                touchAction: 'none',
              }}
            />
            <span
              className="canvas-helper"
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '12px',
                background: '#fffaf5ee',
                padding: '3px 7px',
                borderRadius: '5px',
                border: '1px solid #e2d9cb',
                fontSize: '9px',
                color: '#847970',
              }}
            >
              {tool === 'polygon'
                ? 'Click to place vertices · Click near start vertex to close'
                : 'Click and drag to draw primitive with CG math'}
            </span>
          </div>

          {/* Right: Asset Properties & Layers */}
          <div className="builder-properties" style={{ overflowY: 'auto' }}>
            <label className="asset-name">
              <span>ASSET NAME</span>
              <input
                value={assetName}
                onChange={e => setAssetName(e.target.value)}
                placeholder="Name your asset..."
              />
            </label>

            {/* Colors */}
            <div className="property-row" style={{ marginTop: '14px' }}>
              <span>Fill Color</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className="color-swatch"
                    style={{
                      background: c,
                      outline: fillColor === c ? '2px solid var(--coral)' : 'none',
                      width: '18px',
                      height: '18px',
                    }}
                    onClick={() => setFillColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="property-row" style={{ marginTop: '12px' }}>
              <span>Stroke</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className="color-swatch"
                    style={{
                      background: c,
                      outline: strokeColor === c ? '2px solid var(--coral)' : 'none',
                      width: '18px',
                      height: '18px',
                    }}
                    onClick={() => setStrokeColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Stroke thickness slider */}
            <div className="stroke-row" style={{ marginTop: '14px' }}>
              <span>Stroke Width</span>
              <strong>{strokeWidth} px</strong>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={e => setStrokeWidth(Number(e.target.value))}
              className="range"
              style={{ margin: '4px 0 14px' }}
            />

            {/* Layers list */}
            <div className="layer-header">
              <span>
                LAYERS <small>{primitives.length}</small>
              </span>
              <button
                onClick={() => setPrimitives([])}
                title="Clear all layers"
                style={{ fontSize: '9px', color: '#978C82' }}
              >
                Clear all
              </button>
            </div>

            <div style={{ maxHeight: '140px', overflowY: 'auto', marginTop: '6px' }}>
              {primitives.length === 0 ? (
                <div style={{ color: '#978C82', fontSize: '10px', padding: '12px 0', textAlign: 'center' }}>
                  No shapes drawn yet.
                </div>
              ) : (
                primitives.map((p, idx) => (
                  <div
                    key={p.id}
                    className="layer-item"
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      background: selectedId === p.id ? '#EDE8F5' : 'transparent',
                      padding: '5px 6px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: '#A0958C', fontSize: '11px' }}>⠿</span>
                    <span
                      className="layer-mini"
                      style={{
                        background: p.fillColor !== 'transparent' ? p.fillColor : p.strokeColor,
                      }}
                    />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        toggleVisibility(p.id)
                      }}
                      style={{ opacity: p.visible ? 1 : 0.4 }}
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        deletePrimitive(p.id)
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="algorithm-note" style={{ marginTop: '14px' }}>
              <Sparkles size={15} />
              <div>
                <strong>CG Algorithm Steps</strong>
                <small>
                  {showPixelGrid
                    ? 'Raster blocks calculated by Bresenham & Midpoint algorithms'
                    : 'Smooth vector rendering preview'}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-foot">
          <button className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button className="coral-button" onClick={handleSave} disabled={primitives.length === 0}>
            <Download size={15} /> Save to Asset Library & Add to Scene
          </button>
        </div>
      </div>
    </div>
  )
}
