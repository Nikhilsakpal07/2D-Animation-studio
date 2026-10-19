'use client'

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { RotateCw, Target } from 'lucide-react'
import { CGPrimitive, computeCustomAssetViewBox } from './GraphicsLabModal'
import { CustomBackgroundConfig } from './CustomBackgroundModal'
import {
  Point,
  PivotPointPreset,
  getObjectPivot,
  Matrix3x3,
  ddaLine,
  getBlockStartState,
  getBlockEndState,
  TransformBlock,
} from '@/lib/cg-engine'

export type SceneTheme = 'blank' | 'beach' | 'countryside' | 'midnight' | 'custom'

export interface StageObject {
  id: string
  name: string
  icon: string
  color: string
  kind: 'object' | 'shape' | 'custom' | 'character'
  partType?: string
  x: number
  y: number
  w: number
  h: number
  rotation: number
  scaleX: number
  scaleY: number
  skewX: number
  skewY: number
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  tool?: string
  primitives?: CGPrimitive[]
  points?: Point[]
  imageUrl?: string

  // Hierarchical Kinematics & Joint Pivots
  parentId?: string | null
  pivotPreset?: PivotPointPreset
  pivotX?: number
  pivotY?: number

  // World Space Evaluated Properties
  worldMatrix?: Matrix3x3
  localMatrix?: Matrix3x3
  worldPivot?: Point
  parentJoint?: Point
  worldX?: number
  worldY?: number
  worldRotation?: number
  worldScaleX?: number
  worldScaleY?: number
  worldSkewX?: number
}

interface StageCanvasProps {
  objects: StageObject[]
  selectedId: string | null
  selectedIds?: string[]
  onSelectObject: (id: string, isShift?: boolean) => void
  onSelectMultiple?: (ids: string[]) => void
  onUpdateObject: (id: string, updates: Partial<StageObject>) => void
  onUpdateMultipleObjects?: (updatesMap: Record<string, Partial<StageObject>>) => void
  onDropAsset?: (asset: any, dropX: number, dropY: number) => void
  onDropImageFile?: (file: File, dropX: number, dropY: number) => void
  activeBlock?: any | null
  onUpdateActiveBlock?: (blockId: string, updates: any) => void
  blocksMap?: Record<string, TransformBlock[]>
  isPickingTarget?: boolean
  onStopPickingTarget?: () => void
  hiddenMap: Record<string, boolean>
  lockedMap: Record<string, boolean>
  grid: boolean
  theme: SceneTheme
  customConfig?: CustomBackgroundConfig
  isAnimateMode: boolean
  onKeyframeRecord?: (id: string) => void

  // Viewport Pan, Zoom & Tool
  zoom?: number
  onZoomChange?: (zoom: number | ((z: number) => number)) => void
  pan?: { x: number; y: number }
  onPanChange?: (pan: { x: number; y: number } | ((p: { x: number; y: number }) => { x: number; y: number })) => void
  activeTool?: 'select' | 'hand' | 'move'
}

