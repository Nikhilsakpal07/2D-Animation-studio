/**
 * Computer Graphics Core Engine
 * Hand-implemented classic raster algorithms, 3x3 homogeneous 2D transformation matrices,
 * and keyframe interpolation math.
 */

export interface Point {
  x: number
  y: number
}

export type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
]

export interface TransformableObject {
  x: number
  y: number
  w?: number
  h?: number
  rotation?: number // in degrees
  scaleX?: number   // default 1
  scaleY?: number   // default 1
  skewX?: number    // in degrees or tangent
  skewY?: number    // in degrees or tangent
}

export interface KeyframeData {
  frame: number
  x: number
  y: number
  w: number
  h: number
  rotation: number
  scaleX?: number
  scaleY?: number
  skewX?: number
  skewY?: number
}

// -------------------------------------------------------------
// 1. RASTERIZATION ALGORITHMS
// -------------------------------------------------------------

/**
 * Digital Differential Analyzer (DDA) Line Drawing Algorithm
 * Incremental method based on differential calculations.
 */
export function ddaLine(x0: number, y0: number, x1: number, y1: number): Point[] {
  const points: Point[] = []
  const dx = x1 - x0
  const dy = y1 - y0
  const steps = Math.max(Math.abs(dx), Math.abs(dy))

  if (steps === 0) {
    return [{ x: Math.round(x0), y: Math.round(y0) }]
  }

  const xInc = dx / steps
  const yInc = dy / steps

  let curX = x0
  let curY = y0

  for (let i = 0; i <= steps; i++) {
    points.push({
      x: Math.round(curX),
      y: Math.round(curY),
    })
    curX += xInc
    curY += yInc
  }

  return points
}

/**
 * Bresenham's Line Drawing Algorithm
 * Efficient rasterization utilizing only integer addition, subtraction, and bit shifting.
 */
export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): Point[] {
  const points: Point[] = []
  let x = Math.round(x0)
  let y = Math.round(y0)
  const targetX = Math.round(x1)
  const targetY = Math.round(y1)

  const dx = Math.abs(targetX - x)
  const dy = Math.abs(targetY - y)
  const sx = x < targetX ? 1 : -1
  const sy = y < targetY ? 1 : -1
  let err = dx - dy

  while (true) {
    points.push({ x, y })
    if (x === targetX && y === targetY) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }

  return points
}

/**
 * Midpoint Circle Drawing Algorithm
 * Uses 8-way symmetry and integer decision variable p = 1 - r.
 */
export function midpointCircle(cx: number, cy: number, r: number): Point[] {
  const points: Point[] = []
  const centerX = Math.round(cx)
  const centerY = Math.round(cy)
  const radius = Math.round(Math.abs(r))

  if (radius === 0) {
    return [{ x: centerX, y: centerY }]
  }

  let x = 0
  let y = radius
  let p = 1 - radius

  const addSymmetricPoints = (px: number, py: number) => {
    points.push(
      { x: centerX + px, y: centerY + py },
      { x: centerX - px, y: centerY + py },
      { x: centerX + px, y: centerY - py },
      { x: centerX - px, y: centerY - py },
      { x: centerX + py, y: centerY + px },
      { x: centerX - py, y: centerY + px },
      { x: centerX + py, y: centerY - px },
      { x: centerX - py, y: centerY - px }
    )
  }

  addSymmetricPoints(x, y)

  while (x < y) {
    x++
    if (p < 0) {
      p += 2 * x + 1
    } else {
      y--
      p += 2 * (x - y) + 1
    }
    addSymmetricPoints(x, y)
  }

  // Deduplicate points for crisp rendering
  const seen = new Set<string>()
  const uniquePoints: Point[] = []
  for (const pt of points) {
    const key = `${pt.x},${pt.y}`
    if (!seen.has(key)) {
      seen.add(key)
      uniquePoints.push(pt)
    }
  }

  return uniquePoints
}

