'use client'

import React, { useEffect, useState } from 'react'
import { Play, Pause, X } from 'lucide-react'
import { StageObject, SceneTheme } from './StageCanvas'
import { CustomBackgroundConfig } from './CustomBackgroundModal'
import { computeCustomAssetViewBox } from './GraphicsLabModal'
import { TransformBlock, evaluateCumulativeTransform, computeWorldHierarchy, getObjectPivot } from '@/lib/cg-engine'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  objects: StageObject[]
  blocksMap?: Record<string, TransformBlock[]>
  keyframesMap?: Record<string, any>
  theme: SceneTheme
  customConfig?: CustomBackgroundConfig
}

export default function PreviewModal({
  isOpen,
  onClose,
  objects,
  blocksMap,
  theme,
  customConfig,
}: PreviewModalProps) {
  const [frame, setFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isOpen || !isPlaying) return
    const interval = window.setInterval(() => {
      setFrame(f => (f >= 168 ? 0 : f + 1))
    }, 1000 / 24)
    return () => window.clearInterval(interval)
  }, [isOpen, isPlaying])

  if (!isOpen) return null

  const totalSeconds = frame / 24
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const centis = Math.floor((totalSeconds % 1) * 100)
  const timecodeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(centis).padStart(2, '0')}`

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
            <p>960 × 540 · Clean 24 FPS animation preview without bounding boxes</p>
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
            height: 'auto',
            maxHeight: '440px',
            overflow: 'hidden',
            margin: '16px 24px 0',
            borderRadius: '10px',
            backgroundColor: theme === 'blank' ? '#FFFAF3' : '#CCE1E4',
          }}
        >
          {/* Pure Environment Backdrops */}
          {theme === 'blank' && (
            <div style={{ position: 'absolute', inset: 0, background: '#FFFAF3' }} />
          )}

          {theme === 'beach' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(#70BFD1 0%, #BFE7F0 48%, #1D7C9E 48%, #2086AA 60%, #E8C197 60%, #F5D7B3 100%)',
              }}
            >
              <div style={{ position: 'absolute', top: '59.5%', left: 0, right: 0, height: '6px', background: '#FFFFFFCC', filter: 'blur(1px)' }} />
            </div>
          )}

          {theme === 'countryside' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(#CCE1E4 0%, #DCEBEC 54%, #96BD8D 54%)',
              }}
            >
              <div style={{ position: 'absolute', left: '-10%', bottom: '-12%', height: '46%', width: '75%', borderRadius: '50% 50% 0 0', background: '#96BD8D' }} />
              <div style={{ position: 'absolute', right: '-15%', bottom: '-14%', height: '46%', width: '75%', borderRadius: '50% 50% 0 0', background: '#73A272' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', background: '#E6C89F' }} />
            </div>
          )}

          {theme === 'midnight' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(#121624 0%, #1E2638 64%, #22252E 64%)',
              }}
            >
              {[15, 30, 48, 65, 82, 92].map((l, i) => (
                <span key={i} style={{ position: 'absolute', left: `${l}%`, top: `${15 + (i % 3) * 15}%`, width: '2px', height: '2px', background: '#FFF', borderRadius: '50%', opacity: 0.8 }} />
              ))}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '36%', background: '#22252E', borderTop: '2px solid #2F333E' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg, #F5B941 0, #F5B941 24px, transparent 24px, transparent 48px)', opacity: 0.75 }} />
              </div>
            </div>
          )}

          {theme === 'custom' && customConfig && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(${customConfig.skyTop} 0%, ${customConfig.skyBottom} ${customConfig.horizonHeight}%)`,
              }}
            >
              <div style={{ position: 'absolute', top: `${customConfig.horizonHeight}%`, bottom: 0, left: 0, right: 0, background: customConfig.groundColor }} />
            </div>
          )}

          {/* Interpolated Animated Objects with Hierarchical Kinematics */}
          {(() => {
            const animated = objects.map(obj => {
              const blocks = blocksMap?.[obj.id] || blocksMap?.[obj.name] || []
              return blocks.length > 0 ? evaluateCumulativeTransform(obj, blocks, frame) : obj
            })
            const worldObjects = computeWorldHierarchy(animated)

            return worldObjects.map(obj => {
              const pivot = getObjectPivot(obj)
              const renderX = obj.worldX ?? obj.x
              const renderY = obj.worldY ?? obj.y
              const renderRot = obj.worldRotation ?? obj.rotation
              const renderSx = obj.worldScaleX ?? obj.scaleX ?? 1
              const renderSy = obj.worldScaleY ?? obj.scaleY ?? 1
              const renderSkewX = obj.worldSkewX ?? obj.skewX ?? 0

              const leftPct = (renderX / 960) * 100
              const topPct = (renderY / 540) * 100
              const widthPct = (obj.w / 960) * 100
              const heightPct = (obj.h / 540) * 100
              const transformOriginStr = `${(pivot.x / obj.w) * 100}% ${(pivot.y / obj.h) * 100}%`

              return (
                <div
                  key={obj.id}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    transform: `rotate(${renderRot}deg) scale(${renderSx}, ${renderSy}) skew(${renderSkewX}deg, ${obj.skewY ?? 0}deg)`,
                    transformOrigin: transformOriginStr,
                    pointerEvents: 'none',
                  }}
                >
                {obj.imageUrl ? (
                  <img
                    src={obj.imageUrl}
                    alt={obj.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }}
                  />
                ) : null}
                {!obj.imageUrl && obj.name === 'Sun' && (
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="44" fill={obj.color || '#F5B941'} />
                  </svg>
                )}
                {obj.name === 'Cloud' && (
                  <svg viewBox="0 0 140 60" style={{ width: '100%', height: '100%' }}>
                    <path d="M 25 50 Q 5 50 10 32 Q 12 15 35 15 Q 45 5 70 8 Q 95 5 105 20 Q 130 18 130 35 Q 135 50 115 50 Z" fill={obj.color || '#F8F7F2'} stroke="#302E35" strokeWidth="2.5" />
                  </svg>
                )}
                {obj.name === 'Pine Tree' && (
                  <svg viewBox="0 0 90 140" style={{ width: '100%', height: '100%' }}>
                    <rect x="38" y="105" width="14" height="30" fill="#714F36" />
                    <polygon points="45,8 85,50 65,50 82,82 58,82 75,110 15,110 32,82 8,82 25,50 5,50" fill={obj.color || '#4E8462'} stroke="#302E35" strokeWidth="2" />
                  </svg>
                )}
                {obj.name === 'Cottage House' && (
                  <svg viewBox="0 0 140 120" style={{ width: '100%', height: '100%' }}>
                    <rect x="95" y="10" width="16" height="28" fill="#8F4839" stroke="#302E35" strokeWidth="2" />
                    <rect x="20" y="48" width="100" height="66" fill={obj.color || '#D98264'} stroke="#302E35" strokeWidth="2.5" rx="3" />
                    <polygon points="70,8 132,50 8,50" fill="#B96353" stroke="#302E35" strokeWidth="2.5" />
                    <rect x="32" y="60" width="22" height="24" fill="#A7C5C4" stroke="#302E35" strokeWidth="2" rx="2" />
                    <rect x="86" y="60" width="22" height="24" fill="#A7C5C4" stroke="#302E35" strokeWidth="2" rx="2" />
                  </svg>
                )}
                {obj.name === 'Red Car' && (
                  <svg viewBox="0 0 120 54" style={{ width: '100%', height: '100%' }}>
                    <path d="M 28 26 L 44 8 L 78 8 L 94 26 Z" fill={obj.color || '#D95D4E'} stroke="#302E35" strokeWidth="2" />
                    <rect x="8" y="24" width="104" height="20" rx="6" fill={obj.color || '#D95D4E'} stroke="#302E35" strokeWidth="2" />
                    <circle cx="28" cy="44" r="10" fill="#433F4B" stroke="#F1DFC8" strokeWidth="3" />
                    <circle cx="92" cy="44" r="10" fill="#433F4B" stroke="#F1DFC8" strokeWidth="3" />
                  </svg>
                )}
                {obj.name === 'Boat' && (
                  <svg viewBox="0 0 110 95" style={{ width: '100%', height: '100%' }}>
                    <path d="M 10 65 L 100 65 L 85 88 L 25 88 Z" fill="#C68B59" stroke="#302E35" strokeWidth="2.5" />
                    <line x1="55" y1="10" x2="55" y2="65" stroke="#302E35" strokeWidth="3" />
                    <polygon points="58,15 95,58 58,58" fill="#F8F7F2" stroke="#302E35" strokeWidth="2" />
                    <polygon points="52,22 18,58 52,58" fill="#D95D4E" stroke="#302E35" strokeWidth="2" />
                  </svg>
                )}
                {obj.name === 'Beach Ball' && (
                  <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%' }}>
                    <circle cx="40" cy="40" r="36" fill="#F8F7F2" stroke="#302E35" strokeWidth="2.5" />
                    <path d="M 40 4 Q 20 40 40 76 Q 30 40 40 4 Z" fill="#D95D4E" stroke="#302E35" strokeWidth="1.5" />
                    <path d="M 40 4 Q 60 40 40 76 Q 50 40 40 4 Z" fill="#3B7BA4" stroke="#302E35" strokeWidth="1.5" />
                  </svg>
                )}
                {/* Character Rigging Parts */}
                {obj.name === 'Head' && (
                  <svg viewBox="0 0 60 60" style={{ width: '100%', height: '100%' }}>
                    <circle cx="30" cy="32" r="20" fill={obj.color || '#E8BA94'} stroke="#302E35" strokeWidth="2" />
                    <circle cx="23" cy="30" r="2.5" fill="#302E35" />
                    <circle cx="37" cy="30" r="2.5" fill="#302E35" />
                  </svg>
                )}
                {obj.name.includes('Torso') && (
                  <svg viewBox="0 0 70 100" style={{ width: '100%', height: '100%' }}>
                    <path d="M 18 15 L 52 15 L 58 75 L 12 75 Z" fill={obj.color || '#7B6DAF'} stroke="#302E35" strokeWidth="2.5" />
                  </svg>
                )}
                {obj.name.includes('Arm') && (
                  <svg viewBox="0 0 28 70" style={{ width: '100%', height: '100%' }}>
                    <rect x="6" y="8" width="16" height="52" rx="8" fill={obj.color || '#7B6DAF'} stroke="#302E35" strokeWidth="2" />
                  </svg>
                )}
                {obj.name.includes('Leg') && (
                  <svg viewBox="0 0 30 80" style={{ width: '100%', height: '100%' }}>
                    <rect x="6" y="8" width="18" height="64" rx="8" fill={obj.color || '#3D485C'} stroke="#302E35" strokeWidth="2" />
                  </svg>
                )}
                {obj.kind === 'custom' && obj.primitives && obj.primitives.length > 0 && (() => {
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
                          const rw = Math.abs(p.x1 - p.x0)
                          const rh = Math.abs(p.y1 - p.y0)
                          return (
                            <rect
                              key={p.id}
                              x={x}
                              y={y}
                              width={rw}
                              height={rh}
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
                })()}
                {obj.kind === 'custom' && (!obj.primitives || obj.primitives.length === 0) && (
                  <div style={{ width: '100%', height: '100%', background: obj.color, borderRadius: '6px', border: '2px solid #302E35', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '9px', fontWeight: 'bold' }}>
                    {obj.name}
                  </div>
                )}
                {obj.kind === 'shape' && (
                  <>
                    {(obj.tool === 'line-dda' || obj.tool === 'line-bresenham') && (
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                        <line x1="5" y1="95" x2="95" y2="5" stroke={obj.color || '#3D405B'} strokeWidth={obj.strokeWidth || 4} strokeLinecap="round" />
                      </svg>
                    )}
                    {obj.tool === 'circle-midpoint' && (
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                        <circle cx="50" cy="50" r="44" fill={obj.fillColor || obj.color || '#F5B941'} stroke={obj.strokeColor || '#3D405B'} strokeWidth={obj.strokeWidth || 3} />
                      </svg>
                    )}
                    {obj.tool === 'rect' && (
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                        <rect x="6" y="6" width="88" height="88" rx="4" fill={obj.fillColor || obj.color || '#D98264'} stroke={obj.strokeColor || '#3D405B'} strokeWidth={obj.strokeWidth || 3} />
                      </svg>
                    )}
                    {obj.tool === 'polygon' && (
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                        <polygon points="50,8 92,90 8,90" fill={obj.fillColor || obj.color || '#7B6DAF'} stroke={obj.strokeColor || '#3D405B'} strokeWidth={obj.strokeWidth || 3} />
                      </svg>
                    )}
                    {obj.tool === 'bezier' && (
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                        <path d="M 10 85 C 20 15, 80 15, 90 85" fill="none" stroke={obj.color || '#D95D4E'} strokeWidth={obj.strokeWidth || 4} strokeLinecap="round" />
                      </svg>
                    )}
                  </>
                )}
              </div>
            )
          })
        })()}
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
            {timecodeStr} / 00:07:00 · Frame {frame} / 168
          </span>
          <span style={{ background: '#E4DDD2', padding: '3px 7px', borderRadius: '4px', fontSize: '10px', font: '10px monospace' }}>
            24 FPS
          </span>
        </div>
      </div>
    </div>
  )
}
