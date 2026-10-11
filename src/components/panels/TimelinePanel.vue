<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const playheadPercent = computed(() => `${Math.min(100, (store.playheadMs / 6000) * 100)}%`)

function resetPreview() {
  store.setPlaying(false)
  store.setPlayhead(0)
}

function seekFromPointer(event: PointerEvent) {
  if (event.button !== 0) return
  const area = event.currentTarget as HTMLElement
  const bounds = area.getBoundingClientRect()
  if (bounds.width <= 0) return
  const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
  store.setPlaying(false)
  store.setPlayhead(Math.round(ratio * 6000))
}
</script>

<template>
  <section class="timeline-panel">
    <div class="timeline-header">
      <div class="timeline-title-group">
        <div class="timeline-title-row">
          <span class="timeline-icon">▥</span>
          <h2>时间轴</h2>
          <span class="timeline-divider"></span>
          <span class="timeline-project-name">{{ store.projectTitle }}</span>
        </div>
        <span class="timeline-subtitle">演示片段 · 点击轨道可定位 · 原型时间轴</span>
      </div>
      <div class="timeline-controls">
        <span class="time-readout">00:{{ (store.playheadMs / 1000).toFixed(2).padStart(5, '0') }} <i>/ 00:06.00</i></span>
        <button class="timeline-icon-button" type="button" aria-label="回到开头" title="重置预览" @click="resetPreview">↶</button>
        <button class="timeline-play-button" type="button" @click="store.setPlaying(!store.isPlaying)">
          {{ store.isPlaying ? 'Ⅱ 暂停' : '▶ 播放' }}
        </button>
      </div>
    </div>

    <div class="timeline-content">
      <div class="track-labels">
        <div class="track-label track-label-ruler">时间 / 秒</div>
        <div class="track-label"><span class="track-color track-character"></span>角色动作</div>
        <div class="track-label"><span class="track-color track-expression"></span>表情</div>
        <div class="track-label"><span class="track-color track-effect"></span>特效事件</div>
      </div>
      <div class="track-area" @pointerdown="seekFromPointer">
        <div class="timeline-ruler">
          <span v-for="second in 7" :key="second" class="ruler-mark" :style="{ left: `${((second - 1) / 6) * 100}%` }">
            <i></i><b>{{ second - 1 }}s</b>
          </span>
        </div>
        <div class="track-row">
          <span class="clip-block clip-blue" style="left: 0%; width: 23.3%">说话</span>
          <span class="clip-block clip-green" style="left: 23.3%; width: 13.3%">待机</span>
          <span class="clip-block clip-orange" style="left: 36.6%; width: 18.3%">震惊</span>
          <span class="clip-block clip-pink" style="left: 54.9%; width: 18.4%">崩溃</span>
          <span class="clip-block clip-green" style="left: 73.3%; width: 26.7%">奖励反应</span>
        </div>
        <div class="track-row">
          <span class="clip-block clip-lavender" style="left: 0%; width: 23.3%">普通</span>
          <span class="clip-block clip-lavender" style="left: 23.3%; width: 13.3%">开心</span>
          <span class="clip-block clip-lavender" style="left: 36.6%; width: 18.3%">震惊</span>
          <span class="clip-block clip-lavender" style="left: 54.9%; width: 18.4%">尴尬</span>
          <span class="clip-block clip-lavender" style="left: 73.3%; width: 26.7%">开心</span>
        </div>
        <div class="track-row effect-track-row">
          <span class="effect-keyframe" style="left: 36.6%" title="震惊符号"></span>
          <span class="effect-keyframe reward-keyframe" style="left: 73.3%" title="金币奖励"></span>
          <span class="effect-lane-note">可扩展为可拖动的关键帧轨道</span>
        </div>
        <div class="playhead" :class="{ running: store.isPlaying }" :style="{ left: playheadPercent }">
          <span></span>
        </div>
      </div>
    </div>
  </section>
</template>
