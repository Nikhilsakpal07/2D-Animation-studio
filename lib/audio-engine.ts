/**
 * Computer Graphics Studio - Web Audio Synthesis & Playback Engine
 * 100% Offline Procedural Audio Synthesis, Sound Effects, and Playback Sync
 */

export type SoundCueType =
  | 'whoosh'
  | 'jump'
  | 'pop'
  | 'horn'
  | 'footstep'
  | 'chime'

export interface SoundCue {
  id: string
  frame: number // 0 to 168
  cueType: SoundCueType
  label: string
}

export type PresetAudioId = 'chiptune' | 'lofi' | 'cinematic'

export interface AudioTrackConfig {
  id: string
  name: string
  type: 'preset' | 'custom'
  presetId?: PresetAudioId
  audioDataUrl?: string
  volume: number // 0.0 to 1.0
  muted: boolean
  duration: number // in seconds
  waveform?: number[] // Normalized bar heights [0..1]
}

export interface SoundEffectDef {
  type: SoundCueType
  name: string
  emoji: string
  description: string
  color: string
}

export const SOUND_EFFECT_PRESETS: SoundEffectDef[] = [
  { type: 'whoosh', name: 'Whoosh', emoji: '💨', description: 'Air sweep / motion swing', color: '#86AEB7' },
  { type: 'jump', name: 'Jump / Boing', emoji: '🦘', description: 'Bouncy spring pitch glide', color: '#D95D4E' },
  { type: 'pop', name: 'Pop', emoji: '🫧', description: 'Crisp bubble burst click', color: '#F5B941' },
  { type: 'horn', name: 'Car Horn', emoji: '🚗', description: 'Dual-tone brassy honk', color: '#D98264' },
  { type: 'footstep', name: 'Footstep', emoji: '👟', description: 'Tactile low thump tap', color: '#6A9B72' },
  { type: 'chime', name: 'Chime', emoji: '✨', description: 'Sparkling bell overtone', color: '#7B6DAF' },
]

export const BACKGROUND_MUSIC_PRESETS: {
  id: PresetAudioId
  name: string
  genre: string
  description: string
  bpm: number
  color: string
}[] = [
  {
    id: 'chiptune',
    name: 'Upbeat Chiptune',
    genre: '8-Bit Retro Game',
    description: 'Fast retro square-wave arpeggio with walking bass & punchy chiptune beats',
    bpm: 120,
    color: '#D95D4E',
  },
  {
    id: 'lofi',
    name: 'Cozy Lo-Fi Pulse',
    genre: 'Chillhop / Lo-Fi',
    description: 'Warm Rhodes electric chords, gentle vinyl ambience & mellow chill beats',
    bpm: 80,
    color: '#7B6DAF',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Synth',
    genre: 'Ambient Sci-Fi',
    description: 'Deep analog pad swell with resonant filter sweep & shimmering bells',
    bpm: 90,
    color: '#2E7A8A',
  },
]

// Singleton Web Audio Context
let sharedAudioCtx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    sharedAudioCtx = new AudioContextClass()
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume()
  }
  return sharedAudioCtx
}

// -------------------------------------------------------------
// ONE-SHOT SOUND EFFECT SYNTHESIZERS (Zero external files needed)
// -------------------------------------------------------------

export function playCueSound(type: SoundCueType, volume: number = 0.8) {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), now)
    masterGain.connect(ctx.destination)

    switch (type) {
      case 'whoosh':
        playWhoosh(ctx, masterGain, now)
        break
      case 'jump':
        playJump(ctx, masterGain, now)
        break
      case 'pop':
        playPop(ctx, masterGain, now)
        break
      case 'horn':
        playHorn(ctx, masterGain, now)
        break
      case 'footstep':
        playFootstep(ctx, masterGain, now)
        break
      case 'chime':
        playChime(ctx, masterGain, now)
        break
    }
  } catch (err) {
    console.warn('Audio playback not allowed or failed:', err)
  }
}

function playWhoosh(ctx: AudioContext, dest: GainNode, now: number) {
  const duration = 0.32
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.setValueAtTime(3.0, now)
  filter.frequency.setValueAtTime(300, now)
  filter.frequency.exponentialRampToValueAtTime(2200, now + 0.14)
  filter.frequency.exponentialRampToValueAtTime(350, now + duration)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.001, now)
  gain.gain.linearRampToValueAtTime(0.7, now + 0.12)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(dest)

  noise.start(now)
  noise.stop(now + duration)
}