/**
 * Midpoint Ellipse Drawing Algorithm
 * Plots points in 4 symmetric quadrants using Region 1 and Region 2 decision parameters.
 */
export function midpointEllipse(cx: number, cy: number, rx: number, ry: number): Point[] {
  const points: Point[] = []
  const centerX = Math.round(cx)
  const centerY = Math.round(cy)
  const a = Math.round(Math.abs(rx))
  const b = Math.round(Math.abs(ry))

  if (a === 0 || b === 0) {
    return [{ x: centerX, y: centerY }]
  }

  const a2 = a * a
  const b2 = b * b

  let x = 0
  let y = b

  const add4WayPoints = (px: number, py: number) => {
    points.push(
      { x: centerX + px, y: centerY + py },
      { x: centerX - px, y: centerY + py },
      { x: centerX + px, y: centerY - py },
      { x: centerX - px, y: centerY - py }
    )
  }

  // Region 1: dy/dx < 1
  let d1 = b2 - a2 * b + 0.25 * a2
  let dx = 2 * b2 * x
  let dy = 2 * a2 * y

  while (dx < dy) {
    add4WayPoints(x, y)
    if (d1 < 0) {
      x++
      dx += 2 * b2
      d1 += dx + b2
    } else {
      x++
      y--
      dx += 2 * b2
      dy -= 2 * a2
      d1 += dx - dy + b2
    }
  }

  // Region 2: dy/dx >= 1
  let d2 = b2 * (x + 0.5) * (x + 0.5) + a2 * (y - 1) * (y - 1) - a2 * b2
  while (y >= 0) {
    add4WayPoints(x, y)
    if (d2 > 0) {
      y--
      dy -= 2 * a2
      d2 += a2 - dy
    } else {
      x++
      y--
      dx += 2 * b2
      dy -= 2 * a2
      d2 += dx - dy + a2
    }
  }

  // Deduplicate points
  const seen = new Set<string>()
  const uniquePoints: Point[] = []
  for (const pt of points) {
    const key = `${pt.x},${pt.y}`
    if (!seen.has(key)) {
      seen.add(key)
      uniquePoints.push(pt)
    }
  }

  return uniquePoints
}

/**
 * Cubic Bézier Curve
 * Computes parametric points B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
 */
export function cubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  steps: number = 40
): Point[] {
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    const t2 = t * t
    const t3 = t2 * t

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x
    const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y

    points.push({ x: Math.round(x), y: Math.round(y) })
  }
  return points
}

// -------------------------------------------------------------
// 2. 3x3 HOMOGENEOUS 2D TRANSFORMATION MATRICES
// -------------------------------------------------------------

/**
 * Returns a 3x3 identity matrix
 */
export function identityMatrix(): Matrix3x3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
}

/**
 * 2D Translation Matrix
 * [ 1  0  tx ]
 * [ 0  1  ty ]
 * [ 0  0   1 ]
 */
export function translationMatrix(tx: number, ty: number): Matrix3x3 {
  return [
    [1, 0, tx],
    [0, 1, ty],
    [0, 0, 1],
  ]
}

/**
 * 2D Rotation Matrix (Angle in degrees)
 * [ cos(θ)  -sin(θ)   0 ]
 * [ sin(θ)   cos(θ)   0 ]
 * [   0        0      1 ]
 */
export function rotationMatrix(deg: number): Matrix3x3 {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return [
    [cos, -sin, 0],
    [sin, cos, 0],
    [0, 0, 1],
  ]
}

/**
 * 2D Scaling Matrix
 * [ sx  0   0 ]
 * [  0  sy  0 ]
 * [  0   0  1 ]
 */
export function scalingMatrix(sx: number, sy: number): Matrix3x3 {
  return [
    [sx, 0, 0],
    [0, sy, 0],
    [0, 0, 1],
  ]
}

/**
 * 2D Shear Matrix
 * [ 1   shx  0 ]
 * [ shy  1   0 ]
 * [ 0    0   1 ]
 */
