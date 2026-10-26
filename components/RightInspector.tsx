'use client'

import React, { useState } from 'react'
import {
  ChevronDown, ChevronUp, Copy, Trash2, RotateCw, Sparkles, Layers,
  Move, Maximize2, SlidersHorizontal, Plus, Check, Clock, Crosshair, Target, ArrowRight
} from 'lucide-react'
import { StageObject } from './StageCanvas'
import {
  getCompositeMatrix,
  formatMatrixRow,
  Matrix3x3,
  TransformBlock,
  TransformActionType,
  getBlockColor,
  getBlockLabel,
  getBlockStartState,
  getBlockEndState,
} from '@/lib/cg-engine'

interface RightInspectorProps {
  selected: StageObject | null
  allObjects?: StageObject[]
  onUpdate: (updates: Partial<StageObject>) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void

  // Multi-Object props
  selectedIds?: string[]
  onGroupSelected?: () => void
  onUngroupSelected?: () => void
  canUngroup?: boolean
  onDeleteSelected?: () => void

  // Transformation Blocks on the selected object
  blocks: TransformBlock[]
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onAddBlock: (objectId: string, actionType?: TransformActionType) => void
  onUpdateBlock: (blockId: string, updates: Partial<TransformBlock>) => void
  onDeleteBlock: (blockId: string) => void

  // Canvas picking
  isPickingTarget?: boolean
  onTogglePickTarget?: (active: boolean) => void