function playJump(ctx: AudioContext, dest: GainNode, now: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(140, now)
  osc.frequency.exponentialRampToValueAtTime(620, now + 0.14)
  osc.frequency.linearRampToValueAtTime(380, now + 0.28)

  gain.gain.setValueAtTime(0.01, now)
  gain.gain.linearRampToValueAtTime(0.65, now + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

  osc.connect(gain)
  gain.connect(dest)

  osc.start(now)
  osc.stop(now + 0.28)
}

function playPop(ctx: AudioContext, dest: GainNode, now: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(820, now)
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.06)

  gain.gain.setValueAtTime(0.75, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

  osc.connect(gain)
  gain.connect(dest)

  osc.start(now)
  osc.stop(now + 0.07)
}

function playHorn(ctx: AudioContext, dest: GainNode, now: number) {
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()

  osc1.type = 'sawtooth'
  osc2.type = 'sawtooth'

  // F4 (349Hz) and A4 (440Hz) - Classic car horn harmony
  osc1.frequency.setValueAtTime(349, now)
  osc2.frequency.setValueAtTime(440, now)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1600, now)

  gain.gain.setValueAtTime(0.01, now)
  gain.gain.linearRampToValueAtTime(0.4, now + 0.03)
  gain.gain.setValueAtTime(0.38, now + 0.26)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

  osc1.connect(filter)
  osc2.connect(filter)
  filter.connect(gain)
  gain.connect(dest)

  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 0.35)
  osc2.stop(now + 0.35)
}

function playFootstep(ctx: AudioContext, dest: GainNode, now: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(95, now)
  osc.frequency.exponentialRampToValueAtTime(38, now + 0.1)

  gain.gain.setValueAtTime(0.65, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)

  osc.connect(gain)
  gain.connect(dest)

  osc.start(now)
  osc.stop(now + 0.11)
}

function playChime(ctx: AudioContext, dest: GainNode, now: number) {
  const freqs = [1046.5, 1318.5, 1567.98, 2093.0] // C6, E6, G6, C7
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const delay = idx * 0.04

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + delay)

    gain.gain.setValueAtTime(0.001, now + delay)
    gain.gain.linearRampToValueAtTime(0.25 / (idx + 1), now + delay + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6)

    osc.connect(gain)
    gain.connect(dest)

    osc.start(now + delay)
    osc.stop(now + delay + 0.6)
  })
}

// -------------------------------------------------------------
// PROCEDURAL BACKGROUND MUSIC SYNTHESIS (7-Second Loops)
// -------------------------------------------------------------

const TOTAL_TIMELINE_SECONDS = 7.0
const SAMPLE_RATE = 44100
const NUM_WAVEFORM_BARS = 84

/**
 * Extracts a normalized 84-bar waveform array from an AudioBuffer
 */
export function extractWaveformData(buffer: AudioBuffer, numBars: number = NUM_WAVEFORM_BARS): number[] {
  const channelData = buffer.getChannelData(0)
  const totalSamples = channelData.length
  const samplesPerBar = Math.floor(totalSamples / numBars)
  const result: number[] = []

  let maxVal = 0.001
  for (let i = 0; i < numBars; i++) {
    const start = i * samplesPerBar
    const end = Math.min(start + samplesPerBar, totalSamples)
    let sumSquares = 0
    let count = 0
    for (let s = start; s < end; s += 4) {
      const val = channelData[s]
      sumSquares += val * val
      count++
    }
    const rms = Math.sqrt(sumSquares / Math.max(1, count))
    if (rms > maxVal) maxVal = rms
    result.push(rms)
  }

  // Normalize between 0.12 and 1.0
  return result.map(v => Math.max(0.12, Math.min(1.0, Math.round((v / maxVal) * 100) / 100)))
}

/**
 * 1. Upbeat Chiptune Generator (Retro 8-bit pulse & walking bass)
 */
