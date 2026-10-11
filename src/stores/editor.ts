import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ActionId, BackgroundId, CharacterId, EffectCommand, EffectId, ExpressionId } from '@/engine/types'

export const useEditorStore = defineStore('editor', () => {
  // 当前编辑器的核心状态：角色、动作、表情、背景、播放头和特效命令。
  // 这些状态会同步到各个面板组件和 PixiStage，形成“状态驱动的编辑器”。
  const selectedCharacter = ref<CharacterId>('worker')
  const action = ref<ActionId>('idle')
  const expression = ref<ExpressionId>('neutral')
  const background = ref<BackgroundId>('office')
  const isPlaying = ref(false)
  const playheadMs = ref(0)
  const effectCommand = ref<EffectCommand | null>(null)
  const projectTitle = ref('周一早会：我没事')

  // 用自增序号区分每一次特效触发，避免 Vue 监听到同一个 effectCommand 对象时失效。
  let effectSequence = 0

  function triggerEffect(type: EffectId) {
    effectCommand.value = { id: ++effectSequence, type }
  }

  function setPlaying(value: boolean) {
    isPlaying.value = value
    if (value) playheadMs.value = 0
  }

  function setPlayhead(value: number) {
    playheadMs.value = Math.max(0, Math.min(6000, value))
  }

  return {
    selectedCharacter,
    action,
    expression,
    background,
    isPlaying,
    playheadMs,
    effectCommand,
    projectTitle,
    triggerEffect,
    setPlaying,
    setPlayhead,
  }
})
