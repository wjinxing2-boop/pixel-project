import type { ActionId } from '@/engine/types'

export interface TransformValue {
  x?: number
  y?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
}

export interface PoseKeyframe {
  time: number
  target: string
  properties: TransformValue
}

export interface PoseClip {
  id: ActionId | string
  durationMs: number
  loop: boolean
  keyframes: PoseKeyframe[]
}

/** Linear interpolation helper for normalized numeric properties. Angles use radians. */
export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, progress))
}

export function easeInOutCubic(t: number): number {
  const value = Math.min(1, Math.max(0, t))
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}