export function shearMatrix(shx: number, shy: number): Matrix3x3 {
  // If given in degrees, convert; if given as shear ratio, use directly
  const kx = Math.abs(shx) > 3 ? Math.tan((shx * Math.PI) / 180) : shx
  const ky = Math.abs(shy) > 3 ? Math.tan((shy * Math.PI) / 180) : shy
  return [
    [1, kx, 0],
    [ky, 1, 0],
    [0, 0, 1],
  ]
}

/**
 * Multiplies two 3x3 matrices: M = M1 × M2
 */
export function multiplyMatrices(m1: Matrix3x3, m2: Matrix3x3): Matrix3x3 {
  const result: Matrix3x3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      result[r][c] =
        m1[r][0] * m2[0][c] +
        m1[r][1] * m2[1][c] +
        m1[r][2] * m2[2][c]
    }
  }

  return result
}

/**
 * Applies a 3x3 transformation matrix to a 2D point [x, y, 1]ᵀ
 */
export function applyMatrixToPoint(m: Matrix3x3, pt: Point): Point {
  const x = m[0][0] * pt.x + m[0][1] * pt.y + m[0][2]
  const y = m[1][0] * pt.x + m[1][1] * pt.y + m[1][2]
  const w = m[2][0] * pt.x + m[2][1] * pt.y + m[2][2] || 1

  return {
    x: x / w,
    y: y / w,
  }
}

/**
 * Computes composite 3x3 transformation matrix for an object:
 * Translation × Rotation × Scaling × Shear
 */
export function getCompositeMatrix(obj: TransformableObject): Matrix3x3 {
  const tx = obj.x ?? 0
  const ty = obj.y ?? 0
  const rot = obj.rotation ?? 0
  const sx = obj.scaleX ?? 1
  const sy = obj.scaleY ?? 1
  const shx = obj.skewX ?? 0
  const shy = obj.skewY ?? 0

  const T = translationMatrix(tx, ty)
  const R = rotationMatrix(rot)
  const S = scalingMatrix(sx, sy)
  const Sh = shearMatrix(shx, shy)

  // Composite = T × R × Sh × S
  const TR = multiplyMatrices(T, R)
  const TRSh = multiplyMatrices(TR, Sh)
  return multiplyMatrices(TRSh, S)
}

export type PivotPointPreset =
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'left-center'
  | 'right-center'
  | 'top-left'
  | 'top-right'
  | 'custom'

export interface HierarchicalObject extends TransformableObject {
  id: string
  parentId?: string | null
  pivotPreset?: PivotPointPreset
  pivotX?: number
  pivotY?: number
}

/**
 * Calculates local pivot point (joint) of an object in its coordinate frame
 */
export function getObjectPivot(obj: {
  w?: number
  h?: number
  pivotPreset?: PivotPointPreset
  pivotX?: number
  pivotY?: number
}): Point {
  const w = obj.w ?? 90
  const h = obj.h ?? 90
  switch (obj.pivotPreset) {
    case 'top-center':
      return { x: w / 2, y: 0 }
    case 'bottom-center':
      return { x: w / 2, y: h }
    case 'left-center':
      return { x: 0, y: h / 2 }
    case 'right-center':
      return { x: w, y: h / 2 }
    case 'top-left':
      return { x: 0, y: 0 }
    case 'top-right':
      return { x: w, y: 0 }
    case 'custom':
      return { x: obj.pivotX ?? w / 2, y: obj.pivotY ?? h / 2 }
    case 'center':
    default:
      return { x: w / 2, y: h / 2 }
  }
}

/**
 * Computes 3x3 local transformation matrix around its pivot point:
 * M_local = T(x, y) × T(px, py) × R(rot) × Sh(shx, shy) × S(sx, sy) × T(-px, -py)
 */
