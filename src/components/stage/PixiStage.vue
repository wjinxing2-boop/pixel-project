<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PixelScene } from '@/engine/PixelScene'
import type {
  ActionId,
  BackgroundId,
  CharacterId,
  EffectCommand,
  ExpressionId,
} from '@/engine/types'

const props = defineProps<{
  character: CharacterId
  action: ActionId
  expression: ExpressionId
  background: BackgroundId
  playing: boolean
  playheadMs: number
  effectCommand: EffectCommand | null
}>()

const emit = defineEmits<{
  timeupdate: [timeMs: number, durationMs: number]
  statechange: [action: ActionId, expression: ExpressionId]
  rendermode: [mode: 'rig' | 'sprite']
  error: [message: string]
}>()

const host = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const sceneError = ref('')
const rendererMode = ref<'rig' | 'sprite'>('rig')
let scene: PixelScene | null = null
let cancelled = false

onMounted(async () => {
  if (!host.value) return
  const nextScene = new PixelScene({
    onTimeUpdate: (timeMs, durationMs) => emit('timeupdate', timeMs, durationMs),
    onStateChange: (action, expression) => emit('statechange', action, expression),
    onRendererModeChange: (mode) => {
      rendererMode.value = mode
      emit('rendermode', mode)
    },
  })
  scene = nextScene

  try {
    await nextScene.init(host.value)
    if (cancelled) {
      nextScene.destroy()
      return
    }
    nextScene.setCharacter(props.character)
    nextScene.setBackground(props.background)
    nextScene.setExpression(props.expression)
    nextScene.setAction(props.action)
    nextScene.seek(props.playheadMs)
    nextScene.setPlaying(props.playing)
    isLoading.value = false
  } catch (error) {
    sceneError.value = error instanceof Error ? error.message : 'PixiJS 初始化失败'
    emit('error', sceneError.value)
    isLoading.value = false
  }
})

watch(() => props.character, (value) => scene?.setCharacter(value))
watch(() => props.action, (value) => scene?.setAction(value))
watch(() => props.expression, (value) => scene?.setExpression(value))
watch(() => props.background, (value) => scene?.setBackground(value))
watch(() => props.playing, (value) => scene?.setPlaying(value))
watch(() => props.playheadMs, (value) => {
  if (!props.playing) scene?.seek(value)
})
watch(() => props.effectCommand?.id, () => {
  const command = props.effectCommand
  if (command) scene?.playEffect(command.type)
})

onBeforeUnmount(() => {
  cancelled = true
  scene?.destroy()
  scene = null
})
</script>

<template>
  <div class="pixi-stage-root">
    <div ref="host" class="pixi-canvas-host"></div>
    <div v-if="isLoading" class="stage-overlay stage-loading">
      <span class="loading-pixel"></span>
      正在初始化角色渲染器…
    </div>
    <div v-else-if="sceneError" class="stage-overlay stage-error">
      <strong>舞台初始化失败</strong>
      <span>{{ sceneError }}</span>
    </div>
    <div class="stage-frame-tag"><span></span> LIVE PREVIEW</div>
    <div class="stage-bottom-tag">{{ rendererMode === 'rig' ? 'CODE RIG' : 'PNG SPRITE CLIP' }} / 9:16</div>
  </div>
</template>