export async function generateChiptuneBuffer(): Promise<{ buffer: AudioBuffer; waveform: number[] }> {
  const offlineCtx = new OfflineAudioContext(2, Math.round(SAMPLE_RATE * TOTAL_TIMELINE_SECONDS), SAMPLE_RATE)
  const now = 0
  const duration = TOTAL_TIMELINE_SECONDS

  const master = offlineCtx.createGain()
  master.gain.setValueAtTime(0.5, now)
  master.connect(offlineCtx.destination)

  // 14 beats in 7.0s (0.5s per beat, 120 BPM)
  const beatLen = 0.5
  const totalBeats = 14

  // Melody notes (C5, D5, E5, G5, A5, C6)
  const melodyNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 783.99, 659.25]
  // Bass notes (C3, E3, G3, A3, F3, G3, C3)
  const bassNotes = [130.81, 164.81, 196.0, 220.0, 174.61, 196.0, 130.81]

  for (let beat = 0; beat < totalBeats; beat++) {
    const t = beat * beatLen

    // Bass Note (Triangle Wave)
    const bass = offlineCtx.createOscillator()
    const bassGain = offlineCtx.createGain()
    bass.type = 'triangle'
    bass.frequency.setValueAtTime(bassNotes[beat % bassNotes.length], t)
    bassGain.gain.setValueAtTime(0.35, t)
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 0.9)
    bass.connect(bassGain)
    bassGain.connect(master)
    bass.start(t)
    bass.stop(t + beatLen * 0.9)

    // Snappy 16th Arpeggio Lead (Square Wave)
    for (let sub = 0; sub < 4; sub++) {
      const subT = t + sub * (beatLen / 4)
      const noteIdx = (beat * 4 + sub) % melodyNotes.length
      const lead = offlineCtx.createOscillator()
      const leadGain = offlineCtx.createGain()
      lead.type = 'square'
      lead.frequency.setValueAtTime(melodyNotes[noteIdx], subT)
      leadGain.gain.setValueAtTime(0.2, subT)
      leadGain.gain.exponentialRampToValueAtTime(0.001, subT + (beatLen / 4) * 0.8)
      lead.connect(leadGain)
      leadGain.connect(master)
      lead.start(subT)
      lead.stop(subT + (beatLen / 4) * 0.8)
    }

    // Drum Kick (beats 0, 2, 4...)
    if (beat % 2 === 0) {
      const kick = offlineCtx.createOscillator()
      const kickGain = offlineCtx.createGain()
      kick.type = 'sine'
      kick.frequency.setValueAtTime(140, t)
      kick.frequency.exponentialRampToValueAtTime(38, t + 0.12)
      kickGain.gain.setValueAtTime(0.7, t)
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      kick.connect(kickGain)
      kickGain.connect(master)
      kick.start(t)
      kick.stop(t + 0.15)
    } else {
      // Drum Snare Chiptune Noise Burst
      const snareBuf = offlineCtx.createBuffer(1, Math.round(SAMPLE_RATE * 0.1), SAMPLE_RATE)
      const snData = snareBuf.getChannelData(0)
      for (let i = 0; i < snData.length; i++) snData[i] = Math.random() * 2 - 1
      const snare = offlineCtx.createBufferSource()
      snare.buffer = snareBuf
      const snareFilt = offlineCtx.createBiquadFilter()
      snareFilt.type = 'highpass'
      snareFilt.frequency.setValueAtTime(1800, t)
      const snareGain = offlineCtx.createGain()
      snareGain.gain.setValueAtTime(0.4, t)
      snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
      snare.connect(snareFilt)
      snareFilt.connect(snareGain)
      snareGain.connect(master)
      snare.start(t)
      snare.stop(t + 0.1)
    }
  }

  const renderedBuffer = await offlineCtx.startRendering()
  const waveform = extractWaveformData(renderedBuffer)
  return { buffer: renderedBuffer, waveform }
}

/**
 * 2. Cozy Lo-Fi Pulse Generator (Warm electric Rhodes chords & relaxed beat)
 */
