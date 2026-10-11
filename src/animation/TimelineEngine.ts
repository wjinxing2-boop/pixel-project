import type { TimelineCue, TimelineState } from '@/engine/types'

/**
 * Minimal deterministic timeline resolver.
 * It resolves current character state from absolute time and never owns PixiJS objects.
 */
export class TimelineEngine {
  readonly cues: TimelineCue[]
  readonly durationMs: number

  constructor(cues: TimelineCue[], durationMs: number) {
    this.cues = [...cues].sort((a, b) => a.at - b.at)
    this.durationMs = durationMs
  }

  // 把任意毫秒值限制在项目时长区间内，避免播放头跑出范围。
  normalizeTime(timeMs: number): number {
    return Math.min(this.durationMs, Math.max(0, timeMs))
  }

  // 关键逻辑：把“绝对时间”翻译成当前应该应用哪个 cue。
  // 例如在 2200ms 时，状态应落到 shock 那一条，而不是按帧计时器自己去更新。
  stateAt(timeMs: number): TimelineState {
    const t = this.normalizeTime(timeMs)
    let index = 0
    for (let i = 0; i < this.cues.length; i += 1) {
      if (this.cues[i].at <= t) index = i
      else break
    }
    return { index, cue: this.cues[index] }
  }

  cuesBetween(fromExclusive: number, toInclusive: number): TimelineCue[] {
    if (toInclusive >= fromExclusive) {
      return this.cues.filter((cue) => cue.at > fromExclusive && cue.at <= toInclusive)
    }
    return [
      ...this.cues.filter((cue) => cue.at > fromExclusive),
      ...this.cues.filter((cue) => cue.at <= toInclusive),
    ]
  }
}
