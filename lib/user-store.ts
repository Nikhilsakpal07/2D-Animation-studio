/**
 * User Profile, Projects, Custom CG Assets, and Work History Storage
 * Dual-sync: Cloud Firestore with instant LocalStorage offline fallback
 */

import { doc, setDoc, getDoc, getDocs, collection, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { CGProjectData, AssetDef } from './cg-project'

export interface UserProjectItem {
  id: string
  name: string
  theme: string
  updatedAt: number
  objectCount: number
  blockCount: number
  data: CGProjectData
  thumbnail?: string
}

export interface UserActivityItem {
  id: string
  timestamp: number
  icon: string
  title: string
  details?: string
  badge?: string
}

export interface UserProfileData {
  bio: string
  role: string
  totalProjects: number
  totalAssets: number
  totalBlocks: number
}

// Timeout helper to prevent remote Firestore network hangs from blocking UI
function withTimeout<T>(promise: Promise<T>, ms = 1200): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms)),
  ])
}

// ----------------------------------------------------------------------
// 1. User Projects CRUD
// ----------------------------------------------------------------------

export async function getUserProjects(uid: string): Promise<UserProjectItem[]> {
  const localKey = `cg_user_projects_${uid}`
  let items: UserProjectItem[] = []
  if (typeof window !== 'undefined') {
    try {
      const localData = localStorage.getItem(localKey)
      if (localData) items = JSON.parse(localData)
    } catch (e) {}
  }

  try {
    const colRef = collection(db, 'users', uid, 'projects')
    const snap = await withTimeout(getDocs(colRef), 1200)
    if (!snap.empty) {
      const remoteItems: UserProjectItem[] = []
      snap.forEach(d => {
        remoteItems.push(d.data() as UserProjectItem)
      })
      remoteItems.sort((a, b) => b.updatedAt - a.updatedAt)
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(remoteItems))
      }
      return remoteItems
    }
  } catch (err) {
    // Offline or timed out - local storage is our resilient fallback
  }

  return items.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function saveUserProject(
  uid: string,
  project: CGProjectData,
  projectId?: string
): Promise<UserProjectItem> {
  const localKey = `cg_user_projects_${uid}`
  let existing: UserProjectItem[] = []
  if (typeof window !== 'undefined') {
    try {
      const localData = localStorage.getItem(localKey)
      if (localData) existing = JSON.parse(localData)
    } catch (e) {}
  }

  const id = projectId || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  const objectCount = project.sceneObjects?.length || 0
  let blockCount = 0
  if (project.blocksMap) {
    Object.values(project.blocksMap).forEach(list => {
      blockCount += list.length
    })
  }

  const projectItem: UserProjectItem = {
    id,
    name: project.projectName || 'Untitled Animation',
    theme: project.theme || 'countryside',
    updatedAt: Date.now(),
    objectCount,
    blockCount,
    data: project,
  }

  const updatedList = [projectItem, ...existing.filter(p => p.id !== id)]
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(localKey, JSON.stringify(updatedList))
    } catch (e) {}
  }

  // Dual-sync to Firestore with timeout so UI never hangs (sanitize undefined fields)
  try {
    const docRef = doc(db, 'users', uid, 'projects', id)
    const cleanItem = JSON.parse(JSON.stringify(projectItem))
    await withTimeout(setDoc(docRef, cleanItem), 1200)
  } catch (err) {
    console.warn('Firestore offline/fallback for saveUserProject:', err)
  }

  // Also log activity without blocking
  logUserActivity(uid, {
    icon: '💾',
    title: `Saved project "${projectItem.name}"`,
    details: `${objectCount} objects · ${blockCount} transform blocks · Theme: ${projectItem.theme}`,
    badge: 'Project Saved',
  }).catch(() => {})

  return projectItem
}

export async function deleteUserProject(uid: string, projectId: string): Promise<void> {
  const localKey = `cg_user_projects_${uid}`
  let existing: UserProjectItem[] = []
  if (typeof window !== 'undefined') {
    try {
      const localData = localStorage.getItem(localKey)
      if (localData) existing = JSON.parse(localData)
    } catch (e) {}
  }
  const target = existing.find(p => p.id === projectId)
  const next = existing.filter(p => p.id !== projectId)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(localKey, JSON.stringify(next))
    } catch (e) {}
  }

  try {
    const docRef = doc(db, 'users', uid, 'projects', projectId)
    await withTimeout(deleteDoc(docRef), 1200)
  } catch (err) {
    console.warn('Firestore offline/fallback for deleteUserProject:', err)
  }

  if (target) {
    logUserActivity(uid, {
      icon: '🗑️',
      title: `Deleted project "${target.name}"`,
      badge: 'Project Deleted',
    }).catch(() => {})
  }
}

export async function duplicateUserProject(uid: string, projectId: string): Promise<UserProjectItem | null> {
  const existing = await getUserProjects(uid)
  const source = existing.find(p => p.id === projectId)
  if (!source) return null

  const dupProject: CGProjectData = {
    ...source.data,
    projectName: `${source.name} (Copy)`,
    lastSaved: Date.now(),
  }

  return await saveUserProject(uid, dupProject)
}

// ----------------------------------------------------------------------
// 2. Custom Assets Gallery
// ----------------------------------------------------------------------