export default function StageCanvas({
  objects,
  selectedId,
  selectedIds = [],
  onSelectObject,
  onSelectMultiple,
  onUpdateObject,
  onUpdateMultipleObjects,
  onDropAsset,
  onDropImageFile,
  activeBlock,
  onUpdateActiveBlock,
  blocksMap,
  isPickingTarget = false,
  onStopPickingTarget,
  hiddenMap,
  lockedMap,
  grid,
  theme,
  customConfig,
  isAnimateMode,
  onKeyframeRecord,
  zoom = 1.0,
  onZoomChange,
  pan = { x: 0, y: 0 },
  onPanChange,
  activeTool = 'select',
}: StageCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Infinite Canvas Pan state
  const [isPanning, setIsPanning] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const panStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  })

  // Marquee Selection state
  const [isMarqueeDragging, setIsMarqueeDragging] = useState(false)
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  // Multi-Object drag start positions
  const multiDragStartRef = useRef<{ id: string; x: number; y: number }[]>([])

  const [dragAction, setDragAction] = useState<
    'move' | 'rotate' | 'resize-br' | 'resize-tl' | 'move-ghost' | 'pick-target' | null
  >(null)
  const dragStartRef = useRef<{
    startX: number
    startY: number
    objX: number
    objY: number
    objW: number
    objH: number
    objRot: number
  }>({
    startX: 0,
    startY: 0,
    objX: 0,
    objY: 0,
    objW: 0,
    objH: 0,
    objRot: 0,
  })

  // Effective selected IDs list
  const effectiveSelectedIds = useMemo(() => {
    if (selectedIds && selectedIds.length > 0) return selectedIds
    return selectedId ? [selectedId] : []
  }, [selectedIds, selectedId])

  const selectedObj = objects.find(o => o.id === (selectedId || effectiveSelectedIds[0]))

  // Spacebar pan listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true)
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Non-passive Wheel Zoom / Pan Listener on Viewport
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey || activeTool === 'hand') {
        // Zoom
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08
        if (onZoomChange) {
          onZoomChange(z => Math.min(4.0, Math.max(0.25, Math.round((z + zoomDelta) * 100) / 100)))
        }
      } else {
        // Pan
        if (onPanChange) {
          onPanChange(p => ({
            x: Math.round(p.x - e.deltaX),
            y: Math.round(p.y - e.deltaY),
          }))
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [activeTool, onZoomChange, onPanChange])

  // Target object and chained sequential state calculation for active translation block
  const targetObj = activeBlock
    ? objects.find(o => o.id === activeBlock.objectId) || selectedObj
    : null
  const targetBlocks = targetObj && blocksMap ? blocksMap[targetObj.id] || [] : []

  const translationInfo = useMemo(() => {
    if (!activeBlock || activeBlock.actionType !== 'translation' || !targetObj) {
      return null
    }

    const startState = getBlockStartState(targetObj, targetBlocks, activeBlock)
    const endState = getBlockEndState(startState, activeBlock)

    // Compute parent offset if object is locked to a parent
    const parentOffsetX = (targetObj.worldX ?? targetObj.x) - targetObj.x
    const parentOffsetY = (targetObj.worldY ?? targetObj.y) - targetObj.y

    const localFromX = Math.round(startState.x)
    const localFromY = Math.round(startState.y)
    const localToX = Math.round(endState.x)
    const localToY = Math.round(endState.y)

    const worldFromX = localFromX + parentOffsetX
    const worldFromY = localFromY + parentOffsetY
    const worldToX = localToX + parentOffsetX
    const worldToY = localToY + parentOffsetY

    const fromCenterX = worldFromX + targetObj.w / 2
    const fromCenterY = worldFromY + targetObj.h / 2
    const toCenterX = worldToX + targetObj.w / 2
    const toCenterY = worldToY + targetObj.h / 2

    // DDA line calculation for discrete raster dots
    const ddaPts = ddaLine(fromCenterX, fromCenterY, toCenterX, toCenterY)
    const sampledPoints: Point[] = []
    if (ddaPts.length <= 4) {
      sampledPoints.push(...ddaPts)
    } else {
      const step = Math.max(2, Math.floor(ddaPts.length / 10))
      for (let i = 0; i < ddaPts.length; i += step) {
        sampledPoints.push(ddaPts[i])
      }
      if (sampledPoints[sampledPoints.length - 1] !== ddaPts[ddaPts.length - 1]) {
        sampledPoints.push(ddaPts[ddaPts.length - 1])
      }
    }

    return {
      startState,
      endState,
      localFromX,
      localFromY,
      localToX,
      localToY,
      worldFromX,
      worldFromY,
      worldToX,
      worldToY,
      fromCenterX,
      fromCenterY,
      toCenterX,
      toCenterY,
      sampledPoints,
      parentOffsetX,
      parentOffsetY,
    }
  }, [activeBlock, targetObj, targetBlocks])

  function getStagePoint(e: React.PointerEvent): { x: number; y: number } {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const scaleX = 960 / rect.width
    const scaleY = 540 / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handlePointerDown(
    e: React.PointerEvent,
    action: 'move' | 'rotate' | 'resize-br' | 'resize-tl',
    objId: string
  ) {
    // If Space is held or Hand tool is active, let viewport pan handle it
    if (isSpacePressed || activeTool === 'hand' || e.button === 1) {
      return
    }

    e.stopPropagation()
    if (lockedMap[objId]) return

    const isShift = e.shiftKey
    if (isShift) {
      onSelectObject(objId, true)
    } else {
      if (!effectiveSelectedIds.includes(objId)) {
        onSelectObject(objId, false)
      }
    }

    const pt = getStagePoint(e)
    const obj = objects.find(o => o.id === objId)
    if (!obj) return

    // Populate initial positions for all selected objects for synchronized multi-drag
    const dragIds = isShift
      ? [objId]
      : effectiveSelectedIds.includes(objId)
      ? effectiveSelectedIds
      : [objId]

    multiDragStartRef.current = dragIds.map(id => {
      const o = objects.find(item => item.id === id)
      return { id, x: o?.x ?? 0, y: o?.y ?? 0 }
    })

    setDragAction(action)
    dragStartRef.current = {
      startX: pt.x,
      startY: pt.y,
      objX: obj.x,
      objY: obj.y,
      objW: obj.w,
      objH: obj.h,
      objRot: obj.rotation,
    }

    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  // Pointer down handler on the Ghost Preview handle/box
  function handleGhostPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    if (!activeBlock || !onUpdateActiveBlock || !translationInfo) return
    setDragAction('move-ghost')
    const pt = getStagePoint(e)
    dragStartRef.current = {
      startX: pt.x,
      startY: pt.y,
      objX: translationInfo.localToX,
      objY: translationInfo.localToY,
      objW: 0,
      objH: 0,
      objRot: 0,
    }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  // Pointer down anywhere on canvas when "🎯 Pick Target Position" mode is active
  function handleCanvasPointerDown(e: React.PointerEvent) {
    if (!isPickingTarget || !activeBlock || !onUpdateActiveBlock || !translationInfo || !targetObj) return
    e.stopPropagation()
    const pt = getStagePoint(e)
    const newWorldX = Math.round(pt.x - targetObj.w / 2)
    const newWorldY = Math.round(pt.y - targetObj.h / 2)
    const newLocalX = newWorldX - translationInfo.parentOffsetX
    const newLocalY = newWorldY - translationInfo.parentOffsetY
    const newDx = newLocalX - translationInfo.localFromX
    const newDy = newLocalY - translationInfo.localFromY

    onUpdateActiveBlock(activeBlock.id, { dx: newDx, dy: newDy })

    setDragAction('pick-target')
    dragStartRef.current = {
      startX: pt.x,
      startY: pt.y,
      objX: newLocalX,
      objY: newLocalY,
      objW: 0,
      objH: 0,
      objRot: 0,
    }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragAction) return

    // Ghost drag handler
    if (dragAction === 'move-ghost') {
      if (activeBlock && onUpdateActiveBlock && translationInfo) {
        const pt = getStagePoint(e)
        const dx = pt.x - dragStartRef.current.startX
        const dy = pt.y - dragStartRef.current.startY
        const newLocalX = Math.round(dragStartRef.current.objX + dx)
        const newLocalY = Math.round(dragStartRef.current.objY + dy)
        const newDx = newLocalX - translationInfo.localFromX
        const newDy = newLocalY - translationInfo.localFromY
        onUpdateActiveBlock(activeBlock.id, { dx: newDx, dy: newDy })
      }
      return
    }

    // Pick target canvas click/drag handler
    if (dragAction === 'pick-target') {
      if (activeBlock && onUpdateActiveBlock && translationInfo && targetObj) {
        const pt = getStagePoint(e)
        const newWorldX = Math.round(pt.x - targetObj.w / 2)
        const newWorldY = Math.round(pt.y - targetObj.h / 2)
        const newLocalX = newWorldX - translationInfo.parentOffsetX
        const newLocalY = newWorldY - translationInfo.parentOffsetY
        const newDx = newLocalX - translationInfo.localFromX
        const newDy = newLocalY - translationInfo.localFromY
        onUpdateActiveBlock(activeBlock.id, { dx: newDx, dy: newDy })
      }
      return
    }

    if (!selectedId || !selectedObj) return
    const pt = getStagePoint(e)
    const { startX, startY, objX, objY, objW, objH, objRot } = dragStartRef.current
    const dx = pt.x - startX
    const dy = pt.y - startY

    let localDx = dx
    let localDy = dy
    let parentRot = 0
    if (selectedObj.parentId) {
      const parentObj = objects.find(o => o.id === selectedObj.parentId)
      parentRot = parentObj?.worldRotation ?? parentObj?.rotation ?? 0
      if (parentRot !== 0) {
        const rad = (-parentRot * Math.PI) / 180
        localDx = dx * Math.cos(rad) - dy * Math.sin(rad)
        localDy = dx * Math.sin(rad) + dy * Math.cos(rad)
      }
    }

    if (dragAction === 'move') {
      if (activeBlock && activeBlock.actionType === 'translation' && onUpdateActiveBlock) {
        const newDx = Math.round((activeBlock.dx ?? 0) + localDx)
        const newDy = Math.round((activeBlock.dy ?? 0) + localDy)
        onUpdateActiveBlock(activeBlock.id, { dx: newDx, dy: newDy })
        dragStartRef.current.startX = pt.x
        dragStartRef.current.startY = pt.y
      } else {
        // Multi-Object synchronized move
        if (multiDragStartRef.current.length > 1 && onUpdateMultipleObjects) {
          const updatesMap: Record<string, Partial<StageObject>> = {}
          for (const item of multiDragStartRef.current) {
            updatesMap[item.id] = {
              x: Math.round(item.x + localDx),
              y: Math.round(item.y + localDy),
            }
          }
          onUpdateMultipleObjects(updatesMap)
          if (isAnimateMode && onKeyframeRecord) {
            multiDragStartRef.current.forEach(item => onKeyframeRecord?.(item.id))
          }
        } else {
          const newX = Math.round(objX + localDx)
          const newY = Math.round(objY + localDy)
          onUpdateObject(selectedId, { x: newX, y: newY })
          if (isAnimateMode && onKeyframeRecord) onKeyframeRecord(selectedId)
        }
      }
    } else if (dragAction === 'rotate') {
      const pivot = getObjectPivot(selectedObj)
      const centerWorldX = selectedObj.worldPivot ? selectedObj.worldPivot.x : (objX + pivot.x)
      const centerWorldY = selectedObj.worldPivot ? selectedObj.worldPivot.y : (objY + pivot.y)
      const angleRad = Math.atan2(pt.y - centerWorldY, pt.x - centerWorldX)
      let angleDeg = Math.round((angleRad * 180) / Math.PI + 90)
      if (angleDeg < 0) angleDeg += 360

      const effectiveRot = parentRot !== 0 ? Math.round(angleDeg - parentRot) : angleDeg

      if (activeBlock && activeBlock.actionType === 'rotation' && onUpdateActiveBlock) {
        let diff = effectiveRot - objRot
        if (diff > 180) diff -= 360
        if (diff < -180) diff += 360
        onUpdateActiveBlock(activeBlock.id, { deltaRotation: (activeBlock.deltaRotation ?? 0) + diff })
        dragStartRef.current.objRot = effectiveRot
      } else {
        onUpdateObject(selectedId, { rotation: effectiveRot })
        if (isAnimateMode && onKeyframeRecord) onKeyframeRecord(selectedId)
      }
    } else if (dragAction === 'resize-br') {
      const newW = Math.max(15, Math.round(objW + dx))
      const newH = Math.max(15, Math.round(objH + dy))

      if (activeBlock && activeBlock.actionType === 'scaling' && onUpdateActiveBlock) {
        const sx = Math.round(Math.max(0.1, newW / Math.max(1, objW)) * 100) / 100
        const sy = Math.round(Math.max(0.1, newH / Math.max(1, objH)) * 100) / 100
        onUpdateActiveBlock(activeBlock.id, { scaleX: sx, scaleY: sy })
      } else {
        onUpdateObject(selectedId, { w: newW, h: newH })
        if (isAnimateMode && onKeyframeRecord) onKeyframeRecord(selectedId)
      }
    } else if (dragAction === 'resize-tl') {
      const newW = Math.max(15, Math.round(objW - dx))
      const newH = Math.max(15, Math.round(objH - dy))
      const newX = Math.round(objX + dx)
      const newY = Math.round(objY + dy)
      onUpdateObject(selectedId, { x: newX, y: newY, w: newW, h: newH })
      if (isAnimateMode && onKeyframeRecord) onKeyframeRecord(selectedId)
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragAction) {
      setDragAction(null)
      try {
        ;(e.target as Element).releasePointerCapture(e.pointerId)
      } catch {}
    }
  }

  // HTML5 Drag-and-Drop handling from Asset Library
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const dropX = Math.round(((e.clientX - rect.left) / rect.width) * 960)
    const dropY = Math.round(((e.clientY - rect.top) / rect.height) * 540)

    // 1. Direct file drop from desktop/file explorer (.png, .jpg, .svg, .webp)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file && onDropImageFile) {
        const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|svg|webp)$/i.test(file.name)
        if (isImage) {
          onDropImageFile(file, dropX, dropY)
          return
        }
      }
    }

    // 2. Drag-and-drop asset from left sidebar library
    if (!onDropAsset) return
    try {
      const jsonStr = e.dataTransfer.getData('application/json')
      if (!jsonStr) return
      const asset = JSON.parse(jsonStr)

      onDropAsset(asset, dropX, dropY)
    } catch (err) {
      console.error('Error handling asset drop:', err)
    }
  }

  // Viewport Pan Pointer Events
  function handleViewportPointerDown(e: React.PointerEvent) {
    // 1. Pan via Middle Mouse button OR Spacebar + Click OR Hand tool
    if (e.button === 1 || isSpacePressed || activeTool === 'hand') {
      e.preventDefault()
      e.stopPropagation()
      setIsPanning(true)
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initX: pan.x,
        initY: pan.y,
      }
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
      return
    }

    // 2. Click outside artboard resets selection if not shift-clicking
    if (!e.shiftKey) {
      onSelectObject('', false)
      onSelectMultiple?.([])
    }
  }

  function handleViewportPointerMove(e: React.PointerEvent) {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.startX
      const dy = e.clientY - panStartRef.current.startY
      onPanChange?.({
        x: Math.round(panStartRef.current.initX + dx),
        y: Math.round(panStartRef.current.initY + dy),
      })
      return
    }

    if (isMarqueeDragging && marqueeBox) {
      const pt = getStagePoint(e)
      setMarqueeBox(prev => (prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null))

      const x0 = Math.min(marqueeBox.startX, pt.x)
      const y0 = Math.min(marqueeBox.startY, pt.y)
      const x1 = Math.max(marqueeBox.startX, pt.x)
      const y1 = Math.max(marqueeBox.startY, pt.y)

      if (x1 - x0 > 4 || y1 - y0 > 4) {
        const hitIds = objects
          .filter(o => {
            if (hiddenMap[o.name] || hiddenMap[o.id]) return false
            const ox = o.worldX ?? o.x
            const oy = o.worldY ?? o.y
            return !(ox + o.w < x0 || ox > x1 || oy + o.h < y0 || oy > y1)
          })
          .map(o => o.id)

        if (e.shiftKey) {
          onSelectMultiple?.(Array.from(new Set([...effectiveSelectedIds, ...hitIds])))
        } else {
          onSelectMultiple?.(hitIds)
        }
      }
      return
    }

    // Normal object drag
    handlePointerMove(e)
  }

  function handleViewportPointerUp(e: React.PointerEvent) {
    if (isPanning) {
      setIsPanning(false)
      try {
        ;(e.currentTarget as Element).releasePointerCapture(e.pointerId)
      } catch {}
    }
    if (isMarqueeDragging) {
      setIsMarqueeDragging(false)
      setMarqueeBox(null)
      try {
        ;(e.currentTarget as Element).releasePointerCapture(e.pointerId)
      } catch {}
    }
    handlePointerUp(e)
  }

  // Pointer down directly on the artboard canvas
  function handleArtboardPointerDown(e: React.PointerEvent) {
    // If Space is pressed, Hand tool active, or middle button clicked: pan
    if (isSpacePressed || activeTool === 'hand' || e.button === 1) {
      handleViewportPointerDown(e)
      return
    }

    if (isPickingTarget) {
      handleCanvasPointerDown(e)
      return
    }

    // Clicking artboard background: start Marquee Selection in select mode
    if (activeTool === 'select' && e.button === 0) {
      const pt = getStagePoint(e)
      setIsMarqueeDragging(true)
      setMarqueeBox({
        startX: pt.x,
        startY: pt.y,
        currentX: pt.x,
        currentY: pt.y,
      })

      if (!e.shiftKey) {
        onSelectObject('', false)
        onSelectMultiple?.([])
      }
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    }
  }

  return (
    <div
      ref={viewportRef}
      className="stage-viewport"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isPanning
          ? 'grabbing'
          : isSpacePressed || activeTool === 'hand'
          ? 'grab'
          : isPickingTarget
          ? 'crosshair'
          : 'default',
      }}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
    >
      {/* Pan & Zoom Transform Container */}
      <div
        className="pan-zoom-container"
        style={{
          position: 'relative',
          width: '960px',
          height: '540px',
          flexShrink: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.05s cubic-bezier(0.2, 0.9, 0.4, 1)',
        }}
      >
        <div
          ref={containerRef}
          className={`artboard theme-${theme}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '960px',
            height: '540px',
            overflow: 'hidden',
            border: '8px solid #fffaf4',
            borderRadius: '8px',
            boxShadow: '0 14px 30px rgba(123, 107, 89, 0.18)',
            backgroundColor: theme === 'blank' ? '#FFFAF3' : '#CCE1E4',
            backgroundImage: grid
              ? 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)'
              : 'none',
            backgroundSize: '32px 32px',
          }}
          onPointerDown={handleArtboardPointerDown}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
      {/* Target Picking floating indicator banner */}
      {isPickingTarget && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 250, 243, 0.96)',
            border: '1.5px solid var(--coral)',
            borderRadius: '20px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(217, 93, 78, 0.25)',
            zIndex: 50,
            fontSize: '11px',
            fontWeight: 700,
            color: '#302E35',
            backdropFilter: 'blur(4px)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <Target size={14} style={{ color: 'var(--coral)' }} />
          <span>🎯 Click or drag anywhere on canvas to set Target Position</span>
          <button
            onClick={() => onStopPickingTarget?.()}
            style={{
              background: 'var(--coral)',
              color: '#FFFFFF',
              border: 0,
              borderRadius: '12px',
              padding: '2px 10px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            Done
          </button>
        </div>
      )}
      {/* 
        PURE ENVIRONMENT BACKDROPS ONLY
        Notice: NO movable objects (no hardcoded sun, cottage, car, or trees) are drawn here!
      */}

      {/* 1. Blank Canvas */}
      {theme === 'blank' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFAF3',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#B0A59A',
            }}
          >
            ORIGIN: (0, 0) · 960 × 540 BLANK ARTBOARD
          </div>
        </div>
      )}

      {/* 2. Sunny Beach */}
      {theme === 'beach' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(#70BFD1 0%, #BFE7F0 48%, #1D7C9E 48%, #2086AA 60%, #E8C197 60%, #F5D7B3 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Distant palm/coastline silhouette on horizon */}
          <div
            style={{
              position: 'absolute',
              top: '46%',
              right: '15%',
              width: '120px',
              height: '18px',
              background: '#2F626E',
              borderRadius: '50% 50% 0 0',
              opacity: 0.5,
            }}
          />
          {/* Ocean shoreline wave foam */}
          <div
            style={{
              position: 'absolute',
              top: '59.5%',
              left: 0,
              right: 0,
              height: '6px',
              background: '#FFFFFFCC',
              borderRadius: '3px',
              filter: 'blur(1px)',
            }}
          />
        </div>
      )}

      {/* 3. Countryside Scenery */}
      {theme === 'countryside' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(#CCE1E4 0%, #DCEBEC 54%, #96BD8D 54%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Rolling green hills backdrop */}
          <div
            style={{
              position: 'absolute',
              left: '-10%',
              bottom: '-12%',
              height: '46%',
              width: '75%',
              borderRadius: '50% 50% 0 0',
              background: '#96BD8D',
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '-15%',
              bottom: '-14%',
              height: '46%',
              width: '75%',
              borderRadius: '50% 50% 0 0',
              background: '#73A272',
              zIndex: 2,
            }}
          />
          {/* Dirt path along the bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '24px',
              background: '#E6C89F',
              zIndex: 3,
            }}
          />
        </div>
      )}

      {/* 4. Midnight Highway */}
      {theme === 'midnight' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(#121624 0%, #1E2638 64%, #22252E 64%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Distant stars */}
          {[12, 28, 44, 62, 78, 91, 20, 50, 72].map((left, idx) => (
            <span
              key={idx}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${12 + (idx % 4) * 12}%`,
                width: '2px',
                height: '2px',
                background: '#FFFFFF',
                borderRadius: '50%',
                opacity: 0.85,
              }}
            />
          ))}

          {/* Distant flat city silhouette horizon line */}
          <div
            style={{
              position: 'absolute',
              bottom: '36%',
              left: 0,
              right: 0,
              height: '45px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '6px',
              padding: '0 15px',
              opacity: 0.45,
            }}
          >
            {[45, 60, 35, 75, 50, 65, 40, 80, 55, 70, 48, 62, 50, 85].map((h, i) => (
              <div
                key={i}
                style={{
                  width: `${18 + (i % 3) * 8}px`,
                  height: `${h}px`,
                  background: '#0B0E17',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            ))}
          </div>

          {/* Flat asphalt highway */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '36%',
              background: '#22252E',
              borderTop: '2px solid #2F333E',
              zIndex: 2,
            }}
          >
            {/* Dashed center lane divider */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '3px',
                background: 'repeating-linear-gradient(90deg, #F5B941 0, #F5B941 24px, transparent 24px, transparent 48px)',
                opacity: 0.75,
              }}
            />
          </div>
        </div>
      )}

      {/* 5. Custom Background */}
      {theme === 'custom' && customConfig && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${customConfig.skyTop} 0%, ${customConfig.skyBottom} ${customConfig.horizonHeight}%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {customConfig.hasStars && (
            <div style={{ position: 'absolute', inset: 0 }}>
              {[15, 30, 48, 65, 82, 92, 22, 55, 75].map((l, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${l}%`,
                    top: `${10 + (i % 3) * 14}%`,
                    width: '2px',
                    height: '2px',
                    background: '#FFF',
                    borderRadius: '50%',
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          )}

          {customConfig.horizonStyle === 'flat' && (
            <div
              style={{
                position: 'absolute',
                top: `${customConfig.horizonHeight}%`,
                bottom: 0,
                left: 0,
                right: 0,
                background: customConfig.groundColor,
              }}
            />
          )}

          {customConfig.horizonStyle === 'hills' && (
            <div
              style={{
                position: 'absolute',
                top: `${customConfig.horizonHeight - 14}%`,
                bottom: 0,
                left: '-10%',
                right: '-10%',
                borderRadius: '50% 50% 0 0',
                background: customConfig.groundColor,
              }}
            />
          )}

          {customConfig.horizonStyle === 'waves' && (
            <div
              style={{
                position: 'absolute',
                top: `${customConfig.horizonHeight}%`,
                bottom: 0,
                left: 0,
                right: 0,
                background: customConfig.groundColor,
                borderTop: '3px solid rgba(255,255,255,0.7)',
              }}
            />
          )}

          {customConfig.horizonStyle === 'dunes' && (
            <div
              style={{
                position: 'absolute',
                top: `${customConfig.horizonHeight - 10}%`,
                bottom: 0,
                left: '-5%',
                right: '-5%',
                borderRadius: '35% 65% 0 0',
                background: customConfig.groundColor,
              }}
            />
          )}

          {customConfig.horizonStyle === 'grid' && (
            <div
              style={{
                position: 'absolute',
                top: `${customConfig.horizonHeight}%`,
                bottom: 0,
                left: 0,
                right: 0,
                background: customConfig.groundColor,
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
          )}
        </div>
      )}

      {/* Render All Selectable Scene Objects */}
      {objects.map(obj => {
        if (hiddenMap[obj.name] || hiddenMap[obj.id]) return null
        const isSelected = effectiveSelectedIds.includes(obj.id)

        const renderX = obj.worldX ?? obj.x
        const renderY = obj.worldY ?? obj.y
        const renderRot = obj.worldRotation ?? obj.rotation
        const renderSx = obj.worldScaleX ?? obj.scaleX
        const renderSy = obj.worldScaleY ?? obj.scaleY
        const renderSkewX = obj.worldSkewX ?? obj.skewX

        const pivot = getObjectPivot(obj)
        const leftPct = (renderX / 960) * 100
        const topPct = (renderY / 540) * 100
        const widthPct = (obj.w / 960) * 100
        const heightPct = (obj.h / 540) * 100

        const transformOriginStr = `${(pivot.x / obj.w) * 100}% ${(pivot.y / obj.h) * 100}%`
        const transformStyle = `rotate(${renderRot}deg) scale(${renderSx}, ${renderSy}) skew(${renderSkewX}deg, ${obj.skewY}deg)`

        return (
          <div
            key={obj.id}
            onClick={e => {
              e.stopPropagation()
              onSelectObject(obj.id, e.shiftKey)
            }}
            onPointerDown={e => {
              if (isSpacePressed || activeTool === 'hand' || e.button === 1) return
              handlePointerDown(e, 'move', obj.id)
            }}
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              transform: transformStyle,
              transformOrigin: transformOriginStr,
              zIndex: isSelected ? 15 : 5,
              cursor: isSpacePressed || activeTool === 'hand'
                ? 'grab'
                : lockedMap[obj.name] || lockedMap[obj.id]
                ? 'not-allowed'
                : 'move',
              outline: isSelected && effectiveSelectedIds.length > 1 ? '2px solid #7B6DAF' : 'none',
              outlineOffset: '2px',
              borderRadius: '4px',
            }}
          >
            <ObjectRenderer obj={obj} />
          </div>
        )
      })}

      {/* Multi-Object Combined Bounding Box */}
      {effectiveSelectedIds.length > 1 && (() => {
        const selectedList = objects.filter(o => effectiveSelectedIds.includes(o.id) && !hiddenMap[o.name] && !hiddenMap[o.id])
        if (selectedList.length <= 1) return null

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const o of selectedList) {
          const ox = o.worldX ?? o.x
          const oy = o.worldY ?? o.y
          minX = Math.min(minX, ox)
          minY = Math.min(minY, oy)
          maxX = Math.max(maxX, ox + o.w)
          maxY = Math.max(maxY, oy + o.h)
        }

        return (
          <div
            style={{
              position: 'absolute',
              left: `${(minX / 960) * 100}%`,
              top: `${(minY / 540) * 100}%`,
              width: `${((maxX - minX) / 960) * 100}%`,
              height: `${((maxY - minY) / 540) * 100}%`,
              border: '1.5px dashed #7B6DAF',
              borderRadius: '6px',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-22px',
                left: '-1px',
                background: '#7B6DAF',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(123, 109, 175, 0.3)',
              }}
            >
              <span>🔗 {selectedList.length} Objects Selected</span>
            </div>
          </div>
        )
      })()}

      {/* Single Selected Object Bounding Box with Rotation & Resize Handles */}
      {effectiveSelectedIds.length === 1 && selectedObj && !hiddenMap[selectedObj.name] && !hiddenMap[selectedObj.id] && (() => {
        const renderX = selectedObj.worldX ?? selectedObj.x
        const renderY = selectedObj.worldY ?? selectedObj.y
        const renderRot = selectedObj.worldRotation ?? selectedObj.rotation
        const renderSx = selectedObj.worldScaleX ?? selectedObj.scaleX
        const renderSy = selectedObj.worldScaleY ?? selectedObj.scaleY
        const renderSkewX = selectedObj.worldSkewX ?? selectedObj.skewX
        const pivot = getObjectPivot(selectedObj)

        return (
          <div
            className="selection-box"
            style={{
              position: 'absolute',
              left: `${(renderX / 960) * 100}%`,
              top: `${(renderY / 540) * 100}%`,
              width: `${(selectedObj.w / 960) * 100}%`,
              height: `${(selectedObj.h / 540) * 100}%`,
              transform: `rotate(${renderRot}deg) scale(${renderSx}, ${renderSy}) skew(${renderSkewX}deg, ${selectedObj.skewY}deg)`,
              transformOrigin: `${(pivot.x / selectedObj.w) * 100}% ${(pivot.y / selectedObj.h) * 100}%`,
              border: '1.5px dashed var(--coral)',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            <label
              style={{
                position: 'absolute',
                top: '-20px',
                left: '-1px',
                background: 'var(--coral)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {selectedObj.name}
              {selectedObj.parentId && (
                <span style={{ opacity: 0.85, fontWeight: 400, fontSize: '8px' }}>
                  (↳ {objects.find(o => o.id === selectedObj.parentId)?.name || 'Parent'})
                </span>
              )}
            </label>

            <div
              className="rotate-handle"
              onPointerDown={e => handlePointerDown(e, 'rotate', selectedObj.id)}
              style={{
                position: 'absolute',
                top: '-26px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#fff',
                border: '1.5px solid var(--coral)',
                color: 'var(--coral)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'grab',
                pointerEvents: 'auto',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              }}
            >
              <RotateCw size={11} />
            </div>

            <span
              onPointerDown={e => handlePointerDown(e, 'resize-tl', selectedObj.id)}
              style={{
                position: 'absolute',
                left: '-5px',
                top: '-5px',
                width: '9px',
                height: '9px',
                background: '#fff',
                border: '1.5px solid var(--coral)',
                borderRadius: '2px',
                cursor: 'nwse-resize',
                pointerEvents: 'auto',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '-5px',
                top: '-5px',
                width: '9px',
                height: '9px',
                background: '#fff',
                border: '1.5px solid var(--coral)',
                borderRadius: '2px',
                cursor: 'nesw-resize',
                pointerEvents: 'auto',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '-5px',
                bottom: '-5px',
                width: '9px',
                height: '9px',
                background: '#fff',
                border: '1.5px solid var(--coral)',
                borderRadius: '2px',
                cursor: 'nesw-resize',
                pointerEvents: 'auto',
              }}
            />
            <span
              onPointerDown={e => handlePointerDown(e, 'resize-br', selectedObj.id)}
              style={{
                position: 'absolute',
                right: '-5px',
                bottom: '-5px',
                width: '9px',
                height: '9px',
                background: '#fff',
                border: '1.5px solid var(--coral)',
                borderRadius: '2px',
                cursor: 'nwse-resize',
                pointerEvents: 'auto',
              }}
            />
          </div>
        )
      })()}

      {/* Draggable Semi-Transparent Ghost Preview of Target End Position */}
      {translationInfo && targetObj && (
        <div
          style={{
            position: 'absolute',
            left: `${(translationInfo.worldToX / 960) * 100}%`,
            top: `${(translationInfo.worldToY / 540) * 100}%`,
            width: `${(targetObj.w / 960) * 100}%`,
            height: `${(targetObj.h / 540) * 100}%`,
            transform: `rotate(${translationInfo.endState?.rotation ?? targetObj.rotation}deg) scale(${translationInfo.endState?.scaleX ?? targetObj.scaleX}, ${translationInfo.endState?.scaleY ?? targetObj.scaleY}) skew(${translationInfo.endState?.skewX ?? targetObj.skewX}deg, 0deg)`,
            transformOrigin: `${(getObjectPivot(targetObj).x / targetObj.w) * 100}% ${(getObjectPivot(targetObj).y / targetObj.h) * 100}%`,
            opacity: 0.72,
            border: '2px dashed var(--coral)',
            borderRadius: '8px',
            backgroundColor: 'rgba(217, 93, 78, 0.08)',
            boxShadow: '0 4px 16px rgba(217, 93, 78, 0.25)',
            zIndex: 26,
            cursor: 'grab',
            userSelect: 'none',
          }}
          onPointerDown={handleGhostPointerDown}
          title="Drag Ghost to adjust Target End Position (To X, To Y)"
        >
          {/* Render ghost object visuals */}
          <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            <ObjectRenderer obj={{ ...targetObj, x: translationInfo.worldToX, y: translationInfo.worldToY }} />
          </div>

          {/* Draggable Handle Pill on the Ghost */}
          <div
            style={{
              position: 'absolute',
              top: '-26px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--coral)',
              color: '#FFFFFF',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '9px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(217, 93, 78, 0.4)',
              cursor: 'grab',
              pointerEvents: 'auto',
            }}
            onPointerDown={handleGhostPointerDown}
          >
            <Target size={11} />
            <span>End (Frame {activeBlock.endFrame}: {translationInfo.localToX}, {translationInfo.localToY})</span>
          </div>
        </div>
      )}

      {/* SVG Kinematic Rigging & Motion Path Overlay */}
      <svg
        viewBox="0 0 960 540"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 22,
        }}
      >
        <defs>
          <marker
            id="coral-motion-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#D95D4E" />
          </marker>
        </defs>

        {/* Visual Motion Path Line & DDA Sample Points for Translation Block */}
        {translationInfo && (
          <g key="motion-path-group">
            {/* Dashed coral motion line with arrowhead */}
            <line
              x1={translationInfo.fromCenterX}
              y1={translationInfo.fromCenterY}
              x2={translationInfo.toCenterX}
              y2={translationInfo.toCenterY}
              stroke="#D95D4E"
              strokeWidth={2.5}
              strokeDasharray="6,4"
              markerEnd="url(#coral-motion-arrow)"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(217,93,78,0.3))' }}
            />

            {/* DDA Coordinate Sample Dots */}
            {translationInfo.sampledPoints.map((pt, idx) => (
              <circle
                key={`dda-dot-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={2.5}
                fill="#D95D4E"
                opacity={0.85}
              />
            ))}

            {/* Start Position Halo Ring */}
            <circle
              cx={translationInfo.fromCenterX}
              cy={translationInfo.fromCenterY}
              r={5}
              fill="#FFFFFF"
              stroke="#D95D4E"
              strokeWidth={2}
            />
          </g>
        )}
        {/* Draw subtle dashed connection lines between child and parent joints */}
        {objects.map(obj => {
          if (!obj.parentId || !obj.parentJoint) return null
          const pivotPt = obj.worldPivot || { x: obj.x + getObjectPivot(obj).x, y: obj.y + getObjectPivot(obj).y }
          const isSelected = obj.id === selectedId || obj.parentId === selectedId

          return (
            <line
              key={`rig-line-${obj.id}`}
              x1={obj.parentJoint.x}
              y1={obj.parentJoint.y}
              x2={pivotPt.x}
              y2={pivotPt.y}
              stroke="#00C9E0"
              strokeWidth={isSelected ? 2 : 1.5}
              strokeDasharray="4 4"
              opacity={isSelected ? 0.95 : 0.6}
            />
          )
        })}

        {/* Display cyan joint pin icons at pivots */}
        {objects.map(obj => {
          const pivotPt = obj.worldPivot || { x: obj.x + getObjectPivot(obj).x, y: obj.y + getObjectPivot(obj).y }
          const isSelected = obj.id === selectedId
          const isRigged = !!obj.parentId || objects.some(child => child.parentId === obj.id)
          if (!isSelected && !isRigged) return null

          return (
            <g key={`joint-pin-${obj.id}`}>
              {/* Outer Cyan Ring / Pin */}
              <circle
                cx={pivotPt.x}
                cy={pivotPt.y}
                r={isSelected ? 6 : 4.5}
                fill="#00C9E0"
                stroke="#FFFFFF"
                strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
              />
              {/* Inner White Dot */}
              <circle
                cx={pivotPt.x}
                cy={pivotPt.y}
                r={isSelected ? 2 : 1.5}
                fill="#FFFFFF"
              />
            </g>
          )
        })}
      </svg>

      {/* Marquee Rectangle Selection Box */}
      {marqueeBox && (
        <div
          style={{
            position: 'absolute',
            left: `${(Math.min(marqueeBox.startX, marqueeBox.currentX) / 960) * 100}%`,
            top: `${(Math.min(marqueeBox.startY, marqueeBox.currentY) / 540) * 100}%`,
            width: `${(Math.abs(marqueeBox.currentX - marqueeBox.startX) / 960) * 100}%`,
            height: `${(Math.abs(marqueeBox.currentY - marqueeBox.startY) / 540) * 100}%`,
            background: 'rgba(123, 109, 175, 0.14)',
            border: '1.5px dashed #7B6DAF',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 40,
          }}
        />
      )}
        </div>
      </div>
    </div>
  )
}