export function computeLocalMatrix(
  obj: TransformableObject & {
    pivotPreset?: PivotPointPreset
    pivotX?: number
    pivotY?: number
  }
): Matrix3x3 {
  const tx = obj.x ?? 0
  const ty = obj.y ?? 0
  const rot = obj.rotation ?? 0
  const sx = obj.scaleX ?? 1
  const sy = obj.scaleY ?? 1
  const shx = obj.skewX ?? 0
  const shy = obj.skewY ?? 0

  const pivot = getObjectPivot(obj)

  const T_pos = translationMatrix(tx, ty)
  const T_pivot = translationMatrix(pivot.x, pivot.y)
  const T_inv_pivot = translationMatrix(-pivot.x, -pivot.y)
  const R = rotationMatrix(rot)
  const Sh = shearMatrix(shx, shy)
  const S = scalingMatrix(sx, sy)

  const SSh = multiplyMatrices(Sh, S)
  const RSSh = multiplyMatrices(R, SSh)
  const aroundPivot = multiplyMatrices(multiplyMatrices(T_pivot, RSSh), T_inv_pivot)
  return multiplyMatrices(T_pos, aroundPivot)
}

/**
 * Computes 2D Hierarchical Kinematics for a scene graph:
 * If an object has a parent: M_world = M_parent × M_local
 */
export function computeWorldHierarchy<T extends HierarchicalObject>(
  objects: T[]
): (T & {
  worldMatrix: Matrix3x3
  localMatrix: Matrix3x3
  worldPivot: Point
  parentJoint?: Point
  worldX: number
  worldY: number
  worldRotation: number
  worldScaleX: number
  worldScaleY: number
  worldSkewX: number
})[] {
  const byId = new Map<string, T>(objects.map(o => [o.id, o]))
  const localMatrices = new Map<string, Matrix3x3>()
  const worldMatrices = new Map<string, Matrix3x3>()

  // 1. Compute all local matrices
  for (const obj of objects) {
    localMatrices.set(obj.id, computeLocalMatrix(obj))
  }

  // 2. Resolve world matrices recursively (M_world = M_parent * M_local)
  function resolveWorldMatrix(id: string, visited: Set<string>): Matrix3x3 {
    if (worldMatrices.has(id)) return worldMatrices.get(id)!
    const obj = byId.get(id)
    if (!obj) return identityMatrix()

    if (visited.has(id)) {
      return localMatrices.get(id) || identityMatrix()
    }
    visited.add(id)

    const localM = localMatrices.get(id) || computeLocalMatrix(obj)
    let worldM = localM

    if (obj.parentId && byId.has(obj.parentId)) {
      const parentWorldM = resolveWorldMatrix(obj.parentId, visited)
      worldM = multiplyMatrices(parentWorldM, localM)
    }

    worldMatrices.set(id, worldM)
    return worldM
  }

  for (const obj of objects) {
    resolveWorldMatrix(obj.id, new Set<string>())
  }

  // 3. Extract transformed world coordinates, joint pivots, and decomposed parameters
  return objects.map(obj => {
    const worldM = worldMatrices.get(obj.id) || identityMatrix()
    const localM = localMatrices.get(obj.id) || identityMatrix()
    const localPivot = getObjectPivot(obj)
    const worldPivot = applyMatrixToPoint(worldM, localPivot)

    // Decompose world matrix for CSS rotation, scaling, and skew
    const a = worldM[0][0]
    const b = worldM[1][0]
    const c = worldM[0][1]
    const d = worldM[1][1]

    const worldRotation = Math.round(((Math.atan2(b, a) * 180) / Math.PI) * 10) / 10
    const worldScaleX = Math.round(Math.hypot(a, b) * 100) / 100
    const worldScaleY = Math.round(Math.hypot(c, d) * 100) / 100
    const worldSkewX = Math.round(((Math.atan2(a * c + b * d, a * a + b * b) * 180) / Math.PI) * 10) / 10

    // Top-left world coordinate matching worldPivot when transformOrigin is at localPivot
    const worldX = Math.round((worldPivot.x - localPivot.x) * 10) / 10
    const worldY = Math.round((worldPivot.y - localPivot.y) * 10) / 10

    let parentJoint: Point | undefined
    if (obj.parentId && byId.has(obj.parentId)) {
      const parentObj = byId.get(obj.parentId)!
      const parentWorldM = worldMatrices.get(obj.parentId) || identityMatrix()
      const parentLocalPivot = getObjectPivot(parentObj)
      parentJoint = applyMatrixToPoint(parentWorldM, parentLocalPivot)
    }

    return {
      ...obj,
      worldMatrix: worldM,
      localMatrix: localM,
      worldPivot,
      parentJoint,
      worldX,
      worldY,
      worldRotation,
      worldScaleX,
      worldScaleY,
      worldSkewX,
    }
  })
}