export async function generateLofiBuffer(): Promise<{ buffer: AudioBuffer; waveform: number[] }> {
  const offlineCtx = new OfflineAudioContext(2, Math.round(SAMPLE_RATE * TOTAL_TIMELINE_SECONDS), SAMPLE_RATE)
  const duration = TOTAL_TIMELINE_SECONDS

  const master = offlineCtx.createGain()
  master.gain.setValueAtTime(0.55, 0)
  master.connect(offlineCtx.destination)

  // 4 Chord Steps across 7 seconds (1.75s each):
  // Am7: A2 (110), C4 (261.6), E4 (329.6), G4 (392.0)
  // Dm7: D3 (146.8), F4 (349.2), A4 (440.0), C5 (523.25)
  // G7:  G2 (98.0), B3 (246.9), D4 (293.6), F4 (349.2)
  // Cmaj7: C3 (130.8), E4 (329.6), G4 (392.0), B4 (493.88)
  const chordSteps = [
    [110, 261.63, 329.63, 392.0],
    [146.83, 349.23, 440.0, 523.25],
    [98.0, 246.94, 293.66, 349.23],
    [130.81, 329.63, 392.0, 493.88],
  ]

  const chordLen = duration / chordSteps.length

  chordSteps.forEach((chord, idx) => {
    const t = idx * chordLen

    chord.forEach((freq, fIdx) => {
      const osc = offlineCtx.createOscillator()
      const oscGain = offlineCtx.createGain()
      const filter = offlineCtx.createBiquadFilter()

      osc.type = fIdx === 0 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, t)

      // Warm lowpass filter
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(700, t)

      oscGain.gain.setValueAtTime(0.001, t)
      oscGain.gain.linearRampToValueAtTime(0.22, t + 0.08)
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + chordLen * 0.95)

      osc.connect(filter)
      filter.connect(oscGain)
      oscGain.connect(master)

      osc.start(t)
      osc.stop(t + chordLen * 0.95)
    })
  })

  // Relaxed Beat (8 beats, 0.875s apart)
  const beatCount = 8
  const beatInterval = duration / beatCount

  for (let b = 0; b < beatCount; b++) {
    const t = b * beatInterval

    // Kick on 0, 2, 4, 6
    if (b % 2 === 0) {
      const kick = offlineCtx.createOscillator()
      const kickGain = offlineCtx.createGain()
      kick.type = 'sine'
      kick.frequency.setValueAtTime(105, t)
      kick.frequency.exponentialRampToValueAtTime(40, t + 0.16)
      kickGain.gain.setValueAtTime(0.6, t)
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      kick.connect(kickGain)
      kickGain.connect(master)
      kick.start(t)
      kick.stop(t + 0.18)
    } else {
      // Soft Rim/Snap on 1, 3, 5, 7
      const osc = offlineCtx.createOscillator()
      const g = offlineCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(480, t)
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.05)
      g.gain.setValueAtTime(0.35, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      osc.connect(g)
      g.connect(master)
      osc.start(t)
      osc.stop(t + 0.06)
    }
  }

  const renderedBuffer = await offlineCtx.startRendering()
  const waveform = extractWaveformData(renderedBuffer)
  return { buffer: renderedBuffer, waveform }
}

/**
 * 3. Cinematic Synth Generator (Deep analog swell, resonant filter sweep & sparkling bells)
 */
export async function generateCinematicBuffer(): Promise<{ buffer: AudioBuffer; waveform: number[] }> {
  const offlineCtx = new OfflineAudioContext(2, Math.round(SAMPLE_RATE * TOTAL_TIMELINE_SECONDS), SAMPLE_RATE)
  const duration = TOTAL_TIMELINE_SECONDS

  const master = offlineCtx.createGain()
  master.gain.setValueAtTime(0.5, 0)
  master.connect(offlineCtx.destination)

  // Rich D minor Pad (D2 = 73.4Hz, A2 = 110Hz, D3 = 146.8Hz, F3 = 174.6Hz, A3 = 220Hz)
  const padFreqs = [73.42, 110.0, 146.83, 174.61, 220.0]
  padFreqs.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator()
    const oscGain = offlineCtx.createGain()
    const filter = offlineCtx.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, 0)
    // Slight detune for analog warmth
    osc.detune.setValueAtTime((idx - 2) * 6, 0)

    filter.type = 'lowpass'
    filter.Q.setValueAtTime(3.2, 0)
    // Sweeping filter from 200Hz to 1600Hz and back
    filter.frequency.setValueAtTime(220, 0)
    filter.frequency.exponentialRampToValueAtTime(1500, 3.5)
    filter.frequency.exponentialRampToValueAtTime(240, duration)

    oscGain.gain.setValueAtTime(0.01, 0)
    oscGain.gain.linearRampToValueAtTime(0.18, 1.2)
    oscGain.gain.setValueAtTime(0.18, 5.5)
    oscGain.gain.linearRampToValueAtTime(0.001, duration)

    osc.connect(filter)
    filter.connect(oscGain)
    oscGain.connect(master)

    osc.start(0)
    osc.stop(duration)
  })

  // Deep Sub Bass Drone (55Hz / A1)
  const sub = offlineCtx.createOscillator()
  const subGain = offlineCtx.createGain()
  sub.type = 'sine'
  sub.frequency.setValueAtTime(55, 0)
  subGain.gain.setValueAtTime(0.01, 0)
  subGain.gain.linearRampToValueAtTime(0.4, 0.8)
  subGain.gain.setValueAtTime(0.4, 5.8)
  subGain.gain.linearRampToValueAtTime(0.001, duration)
  sub.connect(subGain)
  subGain.connect(master)
  sub.start(0)
  sub.stop(duration)

  // High Shimmering Bells (Arpeggiated every 0.58s)
  const bellNotes = [587.33, 880.0, 1046.5, 1174.66, 1567.98]
  for (let b = 0; b < 12; b++) {
    const t = 0.5 + b * 0.52
    if (t + 0.8 > duration) break
    const osc = offlineCtx.createOscillator()
    const g = offlineCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(bellNotes[b % bellNotes.length], t)
    g.gain.setValueAtTime(0.001, t)
    g.gain.linearRampToValueAtTime(0.18, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    osc.connect(g)
    g.connect(master)
    osc.start(t)
    osc.stop(t + 0.6)
  }

  const renderedBuffer = await offlineCtx.startRendering()
  const waveform = extractWaveformData(renderedBuffer)
  return { buffer: renderedBuffer, waveform }
}

