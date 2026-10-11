import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ActionId, BackgroundId, CharacterId, EffectCommand, EffectId, ExpressionId } from '@/engine/types'

export const useEditorStore = defineStore('editor', () => {
  const selectedCharacter = ref<CharacterId>('worker')
  const action = ref<ActionId>('idle')
  const expression = ref<ExpressionId>('neutral')
  const background = ref<BackgroundId>('office')
  const isPlaying = ref(false)
  const playheadMs = ref(0)
  const effectCommand = ref<EffectCommand | null>(null)
  const projectTitle = ref('周一早会：我没事')

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