  totalFrames?: number
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

export default function RightInspector({
  selected,
  allObjects = [],
  onUpdate,
  onDuplicate,
  onDelete,
  selectedIds = [],
  onGroupSelected,
  onUngroupSelected,
  canUngroup = false,
  onDeleteSelected,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  isPickingTarget = false,
  onTogglePickTarget,
  totalFrames = 168,
}: RightInspectorProps) {
  const [matrixExpanded, setMatrixExpanded] = useState(true)
  const [actionsExpanded, setActionsExpanded] = useState(true)

  // Compute valid parent candidates (avoiding self or circular descendants)
  const availableParents = selected
    ? (allObjects || []).filter(o => {
        if (o.id === selected.id) return false
        let cur: StageObject | undefined = o
        while (cur && cur.parentId) {
          if (cur.parentId === selected.id) return false
          cur = (allObjects || []).find(p => p.id === cur?.parentId)
        }
        return true
      })
    : []

  if (!selected) {
    return (
      <aside className="right-sidebar panel" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '30px 10px', textAlign: 'center', color: '#978C82' }}>
          <Sparkles size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#D95D4E' }} />
          <h3 style={{ fontSize: '13px', margin: '0 0 6px', color: 'var(--ink)' }}>No Object Selected</h3>
          <p style={{ fontSize: '10px', margin: 0, lineHeight: 1.5 }}>
            Click an object on the canvas or a timeline track row to inspect transforms and action blocks.
          </p>
        </div>
      </aside>
    )
  }

  // Active selected block or default to first/latest
  const activeBlock = blocks.find(b => b.id === selectedBlockId) || (blocks.length > 0 ? blocks[blocks.length - 1] : null)

  // Calculate sequential Start and End states for activeBlock
  const blockStartState = (selected && activeBlock)
    ? getBlockStartState(selected, blocks, activeBlock)
    : null
  const blockEndState = (blockStartState && activeBlock)
    ? getBlockEndState(blockStartState, activeBlock)
    : null

  const fromX = blockStartState ? Math.round(blockStartState.x) : Math.round(selected.x)
  const fromY = blockStartState ? Math.round(blockStartState.y) : Math.round(selected.y)
  const toX = blockEndState ? Math.round(blockEndState.x) : fromX + (activeBlock?.dx ?? 0)
  const toY = blockEndState ? Math.round(blockEndState.y) : fromY + (activeBlock?.dy ?? 0)

  const fromRot = blockStartState ? Math.round(blockStartState.rotation) : Math.round(selected.rotation)
  const toRot = blockEndState ? Math.round(blockEndState.rotation) : fromRot + (activeBlock?.deltaRotation ?? 0)

  const fromSx = blockStartState ? Math.round((blockStartState.scaleX ?? 1) * 100) : 100
  const fromSy = blockStartState ? Math.round((blockStartState.scaleY ?? 1) * 100) : 100
  const toSx = blockEndState ? Math.round((blockEndState.scaleX ?? 1) * 100) : Math.round(fromSx * (activeBlock?.scaleX ?? 1))
  const toSy = blockEndState ? Math.round((blockEndState.scaleY ?? 1) * 100) : Math.round(fromSy * (activeBlock?.scaleY ?? 1))

  const fromShx = blockStartState ? Math.round(blockStartState.skewX ?? 0) : 0
  const fromShy = blockStartState ? Math.round(blockStartState.skewY ?? 0) : 0
  const toShx = blockEndState ? Math.round(blockEndState.skewX ?? 0) : fromShx + (activeBlock?.skewX ?? 0)
  const toShy = blockEndState ? Math.round(blockEndState.skewY ?? 0) : fromShy + (activeBlock?.skewY ?? 0)

  // Calculate live 3x3 Homogeneous Transformation Matrix
  const matrix: Matrix3x3 = getCompositeMatrix({
    x: selected.x,
    y: selected.y,
    w: selected.w,
    h: selected.h,
    rotation: selected.rotation,
    scaleX: selected.scaleX ?? 1,
    scaleY: selected.scaleY ?? 1,
    skewX: selected.skewX ?? 0,
    skewY: selected.skewY ?? 0,
  })

  return (
    <aside
      className="right-sidebar panel"
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        height: '100%',
        padding: '16px 14px',
      }}
    >
      {/* Inspector Header */}
      <div className="inspector-header">
        <div
          className="selected-icon"
          style={{ background: `${selected.color}22`, overflow: 'hidden', padding: selected.imageUrl ? '3px' : 0 }}
        >
          {selected.imageUrl ? (
            <img
              src={selected.imageUrl}
              alt={selected.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <span style={{ color: selected.color, fontWeight: 'bold', fontSize: '15px' }}>
              ✦
            </span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <span className="kicker">SELECTED OBJECT</span>
          <h2 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selected.name}
          </h2>
          <small>
            {selected.imageUrl
              ? 'Imported Image'
              : selected.kind === 'character'
              ? 'Rigging Part'
              : selected.kind === 'custom'
              ? 'Composite Asset'
              : selected.kind === 'shape'
              ? 'CG Primitive'
              : 'Vector Object'}{' '}
            · Active
          </small>
        </div>
        <div className="inspector-actions">
          <button
            onClick={() => onDuplicate(selected.id)}
            title="Duplicate object"
            aria-label="Duplicate object"
          >
            <Copy size={15} />
          </button>
          <button
            onClick={() => onDelete(selected.id)}
            title="Delete object"
            aria-label="Delete object"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Multi-Selection Compound Grouping Card */}
      {selectedIds && selectedIds.length >= 2 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #F3EFF9 0%, #E9E1F3 100%)',
            border: '1.5px solid #C8BEE2',
            borderRadius: '10px',
            padding: '12px',
            marginTop: '12px',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(123, 109, 175, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                background: '#7B6DAF',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Layers size={14} />
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '11px', color: '#4A3E75', display: 'block' }}>
                🔗 {selectedIds.length} Objects Selected
              </strong>
              <small style={{ fontSize: '9px', color: '#77699E' }}>
                Group into a single compound joint unit
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {onGroupSelected && (
              <button
                onClick={onGroupSelected}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  background: '#7B6DAF',
                  color: '#fff',
                  padding: '7px 8px',
                  borderRadius: '6px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(123, 109, 175, 0.25)',
                }}
                title="Group selected into compound joint hierarchy (Ctrl+G)"
              >
                <Layers size={13} /> Group (Ctrl+G)
              </button>
            )}

            {canUngroup && onUngroupSelected && (
              <button
                onClick={onUngroupSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  background: '#FAF6F0',
                  border: '1px solid #C8BEE2',
                  color: '#5E4E8A',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Ungroup compound objects (Ctrl+Shift+G)"
              >
                Ungroup
              </button>
            )}

            {onDeleteSelected && (
              <button
                onClick={onDeleteSelected}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: '30px',
                  height: '30px',
                  background: '#FAF6F0',
                  border: '1px solid #E8D3CF',
                  color: '#BA4437',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title={`Delete all ${selectedIds.length} selected objects`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 
        ACTIVE TIMELINE ACTION CARD
        Allows adding and editing sequential transformation blocks across frame ranges.
      */}
      <div
        className="timeline-action-card"
        style={{
          background: '#FFF9F4',
          border: '1.5px solid #EADBCA',
          borderRadius: '10px',
          padding: '12px',
          marginTop: '14px',
          marginBottom: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          onClick={() => setActionsExpanded(v => !v)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: actionsExpanded ? '10px' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: '#D95D4E',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '11px',
              }}
            >
              <Clock size={12} />
            </span>
            <div>
              <strong style={{ fontSize: '11px', display: 'block' }}>Timeline Action Blocks</strong>
              <small style={{ color: '#8E847B', fontSize: '9px' }}>
                {blocks.length} sequential transform segment{blocks.length !== 1 ? 's' : ''}
              </small>
            </div>
          </div>
          {actionsExpanded ? <ChevronUp size={15} style={{ color: '#8E847B' }} /> : <ChevronDown size={15} style={{ color: '#8E847B' }} />}
        </div>

        {actionsExpanded && (
          <div>
            {/* List of existing blocks on this object */}
            {blocks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                {blocks.map(b => {
                  const isCur = activeBlock?.id === b.id
                  const col = b.color || getBlockColor(b.actionType)
                  return (
                    <div
                      key={b.id}
                      onClick={() => onSelectBlock(b.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: isCur ? '#FFFFFF' : '#F6F1E8',
                        border: isCur ? `1.5px solid ${col}` : '1px solid #E5DBCF',
                        cursor: 'pointer',
                        fontSize: '9.5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: col,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: isCur ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getBlockLabel(b)}
                        </span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          onDeleteBlock(b.id)
                        }}
                        title="Delete block"
                        style={{ color: '#A3988E', padding: '2px' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* + Add Frame Range Action Button */}
            <button
              className="outline-button"
              onClick={() => onAddBlock(selected.id)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '10px',
                marginBottom: activeBlock ? '12px' : 0,
                border: '1px dashed var(--coral)',
                color: 'var(--coral)',
                background: '#FFF5F2',
                borderRadius: '6px',
                fontWeight: 700,
              }}
            >
              <Plus size={13} /> + Add Frame Range Action
            </button>

            {/* Active Transformation Block Inspector */}
            {activeBlock && (() => {
              const transMode = activeBlock.translationMode || 'from-to'
              const color = getBlockColor(activeBlock.actionType)

              return (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${color}44`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Block Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: color,
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '9px',
                        }}
                      >
                        {activeBlock.actionType === 'translation' && <Move size={10} />}
                        {activeBlock.actionType === 'rotation' && <RotateCw size={10} />}
                        {activeBlock.actionType === 'scaling' && <Maximize2 size={10} />}
                        {activeBlock.actionType === 'shear' && <SlidersHorizontal size={10} />}
                      </span>
                      <strong style={{ fontSize: '11px', color: '#302E35' }}>
                        {activeBlock.actionType === 'translation'
                          ? 'Translation Block'
                          : activeBlock.actionType === 'rotation'
                          ? 'Rotation Block'
                          : activeBlock.actionType === 'scaling'
                          ? 'Scaling Block'
                          : 'Shear Block'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          background: color + '22',
                          color: color,
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        F{activeBlock.startFrame}–F{activeBlock.endFrame}
                      </span>
                      <button
                        onClick={() => onDeleteBlock(activeBlock.id)}
                        title="Delete block"
                        style={{ color: '#A3988E', padding: '2px', background: 'transparent', border: 0, cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Action Type Selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '12px' }}>
                    {(['translation', 'rotation', 'scaling', 'shear'] as const).map(type => {
                      const isSelectedType = activeBlock.actionType === type
                      const col = getBlockColor(type)
                      return (
                        <button
                          key={type}
                          onClick={() => onUpdateBlock(activeBlock.id, { actionType: type })}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '6px 2px',
                            borderRadius: '6px',
                            background: isSelectedType ? col : '#F8F4EC',
                            color: isSelectedType ? '#FFFFFF' : '#6F665E',
                            border: isSelectedType ? `1px solid ${col}` : '1px solid #E4DBD0',
                            fontSize: '8.5px',
                            fontWeight: isSelectedType ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {type === 'translation' && <Move size={11} />}
                          {type === 'rotation' && <RotateCw size={11} />}
                          {type === 'scaling' && <Maximize2 size={11} />}
                          {type === 'shear' && <SlidersHorizontal size={11} />}
                          <span>
                            {type === 'translation'
                              ? 'Move'
                              : type === 'rotation'
                              ? 'Rotate'
                              : type === 'scaling'
                              ? 'Scale'
                              : 'Shear'}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* 1. Frame Range Inputs & Quick Presets */}
                  <div style={{ background: '#FAF7F2', padding: '8px', borderRadius: '6px', border: '1px solid #EADBCA', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#7A6E65', letterSpacing: '0.04em' }}>
                        FRAME RANGE
                      </span>
                      <small style={{ fontSize: '8.5px', color: '#9E948B' }}>
                        Duration: {Math.max(1, activeBlock.endFrame - activeBlock.startFrame)} frames
                      </small>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                      <label style={{ background: '#FFFFFF', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E2D7C8', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#8E847B', width: '38px', fontWeight: 600 }}>Start</span>
                        <input
                          type="number"
                          min="0"
                          max={activeBlock.endFrame - 1}
                          value={activeBlock.startFrame}
                          onChange={e => {
                            const val = Math.max(0, Math.min(activeBlock.endFrame - 1, Number(e.target.value)))
                            onUpdateBlock(activeBlock.id, { startFrame: val })
                          }}
                          style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700 }}
                        />
                      </label>

                      <label style={{ background: '#FFFFFF', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E2D7C8', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#8E847B', width: '34px', fontWeight: 600 }}>End</span>
                        <input
                          type="number"
                          min={activeBlock.startFrame + 1}
                          max={String(totalFrames)}
                          value={activeBlock.endFrame}
                          onChange={e => {
                            const val = Math.max(activeBlock.startFrame + 1, Math.min(totalFrames, Number(e.target.value)))
                            onUpdateBlock(activeBlock.id, { endFrame: val })
                          }}
                          style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700 }}
                        />
                      </label>
                    </div>

                    {/* Quick frame range presets */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { label: '1–20', s: 1, e: 20 },
                        { label: '20–40', s: 20, e: 40 },
                        { label: '40–60', s: 40, e: 60 },
                      ].map(p => (
                        <button
                          key={p.label}
                          onClick={() => onUpdateBlock(activeBlock.id, { startFrame: p.s, endFrame: p.e })}
                          style={{
                            fontSize: '8px',
                            padding: '2px 5px',
                            background: '#F0ECE4',
                            border: '1px solid #DED4C7',
                            borderRadius: '3px',
                            color: '#655A51',
                            cursor: 'pointer',
                            flex: 1,
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const dur = Math.max(1, activeBlock.endFrame - activeBlock.startFrame)
                          const newStart = Math.min(Math.max(0, totalFrames - dur), activeBlock.startFrame + 20)
                          const newEnd = Math.min(totalFrames, newStart + dur)
                          onUpdateBlock(activeBlock.id, { startFrame: newStart, endFrame: newEnd })
                        }}
                        style={{
                          fontSize: '8px',
                          padding: '2px 5px',
                          background: '#EAE4F3',
                          border: '1px solid #CFC5E4',
                          borderRadius: '3px',
                          color: '#5C4E84',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        title="Shift range forward by 20 frames"
                      >
                        +20f
                      </button>
                    </div>
                  </div>

                  {/* 2. TRANSLATION PARAMETERS */}
                  {activeBlock.actionType === 'translation' && (
                    <div>
                      {/* Mode Toggle: Target Position vs Relative Offset */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '4px',
                          background: '#F0EBE1',
                          padding: '3px',
                          borderRadius: '6px',
                          marginBottom: '10px',
                        }}
                      >
                        <button
                          onClick={() => onUpdateBlock(activeBlock.id, { translationMode: 'from-to' })}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: 0,
                            fontSize: '8.5px',
                            fontWeight: 700,
                            background: transMode === 'from-to' ? '#FFFFFF' : 'transparent',
                            color: transMode === 'from-to' ? 'var(--coral)' : '#7C7167',
                            boxShadow: transMode === 'from-to' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          From → To Target
                        </button>
                        <button
                          onClick={() => onUpdateBlock(activeBlock.id, { translationMode: 'delta' })}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: 0,
                            fontSize: '8.5px',
                            fontWeight: 700,
                            background: transMode === 'delta' ? '#FFFFFF' : 'transparent',
                            color: transMode === 'delta' ? 'var(--coral)' : '#7C7167',
                            boxShadow: transMode === 'delta' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Relative Offset (ΔX, ΔY)
                        </button>
                      </div>

                      {/* Start Position (From X, From Y) */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#7A6E65' }}>Start Position (From)</span>
                          <span style={{ fontSize: '8px', color: '#978C82' }}>Inherited @ Frame {activeBlock.startFrame}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <div style={{ background: '#F8F5EE', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E6DED2', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: '#978C82', width: '38px' }}>From X</span>
                            <span style={{ width: '100%', textAlign: 'right', font: '11px monospace', fontWeight: 600, color: '#453E38' }}>
                              {fromX} px
                            </span>
                          </div>
                          <div style={{ background: '#F8F5EE', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E6DED2', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: '#978C82', width: '38px' }}>From Y</span>
                            <span style={{ width: '100%', textAlign: 'right', font: '11px monospace', fontWeight: 600, color: '#453E38' }}>
                              {fromY} px
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Target End Position (To X, To Y) */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--coral)' }}>Target End Position (To)</span>
                          <span style={{ fontSize: '8px', color: '#978C82' }}>At Frame {activeBlock.endFrame}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <label style={{ background: '#FFF7F5', padding: '4px 7px', borderRadius: '5px', border: '1.5px solid #F0C3BD', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: 'var(--coral)', width: '30px', fontWeight: 700 }}>To X</span>
                            <input
                              type="number"
                              value={toX}
                              onChange={e => {
                                const newToX = Number(e.target.value)
                                onUpdateBlock(activeBlock.id, { dx: newToX - fromX })
                              }}
                              style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700, color: '#302E35' }}
                            />
                            <span style={{ fontSize: '8.5px', color: '#A3988E', marginLeft: '2px' }}>px</span>
                          </label>

                          <label style={{ background: '#FFF7F5', padding: '4px 7px', borderRadius: '5px', border: '1.5px solid #F0C3BD', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: 'var(--coral)', width: '30px', fontWeight: 700 }}>To Y</span>
                            <input
                              type="number"
                              value={toY}
                              onChange={e => {
                                const newToY = Number(e.target.value)
                                onUpdateBlock(activeBlock.id, { dy: newToY - fromY })
                              }}
                              style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700, color: '#302E35' }}
                            />
                            <span style={{ fontSize: '8.5px', color: '#A3988E', marginLeft: '2px' }}>px</span>
                          </label>
                        </div>
                      </div>

                      {/* Move by Delta Offset (ΔX, ΔY) */}
                      <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#7A6E65', display: 'block', marginBottom: '3px' }}>
                          Move by Delta (Δ Amount)
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <label style={{ background: '#F8F4EC', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E5DBCF', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: '#8E847B', width: '28px', fontWeight: 600 }}>ΔX</span>
                            <input
                              type="number"
                              step="10"
                              value={activeBlock.dx ?? 0}
                              onChange={e => onUpdateBlock(activeBlock.id, { dx: Number(e.target.value) })}
                              style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700 }}
                            />
                            <span style={{ fontSize: '8.5px', color: '#A3988E', marginLeft: '2px' }}>px</span>
                          </label>

                          <label style={{ background: '#F8F4EC', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E5DBCF', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: '#8E847B', width: '28px', fontWeight: 600 }}>ΔY</span>
                            <input
                              type="number"
                              step="10"
                              value={activeBlock.dy ?? 0}
                              onChange={e => onUpdateBlock(activeBlock.id, { dy: Number(e.target.value) })}
                              style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700 }}
                            />
                            <span style={{ fontSize: '8.5px', color: '#A3988E', marginLeft: '2px' }}>px</span>
                          </label>
                        </div>
                      </div>

                      {/* Interactive Canvas Button: 🎯 Pick Target Position on Canvas */}
                      <button
                        onClick={() => onTogglePickTarget?.(!isPickingTarget)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: isPickingTarget
                            ? 'linear-gradient(135deg, #D95D4E 0%, #C44C3D 100%)'
                            : '#FFF4F1',
                          color: isPickingTarget ? '#FFFFFF' : 'var(--coral)',
                          border: isPickingTarget ? '1.5px solid var(--coral)' : '1.5px dashed var(--coral)',
                          boxShadow: isPickingTarget ? '0 0 10px rgba(217,93,78,0.35)' : 'none',
                          marginBottom: '8px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Target size={13} />
                        {isPickingTarget ? '🎯 Active: Click/Drag on Canvas' : '🎯 Pick Target Position on Canvas'}
                      </button>

                      {/* Quick Distance Presets */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[50, 100, 200, -100].map(val => (
                          <button
                            key={val}
                            onClick={() => onUpdateBlock(activeBlock.id, { dx: val })}
                            style={{
                              fontSize: '8px',
                              padding: '2px 5px',
                              background: '#F3EFE7',
                              border: '1px solid #E2D8CA',
                              borderRadius: '3px',
                              color: '#776D65',
                              cursor: 'pointer',
                              flex: 1,
                            }}
                          >
                            X {val > 0 ? `+${val}` : val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. ROTATION PARAMETERS */}
                  {activeBlock.actionType === 'rotation' && (
                    <div>
                      {/* From Angle & To Angle */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ background: '#F8F5EE', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E6DED2' }}>
                          <span style={{ fontSize: '8.5px', color: '#978C82', display: 'block' }}>From Angle</span>
                          <strong style={{ font: '11px monospace', color: '#453E38' }}>{fromRot}°</strong>
                        </div>
                        <label style={{ background: '#F5F1FA', padding: '4px 7px', borderRadius: '5px', border: '1.5px solid #D6CBEE', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '8.5px', color: '#62538C' }}>To Angle</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={toRot}
                              onChange={e => onUpdateBlock(activeBlock.id, { deltaRotation: Number(e.target.value) - fromRot })}
                              style={{ width: '100%', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700, color: '#302E35' }}
                            />
                            <span style={{ fontSize: '9px', color: '#62538C' }}>°</span>
                          </div>
                        </label>
                      </div>

                      {/* Rotate By (Delta Angle) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#7A6E65' }}>Rotate by (Δθ Amount)</span>
                        <strong style={{ font: '11px monospace', color: '#7B6DAF' }}>
                          {(activeBlock.deltaRotation ?? 0) >= 0 ? `+${activeBlock.deltaRotation ?? 0}` : activeBlock.deltaRotation}°
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="-360"
                        max="360"
                        step="5"
                        value={activeBlock.deltaRotation ?? 0}
                        onChange={e => onUpdateBlock(activeBlock.id, { deltaRotation: Number(e.target.value) })}
                        className="range"
                        style={{ margin: '4px 0 8px' }}
                      />

                      {/* Quick Angle Buttons */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[45, 90, 180, 360, -45, -90].map(val => (
                          <button
                            key={val}
                            onClick={() => onUpdateBlock(activeBlock.id, { deltaRotation: val })}
                            style={{
                              fontSize: '8px',
                              padding: '3px 4px',
                              background: '#F3EFE7',
                              border: '1px solid #E2D8CA',
                              borderRadius: '3px',
                              color: '#776D65',
                              cursor: 'pointer',
                              flex: 1,
                            }}
                          >
                            {val > 0 ? `+${val}°` : `${val}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. SCALING PARAMETERS */}
                  {activeBlock.actionType === 'scaling' && (
                    <div>
                      {/* From Scale & To Scale */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ background: '#F8F5EE', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E6DED2' }}>
                          <span style={{ fontSize: '8.5px', color: '#978C82', display: 'block' }}>From Scale</span>
                          <strong style={{ font: '11px monospace', color: '#453E38' }}>{fromSx}% × {fromSy}%</strong>
                        </div>
                        <div style={{ background: '#EEF7F0', padding: '4px 7px', borderRadius: '5px', border: '1.5px solid #BFDEC3' }}>
                          <span style={{ fontSize: '8.5px', color: '#407B4F', display: 'block' }}>To Scale</span>
                          <strong style={{ font: '11px monospace', color: '#275833' }}>{toSx}% × {toSy}%</strong>
                        </div>
                      </div>

                      {/* Target Scale X & Y Inputs */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                        <label style={{ background: '#FFFFFF', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E5DBCF', display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: '9px', color: '#8E847B', width: '38px', fontWeight: 600 }}>To Sx</span>
                          <input
                            type="number"
                            step="10"
                            value={toSx}
                            onChange={e => {
                              const newToSx = Number(e.target.value)
                              const factor = newToSx / Math.max(1, fromSx)
                              if (activeBlock.lockAspect !== false) {
                                onUpdateBlock(activeBlock.id, { scaleX: factor, scaleY: factor })
                              } else {
                                onUpdateBlock(activeBlock.id, { scaleX: factor })
                              }
                            }}
                            style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700 }}
                          />
                          <span style={{ fontSize: '8.5px', color: '#A3988E', marginLeft: '2px' }}>%</span>
                        </label>

                        <label style={{ background: '#FFFFFF', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E5DBCF', display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: '9px', color: '#8E847B', width: '38px', fontWeight: 600 }}>To Sy</span>
                          <input
                            type="number"
                            step="10"
                            value={toSy}
                            onChange={e => {
                              const newToSy = Number(e.target.value)
                              const factor = newToSy / Math.max(1, fromSy)
                              if (activeBlock.lockAspect !== false) {
                                onUpdateBlock(activeBlock.id, { scaleX: factor, scaleY: factor })
                              } else {
                                onUpdateBlock(activeBlock.id, { scaleY: factor })
                              }
                            }}
                            style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700 }}
                          />
                          <span style={{ fontSize: '8.5px', color: '#A3988E', marginLeft: '2px' }}>%</span>
                        </label>
                      </div>

                      {/* Lock Aspect Ratio */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#655A51', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={activeBlock.lockAspect !== false}
                          onChange={e => onUpdateBlock(activeBlock.id, { lockAspect: e.target.checked })}
                        />
                        <span>Lock Aspect Ratio (Uniform Scale)</span>
                      </label>

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[50, 100, 125, 150, 200].map(val => (
                          <button
                            key={val}
                            onClick={() => {
                              const factor = val / Math.max(1, fromSx)
                              onUpdateBlock(activeBlock.id, { scaleX: factor, scaleY: factor })
                            }}
                            style={{
                              fontSize: '8px',
                              padding: '2px 4px',
                              background: '#F3EFE7',
                              border: '1px solid #E2D8CA',
                              borderRadius: '3px',
                              color: '#776D65',
                              cursor: 'pointer',
                              flex: 1,
                            }}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. SHEAR PARAMETERS */}
                  {activeBlock.actionType === 'shear' && (
                    <div>
                      {/* From Shear & To Shear */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ background: '#F8F5EE', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E6DED2' }}>
                          <span style={{ fontSize: '8.5px', color: '#978C82', display: 'block' }}>From Shear</span>
                          <strong style={{ font: '11px monospace', color: '#453E38' }}>{fromShx}°</strong>
                        </div>
                        <label style={{ background: '#FFF7EE', padding: '4px 7px', borderRadius: '5px', border: '1.5px solid #F0D4B2', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '8.5px', color: '#A06B29' }}>To Shear X</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={toShx}
                              onChange={e => onUpdateBlock(activeBlock.id, { skewX: Number(e.target.value) - fromShx })}
                              style={{ width: '100%', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700, color: '#302E35' }}
                            />
                            <span style={{ fontSize: '9px', color: '#A06B29' }}>°</span>
                          </div>
                        </label>
                      </div>

                      {/* Move by Delta Shear */}
                      <label style={{ background: '#FFFFFF', padding: '4px 7px', borderRadius: '5px', border: '1px solid #E5DBCF', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '9px', color: '#8E847B', width: '48px', fontWeight: 600 }}>Move by Δ</span>
                        <input
                          type="number"
                          step="5"
                          value={activeBlock.skewX ?? 0}
                          onChange={e => onUpdateBlock(activeBlock.id, { skewX: Number(e.target.value) })}
                          style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '11px monospace', fontWeight: 700 }}
                        />
                        <span style={{ fontSize: '8.5px', color: '#A3988E', marginLeft: '2px' }}>°</span>
                      </label>

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[0, 15, 30, -15].map(val => (
                          <button
                            key={val}
                            onClick={() => onUpdateBlock(activeBlock.id, { skewX: val - fromShx })}
                            style={{
                              fontSize: '8px',
                              padding: '2px 5px',
                              background: '#F3EFE7',
                              border: '1px solid #E2D8CA',
                              borderRadius: '3px',
                              color: '#776D65',
                              cursor: 'pointer',
                              flex: 1,
                            }}
                          >
                            {val > 0 ? `+${val}°` : `${val}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Easing Mode */}
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F0EAE1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '9px', color: '#8E847B', fontWeight: 600 }}>Interpolation</span>
                    <select
                      value={activeBlock.easing || 'cubic'}
                      onChange={e => onUpdateBlock(activeBlock.id, { easing: e.target.value as any })}
                      style={{
                        padding: '3px 6px',
                        borderRadius: '4px',
                        border: '1px solid #E2D7C8',
                        background: '#FFFDF9',
                        fontSize: '9px',
                        color: '#453E38',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="cubic">Cubic Smoothstep (Natural)</option>
                      <option value="linear">Linear (Constant Velocity)</option>
                    </select>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Reference / Parent Locking & Joint Pivot */}
      <div
        className="inspector-section"
        style={{
          background: '#F0F9FA',
          border: '1.5px solid #C4E9ED',
          borderRadius: '9px',
          padding: '11px 12px',
          marginBottom: '14px',
          boxShadow: '0 2px 6px rgba(0, 180, 200, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, color: '#1B6B78', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: '#00C9E0', fontSize: '13px' }}>⛓</span>
            Parent &amp; Joint Locking
          </h3>
          <span
            style={{
              fontSize: '8.5px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '4px',
              background: selected.parentId ? '#00C9E022' : '#E6EEF0',
              color: selected.parentId ? '#0C7E8D' : '#708285',
            }}
          >
            {selected.parentId ? 'Hierarchical Rig' : 'World Space'}
          </span>
        </div>

        {/* 1. Reference / Lock to Object (Parent) */}
        <div style={{ marginBottom: '9px' }}>
          <label style={{ fontSize: '9px', color: '#567277', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
            Reference / Lock to Object (Parent)
          </label>
          <select
            value={selected.parentId || ''}
            onChange={e => {
              const newParentId = e.target.value || null
              if (newParentId === selected.parentId) return

              if (newParentId) {
                const parentObj = allObjects.find(o => o.id === newParentId)
                if (parentObj) {
                  // Keep visual position stable when locking
                  const localX = Math.round(selected.x - parentObj.x)
                  const localY = Math.round(selected.y - parentObj.y)
                  onUpdate({ parentId: newParentId, x: localX, y: localY })
                  return
                }
              } else {
                // When detaching to world space, preserve world position
                const worldX = selected.worldX ?? selected.x
                const worldY = selected.worldY ?? selected.y
                onUpdate({ parentId: null, x: worldX, y: worldY })
                return
              }
              onUpdate({ parentId: newParentId })
            }}
            style={{
              width: '100%',
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #B0DCE2',
              background: '#FFFFFF',
              fontSize: '11px',
              color: '#26383B',
              cursor: 'pointer',
            }}
          >
            <option value="">🌐 None (World Space)</option>
            {availableParents.map(obj => (
              <option key={obj.id} value={obj.id}>
                ↳ {obj.name} ({obj.kind})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Joint / Pivot Point Selector */}
        <div>
          <label style={{ fontSize: '9px', color: '#567277', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
            Joint / Pivot Point (Cyan Pin on Canvas)
          </label>
          <select
            value={selected.pivotPreset || 'center'}
            onChange={e => onUpdate({ pivotPreset: e.target.value as any })}
            style={{
              width: '100%',
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #B0DCE2',
              background: '#FFFFFF',
              fontSize: '11px',
              color: '#26383B',
              cursor: 'pointer',
            }}
          >
            <option value="center">Center (w/2, h/2)</option>
            <option value="top-center">Top-Center (Neck / Shoulder / Hip)</option>
            <option value="bottom-center">Bottom-Center (Foot / Base / Root)</option>
            <option value="left-center">Left-Edge (Elbow / Joint)</option>
            <option value="right-center">Right-Edge (Wrist / Joint)</option>
            <option value="top-left">Top-Left (0, 0)</option>
            <option value="top-right">Top-Right (w, 0)</option>
            <option value="custom">Custom Offset (px, py)</option>
          </select>
        </div>

        {/* Custom Offset Fields */}
        {selected.pivotPreset === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
            <label style={{ background: '#FFF', padding: '3px 6px', borderRadius: '5px', border: '1px solid #B0DCE2', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#6A8B90', width: '24px' }}>PX</span>
              <input
                type="number"
                value={selected.pivotX ?? Math.round(selected.w / 2)}
                onChange={e => onUpdate({ pivotX: Number(e.target.value) })}
                style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '10px monospace' }}
              />
            </label>
            <label style={{ background: '#FFF', padding: '3px 6px', borderRadius: '5px', border: '1px solid #B0DCE2', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#6A8B90', width: '24px' }}>PY</span>
              <input
                type="number"
                value={selected.pivotY ?? Math.round(selected.h / 2)}
                onChange={e => onUpdate({ pivotY: Number(e.target.value) })}
                style={{ width: '100%', textAlign: 'right', border: 0, background: 'transparent', font: '10px monospace' }}
              />
            </label>
          </div>
        )}

        <div style={{ marginTop: '8px', fontSize: '8.5px', color: '#4D7379', lineHeight: 1.4 }}>
          {selected.parentId ? (
            <>
              💡 Relative kinematics active: <code>M_world = M_parent × M_local</code>. Moves &amp; rotates with parent around cyan joint pin.
            </>
          ) : (
            <>
              💡 Root object in world space. Other objects can lock to this object as their parent.
            </>
          )}
        </div>
      </div>

      {/* Base Position & Size */}
      <div className="inspector-section">
        <h3>
          Base Position &amp; Size <span>PX</span>
        </h3>
        <div className="field-grid">
          <label>
            <span>X</span>
            <input
              type="number"
              value={selected.x}
              onChange={e => onUpdate({ x: Number(e.target.value) })}
            />
          </label>
          <label>
            <span>Y</span>
            <input
              type="number"
              value={selected.y}
              onChange={e => onUpdate({ y: Number(e.target.value) })}
            />
          </label>
          <label>
            <span>W</span>
            <input
              type="number"
              value={selected.w}
              onChange={e => onUpdate({ w: Math.max(10, Number(e.target.value)) })}
            />
          </label>
          <label>
            <span>H</span>
            <input
              type="number"
              value={selected.h}
              onChange={e => onUpdate({ h: Math.max(10, Number(e.target.value)) })}
            />
          </label>
        </div>
      </div>

      {/* 2D Transform */}
      <div className="inspector-section">
        <h3>Base 2D Transform</h3>

        {/* Rotation */}
        <div className="rotation-row">
          <span>Rotation</span>
          <strong>{selected.rotation}°</strong>
        </div>
        <input
          className="range"
          type="range"
          min="0"
          max="360"
          value={selected.rotation}
          onChange={e => onUpdate({ rotation: Number(e.target.value) })}
        />

        {/* Scale X & Scale Y */}
        <div className="scale-grid">
          <label>
            <span>Scale X</span>
            <input
              type="number"
              step="5"
              value={Math.round((selected.scaleX ?? 1) * 100)}
              onChange={e => onUpdate({ scaleX: Math.max(10, Number(e.target.value)) / 100 })}
            />
            <b>%</b>
          </label>
          <label>
            <span>Scale Y</span>
            <input
              type="number"
              step="5"
              value={Math.round((selected.scaleY ?? 1) * 100)}
              onChange={e => onUpdate({ scaleY: Math.max(10, Number(e.target.value)) / 100 })}
            />
            <b>%</b>
          </label>
        </div>
      </div>

      {/* Appearance */}
      <div className="inspector-section">
        <h3>Appearance</h3>

        <div className="color-row">
          <span>Fill Color</span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="color-swatch"
              style={{ background: selected.fillColor || selected.color }}
            />
            <code>{selected.fillColor || selected.color}</code>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', margin: '4px 0 10px', flexWrap: 'wrap' }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className="color-swatch"
              style={{
                background: c,
                width: '16px',
                height: '16px',
                outline: (selected.fillColor || selected.color) === c ? '2px solid var(--coral)' : 'none',
              }}
              onClick={() => onUpdate({ color: c, fillColor: c })}
            />
          ))}
        </div>

        <div className="color-row">
          <span>Stroke Color</span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="color-swatch"
              style={{ background: selected.strokeColor || '#3D405B' }}
            />
            <code>{selected.strokeColor || '#3D405B'}</code>
          </div>
        </div>
      </div>

      {/* Collapsible 3x3 Homogeneous Transformation Matrix Card */}
      <div className="matrix-card" style={{ marginTop: '14px', marginBottom: '14px' }}>
        <div
          onClick={() => setMatrixExpanded(v => !v)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}
        >
          <span className="matrix-icon">▦</span>
          <span style={{ flex: 1 }}>
            <strong>3×3 Homogeneous Matrix</strong>
            <small>
              {selected.parentId
                ? 'M_world = M_parent × M_local'
                : 'M_world (T × R × Sh × S)'}
            </small>
          </span>
          {matrixExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>

        {matrixExpanded && (
          <div className="matrix-values" style={{ marginTop: '10px' }}>
            {selected.parentId && selected.worldMatrix ? (
              <>
                <div style={{ fontSize: '8.5px', color: '#0C7E8D', fontWeight: 'bold', marginBottom: '4px' }}>
                  World Matrix (M_world = M_parent × M_local):
                </div>
                <div>{formatMatrixRow(selected.worldMatrix[0])}</div>
                <div>{formatMatrixRow(selected.worldMatrix[1])}</div>
                <div>{formatMatrixRow(selected.worldMatrix[2])}</div>
                <div style={{ fontSize: '8.5px', color: '#7B6DAF', fontWeight: 'bold', marginTop: '8px', marginBottom: '4px' }}>
                  Local Matrix (M_local):
                </div>
                <div>{formatMatrixRow(matrix[0])}</div>
                <div>{formatMatrixRow(matrix[1])}</div>
                <div>{formatMatrixRow(matrix[2])}</div>
              </>
            ) : (
              <>
                <div>{formatMatrixRow(matrix[0])}</div>
                <div>{formatMatrixRow(matrix[1])}</div>
                <div>{formatMatrixRow(matrix[2])}</div>
              </>
            )}
            <div
              style={{
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid #E2D7EE',
                fontSize: '8px',
                color: '#897BAF',
                lineHeight: 1.4,
              }}
            >
              Homogeneous 2D coordinates:
              <br />
              [x&apos;, y&apos;, 1]ᵀ = M · [x, y, 1]ᵀ
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
