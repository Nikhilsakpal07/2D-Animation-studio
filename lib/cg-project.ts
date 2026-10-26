/**
 * CG Studio Project File (.cgproj / JSON) Serialization, Validation, and Storage
 */

import { StageObject, SceneTheme } from '@/components/StageCanvas'
import { CustomBackgroundConfig, defaultCustomBackground } from '@/components/CustomBackgroundModal'
import { TransformBlock } from '@/lib/cg-engine'
import { AudioTrackConfig, SoundCue } from '@/lib/audio-engine'

export const CG_STORAGE_KEY = 'cg_studio_project_v1'

export interface AssetDef {
  name: string
  icon: string
  color: string
  category: 'world' | 'character' | 'custom'
  defaultW: number
  defaultH: number
  kind: 'object' | 'shape' | 'custom' | 'character'
  primitives?: any[]
  imageUrl?: string
}

export interface CGProjectData {
  version: '1.0'
  projectName: string
  lastSaved: number
  theme: SceneTheme
  customBgConfig: CustomBackgroundConfig
  sceneObjects: StageObject[]
  blocksMap: Record<string, TransformBlock[]>
  customAssets: AssetDef[]
  audioTrack?: AudioTrackConfig | null
  soundCues?: SoundCue[]
  durationSeconds?: number
}

/**
 * Creates a valid, sanitized project payload
 */
export function createProjectPayload(
  params: {
    projectName: string
    theme: SceneTheme
    customBgConfig?: CustomBackgroundConfig
    sceneObjects: StageObject[]
    blocksMap: Record<string, TransformBlock[]>
    customAssets: AssetDef[]
    audioTrack?: AudioTrackConfig | null
    soundCues?: SoundCue[]
    durationSeconds?: number
  }
): CGProjectData {
  return {
    version: '1.0',
    projectName: (params.projectName || 'Untitled Animation').trim(),
    lastSaved: Date.now(),
    theme: params.theme || 'countryside',
    customBgConfig: params.customBgConfig || defaultCustomBackground,
    sceneObjects: params.sceneObjects || [],
    blocksMap: params.blocksMap || {},
    customAssets: params.customAssets || [],
    audioTrack: params.audioTrack || null,
    soundCues: params.soundCues || [],
    durationSeconds: params.durationSeconds || 7,
  }
}

/**
 * Validates and parses raw JSON string into CGProjectData
 */
export function parseProjectFile(jsonStr: string): CGProjectData | null {
  try {
    const data = JSON.parse(jsonStr)
    if (!data || typeof data !== 'object') return null

    // Fallbacks and type validation
    const projectName = typeof data.projectName === 'string' && data.projectName.trim()
      ? data.projectName.trim()
      : 'Loaded Project'

    const theme: SceneTheme = ['blank', 'beach', 'countryside', 'midnight', 'custom'].includes(data.theme)
      ? data.theme
      : 'countryside'

    const customBgConfig: CustomBackgroundConfig = data.customBgConfig && typeof data.customBgConfig === 'object'
      ? { ...defaultCustomBackground, ...data.customBgConfig }
      : defaultCustomBackground

    const sceneObjects: StageObject[] = Array.isArray(data.sceneObjects)
      ? data.sceneObjects.filter((o: any) => o && typeof o === 'object' && typeof o.id === 'string')
      : []

    const blocksMap: Record<string, TransformBlock[]> = {}
    if (data.blocksMap && typeof data.blocksMap === 'object') {
      for (const [k, v] of Object.entries(data.blocksMap)) {
        if (Array.isArray(v)) {
          blocksMap[k] = v.filter((b: any) => b && typeof b === 'object' && typeof b.id === 'string')
        }
      }
    }

    const customAssets: AssetDef[] = Array.isArray(data.customAssets)
      ? data.customAssets.filter((a: any) => a && typeof a === 'object' && typeof a.name === 'string')
      : []

    const audioTrack: AudioTrackConfig | null =
      data.audioTrack && typeof data.audioTrack === 'object' && typeof data.audioTrack.name === 'string'
        ? data.audioTrack
        : null

    const soundCues: SoundCue[] = Array.isArray(data.soundCues)
      ? data.soundCues.filter((c: any) => c && typeof c === 'object' && typeof c.id === 'string')
      : []

    return {
      version: '1.0',
      projectName,
      lastSaved: typeof data.lastSaved === 'number' ? data.lastSaved : Date.now(),
      theme,
      customBgConfig,
      sceneObjects,
      blocksMap,
      customAssets,
      audioTrack,
      soundCues,
    }
  } catch (err) {
    console.error('Failed to parse CG Project file:', err)
    return null
  }
}

/**
 * Saves project data to localStorage safely
 */
export function saveToLocalStorage(data: CGProjectData): boolean {
  if (typeof window === 'undefined') return false
  try {
    const serialized = JSON.stringify(data)
    window.localStorage.setItem(CG_STORAGE_KEY, serialized)
    return true
  } catch (err) {
    console.warn('LocalStorage save failed (possible storage quota exceeded):', err)
    return false
  }
}

/**
 * Loads project data from localStorage
 */
export function loadFromLocalStorage(): CGProjectData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CG_STORAGE_KEY)
    if (!raw) return null
    return parseProjectFile(raw)
  } catch (err) {
    console.error('LocalStorage load failed:', err)
    return null
  }
}

/**
 * Clears saved project from localStorage
 */
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CG_STORAGE_KEY)
  } catch (err) {
    console.error('LocalStorage clear failed:', err)
  }
}

/**
 * Generates and triggers browser download of the .cgproj / .json file
 */
export function downloadProjectFile(projectData: CGProjectData): void {
  if (typeof window === 'undefined') return

  const filenameSafe = projectData.projectName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'animation-project'

  const jsonStr = JSON.stringify(projectData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filenameSafe}.cgproj.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
