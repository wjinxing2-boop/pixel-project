import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/global.css'

// 整个项目的入口：创建 Vue 根实例，并挂载 Pinia 状态管理。
// 这里不直接创建 Pixi 场景，而是让 App.vue 负责布局和组件组合，
// 让 PixiStage.vue 在合适的生命周期中初始化舞台和角色渲染。
createApp(App).use(createPinia()).mount('#app')