/**
 * Visual Vector Renderer for:
 * 1. World Objects (Sun, Cloud, Pine Tree, Cottage House, Red Car, Boat, Beach Ball)
 * 2. Character & Rigging Parts (Head, Torso / Body, Upper Arm, Lower Arm / Hand, Upper Leg, Lower Leg / Foot)
 * 3. CG Primitives & Custom Assets
 */
function ObjectRenderer({ obj }: { obj: StageObject }) {
  // Imported Raster or SVG Image Object
  if (obj.imageUrl) {
    return (
      <img
        src={obj.imageUrl}
        alt={obj.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'block',
        }}
        draggable={false}
      />
    )
  }

  // Custom Composite Assets from Graphics Lab
  if (obj.kind === 'custom' && obj.primitives && obj.primitives.length > 0) {
    const { viewBox } = computeCustomAssetViewBox(obj.primitives)
    return (
      <svg viewBox={viewBox} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {obj.primitives.map(p => {
          if (!p.visible) return null
          if (p.tool === 'line-dda' || p.tool === 'line-bresenham') {
            return (
              <line
                key={p.id}
                x1={p.x0}
                y1={p.y0}
                x2={p.x1}
                y2={p.y1}
                stroke={p.strokeColor}
                strokeWidth={p.strokeWidth}
                strokeLinecap="round"
              />
            )
          }
          if (p.tool === 'circle-midpoint') {
            const cx = p.cx ?? p.x0
            const cy = p.cy ?? p.y0
            const r = p.r ?? 20
            return (
              <circle
                key={p.id}
                cx={cx}
                cy={cy}
                r={r}
                fill={p.fillColor !== 'transparent' ? p.fillColor : 'none'}
                stroke={p.strokeColor}
                strokeWidth={p.strokeWidth}
              />
            )
          }
          if (p.tool === 'ellipse-midpoint') {
            const cx = p.cx ?? p.x0
            const cy = p.cy ?? p.y0
            const rx = p.rx ?? 25
            const ry = p.ry ?? 15
            return (
              <ellipse
                key={p.id}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill={p.fillColor !== 'transparent' ? p.fillColor : 'none'}
                stroke={p.strokeColor}
                strokeWidth={p.strokeWidth}
              />
            )
          }
          if (p.tool === 'rect') {
            const x = Math.min(p.x0, p.x1)
            const y = Math.min(p.y0, p.y1)
            const w = Math.abs(p.x1 - p.x0)
            const h = Math.abs(p.y1 - p.y0)
            return (
              <rect
                key={p.id}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={p.fillColor !== 'transparent' ? p.fillColor : 'none'}
                stroke={p.strokeColor}
                strokeWidth={p.strokeWidth}
                rx={2}
              />
            )
          }
          if (p.tool === 'polygon' && p.points) {
            const pointsStr = p.points.map(pt => `${pt.x},${pt.y}`).join(' ')
            return (
              <polygon
                key={p.id}
                points={pointsStr}
                fill={p.fillColor !== 'transparent' ? p.fillColor : 'none'}
                stroke={p.strokeColor}
                strokeWidth={p.strokeWidth}
              />
            )
          }
          if (p.tool === 'bezier') {
            const pts = p.points || [
              { x: p.x0, y: p.y0 },
              { x: (p.x0 * 2 + p.x1) / 3, y: p.y0 - 40 },
              { x: (p.x0 + p.x1 * 2) / 3, y: p.y1 + 40 },
              { x: p.x1, y: p.y1 },
            ]
            const d = `M ${pts[0].x} ${pts[0].y} C ${pts[1].x} ${pts[1].y}, ${pts[2].x} ${pts[2].y}, ${pts[3].x} ${pts[3].y}`
            return (
              <path
                key={p.id}
                d={d}
                fill="none"
                stroke={p.strokeColor}
                strokeWidth={p.strokeWidth}
                strokeLinecap="round"
              />
            )
          }
          return null
        })}
      </svg>
    )
  }

  // --- WORLD OBJECTS ---
  if (obj.name === 'Sun') {
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <circle cx="50" cy="50" r="44" fill={obj.color || '#F5B941'} />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#F5B941" strokeWidth="3" opacity="0.4" />
      </svg>
    )
  }

  if (obj.name === 'Cloud') {
    return (
      <svg viewBox="0 0 140 60" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <path
          d="M 25 50 Q 5 50 10 32 Q 12 15 35 15 Q 45 5 70 8 Q 95 5 105 20 Q 130 18 130 35 Q 135 50 115 50 Z"
          fill={obj.color || '#F8F7F2'}
          stroke="#302E35"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (obj.name === 'Pine Tree') {
    return (
      <svg viewBox="0 0 90 140" style={{ width: '100%', height: '100%' }}>
        {/* Trunk */}
        <rect x="38" y="105" width="14" height="30" fill="#714F36" rx="2" stroke="#302E35" strokeWidth="2" />
        {/* Pine Foliage Tiers */}
        <polygon points="45,8 85,50 65,50 82,82 58,82 75,110 15,110 32,82 8,82 25,50 5,50" fill={obj.color || '#4E8462'} stroke="#302E35" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    )
  }

  if (obj.name === 'Cottage House') {
    return (
      <svg viewBox="0 0 140 120" style={{ width: '100%', height: '100%' }}>
        {/* Chimney */}
        <rect x="95" y="10" width="16" height="28" fill="#8F4839" stroke="#302E35" strokeWidth="2" />
        {/* Body */}
        <rect x="20" y="48" width="100" height="66" fill={obj.color || '#D98264'} stroke="#302E35" strokeWidth="2.5" rx="3" />
        {/* Roof */}
        <polygon points="70,8 132,50 8,50" fill="#B96353" stroke="#302E35" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Windows */}
        <rect x="32" y="60" width="22" height="24" fill="#A7C5C4" stroke="#302E35" strokeWidth="2" rx="2" />
        <rect x="86" y="60" width="22" height="24" fill="#A7C5C4" stroke="#302E35" strokeWidth="2" rx="2" />
        {/* Door */}
        <rect x="60" y="75" width="20" height="39" fill="#714F36" stroke="#302E35" strokeWidth="2" rx="1" />
      </svg>
    )
  }

  if (obj.name === 'Red Car') {
    return (
      <svg viewBox="0 0 120 54" style={{ width: '100%', height: '100%' }}>
        {/* Cabin */}
        <path d="M 28 26 L 44 8 L 78 8 L 94 26 Z" fill={obj.color || '#D95D4E'} stroke="#302E35" strokeWidth="2" />
        {/* Window */}
        <path d="M 46 12 L 74 12 L 85 24 L 37 24 Z" fill="#9BBABC" stroke="#302E35" strokeWidth="1.5" />
        {/* Body */}
        <rect x="8" y="24" width="104" height="20" rx="6" fill={obj.color || '#D95D4E'} stroke="#302E35" strokeWidth="2" />
        {/* Wheels */}
        <circle cx="28" cy="44" r="10" fill="#433F4B" stroke="#F1DFC8" strokeWidth="3" />
        <circle cx="92" cy="44" r="10" fill="#433F4B" stroke="#F1DFC8" strokeWidth="3" />
      </svg>
    )
  }

  if (obj.name === 'Boat') {
    return (
      <svg viewBox="0 0 110 95" style={{ width: '100%', height: '100%' }}>
        {/* Hull */}
        <path d="M 10 65 L 100 65 L 85 88 L 25 88 Z" fill="#C68B59" stroke="#302E35" strokeWidth="2.5" />
        {/* Mast */}
        <line x1="55" y1="10" x2="55" y2="65" stroke="#302E35" strokeWidth="3" strokeLinecap="round" />
        {/* Main Sail (White) */}
        <polygon points="58,15 95,58 58,58" fill="#F8F7F2" stroke="#302E35" strokeWidth="2" />
        {/* Front Sail (Coral) */}
        <polygon points="52,22 18,58 52,58" fill="#D95D4E" stroke="#302E35" strokeWidth="2" />
      </svg>
    )
  }

  if (obj.name === 'Beach Ball') {
    return (
      <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%' }}>
        <circle cx="40" cy="40" r="36" fill="#F8F7F2" stroke="#302E35" strokeWidth="2.5" />
        {/* Striped Colored Panels */}
        <path d="M 40 4 Q 20 40 40 76 Q 30 40 40 4 Z" fill="#D95D4E" stroke="#302E35" strokeWidth="1.5" />
        <path d="M 40 4 Q 60 40 40 76 Q 50 40 40 4 Z" fill="#3B7BA4" stroke="#302E35" strokeWidth="1.5" />
        <path d="M 4 40 Q 40 20 76 40 Q 40 30 4 40 Z" fill="#F5B941" stroke="#302E35" strokeWidth="1.5" />
        {/* Center circle cap */}
        <circle cx="40" cy="40" r="8" fill="#FFFFFF" stroke="#302E35" strokeWidth="1.5" />
      </svg>
    )
  }

  // --- CHARACTER & RIGGING PARTS (FOR HUMAN ANIMATION) ---
  if (obj.name === 'Head') {
    return (
      <svg viewBox="0 0 60 60" style={{ width: '100%', height: '100%' }}>
        {/* Hair */}
        <path d="M 12 28 C 12 12, 48 12, 48 28 C 52 30, 48 10, 30 8 C 12 10, 8 30, 12 28 Z" fill="#302E35" />
        {/* Face */}
        <circle cx="30" cy="32" r="20" fill={obj.color || '#E8BA94'} stroke="#302E35" strokeWidth="2" />
        {/* Eyes */}
        <circle cx="23" cy="30" r="2.5" fill="#302E35" />
        <circle cx="37" cy="30" r="2.5" fill="#302E35" />
        {/* Smile */}
        <path d="M 24 37 Q 30 42 36 37" fill="none" stroke="#302E35" strokeWidth="2" strokeLinecap="round" />
        {/* Neck Anchor Pin */}
        <circle cx="30" cy="50" r="3" fill="#D95D4E" />
      </svg>
    )
  }

  if (obj.name === 'Torso / Body' || obj.name === 'Torso') {
    return (
      <svg viewBox="0 0 70 100" style={{ width: '100%', height: '100%' }}>
        {/* Torso Shirt */}
        <path d="M 18 15 L 52 15 L 58 75 L 12 75 Z" fill={obj.color || '#7B6DAF'} stroke="#302E35" strokeWidth="2.5" rx="3" />
        {/* Collar */}
        <polygon points="30,15 40,15 35,26" fill="#F8F7F2" stroke="#302E35" strokeWidth="1.5" />
        {/* Belt */}
        <rect x="12" y="75" width="46" height="10" fill="#3D405B" stroke="#302E35" strokeWidth="2" />
        <rect x="31" y="75" width="8" height="10" fill="#F5B941" />
        {/* Shoulder / Hip Rigging Pivot Points */}
        <circle cx="18" cy="18" r="3" fill="#F5B941" opacity="0.8" />
        <circle cx="52" cy="18" r="3" fill="#F5B941" opacity="0.8" />
        <circle cx="20" cy="85" r="3" fill="#F5B941" opacity="0.8" />
        <circle cx="50" cy="85" r="3" fill="#F5B941" opacity="0.8" />
      </svg>
    )
  }

  if (obj.name === 'Upper Arm') {
    return (
      <svg viewBox="0 0 28 70" style={{ width: '100%', height: '100%' }}>
        {/* Upper Arm Limb */}
        <rect x="6" y="8" width="16" height="52" rx="8" fill={obj.color || '#7B6DAF'} stroke="#302E35" strokeWidth="2" />
        {/* Shoulder Pivot */}
        <circle cx="14" cy="12" r="4" fill="#D95D4E" />
        {/* Elbow Pivot */}
        <circle cx="14" cy="56" r="3" fill="#F5B941" />
      </svg>
    )
  }

  if (obj.name === 'Lower Arm / Hand' || obj.name === 'Lower Arm') {
    return (
      <svg viewBox="0 0 26 70" style={{ width: '100%', height: '100%' }}>
        {/* Forearm */}
        <rect x="6" y="8" width="14" height="42" rx="6" fill={obj.color || '#E8BA94'} stroke="#302E35" strokeWidth="2" />
        {/* Hand */}
        <circle cx="13" cy="55" r="7" fill={obj.color || '#E8BA94'} stroke="#302E35" strokeWidth="2" />
        {/* Elbow Joint Pivot */}
        <circle cx="13" cy="12" r="3.5" fill="#F5B941" />
      </svg>
    )
  }

  if (obj.name === 'Upper Leg') {
    return (
      <svg viewBox="0 0 30 80" style={{ width: '100%', height: '100%' }}>
        {/* Thigh */}
        <rect x="6" y="8" width="18" height="64" rx="8" fill={obj.color || '#3D485C'} stroke="#302E35" strokeWidth="2" />
        {/* Hip Joint Pivot */}
        <circle cx="15" cy="14" r="4" fill="#D95D4E" />
        {/* Knee Joint Pivot */}
        <circle cx="15" cy="66" r="3.5" fill="#F5B941" />
      </svg>
    )
  }

  if (obj.name === 'Lower Leg / Foot' || obj.name === 'Lower Leg') {
    return (
      <svg viewBox="0 0 36 80" style={{ width: '100%', height: '100%' }}>
        {/* Shin */}
        <rect x="8" y="8" width="16" height="52" rx="6" fill={obj.color || '#272E3D'} stroke="#302E35" strokeWidth="2" />
        {/* Shoe / Foot */}
        <path d="M 8 60 L 32 60 C 35 60, 36 72, 28 72 L 6 72 C 4 72, 6 60, 8 60 Z" fill="#D95D4E" stroke="#302E35" strokeWidth="2" />
        {/* Knee Joint Pivot */}
        <circle cx="16" cy="12" r="3.5" fill="#F5B941" />
      </svg>
    )
  }

  // --- STANDALONE CG PRIMITIVES ---
  if (obj.kind === 'shape') {
    if (obj.tool === 'line-dda' || obj.tool === 'line-bresenham') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <line x1="5" y1="95" x2="95" y2="5" stroke={obj.color || '#3D405B'} strokeWidth={obj.strokeWidth || 4} strokeLinecap="round" />
        </svg>
      )
    }
    if (obj.tool === 'circle-midpoint') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <circle cx="50" cy="50" r="44" fill={obj.fillColor || obj.color || '#F5B941'} stroke={obj.strokeColor || '#3D405B'} strokeWidth={obj.strokeWidth || 3} />
        </svg>
      )
    }
    if (obj.tool === 'rect') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <rect x="6" y="6" width="88" height="88" rx="4" fill={obj.fillColor || obj.color || '#D98264'} stroke={obj.strokeColor || '#3D405B'} strokeWidth={obj.strokeWidth || 3} />
        </svg>
      )
    }
    if (obj.tool === 'polygon') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <polygon points="50,8 92,90 8,90" fill={obj.fillColor || obj.color || '#7B6DAF'} stroke={obj.strokeColor || '#3D405B'} strokeWidth={obj.strokeWidth || 3} />
        </svg>
      )
    }
    if (obj.tool === 'bezier') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <path d="M 10 85 C 20 15, 80 15, 90 85" fill="none" stroke={obj.color || '#D95D4E'} strokeWidth={obj.strokeWidth || 4} strokeLinecap="round" />
        </svg>
      )
    }
  }

  // Fallback
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: obj.color || 'var(--coral)',
        borderRadius: '6px',
        border: '2px solid #302E35',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 'bold',
      }}
    >
      {obj.name}
    </div>
  )
}