/**
 * Format a 3x3 matrix for display in the Inspector UI
 */
export function formatMatrixRow(row: [number, number, number]): string {
  const [a, b, c] = row.map(v => (Math.abs(v) < 1e-6 ? 0 : v).toFixed(2))
  return `[ ${a.padStart(6, ' ')}  ${b.padStart(6, ' ')}  ${c.padStart(7, ' ')} ]`
}

// -------------------------------------------------------------
// 3. KEYFRAME INTERPOLATION (Linear & Cubic Smooth)
// -------------------------------------------------------------

/**
 * Smoothstep cubic interpolation factor: 3t² - 2t³
 */
export function cubicEaseInOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t))
  return clamped * clamped * (3 - 2 * clamped)
}

/**
 * Linear interpolation between a and b
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Interpolates object properties across keyframes at `currentFrame`
 */
export function interpolateKeyframes(
  keyframes: KeyframeData[],
  currentFrame: number,
  easing: 'linear' | 'cubic' = 'cubic'
): KeyframeData {
  if (!keyframes || keyframes.length === 0) {
    return { frame: currentFrame, x: 0, y: 0, w: 100, h: 100, rotation: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }
  }

  // Sort by frame
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame)

  // Bounds checks
  if (currentFrame <= sorted[0].frame) {
    return { ...sorted[0] }
  }
  if (currentFrame >= sorted[sorted.length - 1].frame) {
    return { ...sorted[sorted.length - 1] }
  }

  // Find surrounding keyframes
  let prev = sorted[0]
  let next = sorted[sorted.length - 1]

  for (let i = 0; i < sorted.length - 1; i++) {
    if (currentFrame >= sorted[i].frame && currentFrame <= sorted[i + 1].frame) {
      prev = sorted[i]
      next = sorted[i + 1]
      break
    }
  }

  const range = next.frame - prev.frame
  const rawT = range === 0 ? 0 : (currentFrame - prev.frame) / range
  const t = easing === 'cubic' ? cubicEaseInOut(rawT) : rawT

  const interp = (k: keyof KeyframeData, def: number = 0) => {
    const valA = (prev[k] ?? def) as number
    const valB = (next[k] ?? def) as number
    return lerp(valA, valB, t)
  }

  // Shortest angle rotation interpolation
  let rotA = prev.rotation ?? 0
  let rotB = next.rotation ?? 0
  let diff = (rotB - rotA) % 360
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  const finalRot = rotA + diff * t

  return {
    frame: currentFrame,
    x: interp('x'),
    y: interp('y'),
    w: interp('w'),
    h: interp('h'),
    rotation: Math.round(finalRot * 10) / 10,
    scaleX: interp('scaleX', 1),
    scaleY: interp('scaleY', 1),
    skewX: interp('skewX', 0),
    skewY: interp('skewY', 0),
  }
}

// -------------------------------------------------------------
// 4. SEQUENTIAL TRANSFORMATION BLOCKS (Cumulative Animation System)
// -------------------------------------------------------------

export type TransformActionType = 'translation' | 'rotation' | 'scaling' | 'shear'

export interface TransformBlock {
  id: string
  objectId: string
  actionType: TransformActionType
  startFrame: number // e.g., 1
  endFrame: number   // e.g., 20

  // Translation delta
  dx?: number
  dy?: number

  // Rotation delta
  deltaRotation?: number

