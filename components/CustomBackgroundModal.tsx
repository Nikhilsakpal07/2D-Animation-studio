'use client'

import React, { useState } from 'react'
import { Check, Sparkles, X, Palette, Waves, Mountain, SunMedium, Compass } from 'lucide-react'

export interface CustomBackgroundConfig {
  skyTop: string
  skyBottom: string
  groundColor: string
  horizonStyle: 'flat' | 'hills' | 'waves' | 'dunes' | 'grid'
  horizonHeight: number // percentage from top, e.g. 55
  hasStars: boolean
}

export const defaultCustomBackground: CustomBackgroundConfig = {
  skyTop: '#6BA4B8',
  skyBottom: '#C5E2E8',
  groundColor: '#79A678',
  horizonStyle: 'hills',
  horizonHeight: 55,
  hasStars: false,
}

interface CustomBackgroundModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (config: CustomBackgroundConfig) => void
  initialConfig?: CustomBackgroundConfig
}

const PRESET_SKY_COLORS = [
  '#CCE1E4', '#8AC6D1', '#6BA4B8', '#3A6073', '#1A2035', '#E57D61', '#F4B87C', '#F7F3EB'
]

const PRESET_GROUND_COLORS = [
  '#79A678', '#96BD8D', '#E7BC91', '#F3D5B5', '#247BA0', '#2D3A4B', '#22252E', '#EAE4D7'
]