export async function getUserCustomAssets(uid: string): Promise<AssetDef[]> {
  const localKey = `cg_user_assets_${uid}`
  let items: AssetDef[] = []
  if (typeof window !== 'undefined') {
    try {
      const localData = localStorage.getItem(localKey)
      if (localData) items = JSON.parse(localData)
    } catch (e) {}
  }

  try {
    const docRef = doc(db, 'users', uid, 'assets', 'library')
    const snap = await withTimeout(getDoc(docRef), 1200)
    if (snap.exists() && Array.isArray(snap.data()?.items)) {
      items = snap.data()?.items
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(items))
      }
    }
  } catch (err) {
    // Fallback to local
  }

  return items
}

export async function saveUserCustomAsset(uid: string, asset: AssetDef): Promise<void> {
  const localKey = `cg_user_assets_${uid}`
  let existing: AssetDef[] = []
  if (typeof window !== 'undefined') {
    try {
      const localData = localStorage.getItem(localKey)
      if (localData) existing = JSON.parse(localData)
    } catch (e) {}
  }
  const next = [...existing.filter(a => a.name !== asset.name), asset]
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(localKey, JSON.stringify(next))
    } catch (e) {}
  }

  try {
    const docRef = doc(db, 'users', uid, 'assets', 'library')
    const cleanItems = JSON.parse(JSON.stringify(next))
    await withTimeout(setDoc(docRef, { items: cleanItems }, { merge: true }), 1200)
  } catch (err) {
    console.warn('Firestore offline/fallback for saveUserCustomAsset:', err)
  }

  logUserActivity(uid, {
    icon: '🎨',
    title: `Built custom CG asset "${asset.name}"`,
    details: `${asset.primitives?.length || 1} primitives rasterized via Computer Graphics algorithms`,
    badge: 'Custom Asset',
  }).catch(() => {})
}

// ----------------------------------------------------------------------
// 3. User Activity & Action History ("What I Did")
// ----------------------------------------------------------------------

export async function getUserActivity(uid: string): Promise<UserActivityItem[]> {
  const localKey = `cg_user_activity_${uid}`
  let items: UserActivityItem[] = []
  if (typeof window !== 'undefined') {
    try {
      const localData = localStorage.getItem(localKey)
      if (localData) items = JSON.parse(localData)
    } catch (e) {}
  }

  try {
    const docRef = doc(db, 'users', uid, 'activity', 'log')
    const snap = await withTimeout(getDoc(docRef), 1200)
    if (snap.exists() && Array.isArray(snap.data()?.items)) {
      items = snap.data()?.items
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(items))
      }
    }
  } catch (err) {
    // Local fallback
  }

  return items.sort((a, b) => b.timestamp - a.timestamp)
}

export async function logUserActivity(
  uid: string,
  entry: { icon: string; title: string; details?: string; badge?: string }
): Promise<void> {
  const localKey = `cg_user_activity_${uid}`
  let existing: UserActivityItem[] = []
  if (typeof window !== 'undefined') {
    try {
      const localData = localStorage.getItem(localKey)
      if (localData) existing = JSON.parse(localData)
    } catch (e) {}
  }

  const newItem: UserActivityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    icon: entry.icon,
    title: entry.title,
    details: entry.details,
    badge: entry.badge,
  }

  // Keep most recent 60 items
  const next = [newItem, ...existing].slice(0, 60)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(localKey, JSON.stringify(next))
    } catch (e) {}
  }

  try {
    const docRef = doc(db, 'users', uid, 'activity', 'log')
    const cleanItems = JSON.parse(JSON.stringify(next))
    await withTimeout(setDoc(docRef, { items: cleanItems }, { merge: true }), 1200)
  } catch (err) {
    // Offline or timed out
  }
}

// ----------------------------------------------------------------------
// 4. User Bio & Profile Stats
// ----------------------------------------------------------------------

export async function getUserProfile(uid: string): Promise<UserProfileData> {
  const localKey = `cg_user_profile_${uid}`
  const localData = localStorage.getItem(localKey)
  let profile: UserProfileData = localData
    ? JSON.parse(localData)
    : {
        bio: 'Creating expressive vector animations with procedural Computer Graphics transforms & keyframes.',
        role: 'Computer Graphics Creator',
        totalProjects: 0,
        totalAssets: 0,
        totalBlocks: 0,
      }

  try {
    const docRef = doc(db, 'users', uid)
    const snap = await withTimeout(getDoc(docRef), 1200)
    if (snap.exists()) {
      profile = { ...profile, ...snap.data() }
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(profile))
      }
    }
  } catch (err) {
    // Offline / fallback to local profile
  }

  return profile
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfileData>): Promise<void> {
  const localKey = `cg_user_profile_${uid}`
  const current = await getUserProfile(uid)
  const updated = { ...current, ...updates }
  if (typeof window !== 'undefined') {
    localStorage.setItem(localKey, JSON.stringify(updated))
  }

  try {
    const docRef = doc(db, 'users', uid)
    await withTimeout(setDoc(docRef, updated, { merge: true }), 1200)
  } catch (err) {
    console.warn('Firestore offline/fallback for updateUserProfile:', err)
  }
}