  // Scaling (target multiplier, e.g. 1.5 = 150%)
  scaleX?: number
  scaleY?: number

  // Shear delta in degrees
  skewX?: number
  skewY?: number

  // Mode & Constraints
  translationMode?: 'from-to' | 'delta'
  lockAspect?: boolean

  easing?: 'linear' | 'cubic'
  color?: string
}

export interface ObjectBaseState {
  x: number
  y: number
  w: number
  h: number
  rotation: number
  scaleX: number
  scaleY: number
  skewX: number
  skewY: number
}

/**
 * Computes cumulative transformations sequentially across transformation blocks up to currentFrame
 */
export function evaluateCumulativeTransform<T extends ObjectBaseState>(
  base: T,
  blocks: TransformBlock[],
  currentFrame: number
): T {
  if (!blocks || blocks.length === 0) {
    return { ...base }
  }

  // Sort blocks chronologically by startFrame
  const sorted = [...blocks].sort((a, b) => a.startFrame - b.startFrame)

  let curX = base.x
  let curY = base.y
  let curW = base.w
  let curH = base.h
  let curRot = base.rotation
  let curScaleX = base.scaleX ?? 1
  let curScaleY = base.scaleY ?? 1
  let curSkewX = base.skewX ?? 0
  let curSkewY = base.skewY ?? 0

  for (const block of sorted) {
    // If currentFrame hasn't reached this block yet, stop accumulating future blocks
    if (currentFrame < block.startFrame) {
      break
    }

    const duration = Math.max(1, block.endFrame - block.startFrame)
    const rawAlpha = Math.min(1, Math.max(0, (currentFrame - block.startFrame) / duration))
    const alpha = block.easing === 'linear' ? rawAlpha : cubicEaseInOut(rawAlpha)

    if (block.actionType === 'translation') {
      const dx = block.dx ?? 0
      const dy = block.dy ?? 0
      curX += dx * alpha
      curY += dy * alpha
    } else if (block.actionType === 'rotation') {
      const dRot = block.deltaRotation ?? 0
      curRot += dRot * alpha
    } else if (block.actionType === 'scaling') {
      const targetSx = block.scaleX ?? 1
      const targetSy = block.scaleY ?? 1
      const factorX = 1 + (targetSx - 1) * alpha
      const factorY = 1 + (targetSy - 1) * alpha
      curScaleX *= factorX
      curScaleY *= factorY
    } else if (block.actionType === 'shear') {
      const shx = block.skewX ?? 0
      const shy = block.skewY ?? 0
      curSkewX += shx * alpha
      curSkewY += shy * alpha
    }
  }

  return {
    ...base,
    x: Math.round(curX * 10) / 10,
    y: Math.round(curY * 10) / 10,
    w: curW,
    h: curH,
    rotation: Math.round(curRot * 10) / 10,
    scaleX: Math.round(curScaleX * 100) / 100,
    scaleY: Math.round(curScaleY * 100) / 100,
    skewX: Math.round(curSkewX * 10) / 10,
    skewY: Math.round(curSkewY * 10) / 10,
  }
}

/**
 * Calculates the exact state of an object right at the start of a given block,
 * taking into account all prior transformations sequentially.
 */
export function getBlockStartState(
  baseObj: ObjectBaseState,
  blocks: TransformBlock[],
  currentBlock: TransformBlock
): ObjectBaseState {
  if (!blocks || blocks.length === 0) {
    return { ...baseObj }
  }

  // Filter all blocks that occur strictly before this block
  const priorBlocks = blocks.filter(b => b.id !== currentBlock.id && b.startFrame < currentBlock.startFrame)
  return evaluateCumulativeTransform(baseObj, priorBlocks, currentBlock.startFrame)
}

/**
 * Calculates the exact state of an object at the end of a given block.
 */