/**
 * Decodes user uploaded audio file (MP3, WAV, OGG)
 */
export async function decodeCustomAudioBuffer(
  arrayBuffer: ArrayBuffer
): Promise<{ buffer: AudioBuffer; waveform: number[]; duration: number }> {
  const ctx = getAudioContext()
  const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
  const waveform = extractWaveformData(decoded)
  return {
    buffer: decoded,
    waveform,
    duration: decoded.duration,
  }
}

// -------------------------------------------------------------
// TIMELINE AUDIO PLAYBACK CONTROLLER
// -------------------------------------------------------------

class TimelineAudioManager {
  private currentSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private activeBuffer: AudioBuffer | null = null
  private isPlaying: boolean = false
  private startPlaybackTime: number = 0
  private startTimelineOffset: number = 0 // In seconds
  private volume: number = 0.8
  private muted: boolean = false
  private lastTriggeredFrame: number = -1

  constructor() {
    // Lazy initialized
  }

  private initGain(ctx: AudioContext) {
    if (!this.gainNode) {
      this.gainNode = ctx.createGain()
      this.gainNode.connect(ctx.destination)
    }
    const targetGain = this.muted ? 0 : this.volume
    this.gainNode.gain.setValueAtTime(targetGain, ctx.currentTime)
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.gainNode && sharedAudioCtx) {
      this.gainNode.gain.setValueAtTime(this.muted ? 0 : this.volume, sharedAudioCtx.currentTime)
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted
    if (this.gainNode && sharedAudioCtx) {
      this.gainNode.gain.setValueAtTime(this.muted ? 0 : this.volume, sharedAudioCtx.currentTime)
    }
  }

  public setBuffer(buffer: AudioBuffer | null) {
    this.stop()
    this.activeBuffer = buffer
  }

  public play(startFrame: number, fps: number = 24) {
    if (!this.activeBuffer) return
    const ctx = getAudioContext()
    this.initGain(ctx)

    // Stop any existing playing source
    this.stop()

    const offsetSeconds = Math.max(0, (startFrame / fps) % this.activeBuffer.duration)
    const source = ctx.createBufferSource()
    source.buffer = this.activeBuffer
    source.loop = true
    source.connect(this.gainNode!)

    source.start(0, offsetSeconds)
    this.currentSource = source
    this.isPlaying = true
    this.startPlaybackTime = ctx.currentTime
    this.startTimelineOffset = offsetSeconds
  }

  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop()
        this.currentSource.disconnect()
      } catch (e) {
        // Already stopped
      }
      this.currentSource = null
    }
    this.isPlaying = false
    this.lastTriggeredFrame = -1
  }

  public seek(frame: number, isPlaying: boolean, fps: number = 24) {
    if (isPlaying && this.activeBuffer) {
      this.play(frame, fps)
    } else {
      this.stop()
    }
  }

  /**
   * Called on every frame tick (24 FPS) to fire frame-accurate sound effect cues!
   */
  public onFrameTick(frame: number, cues: SoundCue[]) {
    if (frame === this.lastTriggeredFrame) return
    this.lastTriggeredFrame = frame

    if (!cues || cues.length === 0 || this.muted) return

    for (const cue of cues) {
      if (cue.frame === frame) {
        playCueSound(cue.cueType, this.volume)
      }
    }
  }
}

export const timelineAudio = new TimelineAudioManager()
