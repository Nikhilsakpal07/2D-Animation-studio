'use client'

import React, { useRef, useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft, ChevronDown, Eye, Lock, Move, Pause, Play, Plus,
  RotateCw, Square, ZoomIn, ZoomOut, Maximize2, SlidersHorizontal, Trash2,
  Volume2, VolumeX, Music, Sparkles
} from 'lucide-react'
import { StageObject } from './StageCanvas'
import {
  TransformBlock,
  TransformActionType,
  getBlockLabel,
  getBlockColor
} from '@/lib/cg-engine'
import { AudioTrackConfig, SoundCue, playCueSound } from '@/lib/audio-engine'

interface TimelinePanelProps {
  objects: StageObject[]
  selectedId: string | null
  selectedIds?: string[]
  onSelectObject: (id: string, isShift?: boolean) => void
  frame: number
  setFrame: (frame: number | ((f: number) => number)) => void
  playing: boolean
  setPlaying: (playing: boolean) => void

  // Sequential Transformation Blocks
  blocksMap: Record<string, TransformBlock[]>
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
  onAddBlock: (objectId: string, actionType?: TransformActionType) => void
  onUpdateBlock: (blockId: string, updates: Partial<TransformBlock>) => void
  onDeleteBlock: (blockId: string) => void

  onToggleHide: (idOrName: string) => void
  onToggleLock: (idOrName: string) => void
  hiddenMap: Record<string, boolean>
  lockedMap: Record<string, boolean>

  // Dedicated Audio Track & Sound FX
  audioTrack?: AudioTrackConfig | null
  soundCues?: SoundCue[]
  onUpdateAudioTrack?: (updates: Partial<AudioTrackConfig>) => void
  onOpenAudioModal?: () => void
  onAddSoundCue?: (cue: SoundCue) => void
  onUpdateSoundCue?: (id: string, updates: Partial<SoundCue>) => void
  onDeleteSoundCue?: (id: string) => void

  // Dynamic Duration
  durationSeconds?: number
  setDurationSeconds?: (seconds: number) => void
  totalFrames?: number
}