export function getBlockEndState(
  startState: ObjectBaseState,
  block: TransformBlock
): ObjectBaseState {
  const dx = block.dx ?? 0
  const dy = block.dy ?? 0
  const dRot = block.deltaRotation ?? 0
  const sx = block.scaleX ?? 1
  const sy = block.scaleY ?? 1
  const shx = block.skewX ?? 0
  const shy = block.skewY ?? 0

  return {
    x: Math.round((startState.x + dx) * 10) / 10,
    y: Math.round((startState.y + dy) * 10) / 10,
    w: startState.w,
    h: startState.h,
    rotation: Math.round(((startState.rotation + dRot) % 360) * 10) / 10,
    scaleX: Math.round(((startState.scaleX ?? 1) * sx) * 100) / 100,
    scaleY: Math.round(((startState.scaleY ?? 1) * sy) * 100) / 100,
    skewX: Math.round(((startState.skewX ?? 0) + shx) * 10) / 10,
    skewY: Math.round(((startState.skewY ?? 0) + shy) * 10) / 10,
  }
}

/**
 * Returns formatted label for a transformation block, displaying exact From -> To parameters
 */
export function getBlockLabel(
  block: TransformBlock,
  baseObj?: ObjectBaseState,
  allBlocks?: TransformBlock[]
): string {
  const range = `${block.startFrame}–${block.endFrame}`

  if (baseObj && allBlocks) {
    const startState = getBlockStartState(baseObj, allBlocks, block)
    const endState = getBlockEndState(startState, block)

    if (block.actionType === 'translation') {
      const fromX = Math.round(startState.x)
      const fromY = Math.round(startState.y)
      const toX = Math.round(endState.x)
      const toY = Math.round(endState.y)
      return `${range}: Translate (${fromX},${fromY} → ${toX},${toY})`
    }
    if (block.actionType === 'rotation') {
      const sign = (block.deltaRotation ?? 0) >= 0 ? `+${block.deltaRotation ?? 0}` : `${block.deltaRotation ?? 0}`
      return `${range}: Rotate (${sign}°)`
    }
    if (block.actionType === 'scaling') {
      const fromSx = Math.round((startState.scaleX ?? 1) * 100)
      const toSx = Math.round((endState.scaleX ?? 1) * 100)
      return `${range}: Scale (${fromSx}% → ${toSx}%)`
    }
    if (block.actionType === 'shear') {
      const fromShx = Math.round(startState.skewX ?? 0)
      const toShx = Math.round(endState.skewX ?? 0)
      return `${range}: Shear (${fromShx}° → ${toShx}°)`
    }
  }

  if (block.actionType === 'translation') {
    const signX = (block.dx ?? 0) >= 0 ? `+${block.dx ?? 0}` : `${block.dx ?? 0}`
    const signY = (block.dy ?? 0) >= 0 ? `+${block.dy ?? 0}` : `${block.dy ?? 0}`
    return `${range}: Translate (${signX}, ${signY})`
  }
  if (block.actionType === 'rotation') {
    const sign = (block.deltaRotation ?? 0) >= 0 ? `+${block.deltaRotation ?? 0}` : `${block.deltaRotation ?? 0}`
    return `${range}: Rotate (${sign}°)`
  }
  if (block.actionType === 'scaling') {
    const sxPct = Math.round((block.scaleX ?? 1) * 100)
    const syPct = Math.round((block.scaleY ?? 1) * 100)
    return `${range}: Scale (${sxPct}%, ${syPct}%)`
  }
  if (block.actionType === 'shear') {
    const signX = (block.skewX ?? 0) >= 0 ? `+${block.skewX ?? 0}` : `${block.skewX ?? 0}`
    return `${range}: Shear (${signX}°)`
  }
  return `${range}: Action`
}

/**
 * Returns theme color for transformation action type
 */
export function getBlockColor(type: TransformActionType): string {
  switch (type) {
    case 'translation':
      return '#D95D4E' // Coral
    case 'rotation':
      return '#7B6DAF' // Lavender Purple
    case 'scaling':
      return '#5A9468' // Forest Green
    case 'shear':
      return '#D98264' // Sienna Amber
  }
}

