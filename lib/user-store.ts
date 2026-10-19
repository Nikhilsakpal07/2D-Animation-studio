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

// ----------------------------------------------------------------------
// 1. User Projects CRUD
// ----------------------------------------------------------------------

export async function getUserProjects(uid: string): Promise<UserProjectItem[]> {
  const localKey = `cg_user_projects_${uid}`
  const localData = localStorage.getItem(localKey)
  let items: UserProjectItem[] = localData ? JSON.parse(localData) : []

  try {
    const colRef = collection(db, 'users', uid, 'projects')
    const snap = await getDocs(colRef)
    if (!snap.empty) {
      const remoteItems: UserProjectItem[] = []
      snap.forEach(d => {
        remoteItems.push(d.data() as UserProjectItem)
      })
      remoteItems.sort((a, b) => b.updatedAt - a.updatedAt)
      localStorage.setItem(localKey, JSON.stringify(remoteItems))
      return remoteItems
    }
  } catch (err) {
    console.warn('Firestore offline/fallback for getUserProjects:', err)
  }

  return items.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function saveUserProject(
  uid: string,
  project: CGProjectData,
  projectId?: string
): Promise<UserProjectItem> {
  const localKey = `cg_user_projects_${uid}`
  const existing = await getUserProjects(uid)

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
  localStorage.setItem(localKey, JSON.stringify(updatedList))

  try {
    const docRef = doc(db, 'users', uid, 'projects', id)
    await setDoc(docRef, projectItem)
  } catch (err) {
    console.warn('Firestore offline/fallback for saveUserProject:', err)
  }

  // Also log activity
  await logUserActivity(uid, {
    icon: '💾',
    title: `Saved project "${projectItem.name}"`,
    details: `${objectCount} objects · ${blockCount} transform blocks · Theme: ${projectItem.theme}`,
    badge: 'Project Saved',
  })

  return projectItem
}

export async function deleteUserProject(uid: string, projectId: string): Promise<void> {
  const localKey = `cg_user_projects_${uid}`
  const existing = await getUserProjects(uid)
  const target = existing.find(p => p.id === projectId)
  const next = existing.filter(p => p.id !== projectId)
  localStorage.setItem(localKey, JSON.stringify(next))

  try {
    const docRef = doc(db, 'users', uid, 'projects', projectId)
    await deleteDoc(docRef)
  } catch (err) {
    console.warn('Firestore offline/fallback for deleteUserProject:', err)
  }

  if (target) {
    await logUserActivity(uid, {
      icon: '🗑️',
      title: `Deleted project "${target.name}"`,
      badge: 'Project Deleted',
    })
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
  const localData = localStorage.getItem(localKey)
  let items: AssetDef[] = localData ? JSON.parse(localData) : []

  try {
    const docRef = doc(db, 'users', uid, 'assets', 'library')
    const snap = await getDoc(docRef)
    if (snap.exists() && Array.isArray(snap.data()?.items)) {
      items = snap.data()?.items
      localStorage.setItem(localKey, JSON.stringify(items))
    }
  } catch (err) {
    console.warn('Firestore offline/fallback for getUserCustomAssets:', err)
  }

  return items
}

export async function saveUserCustomAsset(uid: string, asset: AssetDef): Promise<void> {
  const localKey = `cg_user_assets_${uid}`
  const existing = await getUserCustomAssets(uid)
  const next = [...existing.filter(a => a.name !== asset.name), asset]
  localStorage.setItem(localKey, JSON.stringify(next))

  try {
    const docRef = doc(db, 'users', uid, 'assets', 'library')
    await setDoc(docRef, { items: next }, { merge: true })
  } catch (err) {
    console.warn('Firestore offline/fallback for saveUserCustomAsset:', err)
  }

  await logUserActivity(uid, {
    icon: '🎨',
    title: `Built custom CG asset "${asset.name}"`,
    details: `${asset.primitives?.length || 1} primitives rasterized via Computer Graphics algorithms`,
    badge: 'Custom Asset',
  })
}

// ----------------------------------------------------------------------
// 3. User Activity & Action History ("What I Did")
// ----------------------------------------------------------------------

export async function getUserActivity(uid: string): Promise<UserActivityItem[]> {
  const localKey = `cg_user_activity_${uid}`
  const localData = localStorage.getItem(localKey)
  let items: UserActivityItem[] = localData ? JSON.parse(localData) : []

  try {
    const docRef = doc(db, 'users', uid, 'activity', 'log')
    const snap = await getDoc(docRef)
    if (snap.exists() && Array.isArray(snap.data()?.items)) {
      items = snap.data()?.items
      localStorage.setItem(localKey, JSON.stringify(items))
    }
  } catch (err) {
    console.warn('Firestore offline/fallback for getUserActivity:', err)
  }

  return items.sort((a, b) => b.timestamp - a.timestamp)
}

export async function logUserActivity(
  uid: string,
  entry: { icon: string; title: string; details?: string; badge?: string }
): Promise<void> {
  const localKey = `cg_user_activity_${uid}`
  const existing = await getUserActivity(uid)

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
  localStorage.setItem(localKey, JSON.stringify(next))

  try {
    const docRef = doc(db, 'users', uid, 'activity', 'log')
    await setDoc(docRef, { items: next }, { merge: true })
  } catch (err) {
    console.warn('Firestore offline/fallback for logUserActivity:', err)
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
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      profile = { ...profile, ...snap.data() }
      localStorage.setItem(localKey, JSON.stringify(profile))
    }
  } catch (err) {
    console.warn('Firestore offline/fallback for getUserProfile:', err)
  }

  return profile
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfileData>): Promise<void> {
  const localKey = `cg_user_profile_${uid}`
  const current = await getUserProfile(uid)
  const updated = { ...current, ...updates }
  localStorage.setItem(localKey, JSON.stringify(updated))

  try {
    const docRef = doc(db, 'users', uid)
    await setDoc(docRef, updated, { merge: true })
  } catch (err) {
    console.warn('Firestore offline/fallback for updateUserProfile:', err)
  }
}