export default function TimelinePanel({
  objects,
  selectedId,
  selectedIds = [],
  onSelectObject,
  frame,
  setFrame,
  playing,
  setPlaying,
  blocksMap,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onToggleHide,
  onToggleLock,
  hiddenMap,
  lockedMap,
  audioTrack,
  soundCues = [],
  onUpdateAudioTrack,
  onOpenAudioModal,
  onAddSoundCue,
  onUpdateSoundCue,
  onDeleteSoundCue,
  durationSeconds = 7,
  setDurationSeconds,
  totalFrames: propTotalFrames,
}: TimelinePanelProps) {
  const sequencerRef = useRef<HTMLDivElement>(null)
  const draggingCueRef = useRef<{
    cueId: string
    startX: number
    initFrame: number
  } | null>(null)
  const draggingBlockRef = useRef<{
    block: TransformBlock
    mode: 'move' | 'resize-start' | 'resize-end'
    startX: number
    initStart: number
    initEnd: number
  } | null>(null)

  const selectedObj = objects.find(o => o.id === selectedId)

  const actualDuration = durationSeconds || 7
  const maxFrames = propTotalFrames || Math.max(24, Math.round(actualDuration * 24))
  const [durationMenuOpen, setDurationMenuOpen] = useState(false)
  const [customSecs, setCustomSecs] = useState('')
  const durationMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (durationMenuRef.current && !durationMenuRef.current.contains(e.target as Node)) {
        setDurationMenuOpen(false)
      }
    }
    if (durationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [durationMenuOpen])

  // Calculate formatted timecode (00:00:00)
  const totalSeconds = frame / 24
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const centis = Math.floor((totalSeconds % 1) * 100)
  const timecodeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(centis).padStart(2, '0')}`

  // Calculate total duration timecode
  const maxM = Math.floor(actualDuration / 60)
  const maxS = Math.floor(actualDuration % 60)
  const maxC = Math.floor((actualDuration % 1) * 100)
  const maxTimecodeStr = `${String(maxM).padStart(2, '0')}:${String(maxS).padStart(2, '0')}:${String(maxC).padStart(2, '0')}`

  // Intelligent ruler ticks matching duration
  const tickFrames = React.useMemo(() => {
    const list: number[] = [0]
    const stepSec = actualDuration <= 10 ? 1 : actualDuration <= 20 ? 2 : actualDuration <= 60 ? 5 : 10
    for (let s = stepSec; s < actualDuration; s += stepSec) {
      list.push(Math.round(s * 24))
    }
    if (!list.includes(maxFrames)) {
      list.push(maxFrames)
    }
    return list
  }, [actualDuration, maxFrames])

  function scrubToEvent(e: React.PointerEvent<HTMLDivElement>) {
    if (!sequencerRef.current) return
    const rect = sequencerRef.current.getBoundingClientRect()
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const newFrame = Math.round((clickX / rect.width) * maxFrames)
    setFrame(newFrame)
  }

  function handleScrubStart(e: React.PointerEvent<HTMLDivElement>) {
    // If clicking a block handle, ignore ruler scrub
    if ((e.target as HTMLElement).closest('.transform-block-pill')) {
      return
    }
    scrubToEvent(e)
    const onMove = (ev: PointerEvent) => {
      if (!sequencerRef.current) return
      const rect = sequencerRef.current.getBoundingClientRect()
      const clickX = Math.max(0, Math.min(rect.width, ev.clientX - rect.left))
      const newFrame = Math.round((clickX / rect.width) * maxFrames)
      setFrame(newFrame)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Handle Dragging block edges or moving the entire block
  function handleBlockPointerDown(
    e: React.PointerEvent,
    block: TransformBlock,
    mode: 'move' | 'resize-start' | 'resize-end'
  ) {
    e.stopPropagation()
    onSelectBlock(block.id)
    onSelectObject(block.objectId)

    if (!sequencerRef.current) return
    const rect = sequencerRef.current.getBoundingClientRect()

    draggingBlockRef.current = {
      block,
      mode,
      startX: e.clientX,
      initStart: block.startFrame,
      initEnd: block.endFrame,
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingBlockRef.current || !sequencerRef.current) return
      const info = draggingBlockRef.current
      const deltaX = ev.clientX - info.startX
      const deltaFrames = Math.round((deltaX / rect.width) * maxFrames)

      if (info.mode === 'resize-start') {
        const newStart = Math.max(0, Math.min(info.initEnd - 1, info.initStart + deltaFrames))
        onUpdateBlock(info.block.id, { startFrame: newStart })
      } else if (info.mode === 'resize-end') {
        const newEnd = Math.max(info.initStart + 1, Math.min(maxFrames, info.initEnd + deltaFrames))
        onUpdateBlock(info.block.id, { endFrame: newEnd })
      } else if (info.mode === 'move') {
        const duration = info.initEnd - info.initStart
        let newStart = info.initStart + deltaFrames
        let newEnd = newStart + duration
        if (newStart < 0) {
          newStart = 0
          newEnd = duration
        }
        if (newEnd > maxFrames) {
          newEnd = maxFrames
          newStart = maxFrames - duration
        }
        onUpdateBlock(info.block.id, { startFrame: newStart, endFrame: newEnd })
      }
    }

    const onPointerUp = () => {
      draggingBlockRef.current = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  function getActionIcon(type: TransformActionType) {
    switch (type) {
      case 'translation': return <Move size={11} />
      case 'rotation': return <RotateCw size={11} />
      case 'scaling': return <Maximize2 size={11} />
      case 'shear': return <SlidersHorizontal size={11} />
    }
  }

  function handleCuePointerDown(e: React.PointerEvent<HTMLDivElement>, cue: SoundCue) {
    e.stopPropagation()
    draggingCueRef.current = { cueId: cue.id, startX: e.clientX, initFrame: cue.frame }

    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingCueRef.current || !sequencerRef.current) return
      const rect = sequencerRef.current.getBoundingClientRect()
      const clickX = Math.max(0, Math.min(rect.width, ev.clientX - rect.left))
      const newFrame = Math.max(0, Math.min(maxFrames, Math.round((clickX / rect.width) * maxFrames)))
      if (onUpdateSoundCue) {
        onUpdateSoundCue(cue.id, { frame: newFrame })
      }
      setFrame(newFrame)
    }

    const onPointerUp = () => {
      draggingCueRef.current = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  function handleAudioLaneClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('.sound-cue-marker')) return
    if (!sequencerRef.current) return
    const rect = sequencerRef.current.getBoundingClientRect()
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const clickedFrame = Math.max(0, Math.min(maxFrames, Math.round((clickX / rect.width) * maxFrames)))
    setFrame(clickedFrame)
  }

  return (
    <section className="timeline" style={{ height: '210px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 100, overflow: 'visible' }}>
      {/* 
        Clean, non-overlapping header row directly above TRACKS and frame ruler.
      */}
      <div className="timeline-head" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
        {/* Left: Title & Add Action Block */}
        <div className="timeline-title">
          <h2>Timeline</h2>
          <span>24 FPS</span>
          <button
            onClick={() => {
              if (selectedId) {
                onAddBlock(selectedId)
              }
            }}
            title={selectedId ? `Add Action Block for ${selectedObj?.name}` : 'Select an object first'}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={14} /> Add Action Block
          </button>
        </div>

        {/* Center: Playback Controls */}
        <div className="playback">
          <button
            onClick={() => {
              setPlaying(false)
              setFrame(0)
            }}
            title="Rewind to start"
            aria-label="Rewind to start"
          >
            <ArrowLeft size={15} />
          </button>

          <button
            className="play-button"
            onClick={() => setPlaying(!playing)}
            title={playing ? 'Pause' : 'Play'}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
          >
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>

          <button
            onClick={() => {
              setPlaying(false)
              setFrame(0)
            }}
            title="Stop"
            aria-label="Stop animation"
          >
            <Square size={13} fill="currentColor" />
          </button>

          <span className="timecode">
            {timecodeStr} <small>/ {maxTimecodeStr}</small>
          </span>
          <span className="framecode">
            Frame {frame} <small>/ {maxFrames}</small>
          </span>
        </div>

        {/* Right: Tools & Duration */}
        <div className="timeline-tools" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
          <button title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <input type="range" min="1" max="5" defaultValue="3" aria-label="Timeline zoom level" />
          <button title="Zoom In">
            <ZoomIn size={14} />
          </button>

          {/* Interactive Duration Dropdown */}
          <div style={{ position: 'relative', zIndex: 100 }} ref={durationMenuRef}>
            <button
              className="duration"
              onClick={() => setDurationMenuOpen(v => !v)}
              title="Change animation duration in seconds"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {actualDuration}s <ChevronDown size={13} />
            </button>

            {durationMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#FFFDF9',
                  border: '1px solid #D8CFC0',
                  borderRadius: '9px',
                  boxShadow: '0 10px 30px rgba(48, 46, 53, 0.22)',
                  width: '170px',
                  padding: '9px',
                  zIndex: 99999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#978C82', letterSpacing: '0.08em', marginBottom: '2px' }}>
                  DURATION (SECONDS)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[3, 5, 7, 10, 15, 20, 30, 45, 60].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setDurationSeconds?.(s)
                        setDurationMenuOpen(false)
                      }}
                      style={{
                        padding: '4px 0',
                        fontSize: '11px',
                        fontWeight: actualDuration === s ? 700 : 500,
                        background: actualDuration === s ? 'var(--coral)' : '#F2ECE2',
                        color: actualDuration === s ? '#fff' : 'var(--ink)',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Custom s"
                    value={customSecs}
                    onChange={e => setCustomSecs(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = parseInt(customSecs, 10)
                        if (val && val > 0 && val <= 120) {
                          setDurationSeconds?.(val)
                          setCustomSecs('')
                          setDurationMenuOpen(false)
                        }
                      }
                    }}
                    style={{
                      width: '65%',
                      background: '#FAF6F0',
                      border: '1px solid #D6CABA',
                      borderRadius: '5px',
                      padding: '3px 6px',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(customSecs, 10)
                      if (val && val > 0 && val <= 120) {
                        setDurationSeconds?.(val)
                        setCustomSecs('')
                        setDurationMenuOpen(false)
                      }
                    }}
                    style={{
                      flex: 1,
                      background: '#7B6DAF',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Set
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Body: Tracks list on left, Sequencer ruler & rows on right */}
      <div className="timeline-body" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left: Track List */}
        <div className="track-list" style={{ overflowY: 'auto' }}>
          <div className="track-label-head">
            TRACKS <span>{objects.length + (audioTrack ? 1 : 0)}</span>
          </div>

          {/* Pinned Audio Track Lane */}
          <div
            className="track-row audio-track-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: audioTrack ? 'rgba(217, 93, 78, 0.08)' : 'rgba(238, 234, 245, 0.5)',
              borderBottom: '1.5px solid #E4DBCE',
              padding: '6px 8px',
              minHeight: '34px',
            }}
          >
            <span style={{ fontSize: '13px' }}>🎵</span>
            <span
              style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '11px',
                fontWeight: 700,
                color: audioTrack ? 'var(--coral)' : '#6E6290',
              }}
              title={audioTrack ? `Audio: ${audioTrack.name}` : 'Audio & Sound FX'}
            >
              {audioTrack ? audioTrack.name : 'Audio & Sound FX'}
            </span>

            {/* Mute/Unmute */}
            <button
              className="track-action"
              onClick={e => {
                e.stopPropagation()
                onUpdateAudioTrack?.({ muted: !audioTrack?.muted })
              }}
              title={audioTrack?.muted ? 'Unmute Audio' : 'Mute Audio'}
              style={{ opacity: audioTrack ? 1 : 0.4 }}
            >
              {audioTrack?.muted ? <VolumeX size={13} style={{ color: '#BA4437' }} /> : <Volume2 size={13} />}
            </button>

            {/* Volume Slider (0% - 100%) */}
            <input
              type="range"
              min="0"
              max="100"
              value={audioTrack?.muted ? 0 : Math.round((audioTrack?.volume ?? 0.8) * 100)}
              onChange={e => {
                e.stopPropagation()
                const newVol = Number(e.target.value) / 100
                onUpdateAudioTrack?.({ volume: newVol, muted: false })
              }}
              onClick={e => e.stopPropagation()}
              style={{ width: '42px', height: '4px', accentColor: 'var(--coral)', cursor: 'pointer' }}
              title={`Volume: ${Math.round((audioTrack?.volume ?? 0.8) * 100)}%`}
            />

            {/* + Add Audio Button */}
            <button
              onClick={e => {
                e.stopPropagation()
                onOpenAudioModal?.()
              }}
              style={{
                background: audioTrack ? '#EAE4D7' : 'linear-gradient(135deg, #D95D4E 0%, #B84739 100%)',
                color: audioTrack ? '#4C4540' : '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '9.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap',
              }}
              title="Add background music or sound effect cues"
            >
              <Plus size={11} /> {audioTrack ? 'Audio' : '+ Add Audio'}
            </button>
          </div>

          {objects.length === 0 ? (
            <div style={{ padding: '24px 14px', color: '#978C82', fontSize: '10px', textAlign: 'center' }}>
              Clean stage · Drop objects to begin
            </div>
          ) : (
            objects.map(obj => {
              const isSelected = selectedIds && selectedIds.length > 0 ? selectedIds.includes(obj.id) : obj.id === selectedId
              const isHidden = hiddenMap[obj.id] || hiddenMap[obj.name]
              const isLocked = lockedMap[obj.id] || lockedMap[obj.name]

              return (
                <div
                  key={obj.id}
                  className={`track-row ${isSelected ? 'selected' : ''}`}
                  onClick={e => onSelectObject(obj.id, e.shiftKey)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span className="drag">⠿</span>
                  <span
                    className="track-dot"
                    style={{ background: obj.color || 'var(--coral)' }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {obj.name}
                    {obj.parentId && (
                      <span style={{ fontSize: '8px', color: '#1B6B78', background: '#E2F4F7', padding: '1px 4px', borderRadius: '3px', fontWeight: 600 }}>
                        ↳ {objects.find(p => p.id === obj.parentId)?.name || 'Parent'}
                      </span>
                    )}
                  </span>

                  {/* Eye Visibility Toggle */}
                  <button
                    className="track-action"
                    aria-label={`Toggle ${obj.name} visibility`}
                    onClick={e => {
                      e.stopPropagation()
                      onToggleHide(obj.id)
                    }}
                    title={isHidden ? 'Show object' : 'Hide object'}
                  >
                    <Eye size={13} style={{ opacity: isHidden ? 0.3 : 1 }} />
                  </button>

                  {/* Lock Toggle */}
                  <button
                    className="track-action"
                    aria-label={`Toggle ${obj.name} lock`}
                    onClick={e => {
                      e.stopPropagation()
                      onToggleLock(obj.id)
                    }}
                    title={isLocked ? 'Unlock object' : 'Lock object'}
                  >
                    <Lock size={12} style={{ opacity: isLocked ? 1 : 0.4 }} />
                  </button>

                  {/* + Action Block Shortcut Button */}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onAddBlock(obj.id)
                    }}
                    title="Add transformation action block"
                    style={{
                      background: '#EAE4F3',
                      color: '#62538C',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 700,
                    }}
                  >
                    + Action
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Right: Sequencer & Frame Ruler */}
        <div
          className="sequencer"
          ref={sequencerRef}
          style={{ overflowY: 'auto', overflowX: 'hidden' }}
          onPointerDown={handleScrubStart}
        >
          {/* Frame Ruler */}
          <div className="ruler" onPointerDown={scrubToEvent} style={{ position: 'relative', height: '31px' }}>
            {tickFrames.map(n => {
              const pct = (n / maxFrames) * 100
              return (
                <span
                  key={n}
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    transform: pct === 0 ? 'translateX(0)' : pct >= 98 ? 'translateX(-100%)' : 'translateX(-50%)',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                >
                  {n}
                </span>
              )
            })}
          </div>

          {/* Pinned Audio Track Sequencer Lane with Waveform & Sound Cues */}
          <div
            className="sequence-row audio-sequence-row"
            onClick={handleAudioLaneClick}
            style={{
              height: '34px',
              position: 'relative',
              borderBottom: '1.5px solid #E4DBCE',
              background: audioTrack
                ? 'linear-gradient(180deg, rgba(253, 245, 242, 0.7) 0%, rgba(246, 240, 252, 0.7) 100%)'
                : 'rgba(247, 244, 239, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}
            title="Click to seek audio or add cues"
          >
            {/* Waveform Visualization Bars */}
            {audioTrack && audioTrack.waveform && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px',
                  pointerEvents: 'none',
                  opacity: audioTrack.muted ? 0.35 : 0.85,
                }}
              >
                {audioTrack.waveform.map((barH, i) => (
                  <div
                    key={i}
                    style={{
                      width: '2px',
                      height: `${Math.max(10, Math.round(barH * 28))}px`,
                      borderRadius: '1px',
                      background: i % 2 === 0 ? 'var(--coral)' : '#7B6DAF',
                      transition: 'height 0.1s ease',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Empty prompt */}
            {!audioTrack && soundCues.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  color: '#A89D93',
                  pointerEvents: 'none',
                }}
              >
                <span>🎵 Click &quot;+ Add Audio&quot; to load background music loop or place Sound FX cues</span>
              </div>
            )}

            {/* Frame Sound Cue Markers (♪ badges) */}
            {soundCues.map(cue => {
              const leftPct = (cue.frame / maxFrames) * 100
              return (
                <div
                  key={cue.id}
                  className="sound-cue-marker"
                  onPointerDown={e => handleCuePointerDown(e, cue)}
                  onClick={e => {
                    e.stopPropagation()
                    playCueSound(cue.cueType, audioTrack?.volume ?? 0.8)
                  }}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    top: '3px',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #7B6DAF 0%, #5B4C93 100%)',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 2px 5px rgba(91, 76, 147, 0.4)',
                    cursor: 'grab',
                    zIndex: 6,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                  title={`Sound Cue: ${cue.label} at Frame ${cue.frame}. Drag to change frame, click to test.`}
                >
                  <span>♪</span>
                  <span>{cue.label}</span>
                  <span style={{ fontSize: '8px', opacity: 0.8 }}>F{cue.frame}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onDeleteSoundCue?.(cue.id)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      padding: '0 2px',
                      marginLeft: '2px',
                      fontSize: '10px',
                      lineHeight: 1,
                    }}
                    title="Delete sound cue"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          {/* Sequence Rows with Clean Sequential Transformation Block Pills */}
          {objects.map(obj => {
            const blocks = blocksMap[obj.id] || []
            const isSelected = selectedIds && selectedIds.length > 0 ? selectedIds.includes(obj.id) : obj.id === selectedId

            return (
              <div
                className="sequence-row"
                key={obj.id}
                style={{
                  height: '31px',
                  position: 'relative',
                  borderBottom: '1px solid #E4DBCE',
                  background: isSelected ? 'rgba(238, 234, 245, 0.4)' : undefined,
                }}
              >
                <div className="sequence-line" />

                {blocks.map(block => {
                  const leftPct = (block.startFrame / maxFrames) * 100
                  const widthPct = Math.max(3, ((block.endFrame - block.startFrame) / maxFrames) * 100)
                  const isSelectedBlock = selectedBlockId === block.id
                  const color = block.color || getBlockColor(block.actionType)
                  const label = getBlockLabel(block, obj, blocks)

                  return (
                    <div
                      key={block.id}
                      className="transform-block-pill"
                      onClick={e => {
                        e.stopPropagation()
                        onSelectBlock(block.id)
                        onSelectObject(obj.id)
                      }}
                      onPointerDown={e => handleBlockPointerDown(e, block, 'move')}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        top: '4px',
                        height: '23px',
                        background: color,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 6px',
                        color: '#FFFFFF',
                        fontSize: '9.5px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        cursor: 'grab',
                        zIndex: isSelectedBlock ? 4 : 2,
                        boxShadow: isSelectedBlock
                          ? '0 0 0 2px #FFFFFF, 0 0 0 4px ' + color
                          : '0 1px 4px rgba(0,0,0,0.18)',
                        userSelect: 'none',
                      }}
                      title={label}
                    >
                      {/* Left Resize Handle */}
                      <span
                        onPointerDown={e => handleBlockPointerDown(e, block, 'resize-start')}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          cursor: 'ew-resize',
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '6px 0 0 6px',
                        }}
                      />

                      {/* Icon & Label */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getActionIcon(block.actionType)}
                        <span style={{ fontSize: '9px' }}>{label}</span>
                      </span>

                      {/* Right Resize Handle */}
                      <span
                        onPointerDown={e => handleBlockPointerDown(e, block, 'resize-end')}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          cursor: 'ew-resize',
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '0 6px 6px 0',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Animated Vertical Red Playhead */}
          <div
            className="playhead"
            style={{
              left: `${(frame / maxFrames) * 100}%`,
              transition: playing ? 'none' : 'left 0.05s ease-out',
            }}
          >
            <span>◆</span>
          </div>
        </div>
      </div>
    </section>
  )
}
