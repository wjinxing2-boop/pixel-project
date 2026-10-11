export type CharacterId = 'worker' | 'optimist' | 'boss'
export type ActionId =
  | 'idle'
  | 'talk'
  | 'walk'
  | 'raise-hand'
  | 'shock'
  | 'angry'
  | 'laugh'
  | 'collapse'
  | 'dance'
export type ExpressionId = 'neutral' | 'happy' | 'angry' | 'shocked' | 'embarrassed' | 'tired'
export type BackgroundId = 'office' | 'night' | 'mint'
export type EffectId = 'reward' | 'shock' | 'angry' | 'heart' | 'glitch'
export type RendererMode = 'rig' | 'sprite'

export interface EffectCommand {
  id: number
  type: EffectId
}

export interface TimelineCue {
  id: string
  at: number
  action: ActionId
  expression: ExpressionId
  effect?: EffectId
}

export interface TimelineState {
  index: number
  cue: TimelineCue
}

export interface ProjectSettings {
  title: string
  width: number
  height: number
  fps: 24 | 25 | 30 | 60
  durationMs: number
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  title: '周一早会：我没事',
  width: 360,
  height: 640,
  fps: 30,
  durationMs: 6000,
}

/**
 * Demonstration timeline. This is immutable sample data, not the final editable timeline model.
 * Cues describe state changes; the renderer implementation is selected by CharacterController.
 */
export const DEMO_TIMELINE: TimelineCue[] = [
  { id: 'cue-talk', at: 0, action: 'talk', expression: 'neutral' },
  { id: 'cue-happy', at: 1400, action: 'idle', expression: 'happy' },
  { id: 'cue-shock', at: 2200, action: 'shock', expression: 'shocked', effect: 'shock' },
  { id: 'cue-collapse', at: 3300, action: 'collapse', expression: 'embarrassed' },
  { id: 'cue-reward', at: 4500, action: 'idle', expression: 'happy', effect: 'reward' },
]

export const CHARACTER_OPTIONS: Array<{
  id: CharacterId
  name: string
  description: string
  initials: string
  accent: string
}> = [
  { id: 'worker', name: '崩溃打工人', description: '表面镇定，内心下线', initials: '打', accent: '#78a6df' },
  { id: 'optimist', name: '乐观气氛组', description: '一切都在变好（吧）', initials: '乐', accent: '#c3df78' },
  { id: 'boss', name: '高压领导', description: '气场很强，心里没底', initials: '老', accent: '#f28b76' },
]

export const ACTION_OPTIONS: Array<{ id: ActionId; label: string; icon: string; renderer: RendererMode }> = [
  { id: 'idle', label: '待机', icon: '◌', renderer: 'rig' },
  { id: 'talk', label: '说话', icon: '▤', renderer: 'rig' },
  { id: 'walk', label: '走路', icon: '↔', renderer: 'rig' },
  { id: 'raise-hand', label: '抬手', icon: '↑', renderer: 'rig' },
  { id: 'shock', label: '震惊', icon: '!', renderer: 'rig' },
  { id: 'angry', label: '愤怒', icon: '⚡', renderer: 'rig' },
  { id: 'laugh', label: '大笑', icon: '⌁', renderer: 'rig' },
  { id: 'collapse', label: '崩溃倒地', icon: '↘', renderer: 'sprite' },
  { id: 'dance', label: '摇摆', icon: '♪', renderer: 'rig' },
]

export const EXPRESSION_OPTIONS: Array<{ id: ExpressionId; label: string }> = [
  { id: 'neutral', label: '普通' },
  { id: 'happy', label: '开心' },
  { id: 'angry', label: '愤怒' },
  { id: 'shocked', label: '震惊' },
  { id: 'embarrassed', label: '尴尬' },
  { id: 'tired', label: '疲惫' },
]

export const BACKGROUND_OPTIONS: Array<{ id: BackgroundId; label: string }> = [
  { id: 'office', label: '办公室' },
  { id: 'night', label: '深夜模式' },
  { id: 'mint', label: '薄荷绿' },
]

export const EFFECT_OPTIONS: Array<{ id: EffectId; label: string; description: string }> = [
  { id: 'reward', label: '金币奖励', description: '金币与星星飘起' },
  { id: 'shock', label: '震惊符号', description: '头顶弹出感叹号' },
  { id: 'angry', label: '愤怒气场', description: '红色像素怒气' },
  { id: 'heart', label: '爱心', description: '像素爱心上浮' },
  { id: 'glitch', label: '故障闪屏', description: '短暂的画面故障效果' },
]
