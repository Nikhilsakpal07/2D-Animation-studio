'use client'

import React, { useRef, useState } from 'react'
import {
  Volume2, VolumeX, Music, Upload, Play, Pause, Plus, Trash2, X,
  Sparkles, Check, Headphones, Disc3, Radio, FileAudio
} from 'lucide-react'
import {
  AudioTrackConfig,
  SoundCue,
  SoundCueType,
  PresetAudioId,
  BACKGROUND_MUSIC_PRESETS,
  SOUND_EFFECT_PRESETS,
  playCueSound,
  generateChiptuneBuffer,
  generateLofiBuffer,
  generateCinematicBuffer,
  decodeCustomAudioBuffer,
  getAudioContext,
} from '@/lib/audio-engine'

interface AudioModalProps {
  isOpen: boolean
  onClose: () => void
  currentFrame: number
  audioTrack: AudioTrackConfig | null
  onSetAudioTrack: (track: AudioTrackConfig | null, buffer?: AudioBuffer | null) => void
  onAddSoundCue: (cue: SoundCue) => void
}

export default function AudioModal({
  isOpen,
  onClose,
  currentFrame,
  audioTrack,
  onSetAudioTrack,
  onAddSoundCue,
}: AudioModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'cues'>('presets')
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  function stopPreview() {
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop()
        previewSourceRef.current.disconnect()
      } catch (e) {}
      previewSourceRef.current = null
    }
    setPreviewingId(null)
  }

  async function handlePreviewPreset(presetId: PresetAudioId) {
    if (previewingId === presetId) {
      stopPreview()
      return
    }
    stopPreview()
    setPreviewingId(presetId)

    try {
      let result: { buffer: AudioBuffer; waveform: number[] }
      if (presetId === 'chiptune') {
        result = await generateChiptuneBuffer()
      } else if (presetId === 'lofi') {
        result = await generateLofiBuffer()
      } else {
        result = await generateCinematicBuffer()
      }

      const ctx = getAudioContext()
      const source = ctx.createBufferSource()
      source.buffer = result.buffer
      source.connect(ctx.destination)
      source.onended = () => {
        if (previewingId === presetId) setPreviewingId(null)
      }
      source.start()
      previewSourceRef.current = source
    } catch (e) {
      console.error('Failed to preview preset:', e)
      setPreviewingId(null)
    }
  }

  async function handleApplyPreset(preset: typeof BACKGROUND_MUSIC_PRESETS[0]) {
    setIsGenerating(true)
    stopPreview()

    try {
      let result: { buffer: AudioBuffer; waveform: number[] }
      if (preset.id === 'chiptune') {
        result = await generateChiptuneBuffer()
      } else if (preset.id === 'lofi') {
        result = await generateLofiBuffer()
      } else {
        result = await generateCinematicBuffer()
      }

      const newTrack: AudioTrackConfig = {
        id: `track_${Date.now()}`,
        name: preset.name,
        type: 'preset',
        presetId: preset.id,
        volume: audioTrack?.volume ?? 0.8,
        muted: audioTrack?.muted ?? false,
        duration: 7.0,
        waveform: result.waveform,
      }

      onSetAudioTrack(newTrack, result.buffer)
      onClose()
    } catch (e) {
      console.error('Failed to generate preset audio:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleFileUpload(file: File) {
    setIsGenerating(true)
    stopPreview()

    try {
      const arrayBuffer = await file.arrayBuffer()
      const decoded = await decodeCustomAudioBuffer(arrayBuffer)

      const reader = new FileReader()
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string

        const newTrack: AudioTrackConfig = {
          id: `custom_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'custom',
          audioDataUrl: dataUrl,
          volume: audioTrack?.volume ?? 0.8,
          muted: audioTrack?.muted ?? false,
          duration: decoded.duration,
          waveform: decoded.waveform,
        }

        onSetAudioTrack(newTrack, decoded.buffer)
        setIsGenerating(false)
        onClose()
      }
      reader.readAsDataURL(file)
    } catch (e) {
      alert('Could not decode audio file. Please try a valid MP3, WAV, or OGG file.')
      setIsGenerating(false)
    }
  }

  function handleAddCueAtCurrentFrame(cueType: SoundCueType, label: string) {
    playCueSound(cueType, 0.9)
    onAddSoundCue({
      id: `cue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      frame: currentFrame,
      cueType,
      label,
    })
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(30, 26, 23, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          stopPreview()
          onClose()
        }
      }}
    >
      <div
        className="modal-window"
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#FFFDF9',
          border: '1px solid #D8CFC0',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(48, 46, 53, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #EFEAE0',
            background: '#FAF6F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #D95D4E 0%, #B84739 100%)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 6px rgba(217, 93, 78, 0.3)',
              }}
            >
              <Music size={16} />
            </span>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                Audio Track &amp; Sound FX
              </h2>
              <p style={{ fontSize: '11px', color: '#887C72', margin: 0 }}>
                Synthesized background music loops &amp; frame-specific sound effect cues
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopPreview()
              onClose()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8A7F75',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            padding: '8px 20px',
            gap: '8px',
            borderBottom: '1px solid #EFEAE0',
            background: '#FDFBF7',
          }}
        >
          <button
            onClick={() => setActiveTab('presets')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'presets' ? 'var(--coral)' : '#EFEAE0',
              color: activeTab === 'presets' ? '#FFFFFF' : '#635B55',
              fontWeight: 600,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Disc3 size={13} /> Built-in Music Presets
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'custom' ? 'var(--coral)' : '#EFEAE0',
              color: activeTab === 'custom' ? '#FFFFFF' : '#635B55',
              fontWeight: 600,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Upload size={13} /> Upload Custom Audio
          </button>

          <button
            onClick={() => setActiveTab('cues')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'cues' ? 'var(--coral)' : '#EFEAE0',
              color: activeTab === 'cues' ? '#FFFFFF' : '#635B55',
              fontWeight: 600,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={13} /> Sound Effect Cues ({SOUND_EFFECT_PRESETS.length})
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: BACKGROUND PRESETS */}
          {activeTab === 'presets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  background: '#F0ECE4',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#635B55',
                  lineHeight: 1.4,
                }}
              >
                ✨ <strong>Zero External Files Needed:</strong> Procedurally synthesized in real time via Web Audio API. 7-second seamless loops perfectly matching the 168-frame timeline.
              </div>

              {BACKGROUND_MUSIC_PRESETS.map(preset => {
                const isSelected = audioTrack?.presetId === preset.id
                const isPlaying = previewingId === preset.id

                return (
                  <div
                    key={preset.id}
                    style={{
                      border: isSelected ? '2px solid var(--coral)' : '1px solid #D8CFC0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      background: isSelected ? '#FFF8F6' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Play / Preview Button */}
                    <button
                      onClick={() => handlePreviewPreset(preset.id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isPlaying ? 'var(--coral)' : '#F0ECE4',
                        color: isPlaying ? '#fff' : 'var(--ink)',
                        border: 'none',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                    >
                      {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{preset.name}</strong>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            background: `${preset.color}20`,
                            color: preset.color,
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {preset.genre}
                        </span>
                        <span style={{ fontSize: '10px', color: '#978C82' }}>• {preset.bpm} BPM</span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#6E645C', margin: 0 }}>{preset.description}</p>
                    </div>

                    {/* Apply Button */}
                    <button
                      disabled={isGenerating}
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: isSelected ? '#6A9B72' : 'var(--coral)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: isGenerating ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check size={13} /> Active
                        </>
                      ) : (
                        'Use Track'
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB 2: UPLOAD CUSTOM AUDIO */}
          {activeTab === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg,.mp3,.wav,.ogg"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0])
                    e.target.value = ''
                  }
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0])
                  }
                }}
                style={{
                  border: '2px dashed #C8BDB0',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  background: '#FAF6F0',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#C8BDB0')}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#F0ECE4',
                    color: 'var(--coral)',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <FileAudio size={24} />
                </div>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--ink)', marginBottom: '4px' }}>
                  Click to Browse or Drag &amp; Drop Audio File
                </strong>
                <p style={{ fontSize: '11px', color: '#887C72', margin: 0 }}>
                  Supports MP3, WAV, and OGG formats with automatic waveform generation
                </p>
              </div>

              {audioTrack && audioTrack.type === 'custom' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: '#FFF8F6',
                    border: '1.5px solid var(--coral)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Music size={16} style={{ color: 'var(--coral)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                      Current Custom Track: <strong>{audioTrack.name}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => onSetAudioTrack(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#BA4437',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SOUND EFFECT CUES */}
          {activeTab === 'cues' && (
            <div>
              <div
                style={{
                  background: '#F3EFE6',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#635B55',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  📍 Target Playhead Frame: <strong>Frame {currentFrame}</strong> (
                  {(currentFrame / 24).toFixed(2)}s)
                </span>
                <span style={{ fontSize: '10px', color: '#8A7F75' }}>
                  Click "+ Add Cue" to place a marker at this frame
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                }}
              >
                {SOUND_EFFECT_PRESETS.map(fx => (
                  <div
                    key={fx.type}
                    style={{
                      border: '1px solid #D8CFC0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      background: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{fx.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '12px', color: 'var(--ink)' }}>
                          {fx.name}
                        </strong>
                        <small style={{ fontSize: '10px', color: '#887C72', display: 'block' }}>
                          {fx.description}
                        </small>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      {/* Test sound */}
                      <button
                        onClick={() => playCueSound(fx.type, 0.9)}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          background: '#FAF6F0',
                          border: '1px solid #D8CFC0',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#4C4540',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                        title="Test play this sound effect"
                      >
                        <Play size={10} fill="currentColor" /> Test Sound
                      </button>

                      {/* Add at Frame */}
                      <button
                        onClick={() => handleAddCueAtCurrentFrame(fx.type, fx.name)}
                        style={{
                          flex: 1.4,
                          padding: '5px 8px',
                          background: 'linear-gradient(135deg, #7B6DAF 0%, #6857A1 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 4px rgba(123, 109, 175, 0.25)',
                        }}
                        title={`Place a ${fx.name} cue at frame ${currentFrame}`}
                      >
                        <Plus size={12} /> Add @ Frame {currentFrame}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #EFEAE0',
            background: '#FAF6F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {audioTrack ? (
            <button
              onClick={() => {
                onSetAudioTrack(null)
                stopPreview()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#BA4437',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Trash2 size={13} /> Remove Background Music
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: '#978C82' }}>No background track active</span>
          )}

          <button
            onClick={() => {
              stopPreview()
              onClose()
            }}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              background: '#EAE4D7',
              border: '1px solid #D8CFC0',
              color: 'var(--ink)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
