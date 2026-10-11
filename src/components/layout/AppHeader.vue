<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { DEFAULT_PROJECT_SETTINGS, DEMO_TIMELINE } from '@/engine/types'

const store = useEditorStore()

function exportProject() {
  const project = {
    schemaVersion: '0.1.0',
    settings: { ...DEFAULT_PROJECT_SETTINGS, title: store.projectTitle },
    scene: {
      characterId: store.selectedCharacter,
      backgroundId: store.background,
      initialAction: store.action,
      initialExpression: store.expression,
    },
    timeline: DEMO_TIMELINE,
    notes: '这是起步工程的示例项目数据。当前时间轴为演示片段，编辑能力尚未接入。',
  }
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeName = store.projectTitle.trim().replace(/[\\/:*?"<>|]/g, '-').slice(0, 60) || 'pixel-project'
  anchor.href = url
  anchor.download = `${safeName}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <header class="app-header">
    <div class="brand-lockup">
      <div class="brand-mark" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="brand-copy">
        <div class="brand-title">PIXEL STUDIO <span>ALPHA</span></div>
        <div class="brand-subtitle">像素角色 · 动画编排工作台</div>
      </div>
    </div>

    <div class="project-title-wrap">
      <span class="project-dot"></span>
      <input v-model="store.projectTitle" class="project-title-input" aria-label="项目名称" />
      <span class="saved-label"><span class="saved-indicator"></span>本地草稿</span>
    </div>

    <div class="header-actions">
      <button class="quiet-button" type="button" title="导出当前项目 JSON" @click="exportProject">
        <span class="button-icon">↧</span> 导出 JSON
      </button>
      <button class="primary-button" type="button" @click="store.setPlaying(!store.isPlaying)">
        <span>{{ store.isPlaying ? 'Ⅱ' : '▶' }}</span>
        {{ store.isPlaying ? '暂停预览' : '预览动画' }}
      </button>
    </div>
  </header>
</template>