export default function CustomBackgroundModal({
  isOpen,
  onClose,
  onApply,
  initialConfig = defaultCustomBackground,
}: CustomBackgroundModalProps) {
  const [config, setConfig] = useState<CustomBackgroundConfig>(initialConfig)

  if (!isOpen) return null

  function applyPreset(preset: 'sunset' | 'ocean' | 'night' | 'minimal') {
    if (preset === 'sunset') {
      setConfig({
        skyTop: '#D95D4E',
        skyBottom: '#F4B87C',
        groundColor: '#6B453A',
        horizonStyle: 'hills',
        horizonHeight: 58,
        hasStars: false,
      })
    } else if (preset === 'ocean') {
      setConfig({
        skyTop: '#8AC6D1',
        skyBottom: '#E0F2F1',
        groundColor: '#247BA0',
        horizonStyle: 'waves',
        horizonHeight: 52,
        hasStars: false,
      })
    } else if (preset === 'night') {
      setConfig({
        skyTop: '#121624',
        skyBottom: '#1E2638',
        groundColor: '#22252E',
        horizonStyle: 'flat',
        horizonHeight: 65,
        hasStars: true,
      })
    } else if (preset === 'minimal') {
      setConfig({
        skyTop: '#FAF6F0',
        skyBottom: '#F3EFE6',
        groundColor: '#EAE4D7',
        horizonStyle: 'grid',
        horizonHeight: 60,
        hasStars: false,
      })
    }
  }

  function handleSave() {
    onApply(config)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="utility-modal"
        onClick={e => e.stopPropagation()}
        style={{ width: 'min(680px, 94vw)', maxHeight: '90vh' }}
      >
        <div className="modal-head">
          <div>
            <span className="kicker">SCENE ENVIRONMENT</span>
            <h2>Create Custom Background</h2>
            <p>Customize pure backdrop colors and horizon landscape for your stage canvas.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '60vh' }}>
          {/* Mini Live Preview */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              maxHeight: '180px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid #D5C8B8',
              background: `linear-gradient(${config.skyTop} 0%, ${config.skyBottom} ${config.horizonHeight}%)`,
              marginBottom: '18px',
            }}
          >
            {/* Stars */}
            {config.hasStars && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {[15, 35, 60, 80, 25, 70].map((left, idx) => (
                  <span
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: `${15 + (idx % 3) * 12}%`,
                      width: '2px',
                      height: '2px',
                      background: '#FFF',
                      borderRadius: '50%',
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Ground / Horizon Preview */}
            {config.horizonStyle === 'flat' && (
              <div
                style={{
                  position: 'absolute',
                  top: `${config.horizonHeight}%`,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: config.groundColor,
                }}
              />
            )}

            {config.horizonStyle === 'hills' && (
              <div
                style={{
                  position: 'absolute',
                  top: `${config.horizonHeight - 12}%`,
                  bottom: 0,
                  left: '-10%',
                  right: '-10%',
                  borderRadius: '50% 50% 0 0',
                  background: config.groundColor,
                }}
              />
            )}

            {config.horizonStyle === 'waves' && (
              <div
                style={{
                  position: 'absolute',
                  top: `${config.horizonHeight}%`,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: config.groundColor,
                  borderTop: '3px solid rgba(255,255,255,0.7)',
                }}
              />
            )}

            {config.horizonStyle === 'dunes' && (
              <div
                style={{
                  position: 'absolute',
                  top: `${config.horizonHeight - 8}%`,
                  bottom: 0,
                  left: '-5%',
                  right: '-5%',
                  borderRadius: '35% 65% 0 0',
                  background: config.groundColor,
                }}
              />
            )}

            {config.horizonStyle === 'grid' && (
              <div
                style={{
                  position: 'absolute',
                  top: `${config.horizonHeight}%`,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: config.groundColor,
                  backgroundImage:
                    'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />
            )}

            <span
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '10px',
                background: '#FFFAF5cc',
                padding: '3px 7px',
                borderRadius: '4px',
                fontSize: '9px',
                fontFamily: 'monospace',
                color: '#6F665E',
              }}
            >
              Backdrop Preview · 0 Objects
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#8E847B', letterSpacing: '0.08em' }}>
              QUICK PALETTES
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button className="outline-button" style={{ padding: '6px 10px', fontSize: '10px' }} onClick={() => applyPreset('sunset')}>
                <SunMedium size={13} style={{ color: '#D95D4E' }} /> Sunset
              </button>
              <button className="outline-button" style={{ padding: '6px 10px', fontSize: '10px' }} onClick={() => applyPreset('ocean')}>
                <Waves size={13} style={{ color: '#247BA0' }} /> Ocean Waves
              </button>
              <button className="outline-button" style={{ padding: '6px 10px', fontSize: '10px' }} onClick={() => applyPreset('night')}>
                <Sparkles size={13} style={{ color: '#F4B87C' }} /> Midnight Highway
              </button>
              <button className="outline-button" style={{ padding: '6px 10px', fontSize: '10px' }} onClick={() => applyPreset('minimal')}>
                <Compass size={13} style={{ color: '#8E847B' }} /> Minimal Studio
              </button>
            </div>
          </div>

          {/* Sky Gradient Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#8E847B', display: 'block', marginBottom: '6px' }}>
                SKY TOP COLOR
              </label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="color"
                  value={config.skyTop}
                  onChange={e => setConfig(c => ({ ...c, skyTop: e.target.value }))}
                  style={{ width: '28px', height: '28px', border: '1px solid #D9CCBD', borderRadius: '5px', cursor: 'pointer' }}
                />
                {PRESET_SKY_COLORS.slice(0, 5).map(col => (
                  <button
                    key={col}
                    onClick={() => setConfig(c => ({ ...c, skyTop: col }))}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '5px',
                      background: col,
                      border: config.skyTop === col ? '2px solid var(--coral)' : '1px solid #DDD',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#8E847B', display: 'block', marginBottom: '6px' }}>
                SKY HORIZON COLOR
              </label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="color"
                  value={config.skyBottom}
                  onChange={e => setConfig(c => ({ ...c, skyBottom: e.target.value }))}
                  style={{ width: '28px', height: '28px', border: '1px solid #D9CCBD', borderRadius: '5px', cursor: 'pointer' }}
                />
                {PRESET_SKY_COLORS.slice(3).map(col => (
                  <button
                    key={col}
                    onClick={() => setConfig(c => ({ ...c, skyBottom: col }))}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '5px',
                      background: col,
                      border: config.skyBottom === col ? '2px solid var(--coral)' : '1px solid #DDD',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Ground Color */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, color: '#8E847B', display: 'block', marginBottom: '6px' }}>
              GROUND / TERRAIN COLOR
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="color"
                value={config.groundColor}
                onChange={e => setConfig(c => ({ ...c, groundColor: e.target.value }))}
                style={{ width: '28px', height: '28px', border: '1px solid #D9CCBD', borderRadius: '5px', cursor: 'pointer' }}
              />
              {PRESET_GROUND_COLORS.map(col => (
                <button
                  key={col}
                  onClick={() => setConfig(c => ({ ...c, groundColor: col }))}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '5px',
                    background: col,
                    border: config.groundColor === col ? '2px solid var(--coral)' : '1px solid #DDD',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Horizon Terrain Shape */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, color: '#8E847B', display: 'block', marginBottom: '8px' }}>
              HORIZON TERRAIN STYLE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {[
                { id: 'hills', label: 'Rolling Hills', icon: Mountain },
                { id: 'waves', label: 'Ocean Waves', icon: Waves },
                { id: 'flat', label: 'Flat Road', icon: Compass },
                { id: 'dunes', label: 'Sand Dunes', icon: SunMedium },
                { id: 'grid', label: 'Grid Floor', icon: Palette },
              ].map(st => {
                const Icon = st.icon
                const isActive = config.horizonStyle === st.id
                return (
                  <button
                    key={st.id}
                    onClick={() => setConfig(c => ({ ...c, horizonStyle: st.id as any }))}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      background: isActive ? '#FFFAF5' : '#F9F5EE',
                      border: isActive ? '2px solid var(--coral)' : '1px solid #DED3C5',
                      color: isActive ? 'var(--ink)' : '#7C726A',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={16} style={{ color: isActive ? 'var(--coral)' : '#8E847B' }} />
                    <span style={{ fontSize: '9px', fontWeight: isActive ? 700 : 500 }}>{st.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Starfield toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--stone)' }}>
            <span style={{ fontSize: '11px', color: '#6F665E' }}>Add Stars to Sky</span>
            <button
              onClick={() => setConfig(c => ({ ...c, hasStars: !c.hasStars }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                fontSize: '11px',
                color: '#6F665E',
              }}
            >
              <span className={config.hasStars ? 'toggle on' : 'toggle'}>
                <i />
              </span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-foot">
          <button className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button className="coral-button" onClick={handleSave}>
            <Check size={15} /> Apply to Stage &amp; Start Clean
          </button>
        </div>
      </div>
    </div>
  )
}
